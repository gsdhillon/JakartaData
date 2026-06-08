@echo off
setlocal

set "APP_NAME=jakarta-data-person"
set "CONTEXT_ROOT=jakarta-data-person"
set "ROOT_DIR=%~dp0.."
set "SOURCE_DIR=%ROOT_DIR%\src\main\web"
set "TARGET_DIR=%ROOT_DIR%\target\%APP_NAME%"
set "APP_URL=http://localhost:8080/%CONTEXT_ROOT%/"

if not exist "%TARGET_DIR%" (
    echo Target directory not found: %TARGET_DIR%
    echo Run deploy first.
    exit /b 1
)

echo Syncing frontend files...
robocopy "%SOURCE_DIR%" "%TARGET_DIR%" /E
if %ERRORLEVEL% GEQ 8 exit /b %ERRORLEVEL%

echo Frontend synced to exploded target deployment. Hard refresh browser:
echo %APP_URL%
exit /b 0
