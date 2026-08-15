<#
.SYNOPSIS
    Kleines Fenster zum Aktualisieren des Katalogs. Braucht nichts ausser Windows.

.DESCRIPTION
    Oberflaeche fuer Update-AGP.ps1. Zeigt, was sich in den Quellordnern geaendert
    hat, laesst einzelne Projekte abwaehlen und uebernimmt sie auf Knopfdruck —
    mit oder ohne Hochladen.

    Gestartet wird das ueber "AGP aktualisieren.bat" im Repo-Stamm (Doppelklick).
#>
[CmdletBinding()]
param(
    [string]$Repo = '',
    [string]$PrivatRepo = ''
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

if (-not $Repo)       { $Repo = Split-Path -Parent $PSScriptRoot }
if (-not $PrivatRepo) { $PrivatRepo = Join-Path (Split-Path -Parent $Repo) 'agp-privat' }
$Motor = Join-Path $PSScriptRoot 'Update-AGP.ps1'

# ------------------------------------------------------------------- Fenster

$xaml = @'
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="AGP aktualisieren" Height="640" Width="900"
        WindowStartupLocation="CenterScreen" Background="#0F1117">
  <Window.Resources>
    <Style TargetType="Button">
      <Setter Property="Background" Value="#2F7FD4"/>
      <Setter Property="Foreground" Value="White"/>
      <Setter Property="BorderThickness" Value="0"/>
      <Setter Property="Padding" Value="16,9"/>
      <Setter Property="FontSize" Value="13"/>
      <Setter Property="FontWeight" Value="SemiBold"/>
      <Setter Property="Cursor" Value="Hand"/>
      <Setter Property="Template">
        <Setter.Value>
          <ControlTemplate TargetType="Button">
            <Border x:Name="b" Background="{TemplateBinding Background}" CornerRadius="7"
                    Padding="{TemplateBinding Padding}">
              <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
            </Border>
            <ControlTemplate.Triggers>
              <Trigger Property="IsMouseOver" Value="True">
                <Setter TargetName="b" Property="Opacity" Value="0.86"/>
              </Trigger>
              <Trigger Property="IsEnabled" Value="False">
                <Setter TargetName="b" Property="Background" Value="#2A3042"/>
                <Setter Property="Foreground" Value="#6B7488"/>
              </Trigger>
            </ControlTemplate.Triggers>
          </ControlTemplate>
        </Setter.Value>
      </Setter>
    </Style>
    <Style TargetType="TextBlock">
      <Setter Property="Foreground" Value="#E9ECF3"/>
      <Setter Property="FontFamily" Value="Segoe UI"/>
    </Style>
    <Style TargetType="CheckBox">
      <Setter Property="Foreground" Value="#E9ECF3"/>
      <Setter Property="FontFamily" Value="Segoe UI"/>
      <Setter Property="VerticalContentAlignment" Value="Center"/>
    </Style>
  </Window.Resources>

  <Grid Margin="18">
    <Grid.RowDefinitions>
      <RowDefinition Height="Auto"/>
      <RowDefinition Height="Auto"/>
      <RowDefinition Height="*"/>
      <RowDefinition Height="Auto"/>
      <RowDefinition Height="170"/>
      <RowDefinition Height="Auto"/>
    </Grid.RowDefinitions>

    <!-- Kopf -->
    <StackPanel Grid.Row="0" Margin="0,0,0,14">
      <TextBlock Text="AGP aktualisieren" FontSize="21" FontWeight="Bold"/>
      <TextBlock x:Name="txtOrte" Foreground="#98A1B5" FontSize="12" Margin="0,4,0,0"/>
    </StackPanel>

    <!-- Knopfleiste -->
    <StackPanel Grid.Row="1" Orientation="Horizontal" Margin="0,0,0,12">
      <Button x:Name="btnPruefen" Content="Nachsehen, was sich geaendert hat"/>
      <Button x:Name="btnUebernehmen" Content="Uebernehmen" Margin="10,0,0,0" IsEnabled="False" Background="#C9762F"/>
      <Button x:Name="btnExtern" Content="USB-Quellen" Margin="10,0,0,0" Background="#3A4258"/>
      <TextBlock x:Name="txtStatus" VerticalAlignment="Center" Margin="16,0,0,0" Foreground="#98A1B5" FontSize="12"/>
    </StackPanel>

    <!-- Liste -->
    <Border Grid.Row="2" Background="#171A23" CornerRadius="10" Padding="4">
      <ScrollViewer VerticalScrollBarVisibility="Auto">
        <StackPanel x:Name="listeProjekte" Margin="10"/>
      </ScrollViewer>
    </Border>

    <!-- Optionen -->
    <StackPanel Grid.Row="3" Orientation="Horizontal" Margin="2,12,0,8">
      <CheckBox x:Name="chkHochladen" Content="Anschliessend zu GitHub hochladen" IsChecked="True"/>
      <TextBlock Text="Passwort privater Bereich:" Margin="26,0,8,0" VerticalAlignment="Center" Foreground="#98A1B5" FontSize="12"/>
      <PasswordBox x:Name="pwdPrivat" Width="150" Height="26" VerticalContentAlignment="Center"
                   Background="#1C202B" Foreground="#E9ECF3" BorderBrush="#2A3042"/>
      <TextBlock Text="(nur noetig, wenn du private.json geaendert hast)" Margin="10,0,0,0"
                 VerticalAlignment="Center" Foreground="#6B7488" FontSize="11"/>
    </StackPanel>

    <!-- Protokoll -->
    <Border Grid.Row="4" Background="#0B0D12" CornerRadius="10" Padding="2">
      <ScrollViewer x:Name="scrollLog" VerticalScrollBarVisibility="Auto">
        <TextBox x:Name="txtLog" Background="Transparent" Foreground="#B9C2D4" BorderThickness="0"
                 FontFamily="Consolas" FontSize="11.5" IsReadOnly="True" TextWrapping="NoWrap"
                 Margin="10" VerticalScrollBarVisibility="Disabled"/>
      </ScrollViewer>
    </Border>

    <TextBlock Grid.Row="5" x:Name="txtFuss" Foreground="#6B7488" FontSize="11" Margin="2,8,0,0"/>
  </Grid>
</Window>
'@

$reader = New-Object System.Xml.XmlNodeReader ([xml]$xaml)
$fenster = [Windows.Markup.XamlReader]::Load($reader)

$txtOrte        = $fenster.FindName('txtOrte')
$txtStatus      = $fenster.FindName('txtStatus')
$txtLog         = $fenster.FindName('txtLog')
$txtFuss        = $fenster.FindName('txtFuss')
$scrollLog      = $fenster.FindName('scrollLog')
$btnPruefen     = $fenster.FindName('btnPruefen')
$btnUebernehmen = $fenster.FindName('btnUebernehmen')
$btnExtern      = $fenster.FindName('btnExtern')
$listeProjekte  = $fenster.FindName('listeProjekte')
$chkHochladen   = $fenster.FindName('chkHochladen')
$pwdPrivat      = $fenster.FindName('pwdPrivat')

$txtOrte.Text = "Rechner $env:COMPUTERNAME   |   $Repo   |   $PrivatRepo"
$txtFuss.Text = 'Das Werkzeug liest aus den Quellordnern und schreibt dort nichts. Zugangsdaten bleiben zurueck.'

# ------------------------------------------------------------------ Zustand

$script:Gefunden = @()
$script:Haken    = @{}
$script:Laeuft   = $false

function Schreibe {
    param([string]$Text)
    $txtLog.AppendText($Text + "`r`n")
    $txtLog.ScrollToEnd()
    $scrollLog.ScrollToEnd()
}

function Leere-Liste {
    $listeProjekte.Children.Clear()
    $script:Haken = @{}
}

function Zeige-Hinweis {
    param([string]$Text, [string]$Farbe = '#98A1B5')
    $t = New-Object Windows.Controls.TextBlock
    $t.Text = $Text
    $t.Foreground = $Farbe
    $t.TextWrapping = 'Wrap'
    $t.Margin = '2,6,2,6'
    [void]$listeProjekte.Children.Add($t)
}

# Laeuft der Motor, darf die Oberflaeche nicht einfrieren. Die Arbeit geht in
# einen eigenen Runspace, das Fenster bleibt bedienbar.
function Starte-Hintergrund {
    param([scriptblock]$Arbeit, [object[]]$Argumente, [scriptblock]$Fertig)

    $script:Laeuft = $true
    $btnPruefen.IsEnabled = $false
    $btnUebernehmen.IsEnabled = $false

    $rs = [runspacefactory]::CreateRunspace()
    $rs.ApartmentState = 'STA'
    $rs.ThreadOptions = 'ReuseThread'
    $rs.Open()
    $ps = [powershell]::Create()
    $ps.Runspace = $rs
    [void]$ps.AddScript($Arbeit)
    foreach ($a in $Argumente) { [void]$ps.AddArgument($a) }

    $handle = $ps.BeginInvoke()

    $timer = New-Object Windows.Threading.DispatcherTimer
    $timer.Interval = [TimeSpan]::FromMilliseconds(180)
    $timer.Add_Tick({
        if (-not $handle.IsCompleted) { return }
        $timer.Stop()
        try {
            $ergebnis = $ps.EndInvoke($handle)
            $fehlerStrom = @($ps.Streams.Error)
        } catch {
            $ergebnis = $null
            $fehlerStrom = @($_)
        } finally {
            $ps.Dispose(); $rs.Close(); $rs.Dispose()
        }
        $script:Laeuft = $false
        $btnPruefen.IsEnabled = $true
        foreach ($f in $fehlerStrom) { Schreibe ("FEHLER: " + $f.ToString()) }
        & $Fertig $ergebnis
    }.GetNewClosure())
    $timer.Start()
}

# ------------------------------------------------------------------ Pruefen

$btnPruefen.Add_Click({
    if ($script:Laeuft) { return }
    Leere-Liste
    $txtLog.Clear()
    $txtStatus.Text = 'sehe nach ...'
    Schreibe 'Vergleiche jeden Quellordner mit der Kopie im Katalog.'
    Schreibe 'Das dauert einen Moment — die Zugangsdaten-Pruefung liest jede Textdatei.'
    Schreibe ''

    $arbeit = {
        param($motor, $repo, $privat)
        $r = & $motor -Repo $repo -PrivatRepo $privat 6>&1
        return $r
    }

    Starte-Hintergrund -Arbeit $arbeit -Argumente @($Motor, $Repo, $PrivatRepo) -Fertig {
        param($ergebnis)
        $daten = $ergebnis | Where-Object { $_ -is [psobject] -and $_.PSObject.Properties.Name -contains 'Aenderungen' } | Select-Object -Last 1
        if (-not $daten) {
            $txtStatus.Text = 'fehlgeschlagen'
            Schreibe 'Kein Ergebnis erhalten. Siehe Fehler oben.'
            Zeige-Hinweis 'Der Durchlauf hat kein Ergebnis geliefert.' '#E06C6C'
            return
        }

        $script:Gefunden = @($daten.Aenderungen)
        $anzahl = $script:Gefunden.Count

        foreach ($z in $daten.Protokoll) {
            if ($z.art -eq 'titel' -or $z.art -eq 'warn' -or $z.art -eq 'fehler') { Schreibe $z.text }
        }

        if ($anzahl -eq 0) {
            $txtStatus.Text = 'alles aktuell'
            Zeige-Hinweis 'Nichts hat sich geaendert — der Katalog ist auf dem neuesten Stand.' '#55CF88'
        } else {
            $txtStatus.Text = "$anzahl Projekt(e) geaendert"
            $btnUebernehmen.IsEnabled = $true
            foreach ($a in $script:Gefunden) {
                $v = $a.Vergleich
                $teile = @()
                if ($v.Neu.Count)       { $teile += ("" + $v.Neu.Count + " neu") }
                if ($v.Geaendert.Count) { $teile += ("" + $v.Geaendert.Count + " geaendert") }

                $cb = New-Object Windows.Controls.CheckBox
                $cb.IsChecked = $true
                $cb.Margin = '0,7,0,0'
                $cb.Tag = $a.Projekt.id

                $sp = New-Object Windows.Controls.StackPanel
                $t1 = New-Object Windows.Controls.TextBlock
                $t1.Text = $a.Projekt.titel
                $t1.FontWeight = 'SemiBold'
                $t1.FontSize = 13.5
                [void]$sp.Children.Add($t1)
                $t2 = New-Object Windows.Controls.TextBlock
                $t2.Text = ($teile -join ', ') + $(if ($a.Projekt.bereich -eq 'privat') { '   [privat]' } else { '' })
                $t2.Foreground = '#98A1B5'
                $t2.FontSize = 11.5
                [void]$sp.Children.Add($t2)
                $t3 = New-Object Windows.Controls.TextBlock
                $t3.Text = $a.Quelle
                $t3.Foreground = '#5D6779'
                $t3.FontSize = 10.5
                $t3.TextTrimming = 'CharacterEllipsis'
                [void]$sp.Children.Add($t3)

                $cb.Content = $sp
                [void]$listeProjekte.Children.Add($cb)
                $script:Haken[$a.Projekt.id] = $cb
            }
        }

        if ($daten.OhneQuelle.Count) {
            Zeige-Hinweis ("" + $daten.OhneQuelle.Count + " Projekte haben auf diesem Rechner keine Quelle (Laptop-Projekte). Sie werden uebersprungen.") '#6B7488'
        }
        if ($daten.Fehlend.Count) {
            Zeige-Hinweis ("" + $daten.Fehlend.Count + " Quellordner sind eingetragen, aber nicht mehr da — siehe Protokoll.") '#E0A13A'
        }
    }
})

# -------------------------------------------------------------- Uebernehmen

$btnUebernehmen.Add_Click({
    if ($script:Laeuft) { return }
    $gewaehlt = @()
    foreach ($id in $script:Haken.Keys) { if ($script:Haken[$id].IsChecked) { $gewaehlt += $id } }
    if (-not $gewaehlt.Count) {
        [Windows.MessageBox]::Show('Kein Projekt angehakt.', 'AGP', 'OK', 'Information') | Out-Null
        return
    }

    $hochladen = [bool]$chkHochladen.IsChecked
    $frage = "Sollen " + $gewaehlt.Count + " Projekt(e) uebernommen werden?"
    if ($hochladen) { $frage += "`n`nAnschliessend wird zu GitHub hochgeladen." }
    else            { $frage += "`n`nEs wird NICHT hochgeladen." }
    $antwort = [Windows.MessageBox]::Show($frage, 'AGP aktualisieren', 'YesNo', 'Question')
    if ($antwort -ne 'Yes') { return }

    $txtStatus.Text = 'uebernehme ...'
    Schreibe ''
    Schreibe '--- Uebernehmen ---'

    $arbeit = {
        param($motor, $repo, $privat, $ids, $hochladen, $passwort)
        $args = @{ Repo = $repo; PrivatRepo = $privat; NurProjekt = ($ids -join ','); Uebernehmen = $true }
        if ($hochladen) { $args['Hochladen'] = $true }
        if ($passwort)  { $args['Passwort'] = $passwort }
        return (& $motor @args 6>&1)
    }

    Starte-Hintergrund -Arbeit $arbeit -Argumente @($Motor, $Repo, $PrivatRepo, $gewaehlt, $hochladen, $pwdPrivat.Password) -Fertig {
        param($ergebnis)
        $daten = $ergebnis | Where-Object { $_ -is [psobject] -and $_.PSObject.Properties.Name -contains 'Uebernommen' } | Select-Object -Last 1
        if ($daten) {
            foreach ($z in $daten.Protokoll) {
                if ($z.art -ne 'info' -or $z.text -match '^\s{2}\S') { Schreibe $z.text }
            }
        }
        $txtStatus.Text = 'fertig'
        Leere-Liste
        Zeige-Hinweis 'Fertig. Zum Nachsehen noch einmal auf "Nachsehen" klicken.' '#55CF88'
        $btnUebernehmen.IsEnabled = $false
    }
})

$btnExtern.Add_Click({
    $skript = Join-Path $PSScriptRoot 'Externe-Quellen.ps1'
    Start-Process powershell.exe -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-STA','-File',"`"$skript`"",'-Repo',"`"$Repo`""
})

[void]$fenster.ShowDialog()
