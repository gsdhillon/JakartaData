@echo off
setlocal

set "DOMAIN=domain1"

where asadmin >nul 2>nul
if errorlevel 1 (
    echo asadmin was not found on PATH.
    exit /b 1
)

call asadmin list-applications >nul 2>nul
if not errorlevel 1 (
    echo Payara admin is already available.
    exit /b 0
)

echo Starting Payara domain %DOMAIN%...
call asadmin start-domain "%DOMAIN%"
exit /b %ERRORLEVEL%
