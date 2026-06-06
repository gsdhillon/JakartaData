@echo off
setlocal

set "APP_NAME=jakarta-data-person"
set "SOURCE_DIR=%~dp0src\main\web"
set "TARGET_DIR=%~dp0target\%APP_NAME%"
set "APP_URL=http://localhost:8080/%APP_NAME%/"

if not exist "%TARGET_DIR%" (
    echo Target directory not found: %TARGET_DIR%
    echo Run deploy first.
    exit /b 1
)

echo Syncing frontend files...
robocopy "%SOURCE_DIR%" "%TARGET_DIR%" /E
if %ERRORLEVEL% GEQ 8 exit /b %ERRORLEVEL%

echo Frontend synced. Refresh browser:
echo %APP_URL%
exit /b 0
