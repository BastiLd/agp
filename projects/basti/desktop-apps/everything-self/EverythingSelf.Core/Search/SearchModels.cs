using System;
using System.Collections.Generic;
using System.IO;

namespace EverythingSelf.Core.Search;

/// <summary>Parameter einer Suchanfrage an Everything.</summary>
public sealed class SearchOptions
{
    public string Query { get; set; } = string.Empty;

    public bool MatchCase { get; set; }

    public bool MatchWholeWord { get; set; }

    /// <summary>Suchbegriff auch gegen den vollständigen Pfad prüfen, nicht nur gegen den Dateinamen.</summary>
    public bool MatchPath { get; set; }

    public bool UseRegex { get; set; }

    public uint Offset { get; set; }

    /// <summary>Maximale Trefferzahl. <c>null</c> bedeutet "alle".</summary>
    public uint? MaxResults { get; set; } = 1000;

    public EverythingSort Sort { get; set; } = EverythingSort.NameAscending;
}

/// <summary>Ein einzelner Treffer.</summary>
public sealed class SearchResultItem
{
    public string Name { get; init; } = string.Empty;

    /// <summary>Verzeichnis ohne den Dateinamen.</summary>
    public string Directory { get; init; } = string.Empty;

    public bool IsFolder { get; init; }

    public bool IsDrive { get; init; }

    /// <summary>Größe in Bytes; <c>null</c> bei Ordnern oder wenn unbekannt.</summary>
    public long? Size { get; init; }

    public DateTime? Modified { get; init; }

    public FileAttributes Attributes { get; init; }

    public string FullPath =>
        string.IsNullOrEmpty(Directory) ? Name : Path.Combine(Directory, Name);

    public string Extension =>
        IsFolder ? string.Empty : Path.GetExtension(Name).TrimStart('.').ToLowerInvariant();

    /// <summary>
    /// Anzeigetext der Typ-Spalte. Ordner werden ausdrücklich benannt, sonst wirkt
    /// eine Zeile ohne Größenangabe wie ein Fehler - Ordner können nämlich durchaus
    /// eine Dateiendung im Namen tragen.
    /// </summary>
    public string TypeLabel
    {
        get
        {
            if (IsDrive)
            {
                return "Laufwerk";
            }

            if (IsFolder)
            {
                return "Ordner";
            }

            var extension = Extension;
            return extension.Length == 0 ? "Datei" : extension;
        }
    }
}

/// <summary>Ergebnis einer Suchanfrage.</summary>
public sealed class SearchResult
{
    public static readonly SearchResult Empty = new()
    {
        Items = Array.Empty<SearchResultItem>(),
        TotalCount = 0,
    };

    public IReadOnlyList<SearchResultItem> Items { get; init; } = Array.Empty<SearchResultItem>();

    /// <summary>Gesamtzahl der Treffer in Everything - kann größer sein als <see cref="Items"/>.</summary>
    public long TotalCount { get; init; }

    public bool IsTruncated => TotalCount > Items.Count;
}

/// <summary>Zustand der Verbindung zu Everything.</summary>
public enum EverythingAvailability
{
    /// <summary>Everything läuft und antwortet.</summary>
    Running,

    /// <summary>Everything ist installiert, läuft aber gerade nicht.</summary>
    NotRunning,

    /// <summary>Everything wurde auf diesem System nicht gefunden.</summary>
    NotInstalled,
}

/// <summary>Momentaufnahme des Everything-Status inklusive gefundenem Programmpfad.</summary>
public sealed class EverythingStatus
{
    public EverythingAvailability Availability { get; init; }

    /// <summary>Pfad zu Everything.exe, sofern ermittelbar.</summary>
    public string? ExecutablePath { get; init; }

    public string Description => Availability switch
    {
        EverythingAvailability.Running => "Everything läuft - Suche einsatzbereit.",
        EverythingAvailability.NotRunning =>
            "Everything ist installiert, läuft aber nicht. Ohne laufenden Dienst gibt es keine Suchergebnisse.",
        _ =>
            "Everything wurde nicht gefunden. Die Suche baut auf dem Index von Everything (voidtools) auf.",
    };
}
