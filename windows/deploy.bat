@echo off
setlocal

set "APP_NAME=jakarta-data-person"
set "CONTEXT_ROOT=jakarta-data-person"
set "JDBC_RESOURCE=jdbc/personDS"
set "APP_DIR=%~dp0target\%APP_NAME%"
set "APP_URL=http://localhost:8080/%CONTEXT_ROOT%/"

where asadmin >nul 2>nul
if errorlevel 1 (
    echo asadmin was not found on PATH.
    exit /b 1
)

call asadmin list-applications >nul 2>nul
if errorlevel 1 (
    echo Payara is not running or the admin endpoint is not available.
    echo Start Payara first by running: payara
    exit /b 1
)

call asadmin list-jdbc-resources | findstr /I /X "%JDBC_RESOURCE%" >nul 2>nul
if errorlevel 1 (
    echo JDBC resource %JDBC_RESOURCE% was not found.
    echo Run jdbc first to install the MySQL driver and create the datasource.
    exit /b 1
)

call asadmin list-applications | findstr /I "%APP_NAME%" >nul 2>nul
if not errorlevel 1 (
    echo Undeploying %APP_NAME% so Maven clean can remove locked files...
    call asadmin undeploy "%APP_NAME%"
    if errorlevel 1 exit /b %ERRORLEVEL%
)

echo Building exploded app directory...
call mvn clean package
if errorlevel 1 exit /b %ERRORLEVEL%

if not exist "%APP_DIR%" (
    echo Exploded app directory not found: %APP_DIR%
    exit /b 1
)

echo Deploying exploded directory %APP_DIR%...
call asadmin deploy --force=true --name "%APP_NAME%" --contextroot "%CONTEXT_ROOT%" "%APP_DIR%"
if errorlevel 1 exit /b %ERRORLEVEL%

echo Opening %APP_URL%
start "" "%APP_URL%"
exit /b 0
