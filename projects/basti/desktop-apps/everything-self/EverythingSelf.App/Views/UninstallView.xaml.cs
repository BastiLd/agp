using System.Windows;
using System.Windows.Controls;
using EverythingSelf.App.Dialogs;
using EverythingSelf.App.ViewModels;

namespace EverythingSelf.App.Views;

public partial class UninstallView : UserControl
{
    public UninstallView()
    {
        InitializeComponent();
    }

    private UninstallViewModel? ViewModel => DataContext as UninstallViewModel;

    private void OnSelectionToggled(object sender, RoutedEventArgs e)
        => ViewModel?.NotifySelectionChanged();

    private void OnSilentInfoClick(object sender, RoutedEventArgs e)
    {
        InfoDialog.Show(Window.GetWindow(this), "Still deinstallieren", new[]
        {
            new InfoDialog.Section(
                "Was ist das?",
                "Manche Hersteller hinterlegen in der Registry neben dem normalen Deinstallationsbefehl " +
                "zusätzlich eine \"stille\" Variante (QuietUninstallString). Bei Programmen, die mit dem " +
                "Windows Installer ausgeliefert wurden, lässt sich derselbe Effekt über msiexec erreichen."),

            new InfoDialog.Section(
                "Was macht die Option?",
                "Ist der Haken gesetzt, wird die stille Variante verwendet, wo sie verfügbar ist:\n\n" +
                "    msiexec /x {Produktcode} /qn /norestart\n\n" +
                "Dann erscheint kein Assistent und es gibt keine Rückfragen - praktisch, wenn mehrere " +
                "Programme hintereinander entfernt werden sollen.",
                isMonospaced: false),

            new InfoDialog.Section(
                "Vorsicht",
                "Ohne Assistent gibt es auch keine Gelegenheit mehr, abzubrechen oder Optionen zu wählen " +
                "(etwa \"Benutzerdaten behalten\"). Bei Programmen, deren Einstellungen erhalten bleiben " +
                "sollen, ist die normale Variante die sicherere Wahl. Programme ohne stille Variante " +
                "zeigen ihren Assistenten so oder so.",
                isWarning: true),
        });
    }
}
