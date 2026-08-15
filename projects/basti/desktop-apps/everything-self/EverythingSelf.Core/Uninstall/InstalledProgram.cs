using System;

namespace EverythingSelf.Core.Uninstall;

/// <summary>Herkunft eines Eintrags in der Programmliste.</summary>
public enum RegistryScope
{
    /// <summary>Für alle Benutzer installiert (64 Bit).</summary>
    Machine64,

    /// <summary>Für alle Benutzer installiert (32 Bit, WOW6432Node).</summary>
    Machine32,

    /// <summary>Nur für den aktuellen Benutzer installiert.</summary>
    CurrentUser,
}

/// <summary>Ein installiertes Programm, wie es in der Windows-Registry hinterlegt ist.</summary>
public sealed class InstalledProgram
{
    public string RegistryKeyName { get; init; } = string.Empty;

    public RegistryScope Scope { get; init; }

    /// <summary>Vollständiger Registry-Pfad des Eintrags, z. B. für die Restebereinigung.</summary>
    public string RegistryPath { get; init; } = string.Empty;

    public string DisplayName { get; init; } = string.Empty;

    public string? DisplayVersion { get; init; }

    public string? Publisher { get; init; }

    public string? InstallLocation { get; init; }

    public string? UninstallString { get; init; }

    public string? QuietUninstallString { get; init; }

    /// <summary>Geschätzte Größe in Bytes (aus EstimatedSize in KB umgerechnet).</summary>
    public long? EstimatedSize { get; init; }

    public DateTime? InstallDate { get; init; }

    /// <summary>MSI-Produktcode, falls es sich um eine Windows-Installer-Anwendung handelt.</summary>
    public string? MsiProductCode { get; init; }

    public bool CanUninstall =>
        !string.IsNullOrWhiteSpace(UninstallString) || !string.IsNullOrWhiteSpace(QuietUninstallString);

    /// <summary>Kann das Programm ohne Rückfragen im Hintergrund entfernt werden?</summary>
    public bool SupportsSilentUninstall =>
        !string.IsNullOrWhiteSpace(QuietUninstallString) || !string.IsNullOrWhiteSpace(MsiProductCode);

    public string ScopeLabel => Scope switch
    {
        RegistryScope.Machine64 => "Alle Benutzer (64 Bit)",
        RegistryScope.Machine32 => "Alle Benutzer (32 Bit)",
        _ => "Nur dieser Benutzer",
    };

    public override string ToString() => $"{DisplayName} {DisplayVersion}".Trim();
}
