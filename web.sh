#!/usr/bin/env bash
set -euo pipefail

APP_NAME="jakarta-data-person"
CONTEXT_ROOT="jakarta-data-person"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="${SCRIPT_DIR}/src/main/web"
TARGET_DIR="${SCRIPT_DIR}/target/${APP_NAME}"
APP_URL="http://localhost:8080/${CONTEXT_ROOT}/"

if [[ ! -d "${TARGET_DIR}" ]]; then
    echo "Target directory not found: ${TARGET_DIR}"
    echo "Run ./deploy.sh first."
    exit 1
fi

if [[ ! -d "${SOURCE_DIR}" ]]; then
    echo "Source directory not found: ${SOURCE_DIR}"
    exit 1
fi

echo "Syncing frontend files..."
cp -a "${SOURCE_DIR}/." "${TARGET_DIR}/"

echo "Frontend synced to exploded target deployment. Hard refresh browser:"
echo "${APP_URL}"
