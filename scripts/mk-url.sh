#!/bin/bash
PROJECT_PATH=$(dirname "$(dirname "$(readlink -f "$0")")")
echo $PROJECT_PATH
/usr/bin/env node "$PROJECT_PATH/src/mk-url.js" "$@"
