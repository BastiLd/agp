<#
.SYNOPSIS
    Kopiert ein Projekt in den Katalog und lässt dabei Zugangsdaten und Ballast weg.

.DESCRIPTION
    Das Repo ist öffentlich. Deshalb kopiert dieses Skript nicht einfach einen Ordner,
    sondern lässt drei Arten von Dateien bewusst zurück:

      1. Zugangsdaten  — .env, config.py, Schlüssel, Datenbanken mit Nutzerdaten
      2. Ballast       — node_modules, Build-Ausgaben, Gradle-Caches, Abhängigkeiten
      3. Zu Großes     — alles über der Größengrenze (Standard 20 MB)

    Jede ausgelassene Datei wird protokolliert. Der Bericht ist die Grundlage für den
    Abschnitt "Ausgeschlossene Zugangsdaten" in DUPLIKATE.md — so ist nachvollziehbar,
    was fehlt und warum.

    Das Skript LIEST aus der Quelle. Es löscht und verschiebt dort nichts.

.PARAMETER Quelle
    Der Projektordner, der übernommen werden soll.

.PARAMETER Ziel
    Wohin im Repo. Relativ zum Repo-Stamm, z.B. "projects/basti/websites/webbing".
    Ein absoluter Pfad wird ebenfalls angenommen — praktisch fuer das private Repo.

.PARAMETER MaxMB
    Größengrenze je Datei. Standard: 20.

.PARAMETER Bericht
    Wohin die CSV mit den Auslassungen geschrieben wird. Wird angehängt, nicht überschrieben.

.PARAMETER NurAnzeigen
    Nichts kopieren, nur zeigen was passieren würde.

.EXAMPLE
    .\Import-Projekt.ps1 -Quelle "D:\Meine Projekte\Vergleich" -Ziel "projects/basti/desktop-apps/media-duplikat-finder"

.EXAMPLE
    .\Import-Projekt.ps1 -Quelle "C:\Audio zu Text" -Ziel "projects/basti/python-apps/audio-zu-text" -NurAnzeigen
    Zeigt zuerst, was übernommen würde.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)] [string] $Quelle,
    [Parameter(Mandatory = $true)] [string] $Ziel,
    [int]    $MaxMB = 20,
    [string] $Bericht = "$env:TEMP\agp-import-bericht.csv",
    [switch] $NurAnzeigen,
    # Zusaetzliche Ordner/Pfade, die bei DIESEM Projekt wegbleiben sollen.
    # Stehen in data/quellen.json, z.B. der Ordner, in den ein Hosting-Panel
    # die betriebenen Seiten legt.
    [string[]] $ZusatzAus = @()
)

$ErrorActionPreference = 'Stop'

# Die Ausschlussregeln stehen in einer eigenen Datei, weil Update-AGP.ps1 beim
# Vergleichen exakt dieselben braucht. Zwei getrennte Listen liefen sofort
# auseinander und der Vergleich meldete Aenderungen an Dateien, die nie
# uebernommen werden.
. (Join-Path $PSScriptRoot 'AGP-Regeln.ps1')

if (-not (Test-Path -LiteralPath $Quelle)) {
    throw "Quelle nicht gefunden: $Quelle"
}

$RepoStamm = Split-Path -Parent $PSScriptRoot
$ZielRoh   = $Ziel -replace '/', '\'
# Absolute Ziele erlauben — gebraucht z.B. fuer das getrennte private Repo.
$ZielVoll  = if ([System.IO.Path]::IsPathRooted($ZielRoh)) { $ZielRoh } else { Join-Path $RepoStamm $ZielRoh }
$MaxBytes  = $MaxMB * 1MB

Write-Host ""
Write-Host "Quelle : $Quelle"
Write-Host "Ziel   : $ZielVoll"
if ($NurAnzeigen) { Write-Host "Modus  : nur anzeigen, es wird nichts kopiert" -ForegroundColor Yellow }
Write-Host ""

$uebernommen  = 0
$ausgelassen  = New-Object System.Collections.Generic.List[object]
$bytesGesamt  = 0

$quelleVoll = (Resolve-Path -LiteralPath $Quelle).Path

$profilWurzeln = Get-AgpProfilWurzeln -Wurzel $quelleVoll
if ($profilWurzeln.Count -gt 0) {
    Write-Host ("Browser-Profile erkannt und ausgelassen: {0}" -f $profilWurzeln.Count) -ForegroundColor Yellow
    foreach ($w in $profilWurzeln) {
        Write-Host ("  " + $w.Substring($quelleVoll.Length).TrimStart('\')) -ForegroundColor Yellow
    }
}

$dateien = Get-ChildItem -LiteralPath $quelleVoll -Recurse -File -Force -ErrorAction SilentlyContinue

foreach ($datei in $dateien) {
    $relativ = $datei.FullName.Substring($quelleVoll.Length).TrimStart('\')

    $grund = Get-AgpAusschlussGrund -Datei $datei -Relativ $relativ -ProfilWurzeln $profilWurzeln -MaxBytes $MaxBytes -ZusatzAus $ZusatzAus

    # Ballast-Ordner still übergehen, sonst wird der Bericht unlesbar.
    if ($grund -eq 'Ballast-Ordner' -or $grund -eq 'projektspezifisch ausgenommen') { continue }

    if ($grund) {
        $ausgelassen.Add([pscustomobject]@{
            Projekt = $Ziel
            Datei   = $relativ
            Grund   = $grund
            Bytes   = $datei.Length
        })
        continue
    }

    if (-not $NurAnzeigen) {
        $zielDatei = Join-Path $ZielVoll $relativ
        $zielDir   = Split-Path -Parent $zielDatei
        if (-not (Test-Path -LiteralPath $zielDir)) {
            New-Item -ItemType Directory -Path $zielDir -Force | Out-Null
        }
        try {
            Copy-Item -LiteralPath $datei.FullName -Destination $zielDatei -Force -ErrorAction Stop
        } catch {
            # Gesperrte oder unlesbare Datei darf den Lauf nicht abbrechen —
            # sie wird protokolliert und übersprungen.
            $ausgelassen.Add([pscustomobject]@{
                Projekt = $Ziel
                Datei   = $relativ
                Grund   = 'nicht lesbar'
                Bytes   = $datei.Length
            })
            continue
        }
    }
    $uebernommen++
    $bytesGesamt += $datei.Length
}

$geheim = @($ausgelassen | Where-Object { $_.Grund -in @('Zugangsdaten', 'Schluessel im Inhalt') })

Write-Host ("Übernommen  : {0} Dateien, {1} MB" -f $uebernommen, [Math]::Round($bytesGesamt / 1MB, 1))
Write-Host ("Ausgelassen : {0} Dateien" -f $ausgelassen.Count)

if ($geheim.Count -gt 0) {
    Write-Host ""
    Write-Host "ZUGANGSDATEN gefunden und NICHT übernommen:" -ForegroundColor Yellow
    foreach ($g in $geheim) { Write-Host ("  $($g.Datei)  [$($g.Grund)]") -ForegroundColor Yellow }
    Write-Host ""
}

if ($ausgelassen.Count -gt 0 -and -not $NurAnzeigen) {
    $neu = -not (Test-Path -LiteralPath $Bericht)
    $ausgelassen | Export-Csv -LiteralPath $Bericht -NoTypeInformation -Encoding utf8 -Append:(-not $neu)
    Write-Host "Bericht: $Bericht"
}
