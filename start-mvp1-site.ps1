$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontend = Join-Path $root "frontend\prototype"
$wingetPackages = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages"

$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
    $nodeExe = $node.Source
} else {
    $nodeExe = Get-ChildItem -Path $wingetPackages -Recurse -Filter node.exe -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -like "*OpenJS.NodeJS.LTS*" } |
        Select-Object -First 1 -ExpandProperty FullName
}

if (-not $nodeExe) {
    throw "Node.js was not found. Install Node.js LTS or restart PowerShell after winget installation."
}

$nodeDir = Split-Path -Parent $nodeExe
$npmCli = Join-Path $nodeDir "node_modules\npm\bin\npm-cli.js"
if (-not (Test-Path $npmCli)) {
    throw "npm CLI was not found near Node.js: $npmCli"
}

$env:Path = "$nodeDir;$env:Path"
$env:VITE_FACEGUARD_API_URL = if ($env:VITE_FACEGUARD_API_URL) { $env:VITE_FACEGUARD_API_URL } else { "http://10.93.26.183:8000" }
$env:FACEGUARD_AGENT_URL = if ($env:FACEGUARD_AGENT_URL) { $env:FACEGUARD_AGENT_URL } else { "http://127.0.0.1:8081" }
$env:FACEGUARD_AGENT_KEY = if ($env:FACEGUARD_AGENT_KEY) { $env:FACEGUARD_AGENT_KEY } else { "change-me-agent-key" }

Set-Location $frontend
& $nodeExe $npmCli run dev
