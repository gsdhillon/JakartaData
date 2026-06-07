@echo off
setlocal

set "DOMAIN=domain1"
set "POOL_NAME=personPool"
set "JDBC_RESOURCE=jdbc/personDS"
set "APP_NAME=jakarta-data-person"
set "APP_DIR=%~dp0target\%APP_NAME%"
set "MYSQL_DRIVER=%APP_DIR%\WEB-INF\lib\mysql-connector-j-9.7.0.jar"
set "MYSQL_LIBRARY_NAME=mysql-connector-j"

where asadmin >nul 2>nul
if errorlevel 1 (
    echo asadmin was not found on PATH.
    exit /b 1
)

call asadmin list-applications >nul 2>nul
if errorlevel 1 (
    echo Payara admin endpoint is not available. Start Payara first, then run this script again.
    exit /b 1
)

call asadmin list-libraries --type common | findstr /I "%MYSQL_LIBRARY_NAME%" >nul 2>nul
if errorlevel 1 (
    if not exist "%MYSQL_DRIVER%" (
        echo MySQL driver not found: %MYSQL_DRIVER%
        echo Run mvn package first so the driver exists under target\%APP_NAME%\WEB-INF\lib.
        exit /b 1
    )

    echo Installing MySQL driver into Payara common libraries...
    call asadmin add-library --type common "%MYSQL_DRIVER%"
    if errorlevel 1 exit /b %ERRORLEVEL%

    echo Restarting Payara so the MySQL driver is loaded...
    call asadmin restart-domain "%DOMAIN%"
    if errorlevel 1 exit /b %ERRORLEVEL%
) else (
    echo MySQL driver is already installed in Payara common libraries.
)

call asadmin list-jdbc-connection-pools | findstr /I /X "%POOL_NAME%" >nul 2>nul
if errorlevel 1 (
    echo Creating JDBC connection pool %POOL_NAME%...
    call asadmin create-jdbc-connection-pool ^
        --restype javax.sql.XADataSource ^
        --datasourceclassname com.mysql.cj.jdbc.MysqlXADataSource ^
        --property serverName=localhost:portNumber=3306:databaseName=person:user=ishjyot:password=fw0r:useSSL=false:allowPublicKeyRetrieval=true ^
        "%POOL_NAME%"
    if errorlevel 1 exit /b %ERRORLEVEL%
) else (
    echo JDBC connection pool %POOL_NAME% already exists.
)

call asadmin list-jdbc-resources | findstr /I /X "%JDBC_RESOURCE%" >nul 2>nul
if errorlevel 1 (
    echo Creating JDBC resource %JDBC_RESOURCE%...
    call asadmin create-jdbc-resource ^
        --connectionpoolid "%POOL_NAME%" ^
        "%JDBC_RESOURCE%"
    if errorlevel 1 exit /b %ERRORLEVEL%
) else (
    echo JDBC resource %JDBC_RESOURCE% already exists.
)

echo Pinging JDBC connection pool %POOL_NAME%...
call asadmin ping-connection-pool "%POOL_NAME%"
if errorlevel 1 exit /b %ERRORLEVEL%

echo JDBC setup is ready: %JDBC_RESOURCE% uses %POOL_NAME%.
exit /b 0