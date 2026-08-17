using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Security.Principal;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace EverythingSelf.Core.SystemAccess;

/// <summary>Ergebnis eines mit Administratorrechten ausgeführten Befehlsblocks.</summary>
public sealed class ElevatedResult
{
    public ElevatedResult(bool success, int exitCode, string output, bool userDeclined)
    {
        Success = success;
        ExitCode = exitCode;
        Output = output;
        UserDeclined = userDeclined;
    }

    public bool Success { get; }

    public int ExitCode { get; }

    /// <summary>Gesammelte Ausgabe aller Befehle.</summary>
    public string Output { get; }

    /// <summary>Der Benutzer hat die Windows-Rückfrage zur Rechteerhöhung abgelehnt.</summary>
    public bool UserDeclined { get; }
}

/// <summary>
/// Führt Befehle mit Administratorrechten aus.
///
/// Das Hauptprogramm läuft bewusst OHNE erhöhte Rechte, weil Windows sonst die
/// Fensternachrichten von Everything an uns blockieren würde (UIPI) und damit die
/// gesamte Suche tot wäre. Privilegierte Eingriffe wandern deshalb in einen
/// kurzlebigen, erhöhten Kindprozess - eine einzige UAC-Rückfrage pro Vorgang.
///
/// Als Träger dient ein PowerShell-Skript, kein Batch. Batchdateien werden von cmd.exe
/// in der ANSI-/OEM-Codepage gelesen; Pfade mit Umlauten kämen dort verstümmelt an.
/// PowerShell liest die Datei dagegen als UTF-8, sobald sie eine Bytefolgemarkierung
/// (BOM) trägt - deshalb wird sie genau so geschrieben.
/// </summary>
public static class ElevatedRunner
{
    /// <summary>UTF-8 mit BOM: nur so erkennt Windows PowerShell 5.1 die Kodierung zuverlässig.</summary>
    private static readonly Encoding ScriptEncoding = new UTF8Encoding(encoderShouldEmitUTF8Identifier: true);

    /// <summary>UTF-8 ohne BOM für das Protokoll, das wir selbst wieder einlesen.</summary>
    private static readonly Encoding LogEncoding = new UTF8Encoding(encoderShouldEmitUTF8Identifier: false);

    /// <summary>Läuft dieser Prozess bereits mit Administratorrechten?</summary>
    public static bool IsElevated
    {
        get
        {
            try
            {
                using var identity = WindowsIdentity.GetCurrent();
                return new WindowsPrincipal(identity).IsInRole(WindowsBuiltInRole.Administrator);
            }
            catch
            {
                return false;
            }
        }
    }

    /// <summary>
    /// Führt die übergebenen Kommandozeilen der Reihe nach aus.
    /// Die Befehle sind exakt die, die dem Benutzer vorher angezeigt werden.
    /// </summary>
    public static async Task<ElevatedResult> RunAsync(
        IReadOnlyList<string> commands,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(commands);

        if (commands.Count == 0)
        {
            return new ElevatedResult(true, 0, string.Empty, false);
        }

        var workingDirectory = Path.Combine(Path.GetTempPath(), "EverythingSelf");
        Directory.CreateDirectory(workingDirectory);

        var token = Guid.NewGuid().ToString("N");
        var scriptPath = Path.Combine(workingDirectory, $"aktion_{token}.ps1");
        var logPath = Path.Combine(workingDirectory, $"protokoll_{token}.txt");

        try
        {
            await File.WriteAllTextAsync(scriptPath, BuildScript(commands, logPath), ScriptEncoding, cancellationToken)
                .ConfigureAwait(false);

            var exitCode = await StartAndWaitAsync(scriptPath, cancellationToken).ConfigureAwait(false);

            var output = File.Exists(logPath)
                ? await File.ReadAllTextAsync(logPath, LogEncoding, cancellationToken).ConfigureAwait(false)
                : string.Empty;

            return new ElevatedResult(exitCode == 0, exitCode, output.Trim(), false);
        }
        catch (Win32Exception ex) when (ex.NativeErrorCode == 1223)
        {
            // 1223 = ERROR_CANCELLED: Der Benutzer hat die UAC-Abfrage abgelehnt.
            return new ElevatedResult(false, 1223,
                "Die Rechteerhöhung wurde abgelehnt. Der Vorgang wurde nicht ausgeführt.", true);
        }
        catch (Exception ex)
        {
            return new ElevatedResult(false, -1, "Fehler: " + ex.Message, false);
        }
        finally
        {
            TryDelete(scriptPath);
            TryDelete(logPath);
        }
    }

    /// <summary>
    /// Baut das PowerShell-Skript. Jeder Befehl wird über cmd.exe gestartet, damit die
    /// gewohnte Kommandozeilen-Syntax gilt - die Zeichenkette selbst reicht PowerShell
    /// aber als Unicode weiter, sodass Umlaute in Pfaden erhalten bleiben.
    /// </summary>
    private static string BuildScript(IReadOnlyList<string> commands, string logPath)
    {
        var builder = new StringBuilder();

        builder.AppendLine("$ErrorActionPreference = 'Continue'");
        builder.AppendLine();
        builder.AppendLine("# Ausgaben der aufgerufenen Programme kommen in der OEM-Codepage der Konsole.");
        builder.AppendLine("# Ohne diese Zeile würden Umlaute darin verstümmelt ankommen.");
        builder.AppendLine("try {");
        builder.AppendLine("    [Console]::OutputEncoding = [System.Text.Encoding]::GetEncoding(" +
                           "[System.Globalization.CultureInfo]::CurrentCulture.TextInfo.OEMCodePage)");
        builder.AppendLine("} catch { }");
        builder.AppendLine();
        builder.AppendLine("$lines = New-Object System.Collections.Generic.List[string]");
        builder.AppendLine("$lines.Add('Ausgeführt am ' + (Get-Date).ToString('dd.MM.yyyy HH:mm:ss'))");
        builder.AppendLine();
        builder.AppendLine("# Diagnose: war dieser Prozess wirklich erhöht? Ein 'Zugriff verweigert' bei");
        builder.AppendLine("# einem Systembefehl trotz Administratorrechten deutet meist auf eine von");
        builder.AppendLine("# der Organisation verwaltete Richtlinien-Sperre hin (MDM/Gruppenrichtlinie),");
        builder.AppendLine("# nicht auf ein Problem dieses Programms.");
        builder.AppendLine("$identity = [Security.Principal.WindowsIdentity]::GetCurrent()");
        builder.AppendLine("$principal = New-Object Security.Principal.WindowsPrincipal($identity)");
        builder.AppendLine("$istErhoeht = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)");
        builder.AppendLine("$lines.Add('Angemeldet als: ' + $identity.Name + ' (erhöht: ' + $istErhoeht + ')')");

        foreach (var command in commands)
        {
            var quoted = Quote(command);
            builder.AppendLine();
            builder.AppendLine("$lines.Add('')");
            builder.AppendLine($"$lines.Add('> ' + {quoted})");
            builder.AppendLine($"$ausgabe = & cmd.exe /c {quoted} 2>&1 | Out-String");
            builder.AppendLine("$lines.Add($ausgabe.TrimEnd())");
            builder.AppendLine("$lines.Add('   [Rückgabewert ' + $LASTEXITCODE + ']')");
        }

        builder.AppendLine();
        builder.AppendLine($"[System.IO.File]::WriteAllLines({Quote(logPath)}, $lines, " +
                           "(New-Object System.Text.UTF8Encoding($false)))");
        builder.AppendLine("exit 0");

        return builder.ToString();
    }

    /// <summary>Verpackt einen Text als einfach zitierte PowerShell-Zeichenkette.</summary>
    private static string Quote(string text) => "'" + text.Replace("'", "''") + "'";

    private static async Task<int> StartAndWaitAsync(string scriptPath, CancellationToken cancellationToken)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = "powershell.exe",
            Arguments = $"-NoProfile -NonInteractive -ExecutionPolicy Bypass -File \"{scriptPath}\"",
            UseShellExecute = true,
            CreateNoWindow = true,
            WindowStyle = ProcessWindowStyle.Hidden,
        };

        if (!IsElevated)
        {
            // Löst die UAC-Abfrage aus.
            startInfo.Verb = "runas";
        }

        using var process = Process.Start(startInfo);
        if (process is null)
        {
            throw new InvalidOperationException("Der erhöhte Prozess konnte nicht gestartet werden.");
        }

        await process.WaitForExitAsync(cancellationToken).ConfigureAwait(false);
        return process.ExitCode;
    }

    private static void TryDelete(string path)
    {
        try
        {
            if (File.Exists(path))
            {
                File.Delete(path);
            }
        }
        catch
        {
            // Temporäre Datei bleibt liegen - unkritisch.
        }
    }
}
