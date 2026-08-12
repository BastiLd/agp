# Gemeinsame Regeln: was kommt in den Katalog und was nicht.
#
# Diese Datei wird von Import-Projekt.ps1 UND Update-AGP.ps1 eingebunden.
# Das ist wichtig: Wuerde der Vergleich andere Regeln benutzen als der Import,
# meldete er ewig Aenderungen an Dateien, die gar nie uebernommen werden —
# node_modules, Build-Ausgaben, Protokolle. Genau das ist beim ersten Entwurf
# passiert (3636 "neue" Dateien in einem Chrome-Profil).
#
# Eingebunden wird sie mit:  . (Join-Path $PSScriptRoot 'AGP-Regeln.ps1')

# Ordner, die nie mitkommen. Abhaengigkeiten und Build-Ausgaben lassen sich
# jederzeit neu erzeugen und wuerden das Repo um Groessenordnungen aufblaehen.
$script:AgpOrdnerAus = @(
    'node_modules', '.venv', 'venv', 'env', '__pycache__', '.pytest_cache',
    'dist', 'build', 'out', 'release', 'target', '.next', '.nuxt', '.turbo',
    '.git', '.gradle', '.idea', '.vscode', '.expo', '.dart_tool',
    'vendor', 'Pods', 'bin', 'obj', '.tmp', '.cache', 'coverage',
    'site-packages', '.codex-test', '.playwright-cli', 'hts-cache',
    # Browser-Profile aus automatisierten Screenshot-Laeufen. Die enthalten echte
    # Anmeldedaten und Cookies und haben mit dem Quelltext nichts zu tun.
    'Extensions', 'Service Worker', 'IndexedDB', 'Local Storage', 'Session Storage',
    'Cache', 'Code Cache', 'GPUCache', 'DawnGraphiteCache', 'DawnWebGPUCache',
    'Network', 'Crashpad', 'Safe Browsing', 'component_crx_cache', 'segmentation_platform'
)

# Ordner, deren Name einem Muster folgt. Gebraucht fuer heruntergeladene
# Abhaengigkeiten mit Versionsnummer im Namen: neben den drei Minecraft-Mods
# lag je ein entpacktes "fabric-1.21.1" mit 2284 Dateien Fremdcode.
$script:AgpOrdnerAusMuster = @(
    'fabric-[0-9]*',        # Fabric-API-Quellen, je Minecraft-Fassung entpackt
    'forge-[0-9]*',
    'minecraft-[0-9]*'
)

# Dateien, die nie mitkommen. Die erste Gruppe sind Zugangsdaten — die sind der
# eigentliche Grund fuer dieses Skript. Der Rest ist Laufzeit- und Build-Kram.
$script:AgpGeheimMuster = @(
    '.env', '.env.*', 'config.py', 'secrets.*', 'credentials.*',
    '*.pem', '*.key', '*.p12', '*.pfx', '*.keystore', '*.jks',
    'id_rsa*', 'id_ed25519*', '*.db', '*.sqlite', '*.sqlite3',
    'serviceAccount*.json', '*token*.txt',
    # Chrome-Profildateien. Exakte Namen, damit z.B. eine Adblock-Regelliste
    # namens "cookies_static.json" nicht faelschlich als Cookie-Speicher gilt.
    'Login Data', 'Login Data-journal', 'Login Data For Account',
    'Login Data For Account-journal', 'Web Data', 'Web Data-journal',
    'Cookies', 'Cookies-journal', 'Local State',
    'Secure Preferences', 'Affiliation Database', 'Affiliation Database-journal',
    # Von wget/HTTrack abgelegte Sitzungsdateien — enthalten Anmelde-Cookies
    # fremder Seiten. Beim Nachziehen in "BastiLd Mod Hub" aufgetaucht.
    'cookies.txt', 'cookie.txt', 'cookies.sqlite'
)

$script:AgpBallastMuster = @(
    '*.log', '*.pyc', '*.pyo', '*.class', '*.jar', '*.exe', '*.msi',
    '*.dll', '*.so', '*.dylib', '*.lib', '*.pdb',
    '*.zip', '*.rar', '*.7z', '*.tar', '*.gz', '*.iso',
    '*.mp4', '*.mkv', '*.mov', '*.avi', '*.wav', '*.mp3', '*.m4a',
    '*.ogg', '*.opus', '*.flac', '*.aac', '*.wma',
    '*.nef', '*.psd', '*.blend', 'package-lock.json.bak',
    'Thumbs.db', 'desktop.ini', '.DS_Store',
    # Schuldokumente. Der Katalog ist fuer Software; Praesentationen und
    # Hausuebungen sind beim Aufbau ausdruecklich draussen geblieben.
    '*.docx', '*.doc', '*.pptx', '*.ppt', '*.xlsx', '*.xls', '*.pdf', '*.odt'
)

# .env.example ist keine Zugangsdatei, sondern die Dokumentation dazu — die soll bleiben.
# Als Muster, damit auch ".env.local.example" erkannt wird.
$script:AgpAusnahmen = @('*.example', '*.sample', '*.template', '*.dist')

# Dateinamen allein reichen nicht. Beim Aufbau lag ein echter OpenAI-Schluessel in einer
# Datei namens "project_commands.txt" — kein Muster der Welt haette die am Namen erkannt.
# Deshalb wird der Inhalt jeder Textdatei zusaetzlich auf bekannte Schluesselformen geprueft.
$script:AgpInhaltMuster = @(
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

$script:AgpPruefEndungen = @(
    '.txt', '.md', '.json', '.yml', '.yaml', '.ini', '.cfg', '.conf', '.toml',
    '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py', '.ps1', '.sh', '.bat',
    '.php', '.java', '.rs', '.go', '.html', '.env', '.properties', '.xml', '.sql'
)

# Ein Chrome-Profil besteht aus hunderten Dateien mit wechselnden Namen. Einzelne
# Namen zu sperren reicht nicht — erkannt wird das Profil an seinen Markern, dann
# faellt der ganze Baum darunter weg.
function Get-AgpProfilWurzeln {
    param([Parameter(Mandatory)][string]$Wurzel)
    $marker = @('Login Data', 'Secure Preferences', 'Cookies')
    $treffer = New-Object System.Collections.Generic.List[string]
    Get-ChildItem -LiteralPath $Wurzel -Recurse -Directory -Force -ErrorAction SilentlyContinue |
        ForEach-Object {
            foreach ($m in $marker) {
                if (Test-Path -LiteralPath (Join-Path $_.FullName $m)) { $treffer.Add($_.FullName); break }
            }
        }
    return $treffer
}

<#
.SYNOPSIS
    Entscheidet fuer eine Datei, ob sie in den Katalog darf.
.OUTPUTS
    $null, wenn die Datei uebernommen wird — sonst der Grund als Text.
#>
function Get-AgpAusschlussGrund {
    param(
        [Parameter(Mandatory)][System.IO.FileInfo]$Datei,
        [Parameter(Mandatory)][string]$Relativ,
        [System.Collections.Generic.List[string]]$ProfilWurzeln,
        [long]$MaxBytes = 20971520,
        [switch]$OhneInhaltspruefung,
        [string[]]$ZusatzAus = @()
    )

    $teile = $Relativ -split '\\'
    if ($teile.Count -gt 1) {
        foreach ($t in $teile[0..($teile.Count - 2)]) {
            if ($script:AgpOrdnerAus -contains $t) { return 'Ballast-Ordner' }
            foreach ($m in $script:AgpOrdnerAusMuster) { if ($t -like $m) { return 'Ballast-Ordner' } }
        }
    }

    # Projektspezifische Ausnahmen aus quellen.json, z.B. der Ordner, in den ein
    # Hosting-Panel die betriebenen Seiten legt — das sind Laufzeitdaten, nicht Code.
    foreach ($a in $ZusatzAus) {
        $muster = ($a -replace '/', '\').TrimEnd('\')
        if ($Relativ -like ($muster + '\*') -or $Relativ -like $muster) { return 'projektspezifisch ausgenommen' }
    }

    if ($ProfilWurzeln) {
        foreach ($w in $ProfilWurzeln) {
            if ($Datei.FullName.StartsWith($w + '\', [StringComparison]::OrdinalIgnoreCase)) { return 'Browser-Profil' }
        }
    }

    $name = $Datei.Name
    $istAusnahme = $false
    foreach ($a in $script:AgpAusnahmen) { if ($name -like $a) { $istAusnahme = $true; break } }

    if (-not $istAusnahme) {
        foreach ($m in $script:AgpGeheimMuster) { if ($name -like $m) { return 'Zugangsdaten' } }
    }
    foreach ($m in $script:AgpBallastMuster) { if ($name -like $m) { return 'Ballast' } }

    if ($Datei.Length -gt $MaxBytes) {
        return ("zu gross ({0} MB)" -f [Math]::Round($Datei.Length / 1MB, 1))
    }

    if (-not $OhneInhaltspruefung -and $Datei.Length -lt 2MB -and ($script:AgpPruefEndungen -contains $Datei.Extension.ToLower())) {
        $inhalt = Get-Content -LiteralPath $Datei.FullName -Raw -ErrorAction SilentlyContinue
        if ($inhalt) {
            foreach ($m in $script:AgpInhaltMuster) { if ($inhalt -match $m) { return 'Schluessel im Inhalt' } }
        }
    }

    return $null
}

<#
.SYNOPSIS
    Liefert alle Dateien eines Ordners, die uebernommen wuerden — als
    Zuordnung "relativer Pfad (klein) -> Groesse".
#>
function Get-AgpUebernehmbar {
    param(
        [Parameter(Mandatory)][string]$Wurzel,
        [long]$MaxBytes = 20971520,
        [switch]$OhneInhaltspruefung,
        [string[]]$ZusatzAus = @()
    )
    $ergebnis = @{}
    if (-not (Test-Path -LiteralPath $Wurzel)) { return $ergebnis }
    $voll = (Resolve-Path -LiteralPath $Wurzel).Path
    $profile = Get-AgpProfilWurzeln -Wurzel $voll

    Get-ChildItem -LiteralPath $voll -Recurse -File -Force -ErrorAction SilentlyContinue | ForEach-Object {
        $rel = $_.FullName.Substring($voll.Length).TrimStart('\')
        $grund = Get-AgpAusschlussGrund -Datei $_ -Relativ $rel -ProfilWurzeln $profile -MaxBytes $MaxBytes -OhneInhaltspruefung:$OhneInhaltspruefung -ZusatzAus $ZusatzAus
        if (-not $grund) { $ergebnis[$rel.ToLower()] = $_.Length }
    }
    return $ergebnis
}
