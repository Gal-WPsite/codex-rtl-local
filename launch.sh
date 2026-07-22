#!/bin/sh

set -eu

PORT="${CODEX_RTL_PORT:-9223}"
APP_PATH="${CODEX_APP_PATH:-}"
EXECUTABLE=""

case "$PORT" in
  ''|*[!0-9]*)
    echo "CODEX_RTL_PORT must be an integer." >&2
    exit 1
    ;;
esac

if [ "$PORT" -lt 1024 ] || [ "$PORT" -gt 65535 ]; then
  echo "CODEX_RTL_PORT must be between 1024 and 65535." >&2
  exit 1
fi

find_executable() {
  candidate="$1"

  if [ -x "$candidate/Contents/MacOS/ChatGPT" ]; then
    APP_PATH="$candidate"
    EXECUTABLE="$candidate/Contents/MacOS/ChatGPT"
    return 0
  fi

  if [ -x "$candidate/Contents/MacOS/Codex" ]; then
    APP_PATH="$candidate"
    EXECUTABLE="$candidate/Contents/MacOS/Codex"
    return 0
  fi

  return 1
}

app_is_running() {
  /bin/ps -axo ucomm= | /usr/bin/awk '
    {
      name = $0
      sub(/^[[:space:]]+/, "", name)
      sub(/[[:space:]]+$/, "", name)

      if (name == "ChatGPT" || name == "Codex") {
        found = 1
        exit
      }
    }
    END { exit(found ? 0 : 1) }
  '
}

if [ -n "$APP_PATH" ]; then
  if ! find_executable "$APP_PATH"; then
    echo "Could not find a ChatGPT or Codex executable in: $APP_PATH" >&2
    exit 1
  fi
else
  for candidate in /Applications/ChatGPT.app /Applications/Codex.app; do
    if find_executable "$candidate"; then
      break
    fi
  done
fi

if [ -z "$EXECUTABLE" ]; then
  echo "ChatGPT.app or Codex.app was not found in /Applications." >&2
  echo "Set CODEX_APP_PATH to the application bundle and try again." >&2
  exit 1
fi

if app_is_running; then
  echo "Codex or ChatGPT is already running." >&2
  echo "Recent Codex versions run inside ChatGPT.app. Quit the open Codex/ChatGPT window, then run this launcher again." >&2
  exit 1
fi

echo "Starting Codex with local DevTools port $PORT..."
open -na "$APP_PATH" --args \
  --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port="$PORT"

echo "Codex started."
