param(
  [switch] $Once
)

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

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DelayText = Get-EnvOrDefault "CODEX_RTL_DELAY_MS" "2500"
$DelayMs = 0

if (-not [int]::TryParse($DelayText, [ref] $DelayMs)) {
  throw "CODEX_RTL_DELAY_MS must be an integer."
}

$Node = Get-EnvOrDefault "CODEX_RTL_NODE" "node"

& "$RootDir\launch.ps1"
Start-Sleep -Milliseconds $DelayMs

if ($Once) {
  & $Node "$RootDir\inject.mjs" --once
} else {
  & $Node "$RootDir\inject.mjs" --watch
}
