@echo off
setlocal

set "APP_NAME=jakarta-data-person"
set "CONTEXT_ROOT=jakarta-data-person"
set "SOURCE_DIR=%~dp0src\main\web"
set "TARGET_DIR=%~dp0target\%APP_NAME%"
set "APP_URL=http://localhost:8080/%CONTEXT_ROOT%/"

if not exist "%TARGET_DIR%" (
    echo Target directory not found: %TARGET_DIR%
    echo Run deploy first.
    exit /b 1
)

echo Syncing frontend files...
robocopy "%SOURCE_DIR%" "%TARGET_DIR%" /E
if %ERRORLEVEL% GEQ 8 exit /b %ERRORLEVEL%

where asadmin >nul 2>nul
if errorlevel 1 (
    echo Frontend synced to target, but asadmin was not found on PATH.
    echo Run deploy if Payara is serving an older deployed copy.
    echo Refresh browser:
    echo %APP_URL%
    exit /b 0
)

call asadmin list-applications >nul 2>nul
if errorlevel 1 (
    echo Frontend synced to target, but Payara is not running.
    echo Start Payara and run web again, or run deploy.
    echo Refresh browser if using another static server:
    echo %APP_URL%
    exit /b 0
)

echo Redeploying frontend-updated exploded app directory...
call asadmin deploy --force=true --name "%APP_NAME%" --contextroot "%CONTEXT_ROOT%" "%TARGET_DIR%"
if errorlevel 1 exit /b %ERRORLEVEL%

echo Frontend synced and redeployed. Hard refresh browser:
echo %APP_URL%
exit /b 0
