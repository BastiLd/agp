<#
.SYNOPSIS
    Sucht doppelt vorhandene Projektordner über mehrere Laufwerke hinweg.

.DESCRIPTION
    Findet Ordner, die dasselbe Projekt in mehreren Kopien enthalten — etwa wenn ein Projekt
    auf C:, auf D: und nochmal in einem Unterordner liegt. Erkannt wird über drei Wege:

      1. Gleicher Ordnername
      2. Gleicher Inhalt  (Prüfsumme über Dateinamen + Größen)
      3. Gleiche Git-Herkunft (dasselbe "origin"-Repo in mehreren Arbeitskopien)

    Das Skript LIEST NUR. Es löscht, verschiebt und ändert nichts.

.PARAMETER Pfade
    Wo gesucht werden soll. Standard: alle lokalen Festplatten.

.PARAMETER Tiefe
    Wie viele Ordnerebenen tief gesucht wird. Standard: 4.

.PARAMETER CsvPfad
    Wohin der Bericht als CSV geschrieben wird. Standard: Desktop.

.EXAMPLE
    .\Find-Duplicates.ps1
    Durchsucht alle lokalen Laufwerke.

.EXAMPLE
    .\Find-Duplicates.ps1 -Pfade "C:\Users\basti\Documents", "D:\Projekte" -Tiefe 5
    Durchsucht nur diese beiden Orte, fünf Ebenen tief.
#>

[CmdletBinding()]
param(
    [string[]] $Pfade,
    [int]      $Tiefe = 4,
    [string]   $CsvPfad = "$env:USERPROFILE\Desktop\agp-duplikate.csv"
)

$ErrorActionPreference = 'SilentlyContinue'

# Ordner, die nie ein eigenes Projekt sind
$Ignorieren = @(
    'node_modules', '.git', '.svn', '__pycache__', '.venv', 'venv', 'env',
    'dist', 'build', 'out', 'target', '.next', '.nuxt', '.cache', '.vite',
    'bin', 'obj', 'vendor', 'Pods', '.gradle', '.idea', '.vs', 'coverage',
    'Windows', 'Program Files', 'Program Files (x86)', 'ProgramData',
    '$Recycle.Bin', 'System Volume Information', 'AppData', 'Temp', 'tmp',
    'OneDriveTemp', 'Recovery', 'PerfLogs', 'Microsoft', 'WindowsApps'
)

# Dateien, an denen man ein Projekt erkennt
$Marker = @(
    'package.json', 'requirements.txt', 'pyproject.toml', 'Cargo.toml',
    'go.mod', 'composer.json', 'pom.xml', 'build.gradle', 'Gemfile',
    'manifest.json', 'index.html', 'tauri.conf.json', '*.sln', '*.csproj'
)

function Test-Ignoriert {
    param([string] $Pfad)
    foreach ($teil in $Pfad -split '\\') {
        if ($Ignorieren -contains $teil) { return $true }
    }
    return $false
}

function Get-Projektordner {
    param([string] $Wurzel, [int] $MaxTiefe)

    $gefunden = [System.Collections.Generic.List[object]]::new()
    $warteschlange = [System.Collections.Generic.Queue[object]]::new()
    $warteschlange.Enqueue([pscustomobject]@{ Pfad = $Wurzel; Ebene = 0 })

    while ($warteschlange.Count -gt 0) {
        $aktuell = $warteschlange.Dequeue()
        if ($aktuell.Ebene -gt $MaxTiefe) { continue }

        $kinder = Get-ChildItem -LiteralPath $aktuell.Pfad -Directory -Force -ErrorAction SilentlyContinue
        foreach ($k in $kinder) {
            if ($Ignorieren -contains $k.Name) { continue }
            if ($k.Attributes -band [IO.FileAttributes]::ReparsePoint) { continue }

            $istProjekt = $false
            foreach ($m in $Marker) {
                if (Get-ChildItem -LiteralPath $k.FullName -Filter $m -File -ErrorAction SilentlyContinue |
                    Select-Object -First 1) { $istProjekt = $true; break }
            }
            if (-not $istProjekt -and (Test-Path -LiteralPath (Join-Path $k.FullName '.git'))) {
                $istProjekt = $true
            }
            if (-not $istProjekt -and (Test-Path -LiteralPath (Join-Path $k.FullName '.git') -PathType Leaf)) {
                $istProjekt = $true
            }

            if ($istProjekt) {
                $gefunden.Add($k)
            } else {
                $warteschlange.Enqueue([pscustomobject]@{ Pfad = $k.FullName; Ebene = $aktuell.Ebene + 1 })
            }
        }
    }
    return $gefunden
}

function Get-OrdnerKennung {
    <# Prüfsumme über relative Dateinamen + Größen — erkennt inhaltsgleiche Kopien #>
    param([string] $Pfad)

    $dateien = Get-ChildItem -LiteralPath $Pfad -Recurse -File -Force -ErrorAction SilentlyContinue |
        Where-Object { -not (Test-Ignoriert $_.FullName) } |
        Sort-Object FullName

    if (-not $dateien) { return $null }

    $text = ($dateien | ForEach-Object {
        '{0}|{1}' -f $_.FullName.Substring($Pfad.Length).TrimStart('\'), $_.Length
    }) -join "`n"

    $stream = [IO.MemoryStream]::new([Text.Encoding]::UTF8.GetBytes($text))
    $hash = (Get-FileHash -InputStream $stream -Algorithm SHA256).Hash
    $stream.Dispose()

    [pscustomobject]@{
        Kennung   = $hash
        Anzahl    = $dateien.Count
        Bytes     = ($dateien | Measure-Object Length -Sum).Sum
        Geaendert = ($dateien | Sort-Object LastWriteTime -Descending | Select-Object -First 1).LastWriteTime
    }
}

function Get-GitHerkunft {
    param([string] $Pfad)

    $git = Join-Path $Pfad '.git'
    if (-not (Test-Path -LiteralPath $git)) { return $null }

    # ".git" ist bei Worktrees und Submodulen eine Datei, die auf das echte Verzeichnis zeigt
    if (Test-Path -LiteralPath $git -PathType Leaf) {
        $verweis = (Get-Content -LiteralPath $git -TotalCount 1) -replace '^gitdir:\s*', ''
        if (-not $verweis) { return $null }
        if (-not [IO.Path]::IsPathRooted($verweis)) { $verweis = Join-Path $Pfad $verweis }
        # von .git/worktrees/<name> zurueck auf das Hauptverzeichnis
        $git = ($verweis -replace '[\\/]worktrees[\\/][^\\/]+$', '')
    }

    $cfg = Join-Path $git 'config'
    if (-not (Test-Path -LiteralPath $cfg)) { return $null }
    $zeile = Select-String -LiteralPath $cfg -Pattern '^\s*url\s*=\s*(.+)$' -ErrorAction SilentlyContinue |
             Select-Object -First 1
    if ($zeile) { return $zeile.Matches[0].Groups[1].Value.Trim() }
    return $null
}

# ---------------------------------------------------------------- Start

if (-not $Pfade) {
    $Pfade = Get-PSDrive -PSProvider FileSystem |
             Where-Object { $_.Free -ne $null -and $_.Root -match '^[A-Z]:\\$' } |
             Select-Object -ExpandProperty Root
}

Write-Host ''
Write-Host '  Duplikat-Suche' -ForegroundColor Cyan
Write-Host '  --------------' -ForegroundColor Cyan
Write-Host "  Durchsucht: $($Pfade -join ', ')"
Write-Host "  Tiefe:      $Tiefe Ebenen"
Write-Host '  (Das Skript liest nur — es wird nichts geloescht oder verschoben.)'
Write-Host ''

$alle = [System.Collections.Generic.List[object]]::new()

foreach ($p in $Pfade) {
    if (-not (Test-Path -LiteralPath $p)) { Write-Host "  uebersprungen (nicht da): $p" -ForegroundColor DarkYellow; continue }
    Write-Host "  suche in $p ..." -NoNewline
    $treffer = Get-Projektordner -Wurzel $p -MaxTiefe $Tiefe
    Write-Host " $($treffer.Count) Projektordner"
    foreach ($t in $treffer) { $alle.Add($t) }
}

if ($alle.Count -eq 0) { Write-Host "`n  Nichts gefunden." -ForegroundColor Yellow; return }

Write-Host "`n  Analysiere $($alle.Count) Ordner ..." -ForegroundColor Cyan

$daten = [System.Collections.Generic.List[object]]::new()
$i = 0
foreach ($o in $alle) {
    $i++
    Write-Progress -Activity 'Analysiere Projektordner' -Status $o.Name -PercentComplete (100 * $i / $alle.Count)
    $k = Get-OrdnerKennung -Pfad $o.FullName
    if (-not $k) { continue }
    $daten.Add([pscustomobject]@{
        Name      = $o.Name
        Pfad      = $o.FullName
        Dateien   = $k.Anzahl
        MB        = [math]::Round($k.Bytes / 1MB, 2)
        Geaendert = $k.Geaendert
        Kennung   = $k.Kennung
        GitRepo   = Get-GitHerkunft -Pfad $o.FullName
    })
}
Write-Progress -Activity 'Analysiere Projektordner' -Completed

# ---------------------------------------------------------------- Gruppen

$gruppen = [System.Collections.Generic.List[object]]::new()

foreach ($g in $daten | Group-Object Kennung | Where-Object Count -gt 1) {
    $gruppen.Add([pscustomobject]@{ Art = 'Inhalt identisch'; Schluessel = $g.Name.Substring(0, 8); Eintraege = $g.Group })
}

$schonDrin = $gruppen.Eintraege.Pfad
foreach ($g in $daten | Where-Object { $_.GitRepo } | Group-Object GitRepo | Where-Object Count -gt 1) {
    if (($g.Group.Pfad | Where-Object { $_ -notin $schonDrin }).Count -eq 0) { continue }
    $gruppen.Add([pscustomobject]@{ Art = 'Gleiches Git-Repo'; Schluessel = $g.Name; Eintraege = $g.Group })
}

$schonDrin = $gruppen.Eintraege.Pfad
foreach ($g in $daten | Group-Object Name | Where-Object Count -gt 1) {
    if (($g.Group.Pfad | Where-Object { $_ -notin $schonDrin }).Count -eq 0) { continue }
    $gruppen.Add([pscustomobject]@{ Art = 'Gleicher Name'; Schluessel = $g.Name; Eintraege = $g.Group })
}

# ---------------------------------------------------------------- Bericht

Write-Host ''
if ($gruppen.Count -eq 0) {
    Write-Host '  Keine Duplikate gefunden.' -ForegroundColor Green
} else {
    Write-Host "  $($gruppen.Count) moegliche Duplikat-Gruppen:" -ForegroundColor Yellow
    Write-Host ''
    foreach ($g in $gruppen) {
        Write-Host "  [$($g.Art)]  $($g.Schluessel)" -ForegroundColor Cyan
        $neuestes = ($g.Eintraege | Sort-Object Geaendert -Descending | Select-Object -First 1).Pfad
        foreach ($e in $g.Eintraege | Sort-Object Geaendert -Descending) {
            $zeichen = if ($e.Pfad -eq $neuestes) { '>' } else { ' ' }
            $farbe   = if ($e.Pfad -eq $neuestes) { 'Green' } else { 'Gray' }
            Write-Host ("   {0} {1,-70} {2,6} Dateien {3,8} MB  {4:dd.MM.yyyy}" -f
                        $zeichen, $e.Pfad, $e.Dateien, $e.MB, $e.Geaendert) -ForegroundColor $farbe
        }
        Write-Host ''
    }
    Write-Host '   > = neuester Stand' -ForegroundColor DarkGray
}

$zeilen = foreach ($g in $gruppen) {
    $neuestes = ($g.Eintraege | Sort-Object Geaendert -Descending | Select-Object -First 1).Pfad
    foreach ($e in $g.Eintraege | Sort-Object Geaendert -Descending) {
        [pscustomobject]@{
            Art       = $g.Art
            Gruppe    = $g.Schluessel
            Neuester  = if ($e.Pfad -eq $neuestes) { 'ja' } else { '' }
            Name      = $e.Name
            Pfad      = $e.Pfad
            Dateien   = $e.Dateien
            MB        = $e.MB
            Geaendert = $e.Geaendert
            GitRepo   = $e.GitRepo
        }
    }
}

if ($zeilen) {
    $zeilen | Export-Csv -LiteralPath $CsvPfad -NoTypeInformation -Encoding UTF8 -Delimiter ';'
    Write-Host "  Bericht gespeichert: $CsvPfad" -ForegroundColor Green
    Write-Host '  (Mit Excel oeffnen — Trennzeichen ist ein Semikolon.)' -ForegroundColor DarkGray
}
Write-Host ''
