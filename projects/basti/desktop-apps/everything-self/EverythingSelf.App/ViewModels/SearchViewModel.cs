using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;
using EverythingSelf.App.Common;
using EverythingSelf.Core.FileOps;
using EverythingSelf.Core.Search;

namespace EverythingSelf.App.ViewModels;

/// <summary>Auswahlmöglichkeit für die maximale Trefferzahl.</summary>
public sealed class ResultLimit
{
    public ResultLimit(string label, uint? value)
    {
        Label = label;
        Value = value;
    }

    public string Label { get; }

    /// <summary><c>null</c> bedeutet "alle Treffer".</summary>
    public uint? Value { get; }

    public override string ToString() => Label;
}

/// <summary>Auswahlmöglichkeit für die Sortierung.</summary>
public sealed class SortOption
{
    public SortOption(string label, EverythingSort value)
    {
        Label = label;
        Value = value;
    }

    public string Label { get; }

    public EverythingSort Value { get; }

    public override string ToString() => Label;
}

/// <summary>Ansichtsmodell der Dateisuche.</summary>
public sealed class SearchViewModel : ViewModelBase, IDisposable
{
    private readonly EverythingClient _client = new();
    private readonly DispatcherTimer _debounce;

    private CancellationTokenSource? _running;
    private string _query = string.Empty;
    private string _statusText = "Suchbegriff eingeben - die Ergebnisse erscheinen während des Tippens.";
    private string _connectionWarning = string.Empty;
    private bool _isBusy;
    private bool _matchPath;
    private bool _matchCase;
    private bool _useRegex;
    private bool _hideDuplicates = true;
    private ResultLimit _limit;
    private SortOption _sort;

    public SearchViewModel()
    {
        Limits = new[]
        {
            new ResultLimit("200 Treffer", 200),
            new ResultLimit("1.000 Treffer", 1000),
            new ResultLimit("10.000 Treffer", 10_000),
            new ResultLimit("50.000 Treffer", 50_000),
            new ResultLimit("Alle Treffer", null),
        };

        Sorts = new[]
        {
            new SortOption("Name (A-Z)", EverythingSort.NameAscending),
            new SortOption("Name (Z-A)", EverythingSort.NameDescending),
            new SortOption("Pfad (A-Z)", EverythingSort.PathAscending),
            new SortOption("Größe (absteigend)", EverythingSort.SizeDescending),
            new SortOption("Größe (aufsteigend)", EverythingSort.SizeAscending),
            new SortOption("Geändert (neueste zuerst)", EverythingSort.DateModifiedDescending),
            new SortOption("Geändert (älteste zuerst)", EverythingSort.DateModifiedAscending),
            new SortOption("Dateityp", EverythingSort.ExtensionAscending),
        };

        _limit = Limits[1];
        _sort = Sorts[0];

        _debounce = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(220) };
        _debounce.Tick += (_, _) =>
        {
            _debounce.Stop();
            _ = RunSearchAsync();
        };

        OpenCommand = new RelayCommand(p => OpenSelected(p as System.Collections.IList), CanActOnSelection);
        OpenFolderCommand = new RelayCommand(p => OpenContainingFolder(p as System.Collections.IList), CanActOnSelection);
        CopyPathCommand = new RelayCommand(p => CopyPaths(p as System.Collections.IList), CanActOnSelection);
        RecycleCommand = new RelayCommand(p => _ = DeleteAsync(p as System.Collections.IList, permanent: false), CanActOnSelection);
        DeleteCommand = new RelayCommand(p => _ = DeleteAsync(p as System.Collections.IList, permanent: true), CanActOnSelection);
        RefreshCommand = new RelayCommand(() => _ = RunSearchAsync());
        StartEverythingCommand = new RelayCommand(StartEverything);

        CheckConnection();
    }

    /// <summary>Fensterhandle für die Windows-Dialoge beim Löschen.</summary>
    public IntPtr OwnerWindow { get; set; }

    public IReadOnlyList<ResultLimit> Limits { get; }

    public IReadOnlyList<SortOption> Sorts { get; }

    public ObservableCollection<SearchResultItem> Results { get; } = new();

    public string Query
    {
        get => _query;
        set
        {
            if (SetField(ref _query, value))
            {
                _debounce.Stop();
                _debounce.Start();
            }
        }
    }

    public string StatusText
    {
        get => _statusText;
        private set => SetField(ref _statusText, value);
    }

    /// <summary>Hinweis, wenn Everything nicht läuft. Leer = alles in Ordnung.</summary>
    public string ConnectionWarning
    {
        get => _connectionWarning;
        private set => SetField(ref _connectionWarning, value);
    }

    public bool IsBusy
    {
        get => _isBusy;
        private set => SetField(ref _isBusy, value);
    }

    public bool MatchPath
    {
        get => _matchPath;
        set { if (SetField(ref _matchPath, value)) Restart(); }
    }

    public bool MatchCase
    {
        get => _matchCase;
        set { if (SetField(ref _matchCase, value)) Restart(); }
    }

    public bool UseRegex
    {
        get => _useRegex;
        set { if (SetField(ref _useRegex, value)) Restart(); }
    }

    /// <summary>
    /// Blendet identische Pfade aus. Hilfreich, wenn in Everything ein Laufwerk
    /// doppelt indiziert ist (NTFS-Index und Ordner-Index gleichzeitig).
    /// </summary>
    public bool HideDuplicates
    {
        get => _hideDuplicates;
        set { if (SetField(ref _hideDuplicates, value)) Restart(); }
    }

    public ResultLimit SelectedLimit
    {
        get => _limit;
        set { if (SetField(ref _limit, value)) Restart(); }
    }

    public SortOption SelectedSort
    {
        get => _sort;
        set { if (SetField(ref _sort, value)) Restart(); }
    }

    public RelayCommand OpenCommand { get; }

    public RelayCommand OpenFolderCommand { get; }

    public RelayCommand CopyPathCommand { get; }

    public RelayCommand RecycleCommand { get; }

    public RelayCommand DeleteCommand { get; }

    public RelayCommand RefreshCommand { get; }

    public RelayCommand StartEverythingCommand { get; }

    private static bool CanActOnSelection(object? parameter)
        => parameter is System.Collections.IList { Count: > 0 };

    private void Restart()
    {
        if (!string.IsNullOrWhiteSpace(Query))
        {
            _ = RunSearchAsync();
        }
    }

    private void CheckConnection()
    {
        var status = _client.GetStatus();
        ConnectionWarning = status.Availability == EverythingAvailability.Running
            ? string.Empty
            : status.Description;
    }

    private async Task RunSearchAsync()
    {
        _running?.Cancel();
        var source = new CancellationTokenSource();
        _running = source;

        if (string.IsNullOrWhiteSpace(Query))
        {
            Results.Clear();
            StatusText = "Suchbegriff eingeben - die Ergebnisse erscheinen während des Tippens.";
            return;
        }

        IsBusy = true;

        try
        {
            var stopwatch = Stopwatch.StartNew();
            var result = await _client.SearchAsync(new SearchOptions
            {
                Query = Query,
                MatchCase = MatchCase,
                MatchPath = MatchPath,
                UseRegex = UseRegex,
                MaxResults = SelectedLimit.Value,
                Sort = SelectedSort.Value,
            }, source.Token);
            stopwatch.Stop();

            if (source.IsCancellationRequested)
            {
                return;
            }

            var items = (IEnumerable<SearchResultItem>)result.Items;
            var hidden = 0;

            if (HideDuplicates)
            {
                var unique = new List<SearchResultItem>(result.Items.Count);
                var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                foreach (var item in result.Items)
                {
                    if (seen.Add(item.FullPath))
                    {
                        unique.Add(item);
                    }
                }

                hidden = result.Items.Count - unique.Count;
                items = unique;
            }

            Results.Clear();
            foreach (var item in items)
            {
                Results.Add(item);
            }

            StatusText = BuildStatus(result, Results.Count, hidden, stopwatch.ElapsedMilliseconds);
            ConnectionWarning = string.Empty;
        }
        catch (OperationCanceledException)
        {
            // Eine neuere Suche hat diese hier abgelöst.
        }
        catch (EverythingUnavailableException ex)
        {
            Results.Clear();
            StatusText = string.Empty;
            ConnectionWarning = ex.Message;
        }
        catch (Exception ex)
        {
            Results.Clear();
            StatusText = "Fehler bei der Suche: " + ex.Message;
        }
        finally
        {
            if (ReferenceEquals(_running, source))
            {
                IsBusy = false;
            }

            source.Dispose();
        }
    }

    private static string BuildStatus(SearchResult result, int shown, int hidden, long milliseconds)
    {
        var text = $"{result.TotalCount:N0} Treffer in {milliseconds} ms";

        if (result.IsTruncated)
        {
            text += $" - angezeigt werden die ersten {result.Items.Count:N0}";
        }

        if (hidden > 0)
        {
            text += $", {hidden:N0} Duplikate ausgeblendet ({shown:N0} sichtbar)";
        }

        return text;
    }

    // -----------------------------------------------------------------
    // Aktionen auf der Auswahl
    // -----------------------------------------------------------------

    private static List<SearchResultItem> Selected(System.Collections.IList? selection)
        => selection?.OfType<SearchResultItem>().ToList() ?? new List<SearchResultItem>();

    private void OpenSelected(System.Collections.IList? selection)
    {
        foreach (var item in Selected(selection).Take(15))
        {
            TryStart(item.FullPath);
        }
    }

    private void OpenContainingFolder(System.Collections.IList? selection)
    {
        foreach (var directory in Selected(selection)
                     .Select(static i => i.FullPath)
                     .Take(15))
        {
            // /select markiert die Datei direkt im geöffneten Explorer-Fenster.
            TryStart("explorer.exe", $"/select,\"{directory}\"");
        }
    }

    private void CopyPaths(System.Collections.IList? selection)
    {
        var items = Selected(selection);
        if (items.Count == 0)
        {
            return;
        }

        try
        {
            Clipboard.SetText(string.Join(Environment.NewLine, items.Select(static i => i.FullPath)));
            StatusText = $"{items.Count} Pfad(e) in die Zwischenablage kopiert.";
        }
        catch (Exception ex)
        {
            StatusText = "Zwischenablage nicht verfügbar: " + ex.Message;
        }
    }

    private async Task DeleteAsync(System.Collections.IList? selection, bool permanent)
    {
        var items = Selected(selection);
        if (items.Count == 0)
        {
            return;
        }

        var preview = string.Join(Environment.NewLine, items.Take(12).Select(static i => "  " + i.FullPath));
        if (items.Count > 12)
        {
            preview += Environment.NewLine + $"  ... und {items.Count - 12} weitere";
        }

        var question = permanent
            ? $"{items.Count} Eintrag/Einträge ENDGUELTIG löschen?\n\nDas lässt sich nicht rückgängig machen.\n\n{preview}"
            : $"{items.Count} Eintrag/Einträge in den Papierkorb verschieben?\n\n{preview}";

        var answer = MessageBox.Show(
            question,
            permanent ? "Endgültig löschen" : "In den Papierkorb",
            MessageBoxButton.OKCancel,
            permanent ? MessageBoxImage.Warning : MessageBoxImage.Question,
            MessageBoxResult.Cancel);

        if (answer != MessageBoxResult.OK)
        {
            return;
        }

        var paths = items.Select(static i => i.FullPath).ToList();
        var owner = OwnerWindow;

        var result = await Task.Run(() => permanent
            ? ShellFileOperations.DeletePermanently(paths, owner)
            : ShellFileOperations.MoveToRecycleBin(paths, owner));

        StatusText = result.Message;

        if (result.Success)
        {
            foreach (var item in items)
            {
                Results.Remove(item);
            }
        }
    }

    private void StartEverything()
    {
        var path = EverythingClient.TryFindInstalledExecutable();
        if (path is null)
        {
            MessageBox.Show(
                "Everything wurde auf diesem System nicht gefunden.\n\n" +
                "Diese Suche baut auf dem Index von Everything (voidtools) auf. " +
                "Das Programm ist kostenlos unter voidtools.com erhältlich.",
                "Everything nicht gefunden",
                MessageBoxButton.OK,
                MessageBoxImage.Information);
            return;
        }

        TryStart(path);

        // Everything braucht einen Moment, bis das IPC-Fenster steht.
        Task.Delay(1500).ContinueWith(_ => CheckConnection(), TaskScheduler.FromCurrentSynchronizationContext());
    }

    private void TryStart(string fileName, string? arguments = null)
    {
        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = fileName,
                Arguments = arguments ?? string.Empty,
                UseShellExecute = true,
            });
        }
        catch (Exception ex)
        {
            StatusText = "Konnte nicht geöffnet werden: " + ex.Message;
        }
    }

    public void Dispose()
    {
        _debounce.Stop();
        _running?.Cancel();
        _client.Dispose();
    }
}
