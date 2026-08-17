using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Data;
using EverythingSelf.App.Common;
using EverythingSelf.Core.Uninstall;

namespace EverythingSelf.App.ViewModels;

/// <summary>Ein Listeneintrag mit Auswahlhaken.</summary>
public sealed class ProgramEntry : ViewModelBase
{
    private bool _isSelected;

    public ProgramEntry(InstalledProgram program)
    {
        Program = program;
    }

    public InstalledProgram Program { get; }

    public bool IsSelected
    {
        get => _isSelected;
        set => SetField(ref _isSelected, value);
    }

    public string DisplayName => Program.DisplayName;

    public string? DisplayVersion => Program.DisplayVersion;

    public string? Publisher => Program.Publisher;

    public long? EstimatedSize => Program.EstimatedSize;

    public DateTime? InstallDate => Program.InstallDate;

    public string ScopeLabel => Program.ScopeLabel;
}

/// <summary>Ansichtsmodell der Programmliste.</summary>
public sealed class UninstallViewModel : ViewModelBase
{
    private readonly ObservableCollection<ProgramEntry> _entries = new();

    private string _filter = string.Empty;
    private string _statusText = string.Empty;
    private bool _isBusy;
    private bool _preferSilent;
    private double _progress;

    public UninstallViewModel()
    {
        View = CollectionViewSource.GetDefaultView(_entries);
        View.Filter = MatchesFilter;

        RefreshCommand = new RelayCommand(() => _ = LoadAsync());
        UninstallCommand = new RelayCommand(() => _ = UninstallSelectedAsync(), () => !IsBusy && SelectedCount > 0);
        SelectNoneCommand = new RelayCommand(() =>
        {
            foreach (var entry in _entries)
            {
                entry.IsSelected = false;
            }

            OnPropertyChanged(nameof(SelectedCount));
            OnPropertyChanged(nameof(SelectionSummary));
        });

        _ = LoadAsync();
    }

    /// <summary>Fensterhandle für Dialoge der Restebereinigung.</summary>
    public IntPtr OwnerWindow { get; set; }

    /// <summary>Wird aufgerufen, wenn nach einer Deinstallation Reste zur Bestätigung anstehen.</summary>
    public Func<InstalledProgram, IReadOnlyList<LeftoverItem>, Task>? LeftoverReviewRequested { get; set; }

    public ICollectionView View { get; }

    public string Filter
    {
        get => _filter;
        set
        {
            if (SetField(ref _filter, value))
            {
                View.Refresh();
                OnPropertyChanged(nameof(CountSummary));
            }
        }
    }

    public string StatusText
    {
        get => _statusText;
        private set => SetField(ref _statusText, value);
    }

    public bool IsBusy
    {
        get => _isBusy;
        private set
        {
            if (SetField(ref _isBusy, value))
            {
                OnPropertyChanged(nameof(IsIdle));
            }
        }
    }

    public bool IsIdle => !IsBusy;

    public double Progress
    {
        get => _progress;
        private set => SetField(ref _progress, value);
    }

    /// <summary>Stille Deinstallation bevorzugen, wo der Hersteller sie anbietet.</summary>
    public bool PreferSilent
    {
        get => _preferSilent;
        set => SetField(ref _preferSilent, value);
    }

    public int SelectedCount => _entries.Count(static e => e.IsSelected);

    public string SelectionSummary => SelectedCount == 0
        ? "Nichts ausgewählt"
        : $"{SelectedCount} Programm(e) ausgewählt";

    public string CountSummary
    {
        get
        {
            var visible = View.Cast<object>().Count();
            return visible == _entries.Count
                ? $"{_entries.Count} Programme installiert"
                : $"{visible} von {_entries.Count} Programmen";
        }
    }

    public RelayCommand RefreshCommand { get; }

    public RelayCommand UninstallCommand { get; }

    public RelayCommand SelectNoneCommand { get; }

    /// <summary>Muss aufgerufen werden, wenn sich ein Auswahlhaken ändert.</summary>
    public void NotifySelectionChanged()
    {
        OnPropertyChanged(nameof(SelectedCount));
        OnPropertyChanged(nameof(SelectionSummary));
    }

    private bool MatchesFilter(object item)
    {
        if (string.IsNullOrWhiteSpace(Filter))
        {
            return true;
        }

        if (item is not ProgramEntry entry)
        {
            return false;
        }

        return Contains(entry.DisplayName) || Contains(entry.Publisher) || Contains(entry.DisplayVersion);

        bool Contains(string? text) =>
            text is not null && text.Contains(Filter, StringComparison.CurrentCultureIgnoreCase);
    }

    private async Task LoadAsync()
    {
        IsBusy = true;
        StatusText = "Programmliste wird gelesen ...";

        try
        {
            var programs = await Task.Run(InstalledProgramScanner.Scan);

            _entries.Clear();
            foreach (var program in programs)
            {
                _entries.Add(new ProgramEntry(program));
            }

            View.Refresh();
            StatusText = string.Empty;
            OnPropertyChanged(nameof(CountSummary));
            NotifySelectionChanged();
        }
        catch (Exception ex)
        {
            StatusText = "Die Programmliste konnte nicht gelesen werden: " + ex.Message;
        }
        finally
        {
            IsBusy = false;
        }
    }

    private async Task UninstallSelectedAsync()
    {
        var selected = _entries.Where(static e => e.IsSelected).Select(static e => e.Program).ToList();
        if (selected.Count == 0)
        {
            return;
        }

        var notRemovable = selected.Where(static p => !p.CanUninstall).ToList();
        var removable = selected.Where(static p => p.CanUninstall).ToList();

        var message = $"{removable.Count} Programm(e) werden nacheinander deinstalliert:\n\n" +
                      string.Join("\n", removable.Take(15).Select(static p => "  " + p.DisplayName)) +
                      (removable.Count > 15 ? $"\n  ... und {removable.Count - 15} weitere" : string.Empty) +
                      "\n\nJedes Programm bringt sein eigenes Deinstallationsprogramm mit; " +
                      "dessen Fenster erscheinen nacheinander." +
                      (notRemovable.Count > 0
                          ? $"\n\n{notRemovable.Count} Eintrag/Einträge haben keinen Deinstallationsbefehl und werden übersprungen."
                          : string.Empty);

        if (removable.Count == 0)
        {
            MessageBox.Show("Keines der ausgewählten Programme hat einen hinterlegten Deinstallationsbefehl.",
                "Nichts zu tun", MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }

        if (MessageBox.Show(message, "Deinstallieren", MessageBoxButton.OKCancel,
                MessageBoxImage.Warning, MessageBoxResult.Cancel) != MessageBoxResult.OK)
        {
            return;
        }

        IsBusy = true;
        Progress = 0;

        try
        {
            var progress = new Progress<UninstallProgress>(report =>
            {
                StatusText = $"[{report.Index}/{report.Total}] {report.Program.DisplayName}: {report.Status}";
                Progress = report.Total == 0 ? 0 : report.Index * 100.0 / report.Total;
            });

            var outcomes = await UninstallRunner.RunAsync(removable, PreferSilent, progress, CancellationToken.None);

            var succeeded = outcomes.Where(static o => o.Succeeded).ToList();
            StatusText = $"Fertig: {succeeded.Count} von {outcomes.Count} erfolgreich deinstalliert.";

            // Nach jedem erfolgreichen Vorgang nach Überresten suchen.
            foreach (var outcome in succeeded)
            {
                var leftovers = await LeftoverScanner.ScanAsync(outcome.Program);
                if (leftovers.Count > 0 && LeftoverReviewRequested is not null)
                {
                    await LeftoverReviewRequested(outcome.Program, leftovers);
                }
            }

            var failed = outcomes.Where(static o => !o.Succeeded).ToList();
            if (failed.Count > 0)
            {
                MessageBox.Show(
                    "Bei folgenden Programmen gab es Probleme:\n\n" +
                    string.Join("\n", failed.Select(static o => $"  {o.Program.DisplayName}: {o.Message}")),
                    "Nicht alles hat geklappt",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning);
            }

            await LoadAsync();
        }
        catch (Exception ex)
        {
            StatusText = "Fehler: " + ex.Message;
        }
        finally
        {
            IsBusy = false;
            Progress = 0;
        }
    }
}
