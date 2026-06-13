$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)
New-Item -ItemType Directory -Force -Path wheelhouse | Out-Null
py -3.11 -m pip download -r requirements.txt -d wheelhouse
Write-Host "Offline packages saved to wheelhouse\" -ForegroundColor Green
