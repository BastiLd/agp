<#
.SYNOPSIS
    Zieht Aenderungen aus den Quellordnern in den Katalog nach und laedt sie hoch.

.DESCRIPTION
    Liest data/quellen.json (welches Projekt kommt woher), vergleicht jede Quelle
    mit der Kopie im Repo und uebernimmt Unterschiede ueber Import-Projekt.ps1 —
    also mit denselben Ausschluessen und derselben Zugangsdaten-Pruefung wie beim
    ersten Aufbau.

    Danach: "stand"-Datum in projects.json nachziehen, privaten Bereich neu
    verschluesseln, beide Repos committen und pushen.

    Ohne -Uebernehmen wird NICHTS geaendert — der Lauf zeigt nur, was anfiele.

.PARAMETER Uebernehmen
    Aenderungen wirklich in die Repos schreiben. Ohne diesen Schalter: reine Vorschau.

.PARAMETER Hochladen
    Nach dem Uebernehmen committen und pushen. Setzt -Uebernehmen voraus.

.PARAMETER NurProjekt
    Nur diese Projekt-IDs bearbeiten (kommagetrennt), statt aller.

.PARAMETER Repo
    Pfad zum oeffentlichen Repo. Standard: der Ordner ueber tools\.

.PARAMETER PrivatRepo
    Pfad zum privaten Repo. Standard: Geschwisterordner "agp-privat".

.PARAMETER Passwort
    Passwort fuer den privaten Bereich. Nur noetig, wenn data/private.json
    geaendert wurde und neu verschluesselt werden muss.

.EXAMPLE
    .\tools\Update-AGP.ps1
    Zeigt, was sich geaendert hat. Aendert nichts.

.EXAMPLE
    .\tools\Update-AGP.ps1 -Uebernehmen -Hochladen
    Zieht alles nach, committet und pusht beide Repos.
#>
[CmdletBinding()]
param(
    [switch]$Uebernehmen,
    [switch]$Hochladen,
    [string]$NurProjekt = '',
    [string]$Repo = '',
    [string]$PrivatRepo = '',
    [string]$Passwort = ''
)

$ErrorActionPreference = 'Stop'
if (-not $Repo)       { $Repo = Split-Path -Parent $PSScriptRoot }
if (-not $PrivatRepo) { $PrivatRepo = Join-Path (Split-Path -Parent $Repo) 'agp-privat' }
$Rechner = $env:COMPUTERNAME

# ---------------------------------------------------------------- Hilfsmittel

$script:Zeilen = New-Object System.Collections.ArrayList

function Melde {
    param([string]$Text, [ValidateSet('info','gut','warn','fehler','titel')][string]$Art = 'info')
    $farbe = switch ($Art) {
        'gut'    { 'Green' }  'warn' { 'Yellow' }
        'fehler' { 'Red' }    'titel' { 'Cyan' }
        default  { 'Gray' }
    }
    Write-Host $Text -ForegroundColor $farbe
    [void]$script:Zeilen.Add([pscustomobject]@{ art = $Art; text = $Text })
}

# Windows legt Umlaute mal als ein Zeichen ab (NFC), mal zerlegt (NFD). Beides
# sieht gleich aus, aber ein Pfad in der falschen Form wird nicht gefunden.
function Loese-Pfad {
    param([string]$Pfad)
    if ([string]::IsNullOrWhiteSpace($Pfad)) { return $null }
    if (Test-Path -LiteralPath $Pfad) { return $Pfad }
    $teile = $Pfad -split '\\'
    $hier = $teile[0] + '\'
    foreach ($teil in $teile[1..($teile.Count - 1)]) {
        if (-not $teil) { continue }
        $kinder = Get-ChildItem -LiteralPath $hier -Force -EA SilentlyContinue
        $treffer = $kinder | Where-Object {
            $_.Name -eq $teil -or
            $_.Name.Normalize([Text.NormalizationForm]::FormC) -eq $teil.Normalize([Text.NormalizationForm]::FormC)
        } | Select-Object -First 1
        if (-not $treffer) { return $null }
        $hier = $treffer.FullName
    }
    if (Test-Path -LiteralPath $hier) { return $hier } else { return $null }
}

# Vergleicht Quelle und Repo-Kopie — mit EXAKT den Regeln des Imports, sonst
# meldete der Vergleich ewig Aenderungen an Dateien, die nie uebernommen werden.
. (Join-Path $PSScriptRoot 'AGP-Regeln.ps1')

function Vergleiche {
    param([string]$Quelle, [string]$Ziel, [string[]]$ZusatzAus = @())
    $q = Get-AgpUebernehmbar -Wurzel $Quelle -ZusatzAus $ZusatzAus
    # Im Ziel liegt bereits nur Uebernommenes; die Inhaltspruefung waere hier
    # doppelte Arbeit und wuerde eine bereinigte Datei faelschlich ausblenden.
    $z = Get-AgpUebernehmbar -Wurzel $Ziel -OhneInhaltspruefung -ZusatzAus $ZusatzAus

    $neu = @(); $geaendert = @(); $weg = @()
    foreach ($k in $q.Keys) {
        if (-not $z.ContainsKey($k)) { $neu += $k }
        elseif ($z[$k] -ne $q[$k])   { $geaendert += $k }
    }
    foreach ($k in $z.Keys) { if (-not $q.ContainsKey($k)) { $weg += $k } }
    return [pscustomobject]@{
        Neu = $neu; Geaendert = $geaendert; Entfallen = $weg
        QuellDateien = $q.Count; ZielDateien = $z.Count
        # Entfallene zaehlen NICHT als Aenderung: mehrere Projekte sind aus zwei
        # Quellen zusammengesetzt (z.B. tracker-kaufkompass), da fehlt in der einen
        # Quelle zwangslaeufig, was aus der anderen stammt.
        Anzahl = $neu.Count + $geaendert.Count
    }
}

function Neuestes-Datum {
    param([string]$Wurzel)
    $uebernehmbar = Get-AgpUebernehmbar -Wurzel $Wurzel -OhneInhaltspruefung
    if ($uebernehmbar.Count -eq 0) { return $null }
    $voll = (Resolve-Path -LiteralPath $Wurzel).Path
    $neuestes = $null
    foreach ($rel in $uebernehmbar.Keys) {
        $d = Get-Item -LiteralPath (Join-Path $voll $rel) -Force -EA SilentlyContinue
        if ($d -and (-not $neuestes -or $d.LastWriteTime -gt $neuestes)) { $neuestes = $d.LastWriteTime }
    }
    if ($neuestes) { return $neuestes.ToString('yyyy-MM-dd') } else { return $null }
}

# ------------------------------------------------------------------ Einlesen

Melde "AGP aktualisieren" 'titel'
Melde ("Rechner       : " + $Rechner)
Melde ("Oeffentlich   : " + $Repo)
Melde ("Privat        : " + $PrivatRepo)
Melde ("Modus         : " + $(if ($Uebernehmen) { if ($Hochladen) { 'uebernehmen und hochladen' } else { 'uebernehmen, nicht hochladen' } } else { 'nur ansehen (nichts wird geaendert)' })) $(if ($Uebernehmen) { 'warn' } else { 'info' })
Melde ""

$quellenDatei = Join-Path $Repo 'data\quellen.json'
if (-not (Test-Path -LiteralPath $quellenDatei)) { throw "data/quellen.json fehlt — ohne sie ist nicht bekannt, woher die Projekte stammen." }
$quellen = (Get-Content -Raw -LiteralPath $quellenDatei -Encoding UTF8 | ConvertFrom-Json)

$oeff = (Get-Content -Raw -LiteralPath (Join-Path $Repo 'data\projects.json') -Encoding UTF8 | ConvertFrom-Json)
$privDatei = Join-Path $Repo 'data\private.json'
$priv = if (Test-Path -LiteralPath $privDatei) { Get-Content -Raw -LiteralPath $privDatei -Encoding UTF8 | ConvertFrom-Json } else { $null }

$projekte = @()
foreach ($p in $oeff.projekte)  { $projekte += [pscustomobject]@{ id=$p.id; titel=$p.titel; pfad=$p.pfad; stand=$p.stand; bereich='oeffentlich'; wurzel=$Repo } }
if ($priv) { foreach ($p in $priv.projekte) { $projekte += [pscustomobject]@{ id=$p.id; titel=$p.titel; pfad=$p.pfad; stand=$p.stand; bereich='privat'; wurzel=$PrivatRepo } } }

if ($NurProjekt) {
    $wunsch = $NurProjekt -split ',' | ForEach-Object { $_.Trim() }
    $projekte = $projekte | Where-Object { $wunsch -contains $_.id }
    if (-not $projekte) { throw "Keine Projekte passen zu '$NurProjekt'." }
}

Melde ("Projekte im Katalog: " + $projekte.Count)

# --------------------------------------------------------------- Vergleichen

$aenderungen = @()
$ohneQuelle  = @()
$fehlend     = @()
$i = 0

foreach ($p in $projekte) {
    $i++
    Write-Progress -Activity 'Vergleiche Projekte' -Status $p.titel -PercentComplete (100 * $i / $projekte.Count)

    $eintrag = $quellen.quellen.PSObject.Properties | Where-Object { $_.Name -eq $p.id } | Select-Object -First 1
    if (-not $eintrag) { $ohneQuelle += $p; continue }
    $rohPfad = $eintrag.Value.pfade.PSObject.Properties | Where-Object { $_.Name -eq $Rechner } | Select-Object -First 1
    if (-not $rohPfad) { $ohneQuelle += $p; continue }
    $zusatzAus = @()
    if ($eintrag.Value.ausschluss) { $zusatzAus = @($eintrag.Value.ausschluss) }

    $quellPfad = Loese-Pfad $rohPfad.Value
    if (-not $quellPfad) { $fehlend += [pscustomobject]@{ Projekt=$p; Pfad=$rohPfad.Value }; continue }

    $zielPfad = Join-Path $p.wurzel ($p.pfad -replace '/','\')
    $v = Vergleiche -Quelle $quellPfad -Ziel $zielPfad -ZusatzAus $zusatzAus
    if ($v.Anzahl -gt 0) {
        $aenderungen += [pscustomobject]@{ Projekt=$p; Quelle=$quellPfad; Ziel=$zielPfad; Vergleich=$v; ZusatzAus=$zusatzAus }
    }
}
Write-Progress -Activity 'Vergleiche Projekte' -Completed

# ------------------------------------------------------------------ Bericht

Melde ""
Melde "Ergebnis" 'titel'
Melde ("  geaendert           : " + $aenderungen.Count) $(if ($aenderungen.Count) { 'warn' } else { 'gut' })
Melde ("  unveraendert        : " + ($projekte.Count - $aenderungen.Count - $ohneQuelle.Count - $fehlend.Count))
Melde ("  ohne Quelle hier    : " + $ohneQuelle.Count)
if ($fehlend.Count) { Melde ("  Quelle verschwunden : " + $fehlend.Count) 'fehler' }

if ($fehlend.Count) {
    Melde ""
    Melde "Quelle eingetragen, aber nicht mehr da:" 'fehler'
    foreach ($f in $fehlend) { Melde ("  " + $f.Projekt.id + "  ->  " + $f.Pfad) 'fehler' }
}

if ($aenderungen.Count) {
    Melde ""
    Melde "Diese Projekte haben sich geaendert:" 'titel'
    foreach ($a in $aenderungen) {
        $v = $a.Vergleich
        Melde ("  " + $a.Projekt.titel)
        $teile = @()
        if ($v.Neu.Count)       { $teile += ($v.Neu.Count.ToString() + ' neu') }
        if ($v.Geaendert.Count) { $teile += ($v.Geaendert.Count.ToString() + ' geaendert') }
        Melde ("      " + ($teile -join ', '))
        foreach ($d in ($v.Neu | Select-Object -First 3))       { Melde ("      + " + $d) }
        foreach ($d in ($v.Geaendert | Select-Object -First 3)) { Melde ("      ~ " + $d) }
        $rest = $v.Anzahl - [Math]::Min(3,$v.Neu.Count) - [Math]::Min(3,$v.Geaendert.Count)
        if ($rest -gt 0) { Melde ("      ... und " + $rest + " weitere") }
        if ($v.Entfallen.Count) {
            Melde ("      " + $v.Entfallen.Count + " Datei(en) nur im Repo, nicht in der Quelle — bleiben unangetastet")
        }
    }
}

if (-not $Uebernehmen) {
    Melde ""
    if ($aenderungen.Count) {
        Melde "Nichts geaendert — das war nur die Vorschau." 'warn'
        Melde "Zum Uebernehmen:  .\tools\Update-AGP.ps1 -Uebernehmen -Hochladen" 'warn'
    } else {
        Melde "Alles auf dem neuesten Stand." 'gut'
    }
    return [pscustomobject]@{ Aenderungen=$aenderungen; OhneQuelle=$ohneQuelle; Fehlend=$fehlend; Uebernommen=$false; Protokoll=$script:Zeilen }
}

# ----------------------------------------------------------------- Uebernehmen

if (-not $aenderungen.Count) {
    Melde ""
    Melde "Nichts zu uebernehmen." 'gut'
    return [pscustomobject]@{ Aenderungen=@(); OhneQuelle=$ohneQuelle; Fehlend=$fehlend; Uebernommen=$false; Protokoll=$script:Zeilen }
}

Melde ""
Melde "Uebernehme..." 'titel'
$importer = Join-Path $PSScriptRoot 'Import-Projekt.ps1'
if (-not (Test-Path -LiteralPath $importer)) { throw "tools\Import-Projekt.ps1 fehlt." }

$neueStaende = @{}
$funde = @()

foreach ($a in $aenderungen) {
    Melde ("  " + $a.Projekt.titel)
    # Bewusst NICHT vorher leeren: mehrere Projekte sind aus zwei Quellen
    # zusammengesetzt. Ein Leeren wuerde den Teil aus der anderen Quelle
    # stillschweigend vernichten. Der Import ueberschreibt, was er mitbringt.
    $ausgabe = & $importer -Quelle $a.Quelle -Ziel $a.Ziel -ZusatzAus $a.ZusatzAus 2>&1
    $zugangsZeilen = $ausgabe | Where-Object { $_ -match 'ZUGANGSDATEN|Zugangsdaten' }
    if ($zugangsZeilen) {
        foreach ($z in ($ausgabe | Select-Object -Skip ([Array]::IndexOf($ausgabe, ($zugangsZeilen | Select-Object -First 1))))) {
            if ($z -match '^\s{2}\S') { $funde += ($a.Projekt.id + ': ' + $z.ToString().Trim()) }
        }
    }
    $d = Neuestes-Datum $a.Quelle
    if ($d) { $neueStaende[$a.Projekt.id] = $d }
}

if ($funde.Count) {
    Melde ""
    Melde "Zugangsdaten gefunden und NICHT uebernommen:" 'warn'
    foreach ($f in ($funde | Select-Object -Unique)) { Melde ("  " + $f) 'warn' }
}

# stand-Datum nachziehen
Melde ""
Melde "Ziehe die Stand-Daten nach..."
$nodeSkript = Join-Path $PSScriptRoot 'stand-setzen.js'
$standJson = ($neueStaende.GetEnumerator() | ForEach-Object { '"' + $_.Key + '":"' + $_.Value + '"' }) -join ','
$standJson = '{' + $standJson + '}'
$tmp = Join-Path $env:TEMP ('agp-stand-' + [Guid]::NewGuid().ToString('N') + '.json')
Set-Content -LiteralPath $tmp -Value $standJson -Encoding UTF8
try {
    $r = & node $nodeSkript $Repo $tmp 2>&1
    $r | ForEach-Object { Melde ("  " + $_) }
} finally { Remove-Item -LiteralPath $tmp -Force -EA SilentlyContinue }

# privaten Bereich neu verschluesseln, falls private.json vorhanden
if ((Test-Path -LiteralPath $privDatei) -and $Passwort) {
    Melde ""
    Melde "Verschluessele den privaten Bereich neu..."
    $r = & node (Join-Path $PSScriptRoot 'encrypt-private.js') $Passwort 2>&1
    $r | ForEach-Object { Melde ("  " + $_) }
} elseif (Test-Path -LiteralPath $privDatei) {
    Melde ""
    Melde "private.json vorhanden, aber kein Passwort angegeben — private.enc bleibt unveraendert." 'warn'
}

if (-not $Hochladen) {
    Melde ""
    Melde "Uebernommen. Nicht hochgeladen (kein -Hochladen)." 'gut'
    return [pscustomobject]@{ Aenderungen=$aenderungen; OhneQuelle=$ohneQuelle; Fehlend=$fehlend; Uebernommen=$true; Hochgeladen=$false; Protokoll=$script:Zeilen }
}

# ------------------------------------------------------------------ Hochladen

function Lade-Hoch {
    param([string]$Ordner, [string]$Name, [string[]]$Titel)
    if (-not (Test-Path -LiteralPath (Join-Path $Ordner '.git'))) {
        Melde ("  " + $Name + ": kein Git-Repo, uebersprungen") 'warn'; return
    }
    Push-Location $Ordner
    try {
        $status = & git status --porcelain
        if (-not $status) { Melde ("  " + $Name + ": nichts zu committen") ; return }

        # Sicherheitsnetz: private.json darf nie hochgeladen werden
        $verdaechtig = $status | Where-Object { $_ -match 'private\.json' }
        if ($verdaechtig) { Melde ("  " + $Name + ": private.json waere im Commit — ABGEBROCHEN") 'fehler'; return }

        & git add -A | Out-Null
        $liste = if ($Titel.Count -le 8) { ($Titel | ForEach-Object { "- $_" }) -join "`n" } else { (($Titel | Select-Object -First 8 | ForEach-Object { "- $_" }) -join "`n") + "`n- ... und " + ($Titel.Count - 8) + " weitere" }
        $nachricht = "Projekte nachziehen ($($Titel.Count))`n`nAutomatisch uebernommen von $Rechner mit tools/Update-AGP.ps1.`nGeaendert:`n$liste"
        $nachricht | & git commit -q -F - 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) { Melde ("  " + $Name + ": commit fehlgeschlagen") 'fehler'; return }
        & git push -q origin HEAD 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) { Melde ("  " + $Name + ": push fehlgeschlagen") 'fehler'; return }
        Melde ("  " + $Name + ": hochgeladen") 'gut'
    } finally { Pop-Location }
}

Melde ""
Melde "Lade hoch..." 'titel'
$titelOeff = @($aenderungen | Where-Object { $_.Projekt.bereich -eq 'oeffentlich' } | ForEach-Object { $_.Projekt.titel })
$titelPriv = @($aenderungen | Where-Object { $_.Projekt.bereich -eq 'privat' }      | ForEach-Object { $_.Projekt.titel })
if ($titelOeff.Count -or (& git -C $Repo status --porcelain)) { Lade-Hoch -Ordner $Repo -Name 'agp' -Titel $(if ($titelOeff.Count) { $titelOeff } else { @('Katalogdaten') }) }
if ($titelPriv.Count) { Lade-Hoch -Ordner $PrivatRepo -Name 'agp-privat' -Titel $titelPriv }

Melde ""
Melde "Fertig." 'gut'
return [pscustomobject]@{ Aenderungen=$aenderungen; OhneQuelle=$ohneQuelle; Fehlend=$fehlend; Uebernommen=$true; Hochgeladen=$true; Protokoll=$script:Zeilen }
