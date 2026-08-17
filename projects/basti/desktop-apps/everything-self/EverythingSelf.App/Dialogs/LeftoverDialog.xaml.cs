using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using EverythingSelf.App.Common;
using EverythingSelf.Core.Uninstall;

namespace EverythingSelf.App.Dialogs;

/// <summary>Ein Rest mit Auswahlhaken für die Anzeige im Dialog.</summary>
public sealed class LeftoverEntry : ViewModelBase
{
    private bool _isSelected;

    public LeftoverEntry(LeftoverItem item)
    {
        Item = item;

        // Nur eindeutige Treffer sind vorausgewählt - alles andere will geprüft werden.
        _isSelected = item.Confidence == LeftoverConfidence.High;
    }

    public LeftoverItem Item { get; }

    public bool IsSelected
    {
        get => _isSelected;
        set => SetField(ref _isSelected, value);
    }

    public string KindLabel => Item.KindLabel;

    public string ConfidenceLabel =>
        Item.Confidence == LeftoverConfidence.High ? "eindeutig" : "prüfen";

    public string Path => Item.Path;

    public long? SizeBytes => Item.SizeBytes;

    public string Reason => Item.Reason;
}

/// <summary>
/// Zeigt nach einer Deinstallation die gefundenen Überreste zur Bestätigung.
/// Entfernt wird ausschließlich, was hier angehakt ist.
/// </summary>
public partial class LeftoverDialog : Window
{
    private readonly ObservableCollection<LeftoverEntry> _entries = new();

    private LeftoverDialog()
    {
        InitializeComponent();
        ItemsGrid.ItemsSource = _entries;
        ItemsGrid.RowDetailsVisibilityMode = DataGridRowDetailsVisibilityMode.VisibleWhenSelected;
    }

    /// <summary>Zeigt den Dialog und entfernt anschließend die bestätigten Einträge.</summary>
    public static async Task ShowAsync(
        Window? owner,
        InstalledProgram program,
        IReadOnlyList<LeftoverItem> leftovers)
    {
        var dialog = new LeftoverDialog { Owner = owner };
        dialog.HeadingBlock.Text =
            $"Nach dem Entfernen von \"{program.DisplayName}\" sind {leftovers.Count} Eintrag/Einträge übrig geblieben";

        foreach (var item in leftovers)
        {
            dialog._entries.Add(new LeftoverEntry(item));
        }

        dialog.UpdateStatus();
        dialog.ShowDialog();

        if (dialog._confirmed is null || dialog._confirmed.Count == 0)
        {
            return;
        }

        var handle = owner is null
            ? IntPtr.Zero
            : new System.Windows.Interop.WindowInteropHelper(owner).Handle;

        var result = await LeftoverScanner.RemoveAsync(dialog._confirmed, handle);

        var message = $"{result.Removed} Eintrag/Einträge entfernt.";
        if (result.Failures.Count > 0)
        {
            message += "\n\nNicht entfernt werden konnten:\n" + string.Join("\n", result.Failures);
        }

        MessageBox.Show(message, "Restebereinigung", MessageBoxButton.OK,
            result.Failures.Count > 0 ? MessageBoxImage.Warning : MessageBoxImage.Information);
    }

    private List<LeftoverItem>? _confirmed;

    private void UpdateStatus()
    {
        var selected = _entries.Count(static e => e.IsSelected);
        var totalSize = _entries.Where(static e => e.IsSelected).Sum(static e => e.SizeBytes ?? 0);

        StatusBlock.Text = selected == 0
            ? "Nichts ausgewählt."
            : $"{selected} von {_entries.Count} ausgewählt" +
              (totalSize > 0 ? $" - gibt etwa {Formatting.Size(totalSize)} frei." : ".");
    }

    private void OnRemoveClick(object sender, RoutedEventArgs e)
    {
        // Vor dem Schließen die Zellen-Bearbeitung abschließen, sonst fehlt der letzte Haken.
        ItemsGrid.CommitEdit(DataGridEditingUnit.Row, true);

        _confirmed = _entries.Where(static entry => entry.IsSelected).Select(static entry => entry.Item).ToList();

        if (_confirmed.Count == 0)
        {
            MessageBox.Show("Es ist nichts ausgewählt.", "Restebereinigung",
                MessageBoxButton.OK, MessageBoxImage.Information);
            _confirmed = null;
            return;
        }

        DialogResult = true;
        Close();
    }

    private void OnSkipClick(object sender, RoutedEventArgs e)
    {
        _confirmed = null;
        Close();
    }
}
