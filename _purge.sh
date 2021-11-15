#!/usr/bin/env bash

set -e

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
cd "${SCRIPT_DIR}"

echo "`pwd`: rm -rf node_modules out build logs settings-dev .webpack"
rm -rf node_modules out build logs settings-dev .webpack
