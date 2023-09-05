#!/usr/bin/env bash

set -e

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
cd ${SCRIPT_DIR}

echo "`pwd` : rm -rf out .webpack "
rm -rf out .webpack 

yarn make_win_x64