@echo off
rem Compiles the smart home (console app + web server) into .\out. Requires JDK 17+.
cd /d "%~dp0"
if exist out rmdir /s /q out
dir /s /b smarthome\*.java > sources.txt
javac --release 17 -encoding UTF-8 -d out @sources.txt || exit /b 1
del sources.txt
xcopy /e /i /q /y smarthome\web\static out\smarthome\web\static > nul
echo Built into .\out
