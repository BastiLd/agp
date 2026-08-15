<#
.SYNOPSIS
    Kleines Fenster fuer Projektquellen, die nicht immer angeschlossen sind
    (z.B. ein USB-Stick). Zeigt je Projekt einen fertigen cd-Befehl und einen
    Knopf, der nur den Pfad in die Zwischenablage kopiert.

.DESCRIPTION
    Liest data/quellen.json und zeigt jeden Eintrag mit "externQuelle". Diese
    Pfade stehen bewusst NICHT unter pfade.<RECHNERNAME> — Update-AGP.ps1
    wuerde sonst bei jedem Lauf melden, dass die Quelle fehlt, nur weil der
    Stick gerade nicht steckt. Hier sind sie stattdessen griffbereit, wenn er
    doch mal dran ist.

    Gestartet ueber den Knopf "USB-Quellen" in AGP-Aktualisieren.ps1, oder
    direkt: .\tools\Externe-Quellen.ps1
#>
[CmdletBinding()]
param([string]$Repo = '')

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName PresentationCore

if (-not $Repo) { $Repo = Split-Path -Parent $PSScriptRoot }
$quellenDatei = Join-Path $Repo 'data\quellen.json'
$quellen = (Get-Content -Raw -LiteralPath $quellenDatei -Encoding UTF8 | ConvertFrom-Json)

$oeff = (Get-Content -Raw -LiteralPath (Join-Path $Repo 'data\projects.json') -Encoding UTF8 | ConvertFrom-Json)
$titelVon = @{}
foreach ($p in $oeff.projekte) { $titelVon[$p.id] = $p.titel }
$privDatei = Join-Path $Repo 'data\private.json'
if (Test-Path -LiteralPath $privDatei) {
    foreach ($p in (Get-Content -Raw -LiteralPath $privDatei -Encoding UTF8 | ConvertFrom-Json).projekte) { $titelVon[$p.id] = $p.titel }
}

$eintraege = @()
foreach ($eintrag in $quellen.quellen.PSObject.Properties) {
    if (-not $eintrag.Value.externQuelle) { continue }
    $eintraege += [pscustomobject]@{
        Id     = $eintrag.Name
        Titel  = $(if ($titelVon.ContainsKey($eintrag.Name)) { $titelVon[$eintrag.Name] } else { $eintrag.Name })
        Pfad   = $eintrag.Value.externQuelle.pfad
        Hinweis = $eintrag.Value.externQuelle.hinweis
        CdBefehl = 'cd /d "' + $eintrag.Value.externQuelle.pfad + '"'
        Angeschlossen = Test-Path -LiteralPath $eintrag.Value.externQuelle.pfad
    }
}

$xaml = @'
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Externe Quellen" Height="420" Width="760"
        WindowStartupLocation="CenterScreen" Background="#0F1117">
  <Window.Resources>
    <Style TargetType="Button">
      <Setter Property="Background" Value="#2F7FD4"/>
      <Setter Property="Foreground" Value="White"/>
      <Setter Property="BorderThickness" Value="0"/>
      <Setter Property="Padding" Value="12,7"/>
      <Setter Property="FontSize" Value="12.5"/>
      <Setter Property="Cursor" Value="Hand"/>
      <Setter Property="Template">
        <Setter.Value>
          <ControlTemplate TargetType="Button">
            <Border Background="{TemplateBinding Background}" CornerRadius="6" Padding="{TemplateBinding Padding}">
              <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
            </Border>
          </ControlTemplate>
        </Setter.Value>
      </Setter>
    </Style>
    <Style TargetType="TextBlock">
      <Setter Property="Foreground" Value="#E9ECF3"/>
      <Setter Property="FontFamily" Value="Segoe UI"/>
    </Style>
  </Window.Resources>
  <Grid Margin="18">
    <Grid.RowDefinitions>
      <RowDefinition Height="Auto"/>
      <RowDefinition Height="*"/>
    </Grid.RowDefinitions>
    <StackPanel Grid.Row="0" Margin="0,0,0,12">
      <TextBlock Text="Externe Quellen" FontSize="19" FontWeight="Bold"/>
      <TextBlock Text="Projekte, deren Quelle nicht immer angeschlossen ist (z.B. USB-Stick)."
                 Foreground="#98A1B5" FontSize="12" Margin="0,4,0,0"/>
    </StackPanel>
    <ScrollViewer Grid.Row="1" VerticalScrollBarVisibility="Auto">
      <StackPanel x:Name="liste"/>
    </ScrollViewer>
  </Grid>
</Window>
'@

$fenster = [Windows.Markup.XamlReader]::Load((New-Object System.Xml.XmlNodeReader ([xml]$xaml)))
$liste = $fenster.FindName('liste')

if (-not $eintraege.Count) {
    $t = New-Object Windows.Controls.TextBlock
    $t.Text = 'Keine externen Quellen eingetragen.'
    $t.Foreground = '#6B7488'
    [void]$liste.Children.Add($t)
}

foreach ($e in $eintraege) {
    $box = New-Object Windows.Controls.Border
    $box.Background = '#171A23'
    $box.CornerRadius = 10
    $box.Padding = '14'
    $box.Margin = '0,0,0,10'

    $innen = New-Object Windows.Controls.Grid
    $c1 = New-Object Windows.Controls.ColumnDefinition; $c1.Width = New-Object Windows.GridLength(1, 'Star')
    $c2 = New-Object Windows.Controls.ColumnDefinition; $c2.Width = 'Auto'
    [void]$innen.ColumnDefinitions.Add($c1)
    [void]$innen.ColumnDefinitions.Add($c2)

    $sp = New-Object Windows.Controls.StackPanel
    [Windows.Controls.Grid]::SetColumn($sp, 0)

    $titelZeile = New-Object Windows.Controls.StackPanel
    $titelZeile.Orientation = 'Horizontal'
    $t1 = New-Object Windows.Controls.TextBlock
    $t1.Text = $e.Titel
    $t1.FontWeight = 'SemiBold'
    $t1.FontSize = 14
    [void]$titelZeile.Children.Add($t1)
    $status = New-Object Windows.Controls.TextBlock
    $status.Text = $(if ($e.Angeschlossen) { '  •  angeschlossen' } else { '  •  gerade nicht angeschlossen' })
    $status.Foreground = $(if ($e.Angeschlossen) { '#55CF88' } else { '#6B7488' })
    $status.FontSize = 12
    $status.VerticalAlignment = 'Bottom'
    [void]$titelZeile.Children.Add($status)
    [void]$sp.Children.Add($titelZeile)

    $cd = New-Object Windows.Controls.TextBox
    $cd.Text = $e.CdBefehl
    $cd.IsReadOnly = $true
    $cd.Background = '#0B0D12'
    $cd.Foreground = '#B9C2D4'
    $cd.BorderBrush = '#2A3042'
    $cd.FontFamily = 'Consolas'
    $cd.FontSize = 12
    $cd.Margin = '0,7,0,0'
    $cd.Padding = '6'
    [void]$sp.Children.Add($cd)

    if ($e.Hinweis) {
        $h = New-Object Windows.Controls.TextBlock
        $h.Text = $e.Hinweis
        $h.Foreground = '#6B7488'
        $h.FontSize = 11.5
        $h.TextWrapping = 'Wrap'
        $h.Margin = '0,6,0,0'
        [void]$sp.Children.Add($h)
    }

    [void]$innen.Children.Add($sp)

    $btn = New-Object Windows.Controls.Button
    $btn.Content = 'Pfad kopieren'
    $btn.VerticalAlignment = 'Top'
    $btn.Margin = '10,0,0,0'
    [Windows.Controls.Grid]::SetColumn($btn, 1)
    $pfadFuerKlick = $e.Pfad
    $btnFuerKlick = $btn
    $btn.Add_Click({
        # Windows sperrt die Zwischenablage kurz, wenn z.B. ein Zwischenablage-Verlauf
        # oder eine Remote-Sitzung gerade zugreift (CLIPBRD_E_CANT_OPEN). Ohne
        # Wiederholung wuerde der Knopf dann wortlos nichts tun.
        $geklappt = $false
        for ($versuch = 1; $versuch -le 5 -and -not $geklappt; $versuch++) {
            try { [Windows.Clipboard]::SetText($pfadFuerKlick); $geklappt = $true }
            catch { Start-Sleep -Milliseconds 120 }
        }
        $alterText = $btnFuerKlick.Content
        $btnFuerKlick.Content = if ($geklappt) { 'Kopiert ✓' } else { 'Fehlgeschlagen' }
        $timer = New-Object Windows.Threading.DispatcherTimer
        $timer.Interval = [TimeSpan]::FromSeconds(1.4)
        $timer.Add_Tick({ $btnFuerKlick.Content = $alterText; $timer.Stop() }.GetNewClosure())
        $timer.Start()
    }.GetNewClosure())
    [void]$innen.Children.Add($btn)

    $box.Child = $innen
    [void]$liste.Children.Add($box)
}

[void]$fenster.ShowDialog()
