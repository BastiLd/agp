# Dieses Skript zeigt die Tracker- und Kamera-Daten in einem interaktiven Raster an.
# Stellen Sie sicher, dass sich 'tracker_camera_data.json' im selben Ordner befindet.

# JSON-Datei laden
$jsonPath = Join-Path -Path $PSScriptRoot -ChildPath 'tracker_camera_data.json'
if (-Not (Test-Path $jsonPath)) {
    Write-Error "tracker_camera_data.json wurde nicht gefunden. Bitte stellen Sie sicher, dass die Datei vorhanden ist."
    exit 1
}

$data = Get-Content -Raw -Path $jsonPath | ConvertFrom-Json

# Daten anzeigen
$data | Out-GridView -Title 'Tracker & Kamera Kaufkompass'
