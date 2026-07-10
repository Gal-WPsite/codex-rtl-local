#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Open Codex RTL in ChatGPT
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 🧭
# @raycast.packageName Developer

# @raycast.description Open Codex in ChatGPT with local RTL support
# @raycast.author Gal

APP="$HOME/Projects/codex-rtl-local/Codex RTL.app"

if [ ! -d "$APP" ]; then
  echo "Codex RTL app was not found: $APP"
  exit 1
fi

open "$APP"

echo "Opening Codex RTL in ChatGPT"
