<#
    AKTENZEICHEN - Erstes Deployment nach GitHub Pages
    Aufruf:  .\deploy.ps1 -RepoUrl "https://github.com/BastiLd/MurderMystery.git"
#>
param(
    [string]$RepoUrl = "https://github.com/BastiLd/MurderMystery.git",
    [string]$Message = "Aktenzeichen Ungeloest",
    [string]$Branch  = "main"
)

$ErrorActionPreference = "Continue"
Set-Location -Path $PSScriptRoot

Write-Host ""
Write-Host "  AKTENZEICHEN - Deployment" -ForegroundColor Red
Write-Host "  ----------------------------------------" -ForegroundColor DarkGray

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "  Git fehlt. Download: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

foreach ($l in @(".git\index.lock", ".git\HEAD.lock")) {
    if (Test-Path $l) { Remove-Item $l -Force -ErrorAction SilentlyContinue }
}

if (-not (Test-Path ".git")) {
    Write-Host "  Repository wird angelegt ..." -ForegroundColor Gray
    git init | Out-Null
    git branch -M $Branch
}

$remotes = git remote
if ($remotes -notcontains "origin") { git remote add origin $RepoUrl }
else { git remote set-url origin $RepoUrl }

git add -A
$staged = git diff --cached --name-only
if (-not [string]::IsNullOrWhiteSpace($staged)) { git commit -m $Message | Out-Null }
git push -u origin $Branch

$slug = $RepoUrl -replace '.*github\.com[:/]', '' -replace '\.git$', ''
$user = $slug.Split('/')[0]
$repo = $slug.Split('/')[1]

Write-Host ""
Write-Host "  Fertig." -ForegroundColor Green
Write-Host "  Einmalig auf GitHub: Settings -> Pages -> Deploy from a branch -> $Branch / (root)" -ForegroundColor Gray
Write-Host ("    https://{0}.github.io/{1}/" -f $user, $repo) -ForegroundColor Cyan
Write-Host ""
