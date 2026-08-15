using System;
using System.Windows;
using System.Windows.Interop;
using EverythingSelf.App.Dialogs;
using EverythingSelf.App.ViewModels;
using EverythingSelf.Core.SystemAccess;

namespace EverythingSelf.App;

public partial class MainWindow : Window
{
    private readonly SearchViewModel _search = new();
    private readonly UninstallViewModel _uninstall = new();
    private readonly EdgeViewModel _edge = new();

    public MainWindow()
    {
        InitializeComponent();

        SearchTab.DataContext = _search;
        UninstallTab.DataContext = _uninstall;
        EdgeTab.DataContext = _edge;

        // Der Reste-Dialog wird von der Programmliste angefordert, gehört aber
        // ins Hauptfenster - deshalb hier verdrahtet.
        _uninstall.LeftoverReviewRequested = (program, leftovers) =>
            LeftoverDialog.ShowAsync(this, program, leftovers);

        SubtitleBlock.Text = ElevatedRunner.IsElevated
            ? "Achtung: als Administrator gestartet - die Suche kann dadurch blockiert sein."
            : "Suche über den Everything-Index - Deinstallation und Aufräumen mit Rückfrage.";

        SourceInitialized += OnSourceInitialized;
        Closed += OnClosed;
    }

    private void OnSourceInitialized(object? sender, EventArgs e)
    {
        // Die Windows-Dialoge beim Löschen brauchen ein Elternfenster.
        var handle = new WindowInteropHelper(this).Handle;
        _search.OwnerWindow = handle;
        _uninstall.OwnerWindow = handle;
    }

    private void OnClosed(object? sender, EventArgs e) => _search.Dispose();

    private void OnAboutClick(object sender, RoutedEventArgs e)
    {
        InfoDialog.Show(this, "Über Everything Self", new[]
        {
            new InfoDialog.Section(
                "Was macht dieses Programm?",
                "Es vereint zwei Dinge in einer Oberfläche: eine sofortige Dateisuche und eine " +
                "Programmverwaltung mit Restebereinigung. Beides mit Mehrfachauswahl, damit sich " +
                "mehrere Dinge in einem Rutsch erledigen lassen."),

            new InfoDialog.Section(
                "Woher kommen die Suchergebnisse?",
                "Aus dem Index von Everything (voidtools). Dieses Programm spricht über die " +
                "öffentlich dokumentierte Fenster-Schnittstelle von Everything mit dem laufenden " +
                "Prozess - es wird kein fremder Quellcode und keine fremde Programmbibliothek " +
                "verwendet. Everything muss deshalb installiert sein und laufen."),

            new InfoDialog.Section(
                "Warum läuft das Programm nicht als Administrator?",
                "Weil Windows dann die Antworten von Everything blockieren würde (Benutzeroberflächen-" +
                "Isolation). Ein Programm mit erhöhten Rechten darf keine Fensternachrichten von einem " +
                "Programm mit normalen Rechten annehmen - die Suche wäre tot. Deshalb läuft die " +
                "Oberfläche normal, und einzelne Eingriffe holen sich bei Bedarf kurz erhöhte Rechte " +
                "über die übliche Windows-Rückfrage."),

            new InfoDialog.Section(
                "Wie sicher ist das Löschen?",
                "Dateien und Ordner wandern in den Papierkorb, nicht in die endgültige Löschung - " +
                "endgültig nur, wenn das ausdrücklich gewählt wird. Bei der Restebereinigung sind " +
                "nur eindeutige Treffer vorausgewählt, alles andere muss bewusst angehakt werden. " +
                "Registry-Schlüssel lassen sich allerdings nicht in den Papierkorb legen; " +
                "sie sind nach dem Entfernen weg."),
        });
    }
}
