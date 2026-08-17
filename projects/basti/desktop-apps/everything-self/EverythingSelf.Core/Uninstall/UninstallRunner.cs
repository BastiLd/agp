using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;

namespace EverythingSelf.Core.Uninstall;

/// <summary>Ergebnis eines einzelnen Deinstallationsvorgangs.</summary>
public sealed class UninstallOutcome
{
    public UninstallOutcome(InstalledProgram program, bool started, int? exitCode, string message)
    {
        Program = program;
        Started = started;
        ExitCode = exitCode;
        Message = message;
    }

    public InstalledProgram Program { get; }

    /// <summary>Konnte der Deinstaller überhaupt gestartet werden?</summary>
    public bool Started { get; }

    public int? ExitCode { get; }

    public string Message { get; }

    /// <summary>
    /// Gilt der Vorgang als erfolgreich? Exitcode 0 bedeutet Erfolg,
    /// 1605 = "Produkt nicht installiert", 3010 = "Erfolg, Neustart nötig".
    /// </summary>
    public bool Succeeded => Started && ExitCode is null or 0 or 1605 or 3010;
}

/// <summary>Fortschrittsmeldung während der Abarbeitung der Warteschlange.</summary>
public sealed class UninstallProgress
{
    public UninstallProgress(int index, int total, InstalledProgram program, string status)
    {
        Index = index;
        Total = total;
        Program = program;
        Status = status;
    }

    public int Index { get; }

    public int Total { get; }

    public InstalledProgram Program { get; }

    public string Status { get; }
}

/// <summary>
/// Startet die von den Herstellern hinterlegten Deinstallationsprogramme.
/// Mehrere Programme werden nacheinander abgearbeitet, weil Windows-Installer
/// sich gegenseitig blockieren, wenn sie parallel laufen.
/// </summary>
public static class UninstallRunner
{
    /// <summary>
    /// Arbeitet die übergebenen Programme der Reihe nach ab.
    /// </summary>
    /// <param name="programs">Zu entfernende Programme.</param>
    /// <param name="preferSilent">Wenn möglich die stille Variante ohne Rückfragen nutzen.</param>
    public static async Task<IReadOnlyList<UninstallOutcome>> RunAsync(
        IReadOnlyList<InstalledProgram> programs,
        bool preferSilent,
        IProgress<UninstallProgress>? progress = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(programs);

        var outcomes = new List<UninstallOutcome>(programs.Count);

        for (var i = 0; i < programs.Count; i++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var program = programs[i];
            progress?.Report(new UninstallProgress(i + 1, programs.Count, program, "Deinstallation läuft ..."));

            var outcome = await RunSingleAsync(program, preferSilent, cancellationToken).ConfigureAwait(false);
            outcomes.Add(outcome);

            progress?.Report(new UninstallProgress(i + 1, programs.Count, program, outcome.Message));
        }

        return outcomes;
    }

    private static async Task<UninstallOutcome> RunSingleAsync(
        InstalledProgram program,
        bool preferSilent,
        CancellationToken cancellationToken)
    {
        var command = BuildCommand(program, preferSilent);
        if (command is null)
        {
            return new UninstallOutcome(program, false, null,
                "Kein Deinstallationsbefehl hinterlegt - dieses Programm muss manuell entfernt werden.");
        }

        var startInfo = new ProcessStartInfo
        {
            FileName = command.Value.FileName,
            Arguments = command.Value.Arguments,
            UseShellExecute = true,
            WorkingDirectory = Environment.GetFolderPath(Environment.SpecialFolder.System),
        };

        try
        {
            using var process = Process.Start(startInfo);
            if (process is null)
            {
                return new UninstallOutcome(program, false, null, "Der Deinstaller konnte nicht gestartet werden.");
            }

            await process.WaitForExitAsync(cancellationToken).ConfigureAwait(false);

            var exitCode = process.ExitCode;
            var message = exitCode switch
            {
                0 => "Erfolgreich deinstalliert.",
                1605 => "Das Produkt war bereits entfernt.",
                3010 => "Deinstalliert - ein Neustart wird empfohlen.",
                1602 => "Vom Benutzer abgebrochen.",
                _ => $"Deinstaller beendet mit Code {exitCode}.",
            };

            return new UninstallOutcome(program, true, exitCode, message);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            return new UninstallOutcome(program, false, null, "Fehler beim Start: " + ex.Message);
        }
    }

    /// <summary>
    /// Ermittelt Programmdatei und Argumente. MSI-Produkte werden bei Bedarf
    /// auf <c>msiexec /x {Code} /qn</c> umgestellt, damit sie still entfernt werden können.
    /// </summary>
    internal static (string FileName, string Arguments)? BuildCommand(InstalledProgram program, bool preferSilent)
    {
        if (preferSilent && !string.IsNullOrWhiteSpace(program.QuietUninstallString))
        {
            return SplitCommandLine(program.QuietUninstallString!);
        }

        if (preferSilent && !string.IsNullOrWhiteSpace(program.MsiProductCode))
        {
            return ("msiexec.exe", $"/x {program.MsiProductCode} /qn /norestart");
        }

        if (!string.IsNullOrWhiteSpace(program.UninstallString))
        {
            return SplitCommandLine(program.UninstallString!);
        }

        if (!string.IsNullOrWhiteSpace(program.QuietUninstallString))
        {
            return SplitCommandLine(program.QuietUninstallString!);
        }

        return null;
    }

    /// <summary>
    /// Trennt eine Kommandozeile in Programmdatei und Argumente. Berücksichtigt
    /// Anführungszeichen und unquotierte Pfade mit Leerzeichen (z. B. "C:\Program Files\...\unins000.exe /S").
    /// </summary>
    internal static (string FileName, string Arguments) SplitCommandLine(string commandLine)
    {
        var text = commandLine.Trim();

        if (text.StartsWith('"'))
        {
            var closing = text.IndexOf('"', 1);
            if (closing > 0)
            {
                return (text[1..closing], text[(closing + 1)..].Trim());
            }

            return (text.Trim('"'), string.Empty);
        }

        // Unquotierter Pfad: an der ersten ".exe"-Grenze trennen.
        var exeIndex = text.IndexOf(".exe", StringComparison.OrdinalIgnoreCase);
        if (exeIndex >= 0)
        {
            var splitAt = exeIndex + 4;
            return (text[..splitAt], text[splitAt..].Trim());
        }

        var space = text.IndexOf(' ');
        return space < 0
            ? (text, string.Empty)
            : (text[..space], text[(space + 1)..].Trim());
    }
}
