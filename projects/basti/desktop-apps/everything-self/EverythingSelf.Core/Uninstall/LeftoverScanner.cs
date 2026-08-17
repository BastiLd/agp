using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using EverythingSelf.Core.FileOps;
using EverythingSelf.Core.SystemAccess;
using Microsoft.Win32;

namespace EverythingSelf.Core.Uninstall;

/// <summary>Art eines gefundenen Überrests.</summary>
public enum LeftoverKind
{
    /// <summary>Der Deinstallations-Eintrag selbst ist stehen geblieben.</summary>
    OrphanedUninstallEntry,

    /// <summary>Ein Konfigurationsschlüssel unter HKCU/HKLM Software.</summary>
    RegistryKey,

    /// <summary>Ein zurückgebliebener Ordner.</summary>
    Folder,

    /// <summary>Eine Verknüpfung im Startmenü.</summary>
    Shortcut,
}

/// <summary>Wie sicher ist der Fund?</summary>
public enum LeftoverConfidence
{
    /// <summary>Eindeutig diesem Programm zuzuordnen - wird standardmäßig vorausgewählt.</summary>
    High,

    /// <summary>Wahrscheinlich zugehörig - bitte prüfen, nicht vorausgewählt.</summary>
    Medium,
}

/// <summary>Ein einzelner Fund der Restebereinigung.</summary>
public sealed class LeftoverItem
{
    public LeftoverKind Kind { get; init; }

    public LeftoverConfidence Confidence { get; init; }

    /// <summary>Datei-/Ordnerpfad oder vollständiger Registry-Pfad.</summary>
    public string Path { get; init; } = string.Empty;

    /// <summary>Kurze Begründung, warum der Eintrag als Rest gilt.</summary>
    public string Reason { get; init; } = string.Empty;

    public long? SizeBytes { get; init; }

    public bool IsRegistry => Kind is LeftoverKind.RegistryKey or LeftoverKind.OrphanedUninstallEntry;

    public string KindLabel => Kind switch
    {
        LeftoverKind.OrphanedUninstallEntry => "Registry-Eintrag (Deinstallation)",
        LeftoverKind.RegistryKey => "Registry-Schlüssel",
        LeftoverKind.Folder => "Ordner",
        _ => "Verknüpfung",
    };
}

/// <summary>Ergebnis des Löschens von Resten.</summary>
public sealed class LeftoverCleanupResult
{
    public LeftoverCleanupResult(int removed, IReadOnlyList<string> failures)
    {
        Removed = removed;
        Failures = failures;
    }

    public int Removed { get; }

    public IReadOnlyList<string> Failures { get; }
}

/// <summary>
/// Sucht nach Dateien und Registry-Schlüsseln, die ein Deinstaller zurückgelassen hat.
/// Bewusst konservativ: nur klar zuordenbare Treffer, und gelöscht wird ausschließlich
/// das, was der Benutzer im Dialog bestätigt.
/// </summary>
public static class LeftoverScanner
{
    /// <summary>Ordnernamen, die niemals als Überrest vorgeschlagen werden dürfen.</summary>
    private static readonly HashSet<string> ProtectedNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "windows", "system32", "syswow64", "program files", "program files (x86)", "programdata",
        "common files", "microsoft", "microsoft shared", "windowsapps", "users", "temp", "tmp",
        "microsoft corporation", "windows nt", "windows defender", "internet explorer", "packages",
    };

    /// <summary>Herstellernamen, die zu generisch sind, um daraus Ordner abzuleiten.</summary>
    private static readonly HashSet<string> GenericPublishers = new(StringComparer.OrdinalIgnoreCase)
    {
        "microsoft", "microsoftcorporation", "windows", "unknown", "default",
    };

    /// <summary>Führt die Suche nach Resten für ein Programm aus.</summary>
    public static Task<IReadOnlyList<LeftoverItem>> ScanAsync(
        InstalledProgram program,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(program);
        return Task.Run<IReadOnlyList<LeftoverItem>>(() => Scan(program, cancellationToken), cancellationToken);
    }

    private static IReadOnlyList<LeftoverItem> Scan(InstalledProgram program, CancellationToken cancellationToken)
    {
        var found = new Dictionary<string, LeftoverItem>(StringComparer.OrdinalIgnoreCase);

        void Add(LeftoverItem item)
        {
            if (!string.IsNullOrWhiteSpace(item.Path) && !found.ContainsKey(item.Path))
            {
                found[item.Path] = item;
            }
        }

        var programKey = Normalize(program.DisplayName);
        var publisherKey = Normalize(program.Publisher);

        cancellationToken.ThrowIfCancellationRequested();
        ScanOrphanedUninstallEntry(program, Add);

        cancellationToken.ThrowIfCancellationRequested();
        ScanInstallLocation(program, Add, cancellationToken);

        cancellationToken.ThrowIfCancellationRequested();
        ScanProgramFolders(program, programKey, publisherKey, Add, cancellationToken);

        cancellationToken.ThrowIfCancellationRequested();
        ScanSoftwareRegistryKeys(program, programKey, publisherKey, Add);

        cancellationToken.ThrowIfCancellationRequested();
        ScanStartMenu(programKey, publisherKey, Add, cancellationToken);

        return found.Values
            .OrderBy(static i => i.Confidence)
            .ThenBy(static i => i.Kind)
            .ThenBy(static i => i.Path, StringComparer.CurrentCultureIgnoreCase)
            .ToList();
    }

    /// <summary>Ist der Uninstall-Eintrag noch da, obwohl das Zielprogramm fehlt?</summary>
    private static void ScanOrphanedUninstallEntry(InstalledProgram program, Action<LeftoverItem> add)
    {
        if (!RegistryKeyExists(program.RegistryPath))
        {
            return;
        }

        if (UninstallTargetStillExists(program))
        {
            // Deinstaller ist noch vorhanden - das Programm wurde offenbar nicht entfernt.
            return;
        }

        add(new LeftoverItem
        {
            Kind = LeftoverKind.OrphanedUninstallEntry,
            Confidence = LeftoverConfidence.High,
            Path = program.RegistryPath,
            Reason = "Der Deinstallations-Eintrag existiert noch, das hinterlegte Programm aber nicht mehr.",
        });
    }

    /// <summary>Prüft, ob der im Uninstall-Eintrag hinterlegte Deinstaller noch existiert.</summary>
    private static bool UninstallTargetStillExists(InstalledProgram program)
    {
        var command = program.UninstallString ?? program.QuietUninstallString;
        if (string.IsNullOrWhiteSpace(command))
        {
            return false;
        }

        var (fileName, _) = UninstallRunner.SplitCommandLine(command);

        // MSI-Produkte räumen ihren eigenen Registry-Eintrag beim Deinstallieren auf.
        // Ist der Eintrag noch da, gilt das Produkt als installiert - nicht als Rest.
        if (fileName.EndsWith("msiexec.exe", StringComparison.OrdinalIgnoreCase) ||
            fileName.EndsWith("msiexec", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return File.Exists(fileName);
    }

    private static void ScanInstallLocation(InstalledProgram program, Action<LeftoverItem> add, CancellationToken token)
    {
        var location = program.InstallLocation;
        if (string.IsNullOrWhiteSpace(location) || !Directory.Exists(location))
        {
            return;
        }

        if (IsProtectedPath(location))
        {
            return;
        }

        add(new LeftoverItem
        {
            Kind = LeftoverKind.Folder,
            Confidence = LeftoverConfidence.High,
            Path = location,
            Reason = "Installationsordner laut Registry - existiert nach der Deinstallation noch.",
            SizeBytes = TryGetDirectorySize(location, token),
        });
    }

    /// <summary>Durchsucht die üblichen Anwendungs- und Datenverzeichnisse.</summary>
    private static void ScanProgramFolders(
        InstalledProgram program,
        string programKey,
        string publisherKey,
        Action<LeftoverItem> add,
        CancellationToken token)
    {
        if (programKey.Length < 3)
        {
            return;
        }

        var roots = new List<string>
        {
            Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
            Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),
            Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs"),
        };

        foreach (var root in roots.Where(Directory.Exists).Distinct(StringComparer.OrdinalIgnoreCase))
        {
            token.ThrowIfCancellationRequested();

            foreach (var directory in EnumerateDirectoriesSafe(root))
            {
                var name = Path.GetFileName(directory);
                if (ProtectedNames.Contains(name))
                {
                    continue;
                }

                var normalized = Normalize(name);

                // Direkter Treffer auf den Programmnamen.
                var match = MatchStrength(normalized, programKey);
                if (match is not null)
                {
                    add(new LeftoverItem
                    {
                        Kind = LeftoverKind.Folder,
                        Confidence = match.Value,
                        Path = directory,
                        Reason = $"Ordnername passt zum Programmnamen ({name}).",
                        SizeBytes = TryGetDirectorySize(directory, token),
                    });
                    continue;
                }

                // Herstellerordner: nur der passende Unterordner gilt als Rest.
                if (publisherKey.Length >= 4 &&
                    !GenericPublishers.Contains(publisherKey) &&
                    normalized == publisherKey)
                {
                    foreach (var child in EnumerateDirectoriesSafe(directory))
                    {
                        var childMatch = MatchStrength(Normalize(Path.GetFileName(child)), programKey);
                        if (childMatch is not null)
                        {
                            add(new LeftoverItem
                            {
                                Kind = LeftoverKind.Folder,
                                Confidence = childMatch.Value,
                                Path = child,
                                Reason = $"Unterordner im Herstellerverzeichnis {name}.",
                                SizeBytes = TryGetDirectorySize(child, token),
                            });
                        }
                    }
                }
            }
        }
    }

    private static void ScanSoftwareRegistryKeys(
        InstalledProgram program,
        string programKey,
        string publisherKey,
        Action<LeftoverItem> add)
    {
        if (programKey.Length < 3)
        {
            return;
        }

        var locations = new (RegistryHive Hive, RegistryView View, string Path, string Label)[]
        {
            (RegistryHive.CurrentUser, RegistryView.Default, "SOFTWARE", "HKEY_CURRENT_USER"),
            (RegistryHive.LocalMachine, RegistryView.Registry64, "SOFTWARE", "HKEY_LOCAL_MACHINE"),
            (RegistryHive.LocalMachine, RegistryView.Registry64, @"SOFTWARE\WOW6432Node", "HKEY_LOCAL_MACHINE"),
        };

        foreach (var (hive, view, path, label) in locations)
        {
            try
            {
                using var baseKey = RegistryKey.OpenBaseKey(hive, view);
                using var softwareKey = baseKey.OpenSubKey(path);
                if (softwareKey is null)
                {
                    continue;
                }

                foreach (var vendorName in softwareKey.GetSubKeyNames())
                {
                    var normalizedVendor = Normalize(vendorName);

                    // Programm liegt direkt unter SOFTWARE.
                    var direct = MatchStrength(normalizedVendor, programKey);
                    if (direct is not null)
                    {
                        add(new LeftoverItem
                        {
                            Kind = LeftoverKind.RegistryKey,
                            Confidence = direct.Value,
                            Path = $@"{label}\{path}\{vendorName}",
                            Reason = "Registry-Schlüssel trägt den Programmnamen.",
                        });
                        continue;
                    }

                    if (publisherKey.Length < 4 ||
                        GenericPublishers.Contains(publisherKey) ||
                        normalizedVendor != publisherKey)
                    {
                        continue;
                    }

                    using var vendorKey = softwareKey.OpenSubKey(vendorName);
                    if (vendorKey is null)
                    {
                        continue;
                    }

                    foreach (var productName in vendorKey.GetSubKeyNames())
                    {
                        var productMatch = MatchStrength(Normalize(productName), programKey);
                        if (productMatch is not null)
                        {
                            add(new LeftoverItem
                            {
                                Kind = LeftoverKind.RegistryKey,
                                Confidence = productMatch.Value,
                                Path = $@"{label}\{path}\{vendorName}\{productName}",
                                Reason = $"Produktschlüssel unter dem Hersteller {vendorName}.",
                            });
                        }
                    }
                }
            }
            catch (Exception)
            {
                // Kein Zugriff auf diesen Zweig - überspringen.
            }
        }
    }

    private static void ScanStartMenu(
        string programKey,
        string publisherKey,
        Action<LeftoverItem> add,
        CancellationToken token)
    {
        if (programKey.Length < 3)
        {
            return;
        }

        var roots = new[]
        {
            Environment.GetFolderPath(Environment.SpecialFolder.CommonPrograms),
            Environment.GetFolderPath(Environment.SpecialFolder.Programs),
        };

        foreach (var root in roots.Where(Directory.Exists))
        {
            token.ThrowIfCancellationRequested();

            foreach (var directory in EnumerateDirectoriesSafe(root))
            {
                var normalized = Normalize(Path.GetFileName(directory));
                if (MatchStrength(normalized, programKey) is { } folderMatch)
                {
                    add(new LeftoverItem
                    {
                        Kind = LeftoverKind.Shortcut,
                        Confidence = folderMatch,
                        Path = directory,
                        Reason = "Startmenü-Ordner des Programms.",
                    });
                }
                else if (publisherKey.Length >= 4 && !GenericPublishers.Contains(publisherKey) && normalized == publisherKey)
                {
                    foreach (var link in EnumerateFilesSafe(directory, "*.lnk"))
                    {
                        if (MatchStrength(Normalize(Path.GetFileNameWithoutExtension(link)), programKey) is { } linkMatch)
                        {
                            add(new LeftoverItem
                            {
                                Kind = LeftoverKind.Shortcut,
                                Confidence = linkMatch,
                                Path = link,
                                Reason = "Verknüpfung im Herstellerordner des Startmenüs.",
                            });
                        }
                    }
                }
            }

            foreach (var link in EnumerateFilesSafe(root, "*.lnk"))
            {
                if (MatchStrength(Normalize(Path.GetFileNameWithoutExtension(link)), programKey) is { } match)
                {
                    add(new LeftoverItem
                    {
                        Kind = LeftoverKind.Shortcut,
                        Confidence = match,
                        Path = link,
                        Reason = "Verknüpfung im Startmenü.",
                    });
                }
            }
        }
    }

    /// <summary>
    /// Entfernt die bestätigten Reste. Dateien wandern in den Papierkorb,
    /// Registry-Schlüssel werden gelöscht (dort gibt es kein Rückgängig).
    /// </summary>
    public static async Task<LeftoverCleanupResult> RemoveAsync(
        IReadOnlyList<LeftoverItem> items,
        IntPtr ownerWindow,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(items);

        // Schritt 1: ohne Rechteerhöhung versuchen. Für Benutzerordner und HKCU reicht das.
        var stillOpen = new List<LeftoverItem>();
        var removed = 0;

        await Task.Run(() =>
        {
            foreach (var item in items)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var succeeded = item.IsRegistry
                    ? DeleteRegistryKey(item.Path, out _)
                    : ShellFileOperations.MoveToRecycleBin(new[] { item.Path }, ownerWindow).Success;

                if (succeeded)
                {
                    removed++;
                }
                else
                {
                    stillOpen.Add(item);
                }
            }
        }, cancellationToken).ConfigureAwait(false);

        if (stillOpen.Count == 0)
        {
            return new LeftoverCleanupResult(removed, Array.Empty<string>());
        }

        // Schritt 2: Was übrig bleibt, liegt in geschützten Bereichen -
        // dafür genau eine Rechteerhöhung für alle verbliebenen Einträge zusammen.
        if (ElevatedRunner.IsElevated)
        {
            return new LeftoverCleanupResult(removed,
                stillOpen.Select(static i => $"{i.Path}: konnte nicht entfernt werden.").ToList());
        }

        var commands = stillOpen.Select(BuildElevatedRemovalCommand).ToList();
        var elevated = await ElevatedRunner.RunAsync(commands, cancellationToken).ConfigureAwait(false);

        if (elevated.UserDeclined)
        {
            return new LeftoverCleanupResult(removed, new[]
            {
                $"{stillOpen.Count} Eintrag/Einträge benötigen Administratorrechte - die Rückfrage wurde abgelehnt.",
            });
        }

        // Nachprüfen, was tatsächlich verschwunden ist.
        var failures = new List<string>();
        foreach (var item in stillOpen)
        {
            var gone = item.IsRegistry
                ? !RegistryKeyExists(item.Path)
                : !File.Exists(item.Path) && !Directory.Exists(item.Path);

            if (gone)
            {
                removed++;
            }
            else
            {
                failures.Add($"{item.Path}: konnte auch mit Administratorrechten nicht entfernt werden.");
            }
        }

        return new LeftoverCleanupResult(removed, failures);
    }

    /// <summary>
    /// Baut den Befehl, mit dem ein Eintrag im erhöhten Kontext entfernt wird.
    /// Dateien wandern auch hier in den Papierkorb, nicht in die endgültige Löschung.
    /// </summary>
    private static string BuildElevatedRemovalCommand(LeftoverItem item)
    {
        if (item.IsRegistry)
        {
            return $"reg delete \"{item.Path}\" /f";
        }

        var escaped = item.Path.Replace("'", "''");
        return "powershell -NoProfile -NonInteractive -Command " +
               "\"Add-Type -AssemblyName Microsoft.VisualBasic; " +
               $"if (Test-Path -LiteralPath '{escaped}' -PathType Container) {{ " +
               $"[Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory('{escaped}','OnlyErrorDialogs','SendToRecycleBin') }} " +
               $"else {{ [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile('{escaped}','OnlyErrorDialogs','SendToRecycleBin') }}\"";
    }

    // ---------------------------------------------------------------------
    // Hilfsfunktionen
    // ---------------------------------------------------------------------

    /// <summary>
    /// Vergleicht zwei normalisierte Namen. <c>null</c> bedeutet "kein Treffer".
    /// Bewusst streng, damit keine fremden Ordner vorgeschlagen werden.
    /// </summary>
    private static LeftoverConfidence? MatchStrength(string candidate, string programKey)
    {
        if (candidate.Length < 3 || programKey.Length < 3)
        {
            return null;
        }

        if (candidate == programKey)
        {
            return LeftoverConfidence.High;
        }

        // "Foobar Editor 3" -> Ordner "Foobar Editor": Präfix-Treffer ab 6 Zeichen.
        if (candidate.Length >= 6 && programKey.StartsWith(candidate, StringComparison.Ordinal))
        {
            return LeftoverConfidence.Medium;
        }

        if (programKey.Length >= 6 && candidate.StartsWith(programKey, StringComparison.Ordinal))
        {
            return LeftoverConfidence.Medium;
        }

        return null;
    }

    /// <summary>
    /// Reduziert einen Anzeigenamen auf Kleinbuchstaben und Ziffern und entfernt
    /// Versionsangaben sowie Rechtsformzusätze, damit Namensvarianten zusammenpassen.
    /// </summary>
    internal static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var builder = new StringBuilder(value.Length);
        foreach (var c in value)
        {
            if (char.IsLetterOrDigit(c))
            {
                builder.Append(char.ToLowerInvariant(c));
            }
        }

        var text = builder.ToString();

        foreach (var suffix in new[] { "inc", "llc", "ltd", "gmbh", "corporation", "corp", "software", "gmbhcokg" })
        {
            if (text.Length > suffix.Length + 3 && text.EndsWith(suffix, StringComparison.Ordinal))
            {
                text = text[..^suffix.Length];
            }
        }

        // Angehängte Versionsnummern entfernen ("notepad3" bleibt, "app1024" wird gekürzt).
        var end = text.Length;
        while (end > 4 && char.IsDigit(text[end - 1]))
        {
            end--;
        }

        return end >= 4 ? text[..end] : text;
    }

    private static bool IsProtectedPath(string path)
    {
        try
        {
            var full = Path.GetFullPath(path).TrimEnd(Path.DirectorySeparatorChar);
            var name = Path.GetFileName(full);

            if (string.IsNullOrEmpty(name) || ProtectedNames.Contains(name))
            {
                return true;
            }

            // Laufwerkswurzeln und direkte Windows-Unterordner sind tabu.
            var windows = Environment.GetFolderPath(Environment.SpecialFolder.Windows);
            return full.Length <= 3 || full.StartsWith(windows, StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return true;
        }
    }

    private static IEnumerable<string> EnumerateDirectoriesSafe(string root)
    {
        try
        {
            return Directory.EnumerateDirectories(root).ToList();
        }
        catch
        {
            return Array.Empty<string>();
        }
    }

    private static IEnumerable<string> EnumerateFilesSafe(string root, string pattern)
    {
        try
        {
            return Directory.EnumerateFiles(root, pattern).ToList();
        }
        catch
        {
            return Array.Empty<string>();
        }
    }

    /// <summary>Ermittelt die Ordnergröße, bricht bei sehr großen Bäumen ab.</summary>
    private static long? TryGetDirectorySize(string path, CancellationToken token)
    {
        try
        {
            long total = 0;
            var counted = 0;

            foreach (var file in Directory.EnumerateFiles(path, "*", SearchOption.AllDirectories))
            {
                if (token.IsCancellationRequested || ++counted > 25_000)
                {
                    break;
                }

                try
                {
                    total += new FileInfo(file).Length;
                }
                catch
                {
                    // Einzelne unlesbare Datei ignorieren.
                }
            }

            return total;
        }
        catch
        {
            return null;
        }
    }

    private static bool RegistryKeyExists(string fullPath)
    {
        return TryOpenParent(fullPath, writable: false, out var parent, out var childName) &&
               OpenAndDispose(parent!, childName);
    }

    private static bool OpenAndDispose(RegistryKey parent, string childName)
    {
        using (parent)
        {
            using var child = parent.OpenSubKey(childName);
            return child is not null;
        }
    }

    private static bool DeleteRegistryKey(string fullPath, out string error)
    {
        error = string.Empty;

        try
        {
            if (!TryOpenParent(fullPath, writable: true, out var parent, out var childName) || parent is null)
            {
                error = "Übergeordneter Schlüssel nicht gefunden.";
                return false;
            }

            using (parent)
            {
                parent.DeleteSubKeyTree(childName, throwOnMissingSubKey: false);
            }

            return true;
        }
        catch (UnauthorizedAccessException)
        {
            error = "Zugriff verweigert - bitte als Administrator starten.";
            return false;
        }
        catch (Exception ex)
        {
            error = ex.Message;
            return false;
        }
    }

    /// <summary>Zerlegt "HKEY_LOCAL_MACHINE\SOFTWARE\Foo\Bar" in den Elternschlüssel und "Bar".</summary>
    private static bool TryOpenParent(string fullPath, bool writable, out RegistryKey? parent, out string childName)
    {
        parent = null;
        childName = string.Empty;

        if (string.IsNullOrWhiteSpace(fullPath))
        {
            return false;
        }

        var separator = fullPath.IndexOf('\\');
        if (separator <= 0)
        {
            return false;
        }

        var hiveName = fullPath[..separator];
        var subPath = fullPath[(separator + 1)..];

        var hive = hiveName.ToUpperInvariant() switch
        {
            "HKEY_LOCAL_MACHINE" or "HKLM" => RegistryHive.LocalMachine,
            "HKEY_CURRENT_USER" or "HKCU" => RegistryHive.CurrentUser,
            "HKEY_CLASSES_ROOT" or "HKCR" => RegistryHive.ClassesRoot,
            _ => (RegistryHive)0,
        };

        if (hive == 0)
        {
            return false;
        }

        var lastSeparator = subPath.LastIndexOf('\\');
        if (lastSeparator <= 0)
        {
            return false;
        }

        var parentPath = subPath[..lastSeparator];
        childName = subPath[(lastSeparator + 1)..];

        try
        {
            var view = hive == RegistryHive.LocalMachine ? RegistryView.Registry64 : RegistryView.Default;
            var baseKey = RegistryKey.OpenBaseKey(hive, view);
            parent = baseKey.OpenSubKey(parentPath, writable);

            if (parent is null)
            {
                baseKey.Dispose();
                return false;
            }

            return true;
        }
        catch
        {
            return false;
        }
    }
}
