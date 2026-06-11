@echo off
setlocal EnableDelayedExpansion

set "APP_NAME=jakarta-data-person"
set "CONTEXT_ROOT=jakarta-data-person"
set "JDBC_RESOURCE=jdbc/personDS"
set "DOMAIN_NAME=domain1"
set "ROOT_DIR=%~dp0.."
set "APP_DIR=%ROOT_DIR%\target\%APP_NAME%"
set "APP_URL=http://localhost:8080/%CONTEXT_ROOT%/"

where asadmin >nul 2>nul
if errorlevel 1 (
    echo asadmin was not found on PATH.
    echo Add the Payara bin directory to PATH, then run this script again.
    exit /b 1
)

where mvn >nul 2>nul
if errorlevel 1 (
    echo mvn was not found on PATH.
    echo Install Maven or add it to PATH, then run this script again.
    exit /b 1
)

call asadmin list-applications >nul 2>nul
if errorlevel 1 (
    echo Payara is not running or the admin endpoint is not available.
    echo Start Payara first by running: %~dp0payara.bat
    exit /b 1
)

call asadmin list-jdbc-resources | findstr /I /X /C:"%JDBC_RESOURCE%" >nul
if errorlevel 1 (
    echo JDBC resource %JDBC_RESOURCE% was not found.
    echo Run %~dp0jdbc.bat first to install the MySQL driver and create the datasource.
    exit /b 1
)

call asadmin list-applications | findstr /I /B /C:"%APP_NAME% " >nul
if not errorlevel 1 (
    echo Undeploying %APP_NAME% so Maven clean can remove locked files...
    call asadmin undeploy "%APP_NAME%"
    if errorlevel 1 exit /b 1
)

call :build_app
set "BUILD_EXIT=%ERRORLEVEL%"
if not "%BUILD_EXIT%"=="0" (
    echo Maven build failed. Retrying once after restarting Payara to release locked target files...
    call asadmin stop-domain "%DOMAIN_NAME%"
    if errorlevel 1 exit /b %BUILD_EXIT%

    call :build_app
    set "BUILD_EXIT=%ERRORLEVEL%"

    echo Starting Payara...
    call asadmin start-domain "%DOMAIN_NAME%"
    if errorlevel 1 exit /b 1

    if not "!BUILD_EXIT!"=="0" exit /b !BUILD_EXIT!
)

if not exist "%APP_DIR%\" (
    echo Exploded app directory not found: %APP_DIR%
    exit /b 1
)

echo Deploying exploded directory %APP_DIR%...
call asadmin deploy --force=true --type war --name "%APP_NAME%" --contextroot "%CONTEXT_ROOT%" "%APP_DIR%"
if errorlevel 1 exit /b 1

echo Application URL: %APP_URL%
start "" "%APP_URL%"
exit /b 0

:build_app
echo Building exploded app directory...
pushd "%ROOT_DIR%"
call mvn clean package
set "BUILD_EXIT=%ERRORLEVEL%"
popd
exit /b %BUILD_EXIT%
