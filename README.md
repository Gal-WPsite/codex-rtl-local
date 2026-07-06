# Codex RTL Local

Local RTL helper for Codex Desktop on macOS.

This is an unofficial tool. Use it at your own risk.

## What it does

Codex RTL Local opens Codex Desktop with a local Chromium DevTools port, then
injects CSS and JavaScript into the renderer at runtime.

It does not modify `/Applications/Codex.app`.

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

Close Codex, then run:

```bash
sh ./run.sh
```

The injector stays alive and re-applies the patch after renderer reloads.
Stop it with `Ctrl+C`.

For one-shot injection:

```bash
sh ./run.sh --once
```

## Use with Codex

If you prefer to let Codex install it, give Codex this prompt:

```text
Install this local Codex RTL helper:
https://github.com/Gal-WPsite/codex-rtl-local

Clone it to a convenient local folder.
Read the README before running anything.
Do not modify /Applications/Codex.app.
After cloning, close Codex and run sh ./run.sh from the repo folder.
```

## Optional app launcher

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
CODEX_APP_PATH=/Applications/Codex.app
CODEX_RTL_PORT=9223
CODEX_RTL_DELAY_MS=2500
CODEX_RTL_POLL_MS=2000
CODEX_RTL_NODE=/opt/homebrew/bin/node
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

- macOS
- Codex Desktop installed at `/Applications/Codex.app`
- Node.js 22+

## Files

```text
run.sh
launch.sh
inject.mjs
open-codex-rtl.sh
Codex RTL.app/
raycast/open-codex-rtl.sh
src/rtl-runtime.js
src/rtl-style.css
```
