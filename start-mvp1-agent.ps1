$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$agent = Join-Path $root "agent"
$python = Join-Path $agent ".venv\Scripts\python.exe"

if (-not (Test-Path $python)) {
    throw "Python virtual environment not found: $python. Run dependency setup first."
}

if (-not (Test-Path (Join-Path $agent ".env"))) {
    Copy-Item (Join-Path $agent ".env.example") (Join-Path $agent ".env")
}

Set-Location $root
& $python -m agent.local_api
