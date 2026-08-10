#requires -Version 5.1
<#
.SYNOPSIS
    Baut die Mod fuer alle unter versions/<mc>/ definierten Minecraft-Versionen.
.DESCRIPTION
    Das Multi-Project-Setup im Root build.gradle baut alle Subprojekte;
    ein einziges `./gradlew.bat build` reicht. Diese .ps1 ist nur ein duenner
    Wrapper, der die JARs am Ende kurz auflistet.
#>

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

& ".\gradlew.bat" build $args
if ($LASTEXITCODE -ne 0) { throw "Build fehlgeschlagen." }

Write-Host ""
Write-Host "Fertig. Gebaute JARs:" -ForegroundColor Green
Get-ChildItem build\libs -Filter '*.jar' | Format-Table Name, Length
