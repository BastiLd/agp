using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;

namespace EverythingSelf.Core.FileOps;

/// <summary>Ergebnis einer Datei-Operation über die Windows-Shell.</summary>
public sealed class FileOperationResult
{
    public FileOperationResult(bool success, bool aborted, string message)
    {
        Success = success;
        Aborted = aborted;
        Message = message;
    }

    public bool Success { get; }

    /// <summary>Der Benutzer hat den Vorgang im Windows-Dialog abgebrochen.</summary>
    public bool Aborted { get; }

    public string Message { get; }
}

/// <summary>
/// Löschen über die Windows-Shell (SHFileOperation). Dadurch verhält sich das
/// Programm exakt wie der Explorer: Papierkorb, Fortschritt und Konfliktdialoge inklusive,
/// und mehrere Dateien landen als ein einziger Vorgang im Papierkorb.
/// </summary>
public static class ShellFileOperations
{
    private const uint FO_DELETE = 0x0003;

    private const ushort FOF_SILENT = 0x0004;
    private const ushort FOF_NOCONFIRMATION = 0x0010;
    private const ushort FOF_ALLOWUNDO = 0x0040;
    private const ushort FOF_NOERRORUI = 0x0400;
    private const ushort FOF_WANTNUKEWARNING = 0x4000;

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct SHFILEOPSTRUCT
    {
        public IntPtr hwnd;
        public uint wFunc;
        public string pFrom;
        public string? pTo;
        public ushort fFlags;
        [MarshalAs(UnmanagedType.Bool)] public bool fAnyOperationsAborted;
        public IntPtr hNameMappings;
        public string? lpszProgressTitle;
    }

    [DllImport("shell32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern int SHFileOperationW(ref SHFILEOPSTRUCT lpFileOp);

    /// <summary>Verschiebt die angegebenen Pfade in den Papierkorb.</summary>
    public static FileOperationResult MoveToRecycleBin(IEnumerable<string> paths, IntPtr owner)
        => Delete(paths, owner, useRecycleBin: true);

    /// <summary>Löscht die angegebenen Pfade endgültig (kein Papierkorb).</summary>
    public static FileOperationResult DeletePermanently(IEnumerable<string> paths, IntPtr owner)
        => Delete(paths, owner, useRecycleBin: false);

    private static FileOperationResult Delete(IEnumerable<string> paths, IntPtr owner, bool useRecycleBin)
    {
        var list = paths
            .Where(static p => !string.IsNullOrWhiteSpace(p))
            .Select(static p => p.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (list.Count == 0)
        {
            return new FileOperationResult(true, false, "Nichts zu löschen.");
        }

        ushort flags = FOF_NOCONFIRMATION;
        if (useRecycleBin)
        {
            // WANTNUKEWARNING sorgt dafür, dass Windows nachfragt, falls etwas
            // nicht in den Papierkorb passt und stattdessen endgültig gelöscht würde.
            flags |= FOF_ALLOWUNDO | FOF_WANTNUKEWARNING;
        }

        var operation = new SHFILEOPSTRUCT
        {
            hwnd = owner,
            wFunc = FO_DELETE,
            pFrom = BuildDoubleNullTerminatedList(list),
            pTo = null,
            fFlags = flags,
            lpszProgressTitle = null,
        };

        var code = SHFileOperationW(ref operation);

        if (operation.fAnyOperationsAborted)
        {
            return new FileOperationResult(false, true, "Vorgang wurde abgebrochen.");
        }

        return code == 0
            ? new FileOperationResult(true, false,
                useRecycleBin
                    ? $"{list.Count} Eintrag/Einträge in den Papierkorb verschoben."
                    : $"{list.Count} Eintrag/Einträge endgültig gelöscht.")
            : new FileOperationResult(false, false, DescribeError(code));
    }

    /// <summary>SHFileOperation erwartet eine mit zwei Nullzeichen abgeschlossene Liste.</summary>
    private static string BuildDoubleNullTerminatedList(IReadOnlyList<string> paths)
    {
        var builder = new StringBuilder();
        foreach (var path in paths)
        {
            builder.Append(path).Append('\0');
        }

        builder.Append('\0');
        return builder.ToString();
    }

    private static string DescribeError(int code) => code switch
    {
        0x71 => "Zwei Dateinamen sind identisch - Vorgang abgebrochen.",
        0x7C => "Ungültiger Pfad.",
        0x10000 => "Unerwarteter Fehler in der Windows-Shell.",
        0x402 => "Der Pfad wurde nicht gefunden.",
        5 => "Zugriff verweigert - eventuell werden Administratorrechte benötigt.",
        32 => "Die Datei wird von einem anderen Programm verwendet.",
        _ => $"Windows meldet Fehlercode {code}.",
    };
}
