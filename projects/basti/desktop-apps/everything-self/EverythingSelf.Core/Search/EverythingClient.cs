using System;
using System.Buffers.Binary;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using EverythingSelf.Core.Interop;
using EverythingSelf.Core.Uninstall;

namespace EverythingSelf.Core.Search;

/// <summary>
/// Spricht per WM_COPYDATA direkt mit dem laufenden Everything-Prozess.
/// Dadurch nutzen wir denselben blitzschnellen NTFS-Index wie Everything selbst,
/// ohne eine fremde DLL oder ein SDK einbinden zu müssen.
/// </summary>
public sealed class EverythingClient : IDisposable
{
    private static readonly TimeSpan ReplyTimeout = TimeSpan.FromSeconds(30);

    /// <summary>Kurzes Zeitfenster beim Ausprobieren der Protokollvarianten.</summary>
    private static readonly TimeSpan ProbeTimeout = TimeSpan.FromSeconds(5);

    private readonly ConcurrentDictionary<long, PendingQuery> _pending = new();
    private readonly Lazy<IpcReplyWindow> _replyWindow;

    private long _nextRequestId = 1;
    private IpcProtocol? _knownProtocol;
    private bool _disposed;

    /// <summary>Optionale Diagnoseausgabe, z. B. für das Probe-Werkzeug.</summary>
    public Action<string>? Log { get; set; }

    /// <summary>Beschreibt, welche Protokollvariante gerade verwendet wird.</summary>
    public string ProtocolDescription =>
        _knownProtocol is null ? "noch nicht ermittelt" : _knownProtocol.Describe();

    /// <summary>
    /// Eine konkrete Ausprägung des IPC-Protokolls. Everything gibt es in mehreren
    /// Versionen und Bitness-Varianten; welche Struktur der laufende Prozess erwartet,
    /// wird beim ersten Suchlauf empirisch ermittelt und danach beibehalten.
    /// </summary>
    private sealed record IpcProtocol(bool UseQuery2, bool PointerSizedReplyId)
    {
        internal string Describe() =>
            (UseQuery2 ? "Query2" : "Query1") +
            (PointerSizedReplyId ? " / ausgerichtetes Layout" : " / kompaktes Layout");
    }

    public EverythingClient()
    {
        _replyWindow = new Lazy<IpcReplyWindow>(CreateReplyWindow, LazyThreadSafetyMode.ExecutionAndPublication);
    }

    private IpcReplyWindow CreateReplyWindow()
    {
        var window = new IpcReplyWindow();
        window.CopyDataReceived += OnCopyDataReceived;
        return window;
    }

    /// <summary>Prüft, ob Everything läuft, und ermittelt nach Möglichkeit den Programmpfad.</summary>
    public EverythingStatus GetStatus()
    {
        var hwnd = NativeMethods.FindWindowW(EverythingIpc.WindowClass, null);
        if (hwnd != IntPtr.Zero)
        {
            return new EverythingStatus
            {
                Availability = EverythingAvailability.Running,
                ExecutablePath = TryGetExecutablePathFromWindow(hwnd) ?? TryFindInstalledExecutable(),
            };
        }

        var installed = TryFindInstalledExecutable();
        return new EverythingStatus
        {
            Availability = installed is null
                ? EverythingAvailability.NotInstalled
                : EverythingAvailability.NotRunning,
            ExecutablePath = installed,
        };
    }

    /// <summary>Führt eine Suche aus. Die volle Everything-Syntax (z. B. <c>*.exe size:&gt;10mb</c>) wird unterstützt.</summary>
    public async Task<SearchResult> SearchAsync(SearchOptions options, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(options);
        if (_disposed)
        {
            throw new ObjectDisposedException(nameof(EverythingClient));
        }

        if (string.IsNullOrWhiteSpace(options.Query))
        {
            return SearchResult.Empty;
        }

        var hwnd = NativeMethods.FindWindowW(EverythingIpc.WindowClass, null);
        if (hwnd == IntPtr.Zero)
        {
            throw new EverythingUnavailableException(
                "Everything läuft derzeit nicht. Ohne den laufenden Everything-Dienst gibt es keinen Suchindex.");
        }

        // Bekanntes Protokoll bevorzugen - das ist der Normalfall nach dem ersten Suchlauf.
        if (_knownProtocol is not null)
        {
            var known = await TrySendAsync(hwnd, options, _knownProtocol, ReplyTimeout, cancellationToken)
                .ConfigureAwait(false);
            if (known is not null)
            {
                return known;
            }

            Log?.Invoke($"Protokoll {_knownProtocol.Describe()} antwortet nicht mehr - Neuermittlung.");
            _knownProtocol = null;
        }

        foreach (var candidate in BuildCandidates())
        {
            cancellationToken.ThrowIfCancellationRequested();

            Log?.Invoke($"Teste Protokollvariante: {candidate.Describe()}");
            var result = await TrySendAsync(hwnd, options, candidate, ProbeTimeout, cancellationToken)
                .ConfigureAwait(false);

            if (result is null)
            {
                continue;
            }

            _knownProtocol = candidate;
            Log?.Invoke($"Verwende Protokoll: {candidate.Describe()}");
            return result;
        }

        throw new EverythingUnavailableException(
            "Everything hat auf keine der bekannten Protokollvarianten geantwortet. " +
            "Läuft Everything eventuell mit Administratorrechten, dieses Programm aber nicht? " +
            "Dann blockiert Windows die Kommunikation - beide müssen auf derselben Rechtestufe laufen.");
    }

    /// <summary>
    /// Reihenfolge der Protokollvarianten. Aktuelle Everything-Versionen verwenden das
    /// kompakte Layout (Antwort-Kennung als DWORD) - deshalb steht es vorne. Danach folgen
    /// die ausgerichtete Variante und das ältere Query1-Protokoll als Rückfallebenen.
    /// </summary>
    private static IEnumerable<IpcProtocol> BuildCandidates()
    {
        yield return new IpcProtocol(true, false);
        yield return new IpcProtocol(true, true);
        yield return new IpcProtocol(false, false);
        yield return new IpcProtocol(false, true);
    }

    /// <summary>
    /// Sendet eine Anfrage in der angegebenen Protokollvariante.
    /// Liefert <c>null</c>, wenn Everything die Nachricht ablehnt oder nicht antwortet.
    /// </summary>
    private async Task<SearchResult?> TrySendAsync(
        IntPtr everythingWindow,
        SearchOptions options,
        IpcProtocol protocol,
        TimeSpan timeout,
        CancellationToken cancellationToken)
    {
        var requestId = Interlocked.Increment(ref _nextRequestId);
        var pending = new PendingQuery(protocol.UseQuery2);
        _pending[requestId] = pending;

        try
        {
            var replyHwnd = _replyWindow.Value.Handle;
            var payload = protocol.UseQuery2
                ? BuildQuery2(replyHwnd, requestId, options, protocol.PointerSizedReplyId)
                : BuildQuery1(replyHwnd, requestId, options, protocol.PointerSizedReplyId);

            var dataKind = protocol.UseQuery2 ? EverythingIpc.CopyDataQuery2W : EverythingIpc.CopyDataQueryW;

            var accepted = await Task
                .Run(() => SendCopyData(everythingWindow, replyHwnd, dataKind, payload), cancellationToken)
                .ConfigureAwait(false);

            if (!accepted)
            {
                Log?.Invoke($"  Everything hat die Nachricht abgelehnt (Win32-Fehler {Marshal.GetLastWin32Error()}).");
                return null;
            }

            using var timeoutSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutSource.CancelAfter(timeout);

            using (timeoutSource.Token.Register(() => pending.Completion.TrySetCanceled(timeoutSource.Token)))
            {
                return await pending.Completion.Task.ConfigureAwait(false);
            }
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            Log?.Invoke("  Keine Antwort innerhalb des Zeitfensters.");
            return null;
        }
        finally
        {
            _pending.TryRemove(requestId, out _);
        }
    }

    private static bool SendCopyData(IntPtr targetWindow, IntPtr senderWindow, int dataKind, byte[] payload)
    {
        var buffer = Marshal.AllocHGlobal(payload.Length);
        var copyData = IntPtr.Zero;

        try
        {
            Marshal.Copy(payload, 0, buffer, payload.Length);

            var cds = new NativeMethods.COPYDATASTRUCT
            {
                dwData = new IntPtr(dataKind),
                cbData = payload.Length,
                lpData = buffer,
            };

            copyData = Marshal.AllocHGlobal(Marshal.SizeOf<NativeMethods.COPYDATASTRUCT>());
            Marshal.StructureToPtr(cds, copyData, false);

            var sent = NativeMethods.SendMessageTimeout(
                targetWindow,
                NativeMethods.WM_COPYDATA,
                senderWindow,
                copyData,
                NativeMethods.SMTO_NORMAL | NativeMethods.SMTO_ABORTIFHUNG,
                10_000,
                out var result);

            return sent != IntPtr.Zero && result != IntPtr.Zero;
        }
        finally
        {
            if (copyData != IntPtr.Zero)
            {
                Marshal.FreeHGlobal(copyData);
            }

            Marshal.FreeHGlobal(buffer);
        }
    }

    // ---------------------------------------------------------------------
    // Anfragen zusammenbauen
    // ---------------------------------------------------------------------

    private const uint Query2RequestedFields =
        EverythingIpc.RequestName |
        EverythingIpc.RequestPath |
        EverythingIpc.RequestSize |
        EverythingIpc.RequestDateModified |
        EverythingIpc.RequestAttributes;

    /// <summary>
    /// Baut die EVERYTHING_IPC_QUERY2-Struktur. Das Speicherlayout hängt von der Bitness
    /// des Everything-Prozesses ab, weil dort ein DWORD_PTR-Feld ausgerichtet wird.
    /// </summary>
    private static byte[] BuildQuery2(IntPtr replyWindow, long requestId, SearchOptions options, bool targetIs64Bit)
    {
        var headerSize = targetIs64Bit ? 36 : 28;
        var searchBytes = Encoding.Unicode.GetBytes(options.Query);
        var buffer = new byte[headerSize + searchBytes.Length + 2];
        var span = buffer.AsSpan();

        BinaryPrimitives.WriteUInt32LittleEndian(span, (uint)replyWindow.ToInt64());

        int cursor;
        if (targetIs64Bit)
        {
            BinaryPrimitives.WriteUInt64LittleEndian(span[8..], (ulong)requestId);
            cursor = 16;
        }
        else
        {
            BinaryPrimitives.WriteUInt32LittleEndian(span[4..], (uint)requestId);
            cursor = 8;
        }

        BinaryPrimitives.WriteUInt32LittleEndian(span[cursor..], BuildSearchFlags(options));
        BinaryPrimitives.WriteUInt32LittleEndian(span[(cursor + 4)..], options.Offset);
        BinaryPrimitives.WriteUInt32LittleEndian(span[(cursor + 8)..], options.MaxResults ?? EverythingIpc.AllResults);
        BinaryPrimitives.WriteUInt32LittleEndian(span[(cursor + 12)..], Query2RequestedFields);
        BinaryPrimitives.WriteUInt32LittleEndian(span[(cursor + 16)..], (uint)options.Sort);

        searchBytes.CopyTo(buffer, headerSize);
        return buffer;
    }

    /// <summary>Baut die ältere EVERYTHING_IPC_QUERY-Struktur (nur Name und Pfad).</summary>
    private static byte[] BuildQuery1(IntPtr replyWindow, long requestId, SearchOptions options, bool targetIs64Bit)
    {
        var headerSize = targetIs64Bit ? 28 : 20;
        var searchBytes = Encoding.Unicode.GetBytes(options.Query);
        var buffer = new byte[headerSize + searchBytes.Length + 2];
        var span = buffer.AsSpan();

        BinaryPrimitives.WriteUInt32LittleEndian(span, (uint)replyWindow.ToInt64());

        int cursor;
        if (targetIs64Bit)
        {
            BinaryPrimitives.WriteUInt64LittleEndian(span[8..], (ulong)requestId);
            cursor = 16;
        }
        else
        {
            BinaryPrimitives.WriteUInt32LittleEndian(span[4..], (uint)requestId);
            cursor = 8;
        }

        BinaryPrimitives.WriteUInt32LittleEndian(span[cursor..], BuildSearchFlags(options));
        BinaryPrimitives.WriteUInt32LittleEndian(span[(cursor + 4)..], options.Offset);
        BinaryPrimitives.WriteUInt32LittleEndian(span[(cursor + 8)..], options.MaxResults ?? EverythingIpc.AllResults);

        searchBytes.CopyTo(buffer, headerSize);
        return buffer;
    }

    private static uint BuildSearchFlags(SearchOptions options)
    {
        uint flags = 0;
        if (options.MatchCase) flags |= EverythingIpc.MatchCase;
        if (options.MatchWholeWord) flags |= EverythingIpc.MatchWholeWord;
        if (options.MatchPath) flags |= EverythingIpc.MatchPath;
        if (options.UseRegex) flags |= EverythingIpc.Regex;
        return flags;
    }

    // ---------------------------------------------------------------------
    // Antworten auswerten
    // ---------------------------------------------------------------------

    private void OnCopyDataReceived(IntPtr dwData, byte[] payload)
    {
        var requestId = dwData.ToInt64();
        if (!_pending.TryGetValue(requestId, out var pending))
        {
            // Verspätete Antwort auf eine bereits verworfene Suche - ignorieren.
            return;
        }

        try
        {
            var result = pending.IsQuery2 ? ParseQuery2Reply(payload) : ParseQuery1Reply(payload);
            pending.Completion.TrySetResult(result);
        }
        catch (Exception ex)
        {
            pending.Completion.TrySetException(ex);
        }
    }

    private static SearchResult ParseQuery2Reply(byte[] data)
    {
        const int headerSize = 20;
        if (data.Length < headerSize)
        {
            return SearchResult.Empty;
        }

        var span = data.AsSpan();
        var totalItems = BinaryPrimitives.ReadUInt32LittleEndian(span);
        var itemCount = BinaryPrimitives.ReadUInt32LittleEndian(span[4..]);
        var requestFlags = BinaryPrimitives.ReadUInt32LittleEndian(span[12..]);

        var items = new List<SearchResultItem>((int)Math.Min(itemCount, 100_000));

        for (var i = 0; i < itemCount; i++)
        {
            var itemStart = headerSize + (i * 8);
            if (itemStart + 8 > data.Length)
            {
                break;
            }

            var flags = BinaryPrimitives.ReadUInt32LittleEndian(span[itemStart..]);
            var cursor = (int)BinaryPrimitives.ReadUInt32LittleEndian(span[(itemStart + 4)..]);
            if (cursor <= 0 || cursor >= data.Length)
            {
                break;
            }

            string name = string.Empty;
            string directory = string.Empty;
            long? size = null;
            DateTime? modified = null;
            FileAttributes attributes = 0;

            // Die Felder liegen in exakt der Reihenfolge der REQUEST-Bits hintereinander.
            if ((requestFlags & EverythingIpc.RequestName) != 0 && !TryReadCountedString(span, ref cursor, out name))
            {
                break;
            }

            if ((requestFlags & EverythingIpc.RequestPath) != 0 && !TryReadCountedString(span, ref cursor, out directory))
            {
                break;
            }

            if ((requestFlags & EverythingIpc.RequestSize) != 0)
            {
                if (cursor + 8 > data.Length) break;
                var raw = BinaryPrimitives.ReadInt64LittleEndian(span[cursor..]);
                cursor += 8;
                size = raw < 0 ? null : raw;
            }

            if ((requestFlags & EverythingIpc.RequestDateModified) != 0)
            {
                if (cursor + 8 > data.Length) break;
                var raw = BinaryPrimitives.ReadInt64LittleEndian(span[cursor..]);
                cursor += 8;
                modified = ToDateTime(raw);
            }

            if ((requestFlags & EverythingIpc.RequestAttributes) != 0)
            {
                if (cursor + 4 > data.Length) break;
                attributes = (FileAttributes)BinaryPrimitives.ReadUInt32LittleEndian(span[cursor..]);
            }

            var isFolder = (flags & EverythingIpc.ItemFolder) != 0;

            items.Add(new SearchResultItem
            {
                Name = name,
                Directory = directory,
                IsFolder = isFolder,
                IsDrive = (flags & EverythingIpc.ItemDrive) != 0,
                Size = isFolder ? null : size,
                Modified = modified,
                Attributes = attributes,
            });
        }

        return new SearchResult { Items = items, TotalCount = totalItems };
    }

    private static SearchResult ParseQuery1Reply(byte[] data)
    {
        const int headerSize = 28;
        if (data.Length < headerSize)
        {
            return SearchResult.Empty;
        }

        var span = data.AsSpan();
        var totalItems = BinaryPrimitives.ReadUInt32LittleEndian(span[8..]);
        var itemCount = BinaryPrimitives.ReadUInt32LittleEndian(span[20..]);

        var items = new List<SearchResultItem>((int)Math.Min(itemCount, 100_000));

        for (var i = 0; i < itemCount; i++)
        {
            var itemStart = headerSize + (i * 12);
            if (itemStart + 12 > data.Length)
            {
                break;
            }

            var flags = BinaryPrimitives.ReadUInt32LittleEndian(span[itemStart..]);
            var nameOffset = (int)BinaryPrimitives.ReadUInt32LittleEndian(span[(itemStart + 4)..]);
            var pathOffset = (int)BinaryPrimitives.ReadUInt32LittleEndian(span[(itemStart + 8)..]);

            items.Add(new SearchResultItem
            {
                Name = ReadNullTerminatedString(span, nameOffset),
                Directory = ReadNullTerminatedString(span, pathOffset),
                IsFolder = (flags & EverythingIpc.ItemFolder) != 0,
                IsDrive = (flags & EverythingIpc.ItemDrive) != 0,
            });
        }

        return new SearchResult { Items = items, TotalCount = totalItems };
    }

    /// <summary>Liest ein Stringfeld im Format "DWORD Länge + Zeichen + Nullterminator".</summary>
    private static bool TryReadCountedString(ReadOnlySpan<byte> data, ref int cursor, out string value)
    {
        value = string.Empty;

        if (cursor + 4 > data.Length)
        {
            return false;
        }

        var length = (int)BinaryPrimitives.ReadUInt32LittleEndian(data[cursor..]);
        cursor += 4;

        var byteLength = (length + 1) * 2;
        if (length < 0 || cursor + byteLength > data.Length)
        {
            return false;
        }

        value = Encoding.Unicode.GetString(data.Slice(cursor, length * 2));
        cursor += byteLength;
        return true;
    }

    private static string ReadNullTerminatedString(ReadOnlySpan<byte> data, int offset)
    {
        if (offset <= 0 || offset >= data.Length)
        {
            return string.Empty;
        }

        for (var i = offset; i + 1 < data.Length; i += 2)
        {
            if (data[i] == 0 && data[i + 1] == 0)
            {
                return Encoding.Unicode.GetString(data.Slice(offset, i - offset));
            }
        }

        return Encoding.Unicode.GetString(data[offset..]).TrimEnd('\0');
    }

    private static DateTime? ToDateTime(long fileTime)
    {
        if (fileTime <= 0 || fileTime == long.MaxValue || fileTime == -1)
        {
            return null;
        }

        try
        {
            return DateTime.FromFileTime(fileTime);
        }
        catch (ArgumentOutOfRangeException)
        {
            return null;
        }
    }

    // ---------------------------------------------------------------------
    // Prozess-Hilfsfunktionen
    // ---------------------------------------------------------------------

    private static string? TryGetExecutablePathFromWindow(IntPtr window)
    {
        try
        {
            NativeMethods.GetWindowThreadProcessId(window, out var processId);
            if (processId == 0)
            {
                return null;
            }

            using var process = Process.GetProcessById((int)processId);
            return process.MainModule?.FileName;
        }
        catch
        {
            // Bei erhöhten Rechten des Zielprozesses ist der Modulpfad nicht lesbar - kein Problem.
            return null;
        }
    }

    /// <summary>Sucht Everything.exe über die Deinstallations-Einträge und die üblichen Installationspfade.</summary>
    public static string? TryFindInstalledExecutable()
    {
        foreach (var program in InstalledProgramScanner.Scan())
        {
            if (!program.DisplayName.StartsWith("Everything", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var location = program.InstallLocation;
            if (!string.IsNullOrWhiteSpace(location))
            {
                var candidate = Path.Combine(location, "Everything.exe");
                if (File.Exists(candidate))
                {
                    return candidate;
                }
            }
        }

        var fallbacks = new[]
        {
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Everything", "Everything.exe"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Everything", "Everything.exe"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "Everything", "Everything.exe"),
        };

        foreach (var candidate in fallbacks)
        {
            if (File.Exists(candidate))
            {
                return candidate;
            }
        }

        return null;
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;

        foreach (var pending in _pending.Values)
        {
            pending.Completion.TrySetCanceled();
        }

        _pending.Clear();

        if (_replyWindow.IsValueCreated)
        {
            _replyWindow.Value.Dispose();
        }
    }

    private sealed class PendingQuery
    {
        internal PendingQuery(bool isQuery2)
        {
            IsQuery2 = isQuery2;
        }

        internal bool IsQuery2 { get; }

        internal TaskCompletionSource<SearchResult> Completion { get; } =
            new(TaskCreationOptions.RunContinuationsAsynchronously);
    }
}

/// <summary>Wird ausgelöst, wenn Everything nicht erreichbar ist oder nicht antwortet.</summary>
public sealed class EverythingUnavailableException : Exception
{
    public EverythingUnavailableException(string message) : base(message)
    {
    }
}
