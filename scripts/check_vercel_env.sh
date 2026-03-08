#!/usr/bin/env bash
set -euo pipefail

MISSING=0

required_vars=(
  NODE_ENV
  PUBLIC_BASE_URL
  DB_CLIENT
  DATABASE_URL
  DB_SSL
  STORAGE_MODE
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  SUPABASE_BUCKET_BORROWING
  SUPABASE_BUCKET_REPAIRS
  SUPABASE_BUCKET_REPORTS
  SUPABASE_BUCKET_QRCODES
  SUPABASE_BUCKET_UPLOADS
)

echo "== Vercel/Supabase Env Preflight =="

for key in "${required_vars[@]}"; do
  value="${!key:-}"
  if [[ -z "$value" ]]; then
    echo "MISSING: $key"
    MISSING=1
  else
    echo "OK: $key"
  fi
done

if [[ "${DB_CLIENT:-}" != "postgres" ]]; then
  echo "WARN: DB_CLIENT should be 'postgres' for Supabase."
fi

if [[ "${STORAGE_MODE:-}" != "supabase" ]]; then
  echo "WARN: STORAGE_MODE should be 'supabase' on Vercel."
fi

if [[ "${NODE_ENV:-}" != "production" ]]; then
  echo "WARN: NODE_ENV should be 'production' on Vercel."
fi

if [[ "$MISSING" -eq 1 ]]; then
  echo "RESULT: FAILED (missing required variables)"
  exit 1
fi

echo "RESULT: PASSED"
