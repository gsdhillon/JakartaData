@echo off
setlocal

set "APP_NAME=jakarta-data-person"
set "CONTEXT_ROOT=jakarta-data-person"
set "DOMAIN=domain1"
set "POOL_NAME=personPool"
set "JDBC_RESOURCE=jdbc/personDS"
set "APP_DIR=%~dp0target\%APP_NAME%"
set "MYSQL_DRIVER=%APP_DIR%\WEB-INF\lib\mysql-connector-j-9.7.0.jar"
set "APP_URL=http://localhost:8080/%CONTEXT_ROOT%/"

where asadmin >nul 2>nul
if errorlevel 1 (
    echo asadmin was not found on PATH.
    exit /b 1
)

echo Building exploded app directory...
call mvn clean package
if errorlevel 1 exit /b %ERRORLEVEL%

call "%~dp0payara.bat"
if errorlevel 1 exit /b %ERRORLEVEL%

if not exist "%APP_DIR%" (
    echo Exploded app directory not found: %APP_DIR%
    exit /b 1
)

if not exist "%MYSQL_DRIVER%" (
    echo MySQL driver not found: %MYSQL_DRIVER%
    exit /b 1
)

call asadmin list-libraries --type common | findstr /I "mysql-connector-j" >nul 2>nul
if errorlevel 1 (
    echo Installing MySQL driver into Payara common libraries...
    call asadmin add-library --type common "%MYSQL_DRIVER%"
    if errorlevel 1 exit /b %ERRORLEVEL%

    echo Restarting Payara so the MySQL driver is loaded...
    call asadmin restart-domain "%DOMAIN%"
    if errorlevel 1 exit /b %ERRORLEVEL%
) else (
    echo MySQL driver is already installed in Payara common libraries.
)

echo Recreating JDBC resource %JDBC_RESOURCE%...
call asadmin delete-jdbc-resource "%JDBC_RESOURCE%" >nul 2>nul
call asadmin delete-jdbc-connection-pool "%POOL_NAME%" >nul 2>nul

call asadmin create-jdbc-connection-pool ^
    --restype javax.sql.XADataSource ^
    --datasourceclassname com.mysql.cj.jdbc.MysqlXADataSource ^
    --property serverName=localhost:portNumber=3306:databaseName=person:user=ishjyot:password=fw0r:useSSL=false:allowPublicKeyRetrieval=true ^
    "%POOL_NAME%"
if errorlevel 1 exit /b %ERRORLEVEL%

call asadmin create-jdbc-resource ^
    --connectionpoolid "%POOL_NAME%" ^
    "%JDBC_RESOURCE%"
if errorlevel 1 exit /b %ERRORLEVEL%

echo Deploying exploded directory %APP_DIR%...
call asadmin deploy --force=true --name "%APP_NAME%" --contextroot "%CONTEXT_ROOT%" "%APP_DIR%"
if errorlevel 1 exit /b %ERRORLEVEL%

echo Opening %APP_URL%
start "" "%APP_URL%"
exit /b 0
