@echo off
rem Starts the web UI on http://localhost:8080 (pass another port as the first argument).
cd /d "%~dp0"
if not exist out call build.bat || exit /b 1
java -cp out smarthome.web.SmartHomeServer %*
