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
    [switch] $NurAnzeigen
)

$ErrorActionPreference = 'Stop'

# Ordner, die nie mitkommen. Abhängigkeiten und Build-Ausgaben lassen sich
# jederzeit neu erzeugen und würden das Repo um Größenordnungen aufblähen.
$OrdnerAus = @(
    'node_modules', '.venv', 'venv', 'env', '__pycache__', '.pytest_cache',
    'dist', 'build', 'out', 'release', 'target', '.next', '.nuxt', '.turbo',
    '.git', '.gradle', '.idea', '.vscode', '.expo', '.dart_tool',
    'vendor', 'Pods', 'bin', 'obj', '.tmp', '.cache', 'coverage',
    'site-packages', '.codex-test',
    # Browser-Profile aus automatisierten Screenshot-Läufen. Die enthalten echte
    # Anmeldedaten und Cookies und haben mit dem Quelltext nichts zu tun.
    'Extensions', 'Service Worker', 'IndexedDB', 'Local Storage', 'Session Storage',
    'Cache', 'Code Cache', 'GPUCache', 'DawnGraphiteCache', 'DawnWebGPUCache',
    'Network', 'Crashpad', 'Safe Browsing', 'component_crx_cache', 'segmentation_platform'
)

# Dateien, die nie mitkommen. Die erste Gruppe sind Zugangsdaten — die sind der
# eigentliche Grund für dieses Skript. Der Rest ist Laufzeit- und Build-Kram.
$GeheimMuster = @(
    '.env', '.env.*', 'config.py', 'secrets.*', 'credentials.*',
    '*.pem', '*.key', '*.p12', '*.pfx', '*.keystore', '*.jks',
    'id_rsa*', 'id_ed25519*', '*.db', '*.sqlite', '*.sqlite3',
    'serviceAccount*.json', '*token*.txt',
    # Chrome-Profildateien. Exakte Namen, damit z.B. eine Adblock-Regelliste
    # namens "cookies_static.json" nicht fälschlich als Cookie-Speicher gilt.
    'Login Data', 'Login Data-journal', 'Login Data For Account',
    'Login Data For Account-journal', 'Web Data', 'Web Data-journal',
    'Cookies', 'Cookies-journal', 'Local State',
    'Secure Preferences', 'Affiliation Database', 'Affiliation Database-journal'
)
$BallastMuster = @(
    '*.log', '*.pyc', '*.pyo', '*.class', '*.jar', '*.exe', '*.msi',
    '*.dll', '*.so', '*.dylib', '*.lib', '*.pdb',
    '*.zip', '*.rar', '*.7z', '*.tar', '*.gz', '*.iso',
    '*.mp4', '*.mkv', '*.mov', '*.avi', '*.wav', '*.mp3', '*.m4a',
    '*.ogg', '*.opus', '*.flac', '*.aac', '*.wma',
    '*.nef', '*.psd', '*.blend', 'package-lock.json.bak',
    'Thumbs.db', 'desktop.ini', '.DS_Store'
)

# .env.example ist keine Zugangsdatei, sondern die Dokumentation dazu — die soll bleiben.
# Als Muster, damit auch ".env.local.example" erkannt wird.
$Ausnahmen = @('*.example', '*.sample', '*.template', '*.dist')

# Dateinamen allein reichen nicht. Beim Aufbau lag ein echter OpenAI-Schlüssel in einer
# Datei namens "project_commands.txt" — kein Muster der Welt hätte die am Namen erkannt.
# Deshalb wird der Inhalt jeder Textdatei zusätzlich auf bekannte Schlüsselformen geprüft.
$InhaltMuster = @(
    'sk-proj-[A-Za-z0-9_\-]{20,}',          # OpenAI
    'sk-ant-[A-Za-z0-9_\-]{20,}',           # Anthropic
    'gh[pousr]_[A-Za-z0-9]{36,}',           # GitHub
    'xox[baprs]-[A-Za-z0-9\-]{10,}',        # Slack
    'AKIA[0-9A-Z]{16}',                     # AWS
    'AIza[0-9A-Za-z_\-]{35}',               # Google
    '[MNO][A-Za-z\d_\-]{23}\.[\w\-]{6}\.[\w\-]{27}',  # Discord-Bot-Token
    'eyJ[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}',    # JWT (u.a. Supabase)
    '-----BEGIN [A-Z ]*PRIVATE KEY-----'
)
$PruefEndungen = @(
    '.txt', '.md', '.json', '.yml', '.yaml', '.ini', '.cfg', '.conf', '.toml',
    '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py', '.ps1', '.sh', '.bat',
    '.php', '.java', '.rs', '.go', '.html', '.env', '.properties', '.xml', '.sql'
)

if (-not (Test-Path -LiteralPath $Quelle)) {
    throw "Quelle nicht gefunden: $Quelle"
}

$RepoStamm = Split-Path -Parent $PSScriptRoot
$ZielVoll  = Join-Path $RepoStamm ($Ziel -replace '/', '\')
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

# Browser-Profile aus automatisierten Testläufen erkennen und komplett überspringen.
# Einzelne Dateinamen zu sperren reicht nicht — ein Chrome-Profil besteht aus hunderten
# Dateien mit wechselnden Namen, darunter Autofill- und Zertifikatsspeicher. Erkannt wird
# ein Profil an seinen Markern; der ganze Baum darunter fällt dann weg.
$profilMarker = @('Login Data', 'Secure Preferences', 'Cookies')
$profilWurzeln = New-Object System.Collections.Generic.List[string]
Get-ChildItem -LiteralPath $quelleVoll -Recurse -Directory -Force -ErrorAction SilentlyContinue |
    ForEach-Object {
        $dir = $_
        foreach ($m in $profilMarker) {
            if (Test-Path -LiteralPath (Join-Path $dir.FullName $m)) {
                $profilWurzeln.Add($dir.FullName)
                break
            }
        }
    }
if ($profilWurzeln.Count -gt 0) {
    Write-Host ("Browser-Profile erkannt und ausgelassen: {0}" -f $profilWurzeln.Count) -ForegroundColor Yellow
    foreach ($w in $profilWurzeln) {
        Write-Host ("  " + $w.Substring($quelleVoll.Length).TrimStart('\')) -ForegroundColor Yellow
    }
}

$dateien = Get-ChildItem -LiteralPath $quelleVoll -Recurse -File -Force -ErrorAction SilentlyContinue

foreach ($datei in $dateien) {
    $relativ = $datei.FullName.Substring($quelleVoll.Length).TrimStart('\')
    $teile   = $relativ -split '\\'
    $name    = $datei.Name

    # Liegt die Datei in einem ausgeschlossenen Ordner?
    $imAusOrdner = $null
    foreach ($t in $teile[0..([Math]::Max(0, $teile.Count - 2))]) {
        if ($OrdnerAus -contains $t) { $imAusOrdner = $t; break }
    }
    if ($teile.Count -eq 1) { $imAusOrdner = $null }

    if ($imAusOrdner) { continue }   # Ballast-Ordner: still übergehen, sonst wird der Bericht unlesbar

    $imProfil = $false
    foreach ($w in $profilWurzeln) {
        if ($datei.FullName.StartsWith($w + '\', [StringComparison]::OrdinalIgnoreCase)) { $imProfil = $true; break }
    }
    if ($imProfil) {
        $ausgelassen.Add([pscustomobject]@{
            Projekt = $Ziel
            Datei   = $relativ
            Grund   = 'Browser-Profil'
            Bytes   = $datei.Length
        })
        continue
    }

    $istAusnahme = $false
    foreach ($a in $Ausnahmen) { if ($name -like $a) { $istAusnahme = $true; break } }

    $grund = $null
    if (-not $istAusnahme) {
        foreach ($m in $GeheimMuster) {
            if ($name -like $m) { $grund = 'Zugangsdaten'; break }
        }
    }
    if (-not $grund) {
        foreach ($m in $BallastMuster) {
            if ($name -like $m) { $grund = 'Ballast'; break }
        }
    }
    if (-not $grund -and $datei.Length -gt $MaxBytes) {
        $grund = "zu groß ($([Math]::Round($datei.Length / 1MB, 1)) MB)"
    }

    # Inhaltsprüfung: nur für Textdateien vernünftiger Größe.
    if (-not $grund -and $datei.Length -lt 2MB -and ($PruefEndungen -contains $datei.Extension.ToLower())) {
        $inhalt = Get-Content -LiteralPath $datei.FullName -Raw -ErrorAction SilentlyContinue
        if ($inhalt) {
            foreach ($m in $InhaltMuster) {
                if ($inhalt -match $m) { $grund = 'Schlüssel im Inhalt'; break }
            }
        }
    }

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

$geheim = @($ausgelassen | Where-Object { $_.Grund -in @('Zugangsdaten', 'Schlüssel im Inhalt') })

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
