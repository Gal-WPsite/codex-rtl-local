param()

$ErrorActionPreference = "Stop"

function Get-EnvOrDefault {
  param(
    [string] $Name,
    [string] $Default
  )

  $Value = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $Default
  }

  return $Value
}

function Test-LocalEndpoint {
  param([int] $Port)

  try {
    Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$Port/json" -TimeoutSec 1 | Out-Null
    return $true
  } catch {
    return $false
  }
}

$PortText = Get-EnvOrDefault "CODEX_RTL_PORT" "9223"
$Port = 0
if (-not [int]::TryParse($PortText, [ref] $Port)) {
  throw "CODEX_RTL_PORT must be an integer."
}

if ($Port -lt 1024 -or $Port -gt 65535) {
  throw "CODEX_RTL_PORT must be between 1024 and 65535."
}

if (Test-LocalEndpoint $Port) {
  Write-Host "Codex DevTools endpoint is already available on 127.0.0.1:$Port."
  return
}

$ConfiguredAppPath = [Environment]::GetEnvironmentVariable("CODEX_APP_PATH")
$Candidates = @()
if (-not [string]::IsNullOrWhiteSpace($ConfiguredAppPath)) {
  $Candidates += $ConfiguredAppPath
}

$Candidates += @(
  "$env:LOCALAPPDATA\Programs\Codex\Codex.exe",
  "$env:LOCALAPPDATA\Codex\Codex.exe",
  "$env:ProgramFiles\Codex\Codex.exe",
  "${env:ProgramFiles(x86)}\Codex\Codex.exe"
)

$AppPath = $Candidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

if (-not $AppPath) {
  throw "Codex.exe was not found. Set CODEX_APP_PATH to the full path of Codex.exe and try again."
}

$ExistingCodex = Get-Process -Name "Codex" -ErrorAction SilentlyContinue
if ($ExistingCodex) {
  throw "Codex is already running without the RTL launcher. Close Codex first, then run this launcher again."
}

Write-Host "Starting Codex with local DevTools port $Port..."
Start-Process -FilePath $AppPath -ArgumentList @(
  "--remote-debugging-address=127.0.0.1",
  "--remote-debugging-port=$Port"
)
Write-Host "Codex started."
