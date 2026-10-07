#!/usr/bin/env sh
# Starts the web UI on http://localhost:8080 (pass another port as the first argument).
set -e
cd "$(dirname "$0")"
[ -d out ] || ./build.sh
exec java -cp out smarthome.web.SmartHomeServer "$@"
