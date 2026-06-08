#!/usr/bin/env bash
set -euo pipefail

APP_NAME="jakarta-data-person"
CONTEXT_ROOT="jakarta-data-person"
JDBC_RESOURCE="jdbc/personDS"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${SCRIPT_DIR}/target/${APP_NAME}"
APP_URL="http://localhost:8080/${CONTEXT_ROOT}/"

if ! command -v asadmin >/dev/null 2>&1; then
    echo "asadmin was not found on PATH."
    echo "Add Payara bin directory to PATH, for example: export PATH=\"/opt/payara7/bin:$PATH\""
    exit 1
fi

if ! command -v mvn >/dev/null 2>&1; then
    echo "mvn was not found on PATH. Install Maven or add it to PATH."
    exit 1
fi

if ! asadmin list-applications >/dev/null 2>&1; then
    echo "Payara is not running or the admin endpoint is not available."
    echo "Start Payara first by running: ./payara.sh"
    exit 1
fi

if ! asadmin list-jdbc-resources | grep -ixq "${JDBC_RESOURCE}"; then
    echo "JDBC resource ${JDBC_RESOURCE} was not found."
    echo "Run ./jdbc.sh first to install the MySQL driver and create the datasource."
    exit 1
fi

if asadmin list-applications | grep -qi "${APP_NAME}"; then
    echo "Undeploying ${APP_NAME} so Maven clean can remove locked files..."
    asadmin undeploy "${APP_NAME}"
fi

echo "Building exploded app directory..."
cd "${SCRIPT_DIR}"
mvn clean package

if [[ ! -d "${APP_DIR}" ]]; then
    echo "Exploded app directory not found: ${APP_DIR}"
    exit 1
fi

echo "Deploying exploded directory ${APP_DIR}..."
asadmin deploy --force=true --name "${APP_NAME}" --contextroot "${CONTEXT_ROOT}" "${APP_DIR}"

echo "Application URL: ${APP_URL}"
if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "${APP_URL}" >/dev/null 2>&1 || true
fi
