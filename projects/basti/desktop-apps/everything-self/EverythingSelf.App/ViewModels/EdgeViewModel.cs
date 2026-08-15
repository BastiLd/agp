using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using EverythingSelf.App.Common;
using EverythingSelf.Core.Edge;

namespace EverythingSelf.App.ViewModels;

/// <summary>Eine Edge-Komponente, aufbereitet für die Kartenansicht.</summary>
public sealed class EdgeComponentViewModel : ViewModelBase
{
    public EdgeComponentViewModel(EdgeComponent component)
    {
        Component = component;
        Commands = EdgeRemovalService.BuildCommands(component.Action);
    }

    public EdgeComponent Component { get; }

    /// <summary>Die Befehle, die bei Ausführung tatsächlich laufen würden.</summary>
    public IReadOnlyList<string> Commands { get; }

    public string Title => Component.Title;

    public string StatusText => Component.StatusText;

    public string ActionTitle => Component.ActionTitle;

    public string? Location => Component.Location;

    public bool HasAction => Component.HasAction && Commands.Count > 0;

    public bool IsDestructive => Component.IsDestructive;

    public string CommandPreview => Commands.Count == 0
        ? string.Empty
        : string.Join(Environment.NewLine, Commands);

    public string PresenceLabel => Component.IsPresent ? "vorhanden" : "nicht vorhanden";
}

/// <summary>Ansichtsmodell der Edge-Registerkarte.</summary>
public sealed class EdgeViewModel : ViewModelBase
{
    private string _statusText = string.Empty;
    private bool _isBusy;
    private bool _understood;

    public EdgeViewModel()
    {
        RefreshCommand = new RelayCommand(() => _ = LoadAsync());
        _ = LoadAsync();
    }

    /// <summary>Wird aufgerufen, wenn eine Aktion bestätigt und ausgeführt werden soll.</summary>
    public Func<EdgeComponentViewModel, Task<bool>>? ActionRequested { get; set; }

    public ObservableCollection<EdgeComponentViewModel> Components { get; } = new();

    public string StatusText
    {
        get => _statusText;
        set => SetField(ref _statusText, value);
    }

    public bool IsBusy
    {
        get => _isBusy;
        private set => SetField(ref _isBusy, value);
    }

    /// <summary>
    /// Muss der Benutzer aktiv bestätigen, bevor irgendeine Aktion ausführbar wird.
    /// Verhindert versehentliche Klicks auf schwer umkehrbare Eingriffe.
    /// </summary>
    public bool Understood
    {
        get => _understood;
        set
        {
            if (SetField(ref _understood, value))
            {
                OnPropertyChanged(nameof(ActionsEnabled));
            }
        }
    }

    public bool ActionsEnabled => Understood && !IsBusy;

    public RelayCommand RefreshCommand { get; }

    public async Task LoadAsync()
    {
        IsBusy = true;
        StatusText = "System wird untersucht ...";

        try
        {
            var components = await EdgeRemovalService.InspectAsync();

            Components.Clear();
            foreach (var component in components)
            {
                Components.Add(new EdgeComponentViewModel(component));
            }

            StatusText = string.Empty;
        }
        catch (Exception ex)
        {
            StatusText = "Die Analyse ist fehlgeschlagen: " + ex.Message;
        }
        finally
        {
            IsBusy = false;
            OnPropertyChanged(nameof(ActionsEnabled));
        }
    }

    /// <summary>Führt die Aktion einer Karte aus, nachdem die Oberfläche sie bestätigt hat.</summary>
    public async Task<EdgeActionResult> ExecuteAsync(EdgeComponentViewModel component)
    {
        IsBusy = true;
        OnPropertyChanged(nameof(ActionsEnabled));
        StatusText = component.ActionTitle + " läuft ...";

        try
        {
            var result = await EdgeRemovalService.ExecuteAsync(component.Component.Action);
            StatusText = result.Message;
            await LoadAsync();
            return result;
        }
        finally
        {
            IsBusy = false;
            OnPropertyChanged(nameof(ActionsEnabled));
        }
    }
}
