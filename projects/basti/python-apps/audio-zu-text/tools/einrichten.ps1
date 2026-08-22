# Richtet mittelkap ein: Python-Umgebung, Bibliotheken und Modelle.
# Wird sowohl von EINRICHTEN.bat (Terminal-Paket) als auch von der Anwendung genutzt.
# Alles landet in einem Unterordner "mittelkap-daten" - nichts wird im System installiert.

param(
    [string]$Ziel = "",
    [switch]$NurCpu,
    [switch]$OhneModelle
)

$ErrorActionPreference = "Stop"
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

function Schritt($text) { Write-Host "`n==> $text" -ForegroundColor Cyan }
function Gut($text)     { Write-Host "    $text" -ForegroundColor Green }
function Hinweis($text) { Write-Host "    $text" -ForegroundColor DarkGray }
function Fehler($text)  { Write-Host "`nFEHLER: $text" -ForegroundColor Red }

if (-not $Ziel) { $Ziel = Join-Path (Split-Path $PSScriptRoot -Parent) "mittelkap-daten" }
$Runtime = Join-Path $Ziel "runtime"
$Kern    = Join-Path (Split-Path $PSScriptRoot -Parent) "core"

Write-Host "mittelkap - Einrichtung" -ForegroundColor White
Hinweis "Ziel: $Ziel"

# ---------------------------------------------------------------- Grafikkarte

Schritt "Grafikkarte prüfen"
$MitGpu = $false
if (-not $NurCpu) {
    try {
        $name = (& nvidia-smi --query-gpu=name --format=csv,noheader 2>$null | Select-Object -First 1)
        if ($name) { $MitGpu = $true; Gut "NVIDIA gefunden: $name" }
    } catch { }
}
if (-not $MitGpu) {
    Hinweis "Keine nutzbare NVIDIA-Karte - es wird auf dem Prozessor gerechnet."
    Hinweis "Das funktioniert überall, dauert aber länger."
}

# ---------------------------------------------------------------- Python

Schritt "Python bereitstellen"
$PyExe = Join-Path $Runtime "Scripts\python.exe"

if (Test-Path $PyExe) {
    Gut "Umgebung besteht bereits."
} else {
    $system = $null
    foreach ($kandidat in @("python", "py")) {
        try {
            $v = & $kandidat -c "import sys; print('%d.%d' % sys.version_info[:2])" 2>$null
            if ($v -and [version]$v -ge [version]"3.10") { $system = $kandidat; break }
        } catch { }
    }
    if (-not $system) {
        Fehler @"
Es wurde kein Python 3.10 oder neuer gefunden.

Bitte einmalig installieren:
  1. https://www.python.org/downloads/ öffnen
  2. Die Windows-Version herunterladen und starten
  3. WICHTIG: unten "Add python.exe to PATH" ankreuzen
  4. Danach diese Einrichtung erneut ausführen
"@
        exit 1
    }
    Hinweis "Lege eigene Python-Umgebung an ..."
    New-Item -ItemType Directory -Force $Ziel | Out-Null
    & $system -m venv $Runtime
    if (-not (Test-Path $PyExe)) { Fehler "Die Python-Umgebung ließ sich nicht anlegen."; exit 1 }
    Gut "Angelegt."
}

# ---------------------------------------------------------------- Bibliotheken

Schritt "Bibliotheken installieren (dauert beim ersten Mal einige Minuten)"
& $PyExe -m pip install --upgrade pip --quiet

$pakete = @("faster-whisper", "pyperclip", "watchdog", "huggingface-hub")
if ($MitGpu) { $pakete += @("nvidia-cublas-cu12", "nvidia-cudnn-cu12==9.*", "nvidia-cuda-runtime-cu12") }

& $PyExe -m pip install --quiet @pakete
if ($LASTEXITCODE -ne 0) { Fehler "Die Bibliotheken ließen sich nicht installieren."; exit 1 }
Gut "Grundpakete bereit."

Schritt "Textaufbereitung (optional)"
$llamaQuelle = if ($MitGpu) { "https://abetlen.github.io/llama-cpp-python/whl/cu124" } else { "" }
if ($llamaQuelle) {
    & $PyExe -m pip install --quiet llama-cpp-python --extra-index-url $llamaQuelle
} else {
    & $PyExe -m pip install --quiet llama-cpp-python
}
if ($LASTEXITCODE -eq 0) { Gut "Markdown-Aufbereitung verfügbar." }
else { Hinweis "Übersprungen - Transkription funktioniert trotzdem." }

# ---------------------------------------------------------------- Modelle

if (-not $OhneModelle) {
    Schritt "Spracherkennungs-Modell laden (einmalig, mehrere GB)"
    $modell = if ($MitGpu) { "large-v3" } else { "small" }
    Hinweis "Modell: $modell"

    $env:MITTELKAP_DATEN = $Ziel
    $env:PYTHONPATH = $Kern
    & $PyExe -c @"
from mittelkap.config import Einstellungen
from mittelkap.modelmanager import whisper_holen
e = Einstellungen.laden()
e.modell = '$modell'
e.ordner_anlegen()
e.speichern()
whisper_holen('$modell', e.modellordner)
print('fertig')
"@
    if ($LASTEXITCODE -ne 0) { Fehler "Das Modell konnte nicht geladen werden (Internetverbindung?)."; exit 1 }
    Gut "Modell liegt bereit."
}

Write-Host "`nFertig. mittelkap ist einsatzbereit." -ForegroundColor Green
Hinweis "Alle Daten liegen in: $Ziel"
