#!/usr/bin/env bash
set -euo pipefail

DOMAIN="domain1"

if ! command -v asadmin >/dev/null 2>&1; then
    echo "asadmin was not found on PATH."
    echo "Add Payara bin directory to PATH, for example: export PATH=\"/opt/payara7/bin:$PATH\""
    exit 1
fi

if asadmin list-applications >/dev/null 2>&1; then
    echo "Payara admin is already available."
    exit 0
fi

echo "Starting Payara domain ${DOMAIN}..."
asadmin start-domain "${DOMAIN}"
