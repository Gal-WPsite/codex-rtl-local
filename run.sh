#!/bin/sh

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
DELAY_MS="${CODEX_RTL_DELAY_MS:-2500}"

case "$DELAY_MS" in
  ''|*[!0-9]*)
    echo "CODEX_RTL_DELAY_MS must be an integer." >&2
    exit 1
    ;;
esac

sh "$ROOT_DIR/launch.sh"

sleep_seconds=$(awk "BEGIN { printf \"%.3f\", $DELAY_MS / 1000 }")
sleep "$sleep_seconds"

if [ "${1:-}" = "--once" ]; then
  node "$ROOT_DIR/inject.mjs" --once
else
  node "$ROOT_DIR/inject.mjs" --watch
fi

