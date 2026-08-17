using System;
using System.Collections.Generic;

namespace EverythingSelf.Core.Edge;

/// <summary>Welche Aktion an einer Edge-Komponente ausgeführt werden kann.</summary>
public enum EdgeActionKind
{
    /// <summary>Reine Information, keine Aktion möglich.</summary>
    None,

    /// <summary>Dienste edgeupdate/edgeupdatem stoppen und auf "Deaktiviert" setzen.</summary>
    DisableUpdateServices,

    /// <summary>Geplante Aufgaben des Edge-Updaters deaktivieren.</summary>
    DisableUpdateTasks,

    /// <summary>Per Richtlinie verhindern, dass Edge automatisch neu installiert wird.</summary>
    BlockReinstall,

    /// <summary>Microsoft Edge über den mitgelieferten Installer entfernen.</summary>
    UninstallEdge,

    /// <summary>Windows Widgets per Richtlinie abschalten und den laufenden Dienst beenden.</summary>
    DisableWidgets,
}

/// <summary>Eine gefundene Edge-Komponente samt Erklärung und möglicher Aktion.</summary>
public sealed class EdgeComponent
{
    public string Title { get; init; } = string.Empty;

    /// <summary>Antwort auf "Was ist das?" - wird hinter dem Info-Symbol angezeigt.</summary>
    public string WhatItIs { get; init; } = string.Empty;

    /// <summary>Aktueller Zustand auf diesem System.</summary>
    public string StatusText { get; init; } = string.Empty;

    public bool IsPresent { get; init; }

    public string? Location { get; init; }

    public string? Version { get; init; }

    public EdgeActionKind Action { get; init; } = EdgeActionKind.None;

    public string ActionTitle { get; init; } = string.Empty;

    /// <summary>Antwort auf "Was macht das?" - wird vor dem Ausführen angezeigt.</summary>
    public string ActionExplanation { get; init; } = string.Empty;

    /// <summary>Wie der Eingriff wieder rückgängig gemacht werden kann.</summary>
    public string HowToUndo { get; init; } = string.Empty;

    /// <summary>Warnstufe: true = Eingriff ist schwer rückgängig zu machen.</summary>
    public bool IsDestructive { get; init; }

    public bool HasAction => Action != EdgeActionKind.None && IsPresent;
}

/// <summary>Ergebnis einer ausgeführten Edge-Aktion.</summary>
public sealed class EdgeActionResult
{
    public EdgeActionResult(bool success, string message, IReadOnlyList<string> steps)
    {
        Success = success;
        Message = message;
        Steps = steps;
    }

    public bool Success { get; }

    public string Message { get; }

    /// <summary>Protokoll der einzelnen ausgeführten Schritte.</summary>
    public IReadOnlyList<string> Steps { get; }
}
