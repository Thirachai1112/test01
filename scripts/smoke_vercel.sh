#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-}"

if [[ -z "$BASE_URL" ]]; then
  echo "Usage: bash scripts/smoke_vercel.sh https://<your-vercel-domain>"
  exit 1
fi

BASE_URL="${BASE_URL%/}"

echo "== Smoke Test: $BASE_URL =="

check_http() {
  local url="$1"
  local expected_min="${2:-200}"
  local expected_max="${3:-399}"

  local code
  code=$(curl -sS -o /tmp/smoke_body.txt -w "%{http_code}" "$url" || true)

  if [[ "$code" -ge "$expected_min" && "$code" -le "$expected_max" ]]; then
    echo "PASS [$code] $url"
  else
    echo "FAIL [$code] $url"
    echo "---- response body ----"
    cat /tmp/smoke_body.txt || true
    echo "-----------------------"
    exit 1
  fi
}

check_json_success() {
  local url="$1"
  local body
  body=$(curl -sS "$url")

  if echo "$body" | grep -qi '"success"'; then
    echo "PASS [json] $url"
  else
    echo "FAIL [json] $url"
    echo "$body"
    exit 1
  fi
}

check_http "$BASE_URL/" 200 399
check_http "$BASE_URL/frontend/admin/status_repair.html" 200 399
check_http "$BASE_URL/api/repair-status" 200 499
check_json_success "$BASE_URL/api/repair-status"

echo "All smoke checks passed."
