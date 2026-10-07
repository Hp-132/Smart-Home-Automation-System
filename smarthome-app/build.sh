#!/usr/bin/env sh
# Compiles the smart home (console app + web server) into ./out. Requires JDK 17+.
set -e
cd "$(dirname "$0")"
rm -rf out
javac --release 17 -encoding UTF-8 -d out $(find smarthome -name '*.java')
mkdir -p out/smarthome/web
cp -R smarthome/web/static out/smarthome/web/static
echo "Built into ./out"
