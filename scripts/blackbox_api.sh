#!/usr/bin/env bash
# Eco-Nexus – Blackbox API tests (curl).
# Usage: ./scripts/blackbox_api.sh [BASE_URL]
set -e
BASE_URL="${1:-http://localhost:8000}"

echo "Blackbox tests – $BASE_URL"

# Health
curl -sf "$BASE_URL/health" | grep -q '"status"' && echo "OK: health" || (echo "FAIL: health"; exit 1)

# Root
curl -sf "$BASE_URL/" | grep -q '"name"' && echo "OK: root" || (echo "FAIL: root"; exit 1)

# OpenAPI
curl -sf "$BASE_URL/openapi.json" | grep -q 'openapi' && echo "OK: openapi" || (echo "FAIL: openapi"; exit 1)

echo "Blackbox checks passed."
