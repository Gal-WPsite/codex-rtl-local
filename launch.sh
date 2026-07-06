#!/bin/sh

set -eu

PORT="${CODEX_RTL_PORT:-9223}"
APP_PATH="${CODEX_APP_PATH:-/Applications/Codex.app}"
EXECUTABLE="$APP_PATH/Contents/MacOS/Codex"

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

if [ ! -d "$APP_PATH" ]; then
  echo "Codex.app was not found at: $APP_PATH" >&2
  exit 1
fi

if [ ! -x "$EXECUTABLE" ]; then
  echo "Could not find the Codex executable at: $EXECUTABLE" >&2
  exit 1
fi

if pgrep -x "Codex" >/dev/null 2>&1; then
  echo "Codex is already running." >&2
  echo "Close Codex first, then run this launcher again." >&2
  exit 1
fi

echo "Starting Codex with local DevTools port $PORT..."
open -na "$APP_PATH" --args \
  --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port="$PORT"

echo "Codex started."
