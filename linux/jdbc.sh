#!/usr/bin/env bash
set -euo pipefail

DOMAIN="domain1"
POOL_NAME="personPool"
JDBC_RESOURCE="jdbc/personDS"
APP_NAME="jakarta-data-person"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${SCRIPT_DIR}/target/${APP_NAME}"
MYSQL_DRIVER="${APP_DIR}/WEB-INF/lib/mysql-connector-j-9.7.0.jar"
MYSQL_LIBRARY_NAME="mysql-connector-j"

if ! command -v asadmin >/dev/null 2>&1; then
    echo "asadmin was not found on PATH."
    echo "Add Payara bin directory to PATH, for example: export PATH=\"/opt/payara7/bin:$PATH\""
    exit 1
fi

if ! asadmin list-applications >/dev/null 2>&1; then
    echo "Payara admin endpoint is not available. Start Payara first, then run this script again."
    exit 1
fi

if ! asadmin list-libraries --type common | grep -qi "${MYSQL_LIBRARY_NAME}"; then
    if [[ ! -f "${MYSQL_DRIVER}" ]]; then
        echo "MySQL driver not found: ${MYSQL_DRIVER}"
        echo "Run mvn package first so the driver exists under target/${APP_NAME}/WEB-INF/lib."
        exit 1
    fi

    echo "Installing MySQL driver into Payara common libraries..."
    asadmin add-library --type common "${MYSQL_DRIVER}"

    echo "Restarting Payara so the MySQL driver is loaded..."
    asadmin restart-domain "${DOMAIN}"
else
    echo "MySQL driver is already installed in Payara common libraries."
fi

if ! asadmin list-jdbc-connection-pools | grep -ixq "${POOL_NAME}"; then
    echo "Creating JDBC connection pool ${POOL_NAME}..."
    asadmin create-jdbc-connection-pool \
        --restype javax.sql.XADataSource \
        --datasourceclassname com.mysql.cj.jdbc.MysqlXADataSource \
        --property 'serverName=localhost:portNumber=3306:databaseName=person:user=ishjyot:password=fw0r:useSSL=false:allowPublicKeyRetrieval=true' \
        "${POOL_NAME}"
else
    echo "JDBC connection pool ${POOL_NAME} already exists."
fi

if ! asadmin list-jdbc-resources | grep -ixq "${JDBC_RESOURCE}"; then
    echo "Creating JDBC resource ${JDBC_RESOURCE}..."
    asadmin create-jdbc-resource \
        --connectionpoolid "${POOL_NAME}" \
        "${JDBC_RESOURCE}"
else
    echo "JDBC resource ${JDBC_RESOURCE} already exists."
fi

echo "Pinging JDBC connection pool ${POOL_NAME}..."
asadmin ping-connection-pool "${POOL_NAME}"

echo "JDBC setup is ready: ${JDBC_RESOURCE} uses ${POOL_NAME}."
