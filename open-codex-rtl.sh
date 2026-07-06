#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
APP_DIR="$SCRIPT_DIR/Codex RTL.app"

open "$APP_DIR"
