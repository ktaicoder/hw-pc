#!/usr/bin/env bash

set -e

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
cd "${SCRIPT_DIR}"

echo "`pwd` : rm -rf out .webpack node_modules"
rm -rf out .webpack node_modules
