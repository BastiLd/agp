using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using EverythingSelf.Core.SystemAccess;
using Microsoft.Win32;

namespace EverythingSelf.Core.Edge;

/// <summary>
/// Untersucht die Edge-Installation und bietet gezielte, einzeln bestätigbare Eingriffe an.
/// Jede Aktion nutzt ausschließlich dokumentierte Windows-Bordmittel
/// (sc.exe, schtasks.exe und den von Microsoft mitgelieferten setup.exe).
/// </summary>
public static class EdgeRemovalService
{
    private const string EdgeUpdatePolicyKey = @"SOFTWARE\Policies\Microsoft\EdgeUpdate";
    private const string WidgetsPolicyKey = @"SOFTWARE\Policies\Microsoft\Dsh";
    private const string TaskbarAdvancedKey = @"Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced";

    /// <summary>
    /// Erklärung zu der Beobachtung, dass Edge weiterhin Favicons herunterlädt,
    /// obwohl der Browser scheinbar nicht benutzt wird.
    /// </summary>
    public const string FaviconExplanation =
        "Warum tauchen ständig favicon.ico-Downloads auf?\n\n" +
        "Ein Favicon ist das kleine Symbol einer Webseite. Es wird nicht nur beim Surfen geladen, " +
        "sondern auch von Programmen, die im Hintergrund die Edge-Engine (WebView2) benutzen - allen " +
        "voran der Windows-Widgets-Dienst (WidgetService.exe), der Nachrichten- und Wetterkacheln lädt, " +
        "sowie diverse Apps von Drittanbietern, die statt eines eigenen Browsers einfach Edge einbetten.\n\n" +
        "Diese Hintergrundsitzungen benutzen dasselbe Edge-Profil und denselben Download-Verlauf. " +
        "Deshalb erscheinen die Favicons im Download-Fenster von Edge, obwohl niemand den Browser " +
        "aktiv geöffnet hat. Der wirksamste Hebel ist die Karte \"Windows Widgets\" weiter unten - " +
        "sie schaltet die konkrete Ursache ab, ohne WebView2 selbst anzutasten.";

    /// <summary>Untersucht das System und liefert alle relevanten Edge-Bestandteile.</summary>
    public static Task<IReadOnlyList<EdgeComponent>> InspectAsync(CancellationToken cancellationToken = default)
        => Task.Run<IReadOnlyList<EdgeComponent>>(Inspect, cancellationToken);

    private static IReadOnlyList<EdgeComponent> Inspect()
    {
        var components = new List<EdgeComponent>
        {
            InspectWidgets(),
            InspectEdgeBrowser(),
            InspectWebView2(),
            InspectUpdateServices(),
            InspectUpdateTasks(),
            InspectReinstallPolicy(),
        };

        return components;
    }

    // ---------------------------------------------------------------------
    // Inspektion
    // ---------------------------------------------------------------------

    /// <summary>
    /// Untersucht die Windows-Widgets - in der Praxis die konkreteste, am leichtesten
    /// abschaltbare Ursache der Favicon-Downloads, weil der Widgets-Dienst regelmäßig
    /// Kachelinhalte samt Favicons über WebView2 nachlädt.
    /// </summary>
    private static EdgeComponent InspectWidgets()
    {
        var policyBlocked = ReadWidgetsPolicy();
        var running = IsProcessRunning("WidgetService") || IsProcessRunning("Widgets");
        var taskbarIconVisible = ReadTaskbarWidgetsIcon();
        var fullyDisabled = policyBlocked && !running && !taskbarIconVisible;

        var status = new List<string>
        {
            policyBlocked
                ? "Richtlinie: Widgets sind per Richtlinie deaktiviert."
                : "Richtlinie: nicht gesetzt - Widgets dürfen laufen.",
            running
                ? "Gerade aktiv: der Widgets-Hintergrunddienst läuft momentan."
                : "Gerade aktiv: der Widgets-Hintergrunddienst läuft momentan nicht.",
            taskbarIconVisible
                ? "Taskleiste: Widgets-Symbol wird angezeigt."
                : "Taskleiste: Widgets-Symbol ist ausgeblendet.",
        };

        if (fullyDisabled)
        {
            status.Add("Vollständig abgeschaltet.");
        }

        return new EdgeComponent
        {
            Title = "Windows Widgets",
            WhatItIs =
                "Das Widgets-Board (Nachrichten, Wetter, Kalender) in der Taskleiste. Es wird von " +
                "WidgetService.exe betrieben, einem Hintergrundprozess, der die Kachelinhalte über die " +
                "WebView2-Engine lädt - inklusive der Favicons der jeweiligen Nachrichtenquellen. " +
                "Das läuft unabhängig davon, ob das Taskleisten-Symbol sichtbar ist.",
            IsPresent = true,
            StatusText = string.Join("\n", status),
            Action = fullyDisabled ? EdgeActionKind.None : EdgeActionKind.DisableWidgets,
            ActionTitle = "Widgets abschalten",
            ActionExplanation =
                "Setzt die von Microsoft dokumentierte Gruppenrichtlinie \"Allow widgets\" auf " +
                "Deaktiviert:\n\n" +
                @"    reg add HKLM\SOFTWARE\Policies\Microsoft\Dsh /v AllowNewsAndInterests /t REG_DWORD /d 0 /f" +
                "\n\n" +
                "Zusätzlich wird das Taskleisten-Symbol ausgeblendet und der gerade laufende Dienst " +
                "sofort beendet, damit die Wirkung ohne Neustart einsetzt. Das Widgets-Feature selbst " +
                "bleibt installiert - es wird nur per Richtlinie stillgelegt, nichts wird gelöscht.",
            HowToUndo =
                @"Rückgängig durch Löschen von AllowNewsAndInterests unter HKLM\SOFTWARE\Policies\Microsoft\Dsh " +
                "(oder Wert auf 1 setzen), danach An- und Abmelden.",
            IsDestructive = false,
        };
    }

    private static EdgeComponent InspectEdgeBrowser()
    {
        var installation = FindEdgeInstallation();
        var isRealInstall = installation is { IsLeftoverShellOnly: false };

        var status = installation switch
        {
            null => "Nicht gefunden - Edge ist auf diesem System nicht installiert.",
            { IsLeftoverShellOnly: true } =>
                $"Bereits deinstalliert. Es liegt nur noch eine leere Ordnerhülle der Version " +
                $"{installation.Version} herum - ohne msedge.exe. Der Browser selbst ist weg; " +
                "was weiterhin im Hintergrund läuft, ist die WebView2-Laufzeit darunter.",
            _ => $"Installiert in Version {installation.Version}.",
        };

        return new EdgeComponent
        {
            Title = "Microsoft Edge (Browser)",
            WhatItIs =
                "Der eigentliche Webbrowser von Microsoft. Er liegt getrennt von der WebView2-Laufzeit " +
                "in einem eigenen Versionsordner und bringt sein eigenes Deinstallationsprogramm mit.\n\n" +
                "Entscheidend ist, ob im Versionsordner eine msedge.exe liegt. Fehlt sie, ist der Browser " +
                "bereits entfernt und der Ordner nur noch eine Hülle.",
            IsPresent = installation is not null,
            Version = installation?.Version,
            Location = installation?.VersionDirectory,
            StatusText = status,
            Action = isRealInstall && installation!.SetupPath is not null
                ? EdgeActionKind.UninstallEdge
                : EdgeActionKind.None,
            ActionTitle = "Edge deinstallieren",
            ActionExplanation =
                "Ruft das von Microsoft mitgelieferte Deinstallationsprogramm auf:\n\n" +
                "    setup.exe --uninstall --system-level --force-uninstall\n\n" +
                "Das entfernt den Browser Microsoft Edge. Nicht entfernt werden dabei die WebView2-Laufzeit " +
                "und der Update-Dienst - diese sind getrennte Produkte.\n\n" +
                "Wichtig: Windows installiert Edge bei größeren Funktionsupdates unter Umständen erneut. " +
                "Wer das verhindern möchte, sollte zusätzlich die Richtlinie weiter unten setzen.",
            HowToUndo =
                "Edge kann jederzeit kostenlos von microsoft.com/edge neu installiert werden.",
            IsDestructive = true,
        };
    }

    private static EdgeComponent InspectWebView2()
    {
        var webView = FindWebView2Installation();

        return new EdgeComponent
        {
            Title = "WebView2-Laufzeit",
            WhatItIs =
                "Die Edge-Engine ohne Browserfenster. Windows selbst und viele Programme betten sie ein, " +
                "um Webinhalte anzuzeigen - unter anderem die Windows-Widgets, Teile des Startmenüs, " +
                "Office-Komponenten und zahlreiche Apps von Drittanbietern.\n\n" +
                "Genau diese Hintergrundnutzung ist die häufigste Ursache für Favicon-Downloads, " +
                "die im Edge-Downloadfenster auftauchen, ohne dass der Browser geöffnet wurde.",
            IsPresent = webView is not null,
            Version = webView?.Version,
            Location = webView?.BrowserPath ?? webView?.VersionDirectory,
            StatusText = webView is null
                ? "Nicht gefunden."
                : $"Installiert in Version {webView.Version}. Wird von diesem Programm bewusst nicht angetastet." +
                  (webView.BrowserPath is not null
                      ? "\n\nAchtung: Hier liegt eine vollwertige msedge.exe. Genau dieses Programm läuft " +
                        "im Hintergrund, wenn Windows-Komponenten Webinhalte anzeigen - mit demselben " +
                        "Downloadverlauf, den auch der Browser benutzt hat."
                      : string.Empty),
            Action = EdgeActionKind.None,
            ActionTitle = string.Empty,
            ActionExplanation =
                "Für WebView2 wird absichtlich keine Entfernung angeboten. Ohne diese Laufzeit können " +
                "Windows-Funktionen wie die Widgets und diverse installierte Programme abstürzen oder " +
                "leere Fenster anzeigen. Der Nutzen einer Entfernung steht in keinem Verhältnis zum Risiko.",
            HowToUndo = string.Empty,
        };
    }

    private static EdgeComponent InspectUpdateServices()
    {
        var states = new List<string>();
        var anyPresent = false;
        var anyActive = false;

        foreach (var serviceName in new[] { "edgeupdate", "edgeupdatem" })
        {
            var info = QueryService(serviceName);
            if (info is null)
            {
                continue;
            }

            anyPresent = true;
            if (!info.IsDisabled)
            {
                anyActive = true;
            }

            states.Add($"{serviceName}: Starttyp {info.StartTypeLabel}");
        }

        return new EdgeComponent
        {
            Title = "Edge-Update-Dienste",
            WhatItIs =
                "Die beiden Windows-Dienste edgeupdate und edgeupdatem. Sie laden im Hintergrund neue " +
                "Edge-Versionen herunter und installieren sie - unabhängig davon, ob Edge benutzt wird.",
            IsPresent = anyPresent,
            StatusText = anyPresent
                ? string.Join("\n", states) + (anyActive ? string.Empty : "\nBereits deaktiviert.")
                : "Keine Edge-Update-Dienste gefunden.",
            Action = anyActive ? EdgeActionKind.DisableUpdateServices : EdgeActionKind.None,
            ActionTitle = "Update-Dienste deaktivieren",
            ActionExplanation =
                "Stoppt beide Dienste und setzt ihren Starttyp auf \"Deaktiviert\":\n\n" +
                "    sc stop edgeupdate\n" +
                "    sc config edgeupdate start= disabled\n\n" +
                "Danach aktualisiert sich Edge nicht mehr von selbst. Der Browser bleibt nutzbar, " +
                "bekommt aber keine Sicherheitsupdates mehr - das ist nur sinnvoll, wenn Edge " +
                "ohnehin nicht als Browser verwendet wird.",
            HowToUndo =
                "Rückgängig mit: sc config edgeupdate start= auto  (bzw. start= demand für edgeupdatem).",
        };
    }

    private static EdgeComponent InspectUpdateTasks()
    {
        var tasks = QueryEdgeUpdateTasks();
        var enabled = tasks.Where(static t => t.Enabled).ToList();

        return new EdgeComponent
        {
            Title = "Geplante Aufgaben des Edge-Updaters",
            WhatItIs =
                "Zwei Einträge in der Windows-Aufgabenplanung (MicrosoftEdgeUpdateTaskMachineCore und " +
                "...TaskMachineUA). Sie starten den Edge-Updater regelmäßig sowie bei jeder Anmeldung " +
                "und können einen zuvor entfernten Edge dadurch stillschweigend zurückholen.",
            IsPresent = tasks.Count > 0,
            StatusText = tasks.Count == 0
                ? "Keine Edge-Update-Aufgaben gefunden. Hinweis: Zum vollständigen Auslesen der " +
                  "Aufgabenplanung werden Administratorrechte benötigt."
                : string.Join("\n", tasks.Select(static t => $"{t.Name}: {(t.Enabled ? "aktiv" : "deaktiviert")}")),
            Action = enabled.Count > 0 ? EdgeActionKind.DisableUpdateTasks : EdgeActionKind.None,
            ActionTitle = "Update-Aufgaben deaktivieren",
            ActionExplanation =
                "Setzt die gefundenen Edge-Update-Aufgaben auf \"deaktiviert\":\n\n" +
                "    schtasks /Change /TN \"<Aufgabe>\" /Disable\n\n" +
                "Die Aufgaben bleiben in der Aufgabenplanung sichtbar, werden aber nicht mehr ausgeführt.",
            HowToUndo =
                "Rückgängig mit: schtasks /Change /TN \"<Aufgabe>\" /Enable",
        };
    }

    private static EdgeComponent InspectReinstallPolicy()
    {
        var isBlocked = ReadReinstallPolicy();

        return new EdgeComponent
        {
            Title = "Richtlinie gegen automatische Neuinstallation",
            WhatItIs =
                "Ein von Microsoft offiziell dokumentierter Richtlinienwert unter " +
                @"HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\EdgeUpdate. " +
                "Er teilt dem Edge-Updater mit, dass Edge auf diesem Rechner nicht automatisch " +
                "ausgerollt werden soll.",
            IsPresent = true,
            StatusText = isBlocked
                ? "Bereits gesetzt - eine automatische Neuinstallation ist blockiert."
                : "Nicht gesetzt - Windows darf Edge jederzeit erneut ausrollen.",
            Action = isBlocked ? EdgeActionKind.None : EdgeActionKind.BlockReinstall,
            ActionTitle = "Neuinstallation blockieren",
            ActionExplanation =
                "Legt in der Registry zwei Werte an:\n\n" +
                "    DoNotUpdateToEdgeWithChromium = 1\n" +
                "    InstallDefault = 0\n\n" +
                "Damit installiert der Edge-Updater Edge nicht mehr eigenständig nach. " +
                "Das ist eine reine Konfigurationsänderung, es wird nichts gelöscht.",
            HowToUndo =
                @"Rückgängig durch Löschen der beiden Werte unter HKLM\SOFTWARE\Policies\Microsoft\EdgeUpdate.",
        };
    }

    // ---------------------------------------------------------------------
    // Aktionen
    // ---------------------------------------------------------------------

    /// <summary>
    /// Liefert die Befehle, die eine Aktion ausführen würde - wortwörtlich so,
    /// wie sie später laufen. Die Oberfläche zeigt sie dem Benutzer vor der Bestätigung.
    /// </summary>
    public static IReadOnlyList<string> BuildCommands(EdgeActionKind action)
    {
        switch (action)
        {
            case EdgeActionKind.DisableUpdateServices:
            {
                var commands = new List<string>();
                foreach (var serviceName in new[] { "edgeupdate", "edgeupdatem" })
                {
                    if (QueryService(serviceName) is null)
                    {
                        continue;
                    }

                    commands.Add($"sc stop {serviceName}");
                    commands.Add($"sc config {serviceName} start= disabled");
                }

                return commands;
            }

            case EdgeActionKind.DisableUpdateTasks:
                return QueryEdgeUpdateTasks()
                    .Where(static t => t.Enabled)
                    .Select(static t => $"schtasks /Change /TN \"{t.Name}\" /Disable")
                    .ToList();

            case EdgeActionKind.BlockReinstall:
                return new[]
                {
                    $"reg add \"HKLM\\{EdgeUpdatePolicyKey}\" /v DoNotUpdateToEdgeWithChromium /t REG_DWORD /d 1 /f",
                    $"reg add \"HKLM\\{EdgeUpdatePolicyKey}\" /v InstallDefault /t REG_DWORD /d 0 /f",
                };

            case EdgeActionKind.UninstallEdge:
            {
                var installation = FindEdgeInstallation();
                return installation?.SetupPath is null
                    ? Array.Empty<string>()
                    : new[] { $"\"{installation.SetupPath}\" --uninstall --system-level --force-uninstall --verbose-logging" };
            }

            case EdgeActionKind.DisableWidgets:
                return new[]
                {
                    $"reg add \"HKLM\\{WidgetsPolicyKey}\" /v AllowNewsAndInterests /t REG_DWORD /d 0 /f",
                    $"reg add \"HKCU\\{TaskbarAdvancedKey}\" /v TaskbarDa /t REG_DWORD /d 0 /f",
                    "taskkill /F /IM WidgetService.exe",
                    "taskkill /F /IM Widgets.exe",
                };

            default:
                return Array.Empty<string>();
        }
    }

    /// <summary>
    /// Führt die gewählte Aktion aus. Alle Aktionen benötigen Administratorrechte und
    /// laufen deshalb in einem erhöhten Kindprozess (eine UAC-Rückfrage).
    /// </summary>
    public static async Task<EdgeActionResult> ExecuteAsync(
        EdgeActionKind action,
        CancellationToken cancellationToken = default)
    {
        var commands = BuildCommands(action);
        if (commands.Count == 0)
        {
            return new EdgeActionResult(false,
                "Für diesen Eintrag gibt es derzeit nichts zu tun.", Array.Empty<string>());
        }

        var result = await ElevatedRunner.RunAsync(commands, cancellationToken).ConfigureAwait(false);

        var steps = new List<string>(commands);
        if (!string.IsNullOrWhiteSpace(result.Output))
        {
            steps.Add(string.Empty);
            steps.Add("--- Ausgabe ---");
            steps.Add(result.Output);
        }

        if (result.UserDeclined)
        {
            return new EdgeActionResult(false, result.Output, steps);
        }

        // Rückgabewerte der Kommandozeilenwerkzeuge sind unzuverlässig - "sc stop" meldet
        // zum Beispiel einen Fehler, wenn der Dienst ohnehin schon stand. Deshalb wird
        // stattdessen nachgesehen, ob der gewünschte Zustand jetzt tatsächlich vorliegt.
        var applied = IsAlreadyApplied(action);

        return new EdgeActionResult(applied, DescribeOutcome(action, applied), steps);
    }

    /// <summary>Prüft am System nach, ob die Aktion ihr Ziel erreicht hat.</summary>
    private static bool IsAlreadyApplied(EdgeActionKind action) => action switch
    {
        EdgeActionKind.DisableUpdateServices =>
            new[] { "edgeupdate", "edgeupdatem" }
                .Select(QueryService)
                .All(static info => info is null || info.IsDisabled),

        EdgeActionKind.DisableUpdateTasks =>
            !QueryEdgeUpdateTasks().Any(static task => task.Enabled),

        EdgeActionKind.BlockReinstall => ReadReinstallPolicy(),

        EdgeActionKind.UninstallEdge =>
            FindEdgeInstallation() is null or { IsLeftoverShellOnly: true },

        EdgeActionKind.DisableWidgets =>
            ReadWidgetsPolicy() && !IsProcessRunning("WidgetService") && !IsProcessRunning("Widgets"),

        _ => true,
    };

    private static bool ReadWidgetsPolicy()
    {
        try
        {
            using var baseKey = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64);
            using var key = baseKey.OpenSubKey(WidgetsPolicyKey);
            return key?.GetValue("AllowNewsAndInterests") is int flag && flag == 0;
        }
        catch
        {
            return false;
        }
    }

    private static bool ReadTaskbarWidgetsIcon()
    {
        try
        {
            using var key = Registry.CurrentUser.OpenSubKey(TaskbarAdvancedKey);
            // Fehlt der Wert, zeigt Windows das Symbol standardmäßig an.
            return key?.GetValue("TaskbarDa") is not int flag || flag != 0;
        }
        catch
        {
            return true;
        }
    }

    private static bool IsProcessRunning(string processName)
    {
        try
        {
            return Process.GetProcessesByName(processName).Length > 0;
        }
        catch
        {
            return false;
        }
    }

    private static bool ReadReinstallPolicy()
    {
        try
        {
            using var baseKey = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64);
            using var key = baseKey.OpenSubKey(EdgeUpdatePolicyKey);
            return key?.GetValue("DoNotUpdateToEdgeWithChromium") is int flag && flag == 1;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>Aktionen, die einen Wert unter HKLM\SOFTWARE\Policies\... schreiben.</summary>
    private static bool WritesToPoliciesHive(EdgeActionKind action) =>
        action is EdgeActionKind.BlockReinstall or EdgeActionKind.DisableWidgets;

    /// <summary>
    /// Erklärung für "Zugriff verweigert" trotz echter Rechteerhöhung. Das ist kein
    /// Rechteproblem, sondern fast immer eine gezielte Schreibsperre - entweder von einer
    /// Geräteverwaltung (Schule/Firma) oder von installierter Sicherheitssoftware, die
    /// Schreibzugriffe auf Policy- und Explorer-Schlüssel als verdächtig einstuft.
    /// </summary>
    private static string DescribeAccessDeniedDespiteElevation()
    {
        var securitySoftware = DetectRegistryProtectionSoftware();

        var text = "Steht im Protokoll \"Zugriff verweigert\" bei gleichzeitig \"erhöht: True\", " +
                   "liegt es nicht an fehlenden Rechten. Der Schlüssel wird gezielt gegen Schreibzugriffe " +
                   "geschützt - selbst ein Administrator-Konto kommt dann nicht durch. Zwei mögliche Ursachen:\n\n" +
                   "1. Ein verwaltetes Gerät (Schule/Firma, Intune/MDM) sperrt die Richtlinie serverseitig.\n" +
                   "2. Installierte Sicherheitssoftware mit Selbstschutz/HIPS blockiert die Änderung, weil " +
                   "genau dieses Muster (Skript startet reg.exe auf einen Policy- oder Explorer-Schlüssel) " +
                   "wie ein Manipulationsversuch aussieht.";

        if (securitySoftware is not null)
        {
            text += $"\n\nAuf diesem Rechner ist \"{securitySoftware}\" aktiv - das ist die wahrscheinlichste " +
                    "Ursache. Abhilfe nur direkt in dessen Einstellungen (etwa eine Ausnahme für reg.exe " +
                    "eintragen oder den Selbstschutz kurz pausieren), nicht über dieses Programm.";
        }

        return text;
    }

    /// <summary>Erkennt gängige Sicherheitssoftware, deren Selbstschutz Registry-Schreibzugriffe blockiert.</summary>
    private static string? DetectRegistryProtectionSoftware()
    {
        var knownProcessNames = new[] { "ekrn", "avp", "avpui", "bdagent", "mbamservice", "SavService", "nswscsvc" };
        var labels = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["ekrn"] = "ESET Security",
            ["avp"] = "Kaspersky",
            ["avpui"] = "Kaspersky",
            ["bdagent"] = "Bitdefender",
            ["mbamservice"] = "Malwarebytes Premium",
            ["SavService"] = "Sophos",
            ["nswscsvc"] = "Norton 360",
        };

        foreach (var name in knownProcessNames)
        {
            if (IsProcessRunning(name))
            {
                return labels[name];
            }
        }

        return null;
    }

    private static string DescribeOutcome(EdgeActionKind action, bool applied)
    {
        if (!applied)
        {
            if (action == EdgeActionKind.DisableWidgets && !IsProcessRunning("WidgetService") && !IsProcessRunning("Widgets"))
            {
                // Teilerfolg: der Hintergrunddienst wurde beendet, auch wenn die dauerhafte
                // Richtlinie nicht gesetzt werden konnte. Genau das ist der haeufige Fall bei
                // aktiver Sicherheitssoftware, die nur den Registry-Zugriff blockiert.
                return "Sofortige Wirkung erzielt: Der Widgets-Hintergrunddienst wurde soeben beendet, " +
                       "die Favicon-Downloads sollten für diese Sitzung aufhören.\n\n" +
                       "Die dauerhafte Sperre (damit das auch nach dem nächsten Anmelden so bleibt) " +
                       "konnte aber nicht gesetzt werden:\n\n" + DescribeAccessDeniedDespiteElevation();
            }

            var hint = "Der gewünschte Zustand ist nicht eingetreten. Einzelheiten stehen im Protokoll unten.";

            hint += WritesToPoliciesHive(action)
                ? "\n\n" + DescribeAccessDeniedDespiteElevation()
                : " Häufigste Ursache ist eine abgelehnte oder fehlgeschlagene Rechteerhöhung.";

            return hint;
        }

        return action switch
        {
            EdgeActionKind.DisableUpdateServices => "Die Edge-Update-Dienste sind gestoppt und deaktiviert.",
            EdgeActionKind.DisableUpdateTasks => "Die Update-Aufgaben sind deaktiviert.",
            EdgeActionKind.BlockReinstall => "Die Richtlinie gegen automatische Neuinstallation ist gesetzt.",
            EdgeActionKind.UninstallEdge => "Microsoft Edge wurde entfernt.",
            EdgeActionKind.DisableWidgets =>
                "Widgets sind per Richtlinie abgeschaltet, das Taskleisten-Symbol ausgeblendet und der " +
                "laufende Dienst beendet. Die Favicon-Downloads sollten jetzt aufhören.",
            _ => "Vorgang abgeschlossen.",
        };
    }

    // ---------------------------------------------------------------------
    // Systemabfragen
    // ---------------------------------------------------------------------

    private sealed class EdgeInstallation
    {
        public string ApplicationDirectory { get; init; } = string.Empty;

        public string Version { get; init; } = string.Empty;

        public string VersionDirectory { get; init; } = string.Empty;

        public string? SetupPath { get; init; }

        /// <summary>Pfad zu msedge.exe, sofern die Programmdatei tatsächlich vorhanden ist.</summary>
        public string? BrowserPath { get; init; }

        /// <summary>
        /// Der Versionsordner existiert, enthält aber keine msedge.exe mehr.
        /// Typisch für eine bereits entfernte Installation, deren Ordnerhülle liegen blieb.
        /// </summary>
        public bool IsLeftoverShellOnly => BrowserPath is null;
    }

    private static EdgeInstallation? FindEdgeInstallation()
        => FindChromiumStyleInstallation(new[] { @"Microsoft\Edge\Application" });

    private static EdgeInstallation? FindWebView2Installation()
        => FindChromiumStyleInstallation(new[] { @"Microsoft\EdgeWebView\Application", @"Microsoft\EdgeCore" });

    /// <summary>
    /// Edge und WebView2 liegen beide in einem Ordner mit je einem Unterordner pro Version,
    /// der die Programmdateien und "Installer\setup.exe" enthält.
    ///
    /// Es werden alle bekannten Ablageorte durchsucht. Bevorzugt wird der Fund, in dem
    /// tatsächlich eine msedge.exe liegt - denn neuere WebView2-Versionen verteilen sich
    /// auf eine leere Hülle unter "EdgeWebView" und die echten Dateien unter "EdgeCore".
    /// </summary>
    private static EdgeInstallation? FindChromiumStyleInstallation(IReadOnlyList<string> relativePaths)
    {
        var roots = new[]
        {
            Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),
            Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
        };

        var candidates = new List<EdgeInstallation>();

        foreach (var root in roots.Where(static r => !string.IsNullOrEmpty(r)))
        {
            foreach (var relative in relativePaths)
            {
                var applicationDirectory = Path.Combine(root, relative);
                if (!Directory.Exists(applicationDirectory))
                {
                    continue;
                }

                string[] versionDirectories;
                try
                {
                    versionDirectories = Directory.GetDirectories(applicationDirectory);
                }
                catch
                {
                    continue;
                }

                var newest = versionDirectories
                    .Select(static d => new { Directory = d, Name = Path.GetFileName(d) })
                    .Where(static d => Version.TryParse(d.Name, out _))
                    .OrderByDescending(static d => Version.Parse(d.Name))
                    .FirstOrDefault();

                if (newest is null)
                {
                    continue;
                }

                var setupPath = Path.Combine(newest.Directory, "Installer", "setup.exe");
                var browserPath = Path.Combine(newest.Directory, "msedge.exe");

                candidates.Add(new EdgeInstallation
                {
                    ApplicationDirectory = applicationDirectory,
                    VersionDirectory = newest.Directory,
                    Version = newest.Name,
                    SetupPath = File.Exists(setupPath) ? setupPath : null,
                    BrowserPath = File.Exists(browserPath) ? browserPath : null,
                });
            }
        }

        return candidates.FirstOrDefault(static c => c.BrowserPath is not null) ?? candidates.FirstOrDefault();
    }

    /// <summary>
    /// Liest den Starttyp eines Dienstes direkt aus der Registry. Das ist
    /// sprachunabhängig - im Gegensatz zum übersetzten Text von "sc query".
    /// </summary>
    private static ServiceInfo? QueryService(string name)
    {
        try
        {
            using var baseKey = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64);
            using var key = baseKey.OpenSubKey($@"SYSTEM\CurrentControlSet\Services\{name}");
            if (key is null)
            {
                return null;
            }

            var start = key.GetValue("Start") as int? ?? 3;
            return new ServiceInfo
            {
                Name = name,
                StartValue = start,
            };
        }
        catch
        {
            return null;
        }
    }

    private sealed class ServiceInfo
    {
        public string Name { get; init; } = string.Empty;

        /// <summary>Registry-Wert "Start": 2 = Automatisch, 3 = Manuell, 4 = Deaktiviert.</summary>
        public int StartValue { get; init; }

        public bool IsDisabled => StartValue == 4;

        public string StartTypeLabel => StartValue switch
        {
            0 or 1 => "Systemstart",
            2 => "Automatisch",
            3 => "Manuell",
            4 => "Deaktiviert",
            _ => "Unbekannt",
        };
    }

    private sealed class ScheduledTaskInfo
    {
        public string Name { get; init; } = string.Empty;

        public bool Enabled { get; init; }
    }

    /// <summary>Fragt die Aufgabenplanung per schtasks nach Edge-Update-Aufgaben ab.</summary>
    private static IReadOnlyList<ScheduledTaskInfo> QueryEdgeUpdateTasks()
    {
        var tasks = new List<ScheduledTaskInfo>();

        var result = RunProcess("schtasks.exe", "/Query /FO CSV /NH");
        if (result.ExitCode != 0 || string.IsNullOrWhiteSpace(result.Output))
        {
            return tasks;
        }

        foreach (var line in result.Output.Split('\n', StringSplitOptions.RemoveEmptyEntries))
        {
            var columns = SplitCsvLine(line.Trim());
            if (columns.Count < 3)
            {
                continue;
            }

            var name = columns[0];
            if (name.IndexOf("MicrosoftEdgeUpdate", StringComparison.OrdinalIgnoreCase) < 0)
            {
                continue;
            }

            var state = columns[2];
            tasks.Add(new ScheduledTaskInfo
            {
                Name = name,
                // schtasks meldet je nach Sprache "Disabled" oder "Deaktiviert".
                Enabled = !state.StartsWith("Disab", StringComparison.OrdinalIgnoreCase) &&
                          !state.StartsWith("Deaktiv", StringComparison.OrdinalIgnoreCase),
            });
        }

        return tasks;
    }

    private static List<string> SplitCsvLine(string line)
    {
        var values = new List<string>();
        var current = new StringBuilder();
        var inQuotes = false;

        foreach (var c in line)
        {
            switch (c)
            {
                case '"':
                    inQuotes = !inQuotes;
                    break;
                case ',' when !inQuotes:
                    values.Add(current.ToString());
                    current.Clear();
                    break;
                default:
                    current.Append(c);
                    break;
            }
        }

        values.Add(current.ToString().TrimEnd('\r'));
        return values;
    }

    /// <summary>
    /// Startet ein Konsolenprogramm und liest dessen Ausgabe als UTF-8.
    ///
    /// Der Umweg über cmd.exe mit "chcp 65001" ist Absicht: Konsolenprogramme schreiben
    /// sonst in der OEM-Codepage, und Aufgabennamen mit Umlauten kämen verstümmelt an.
    /// </summary>
    private static (int ExitCode, string Output) RunProcess(string fileName, string arguments, TimeSpan? timeout = null)
    {
        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = $"/c \"chcp 65001>nul & {fileName} {arguments}\"",
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                StandardOutputEncoding = Encoding.UTF8,
                StandardErrorEncoding = Encoding.UTF8,
            };

            using var process = Process.Start(startInfo);
            if (process is null)
            {
                return (-1, "Prozess konnte nicht gestartet werden.");
            }

            var output = process.StandardOutput.ReadToEnd();
            var error = process.StandardError.ReadToEnd();

            if (!process.WaitForExit((int)(timeout ?? TimeSpan.FromMinutes(2)).TotalMilliseconds))
            {
                return (-1, "Zeitüberschreitung beim Ausführen von " + fileName);
            }

            return (process.ExitCode, string.IsNullOrWhiteSpace(error) ? output : output + Environment.NewLine + error);
        }
        catch (Exception ex)
        {
            return (-1, ex.Message);
        }
    }
}
