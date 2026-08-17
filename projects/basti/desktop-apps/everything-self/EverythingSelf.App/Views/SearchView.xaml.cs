using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using EverythingSelf.App.Dialogs;
using EverythingSelf.App.ViewModels;

namespace EverythingSelf.App.Views;

public partial class SearchView : UserControl
{
    public SearchView()
    {
        InitializeComponent();
        Loaded += (_, _) => QueryBox.Focus();
    }

    private SearchViewModel? ViewModel => DataContext as SearchViewModel;

    private void OnResultDoubleClick(object sender, MouseButtonEventArgs e)
    {
        // Nur auf Zeilen reagieren, nicht auf Kopfzeile oder Leerraum.
        if (ResultsGrid.SelectedItem is null)
        {
            return;
        }

        ViewModel?.OpenCommand.Execute(ResultsGrid.SelectedItems);
    }

    private void OnDuplicateInfoClick(object sender, RoutedEventArgs e)
    {
        InfoDialog.Show(Window.GetWindow(this), "Duplikate ausblenden", new[]
        {
            new InfoDialog.Section(
                "Was ist das?",
                "Everything kann dieselbe Datei mehrfach im Index haben. Das passiert, wenn ein Laufwerk " +
                "gleichzeitig als NTFS-Volume UND als Ordner-Index eingetragen ist. Jede Datei taucht dann " +
                "doppelt in den Ergebnissen auf."),

            new InfoDialog.Section(
                "Was macht die Option?",
                "Sie filtert Treffer mit identischem vollständigen Pfad heraus, sodass jeder Eintrag nur " +
                "einmal erscheint. Die Gesamtzahl in der Fußzeile bleibt die Zahl, die Everything meldet - " +
                "wie viele Duplikate ausgeblendet wurden, steht daneben."),

            new InfoDialog.Section(
                "Dauerhaft beheben",
                "Die eigentliche Ursache liegt in der Everything-Konfiguration. In Everything unter " +
                "Extras > Optionen > Indizes prüfen, ob dieselben Laufwerke sowohl unter \"NTFS\" als auch " +
                "unter \"Ordner\" eingetragen sind, und die doppelten Einträge entfernen. Das halbiert " +
                "nebenbei auch den Speicherverbrauch des Index.",
                isWarning: true),
        });
    }

    private void OnSyntaxHelpClick(object sender, RoutedEventArgs e)
    {
        InfoDialog.Show(Window.GetWindow(this), "Suchsyntax", new[]
        {
            new InfoDialog.Section(
                "Grundlagen",
                "Mehrere Wörter werden mit UND verknüpft: wer \"urlaub foto\" eingibt, findet alles, " +
                "was beide Wörter enthält. Die Suche läuft über den Index von Everything, deshalb " +
                "funktioniert hier die komplette Everything-Syntax."),

            new InfoDialog.Section(
                "Häufige Beispiele",
                "*.exe                alle Programmdateien\n" +
                "*.jpg|*.png          mehrere Endungen mit ODER\n" +
                "ext:pdf              nach Dateiendung filtern\n" +
                "size:>100mb          größer als 100 MB\n" +
                "dm:today             heute geändert\n" +
                "dm:lastweek          in der letzten Woche geändert\n" +
                "folder:              nur Ordner anzeigen\n" +
                "file:                nur Dateien anzeigen\n" +
                "empty:               leere Ordner finden\n" +
                "dupe:                doppelte Dateinamen finden\n" +
                "c:\\windows\\ *.dll    auf einen Pfad einschränken\n" +
                "!temp                Treffer mit \"temp\" ausschließen",
                isMonospaced: true),

            new InfoDialog.Section(
                "Wichtig: die Befehle sind englisch",
                "Auch bei deutscher Everything-Oberfläche funktionieren nur die englischen " +
                "Funktionsnamen. \"ordner:\" liefert null Treffer, richtig ist \"folder:\". " +
                "Ebenso \"dm:today\" statt \"dm:heute\" - Letzteres sucht sonst schlicht nach dem " +
                "Wort \"heute\" im Dateinamen.",
                isWarning: true),

            new InfoDialog.Section(
                "Aufräumen leicht gemacht",
                "Für das Freiräumen von Speicherplatz lohnt sich \"size:>500mb\" zusammen mit der " +
                "Sortierung nach Größe. Mit gedrückter Strg- oder Umschalttaste lassen sich mehrere " +
                "Zeilen auswählen und in einem Rutsch in den Papierkorb verschieben."),
        });
    }
}
