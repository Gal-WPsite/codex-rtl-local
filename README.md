# Codex RTL Local

Local RTL helper for Codex Desktop.

This is an unofficial tool. Use it at your own risk.

## Status

- macOS: tested by the author.
- Windows: experimental PowerShell launcher. Not yet tested by the author on a Windows machine.

## What it does

Codex RTL Local opens Codex Desktop (now distributed as ChatGPT on recent
macOS releases) with a local Chromium DevTools port, then injects CSS and
JavaScript into the renderer at runtime.

It does not modify the Codex app files.

The goal is simple:

- Hebrew and Arabic text read RTL.
- Prompts written in Hebrew align naturally.
- Code blocks, terminal output, paths and commands stay LTR.

## Install

Clone the repo:

```bash
git clone https://github.com/Gal-WPsite/codex-rtl-local.git
cd codex-rtl-local
```

## macOS

Close Codex, then run:

```bash
sh ./run.sh
```

For one-shot injection:

```bash
sh ./run.sh --once
```

By default, the injector stays alive and re-applies the RTL layer after renderer
reloads. Stop it with `Ctrl+C`.

## Windows (experimental)

Close Codex, then run from PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\run.ps1
```

For one-shot injection:

```powershell
powershell -ExecutionPolicy Bypass -File .\run.ps1 -Once
```

By default, the injector stays alive and re-applies the RTL layer after renderer
reloads. Stop it with `Ctrl+C`.

The launcher looks for Codex in common install locations. If it cannot find it,
set `CODEX_APP_PATH` to the full path of `Codex.exe`:

```powershell
$env:CODEX_APP_PATH = "C:\Path\To\Codex.exe"
powershell -ExecutionPolicy Bypass -File .\run.ps1
```

## Use with Codex

If you prefer to let Codex install it, give Codex this prompt:

```text
Install this local Codex RTL helper:
https://github.com/Gal-WPsite/codex-rtl-local

Clone it to a convenient local folder.
Read the README before running anything.
Do not modify the Codex app files.

If I am on macOS, explain how to run sh ./run.sh.
If I am on Windows, explain how to run powershell -ExecutionPolicy Bypass -File .\run.ps1.
```

## Optional macOS app launcher

This repo includes a tiny local macOS app bundle:

```text
Codex RTL.app
```

You can open it from Finder or with:

```bash
sh ./open-codex-rtl.sh
```

It runs the same local launcher and writes logs to your temporary directory.

## Configuration

Optional environment variables:

```bash
# Optional: defaults to /Applications/ChatGPT.app, then /Applications/Codex.app
CODEX_APP_PATH=/Applications/ChatGPT.app
CODEX_RTL_PORT=9223
CODEX_RTL_DELAY_MS=2500
CODEX_RTL_POLL_MS=2000
CODEX_RTL_NODE=/opt/homebrew/bin/node
```

Windows PowerShell example:

```powershell
$env:CODEX_APP_PATH = "C:\Path\To\Codex.exe"
$env:CODEX_RTL_PORT = "9223"
$env:CODEX_RTL_NODE = "node"
```

## Safety model

- No `codesign`
- No `app.asar` patching
- No npm install
- No external network calls
- DevTools is bound to `127.0.0.1`
- Non-local WebSocket debugger URLs are rejected
- The app files are not modified

The main tradeoff is that while Codex is open through this launcher, a local
process on your machine could theoretically connect to the DevTools port.
Close Codex or restart it normally when you no longer need RTL injection.

## Requirements

- Codex Desktop
- Node.js 22+
- macOS or Windows

## Files

```text
run.sh
launch.sh
run.ps1
launch.ps1
inject.mjs
open-codex-rtl.sh
Codex RTL.app/
raycast/open-codex-rtl.sh
src/rtl-runtime.js
src/rtl-style.css
```
