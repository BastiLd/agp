using System;
using System.Linq;
using System.Threading.Tasks;
using EverythingSelf.Core.Edge;
using EverythingSelf.Core.Search;
using EverythingSelf.Core.Uninstall;

namespace EverythingSelf.Probe;

/// <summary>
/// Kleines Diagnosewerkzeug ohne Oberfläche. Prüft, ob die drei Kernbausteine
/// (Everything-IPC, Programmliste, Edge-Analyse) auf diesem System funktionieren.
/// Aufruf: EverythingSelf.Probe.exe [Suchbegriff]
/// </summary>
internal static class Program
{
    private static async Task<int> Main(string[] args)
    {
        Console.OutputEncoding = System.Text.Encoding.UTF8;

        var query = args.Length > 0 ? string.Join(' ', args) : "*.exe";

        Section("1. Everything-Verbindung");
        using var client = new EverythingClient { Log = message => Console.WriteLine("   " + message) };
        Console.WriteLine($"   Eigener Prozess: {(Environment.Is64BitProcess ? "64" : "32")} Bit, erhöhte Rechte: {IsElevated()}");
        var status = client.GetStatus();
        Console.WriteLine($"   Status : {status.Availability}");
        Console.WriteLine($"   Pfad   : {status.ExecutablePath ?? "(unbekannt)"}");
        Console.WriteLine($"   Hinweis: {status.Description}");

        if (status.Availability == EverythingAvailability.Running)
        {
            Section($"2. Suche nach \"{query}\"");
            try
            {
                var watch = System.Diagnostics.Stopwatch.StartNew();
                var result = await client.SearchAsync(new SearchOptions
                {
                    Query = query,
                    MaxResults = 15,
                    Sort = EverythingSort.SizeDescending,
                });
                watch.Stop();

                Console.WriteLine($"   Protokoll: {client.ProtocolDescription}");
                Console.WriteLine($"   {result.TotalCount:N0} Treffer insgesamt, angezeigt {result.Items.Count}, Dauer {watch.ElapsedMilliseconds} ms");
                Console.WriteLine();

                foreach (var item in result.Items)
                {
                    var size = item.Size.HasValue ? FormatSize(item.Size.Value) : (item.IsFolder ? "<Ordner>" : "-");
                    var modified = item.Modified?.ToString("dd.MM.yyyy HH:mm") ?? "-";
                    Console.WriteLine($"   {size,12}  {modified,16}  {item.FullPath}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("   FEHLER: " + ex.Message);
                return 1;
            }
        }

        Section("3. Installierte Programme");
        var programs = InstalledProgramScanner.Scan();
        Console.WriteLine($"   {programs.Count} Einträge gefunden. Die ersten 10:");
        Console.WriteLine();
        foreach (var program in programs.Take(10))
        {
            Console.WriteLine($"   {program.DisplayName,-45} {program.DisplayVersion,-16} {program.ScopeLabel}");
        }

        Section("4. Edge-Analyse");
        var components = await EdgeRemovalService.InspectAsync();
        foreach (var component in components)
        {
            Console.WriteLine($"   [{(component.IsPresent ? "x" : " ")}] {component.Title}");
            foreach (var line in component.StatusText.Split('\n'))
            {
                Console.WriteLine($"       {line.Trim()}");
            }

            if (component.HasAction)
            {
                Console.WriteLine($"       -> mögliche Aktion: {component.ActionTitle}");
            }

            Console.WriteLine();
        }

        return 0;
    }

    private static bool IsElevated()
    {
        try
        {
            using var identity = System.Security.Principal.WindowsIdentity.GetCurrent();
            return new System.Security.Principal.WindowsPrincipal(identity)
                .IsInRole(System.Security.Principal.WindowsBuiltInRole.Administrator);
        }
        catch
        {
            return false;
        }
    }

    private static void Section(string title)
    {
        Console.WriteLine();
        Console.WriteLine("== " + title + " " + new string('=', Math.Max(0, 60 - title.Length)));
        Console.WriteLine();
    }

    private static string FormatSize(long bytes)
    {
        string[] units = { "B", "KB", "MB", "GB", "TB" };
        double value = bytes;
        var unit = 0;

        while (value >= 1024 && unit < units.Length - 1)
        {
            value /= 1024;
            unit++;
        }

        return unit == 0 ? $"{bytes} B" : $"{value:0.##} {units[unit]}";
    }
}
