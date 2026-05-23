#!/bin/bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname $SCRIPT_DIR)"
"$PROJECT_DIR/node_modules/.bin/electron" "$PROJECT_DIR" "$@"
