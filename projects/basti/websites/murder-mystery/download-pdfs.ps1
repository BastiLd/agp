<#
    AKTENZEICHEN - Originaldokumente herunterladen
    Laedt die frei verfuegbaren Gerichts-PDFs in den Ordner .\docs\
    Danach zeigt das Spiel sie direkt in der Seite an.

    Aufruf:  .\download-pdfs.ps1
#>
$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

Write-Host ""
Write-Host "  AKTENZEICHEN - Originaldokumente" -ForegroundColor Red
Write-Host "  ----------------------------------------" -ForegroundColor DarkGray

if (-not (Test-Path "cases.json")) {
    Write-Host "  cases.json nicht gefunden." -ForegroundColor Yellow
    exit 1
}
New-Item -ItemType Directory -Force -Path "docs" | Out-Null

$cases = Get-Content "cases.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$ok = 0
$fail = 0
$skip = 0

foreach ($c in $cases) {
    if (-not $c.pdfs) { continue }
    for ($i = 0; $i -lt $c.pdfs.Count; $i++) {
        $url  = $c.pdfs[$i].u
        $dest = Join-Path "docs" ("{0}-{1}.pdf" -f $c.id, $i)
        if (Test-Path $dest) { $skip++; continue }
        try {
            Write-Host ("  laden: {0}" -f $c.pdfs[$i].t) -ForegroundColor Gray
            Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing -TimeoutSec 40
            $ok++
        } catch {
            Write-Host ("  fehlgeschlagen: {0}" -f $url) -ForegroundColor DarkYellow
            if (Test-Path $dest) { Remove-Item $dest -Force }
            $fail++
        }
    }
}

Write-Host ""
Write-Host ("  {0} geladen, {1} bereits vorhanden, {2} fehlgeschlagen" -f $ok, $skip, $fail) -ForegroundColor Green
Write-Host "  Die Dokumente erscheinen jetzt direkt im Spiel." -ForegroundColor Gray
Write-Host ""
Write-Host "  Jetzt hochladen mit:  .\push.ps1" -ForegroundColor White
Write-Host ""
