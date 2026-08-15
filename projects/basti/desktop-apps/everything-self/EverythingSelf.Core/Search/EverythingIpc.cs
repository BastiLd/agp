using System;

namespace EverythingSelf.Core.Search;

/// <summary>
/// Konstanten des öffentlich dokumentierten Everything-IPC-Protokolls (voidtools).
/// Die Werte stammen aus der frei verfügbaren Protokollbeschreibung; es wird kein
/// Everything-Quellcode und keine Everything-DLL verwendet - wir sprechen nur über
/// WM_COPYDATA mit dem laufenden Everything-Prozess.
/// </summary>
internal static class EverythingIpc
{
    /// <summary>Fensterklasse des versteckten IPC-Fensters von Everything.</summary>
    internal const string WindowClass = "EVERYTHING_TASKBAR_NOTIFICATION";

    // WM_COPYDATA dwData-Werte für ausgehende Anfragen.
    internal const int CopyDataQueryW = 2;
    internal const int CopyDataQuery2W = 18;

    // Suchflags (Query und Query2 identisch).
    internal const uint MatchCase = 0x00000001;
    internal const uint MatchWholeWord = 0x00000002;
    internal const uint MatchPath = 0x00000004;
    internal const uint Regex = 0x00000008;

    // Query2: welche Felder Everything pro Treffer zurückliefern soll.
    // Die Reihenfolge der Daten im Antwortblock entspricht exakt dieser Bit-Reihenfolge.
    internal const uint RequestName = 0x00000001;
    internal const uint RequestPath = 0x00000002;
    internal const uint RequestFullPathAndName = 0x00000004;
    internal const uint RequestExtension = 0x00000008;
    internal const uint RequestSize = 0x00000010;
    internal const uint RequestDateCreated = 0x00000020;
    internal const uint RequestDateModified = 0x00000040;
    internal const uint RequestDateAccessed = 0x00000080;
    internal const uint RequestAttributes = 0x00000100;
    internal const uint RequestFileListFileName = 0x00000200;
    internal const uint RequestRunCount = 0x00000400;
    internal const uint RequestDateRun = 0x00000800;
    internal const uint RequestDateRecentlyChanged = 0x00001000;
    internal const uint RequestHighlightedName = 0x00002000;
    internal const uint RequestHighlightedPath = 0x00004000;
    internal const uint RequestHighlightedFullPathAndName = 0x00008000;

    // Item-Flags im Antwortblock.
    internal const uint ItemFolder = 0x00000001;
    internal const uint ItemDrive = 0x00000002;

    /// <summary>Alle Treffer anfordern (Everything interpretiert 0xFFFFFFFF als "unbegrenzt").</summary>
    internal const uint AllResults = 0xFFFFFFFF;
}

/// <summary>Sortierreihenfolge, die Everything serverseitig anwendet.</summary>
public enum EverythingSort
{
    NameAscending = 1,
    NameDescending = 2,
    PathAscending = 3,
    PathDescending = 4,
    SizeAscending = 5,
    SizeDescending = 6,
    ExtensionAscending = 7,
    ExtensionDescending = 8,
    TypeNameAscending = 9,
    TypeNameDescending = 10,
    DateCreatedAscending = 11,
    DateCreatedDescending = 12,
    DateModifiedAscending = 13,
    DateModifiedDescending = 14,
    AttributesAscending = 15,
    AttributesDescending = 16,
    FileListFilenameAscending = 17,
    FileListFilenameDescending = 18,
    RunCountAscending = 19,
    RunCountDescending = 20,
    DateRecentlyChangedAscending = 21,
    DateRecentlyChangedDescending = 22,
    DateAccessedAscending = 23,
    DateAccessedDescending = 24,
    DateRunAscending = 25,
    DateRunDescending = 26,
}
