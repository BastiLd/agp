<#
    AKTENZEICHEN - Alles hochladen
    Raeumt haengengebliebene Git-Sperrdateien weg, committet und pusht.

    Aufruf:  .\push.ps1
             .\push.ps1 -Message "Eigener Text"
#>
param([string]$Message = "Update")

$ErrorActionPreference = "Continue"
Set-Location -Path $PSScriptRoot

Write-Host ""
Write-Host "  AKTENZEICHEN - Upload" -ForegroundColor Red
Write-Host "  ----------------------------------------" -ForegroundColor DarkGray

# 1. Sperrdateien entfernen (entstehen, wenn Git unsauber beendet wurde)
$locks = @(".git\index.lock", ".git\HEAD.lock", ".git\objects\maintenance.lock",
           ".git\config.lock", ".git\refs\heads\main.lock")
$removed = 0
foreach ($l in $locks) {
    if (Test-Path $l) {
        Remove-Item $l -Force -ErrorAction SilentlyContinue
        if (-not (Test-Path $l)) { $removed++ }
    }
}
if ($removed -gt 0) {
    Write-Host ("  {0} Sperrdatei(en) entfernt" -f $removed) -ForegroundColor Yellow
}

# 2. Status pruefen
if (-not (Test-Path ".git")) {
    Write-Host "  Kein Git-Repository in diesem Ordner." -ForegroundColor Yellow
    exit 1
}

Write-Host "  Dateien werden vorgemerkt ..." -ForegroundColor Gray
git add -A
if ($LASTEXITCODE -ne 0) {
    Write-Host "  git add fehlgeschlagen." -ForegroundColor Yellow
    exit 1
}

$staged = git diff --cached --name-only
if ([string]::IsNullOrWhiteSpace($staged)) {
    Write-Host "  Keine Aenderungen zu committen." -ForegroundColor Gray
} else {
    $n = ($staged -split "`n" | Where-Object { $_ }).Count
    Write-Host ("  {0} Datei(en) werden committet" -f $n) -ForegroundColor Gray
    git commit -m $Message | Out-Null
}

Write-Host "  Wird hochgeladen ..." -ForegroundColor Gray
git push

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "  Fertig." -ForegroundColor Green
    Write-Host "  In etwa einer Minute live unter:" -ForegroundColor Gray
    Write-Host "    https://bastild.github.io/MurderMystery/?frisch=1" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "  Push fehlgeschlagen. Fehlermeldung siehe oben." -ForegroundColor Yellow
    Write-Host ""
}
