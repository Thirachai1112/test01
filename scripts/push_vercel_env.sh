#!/usr/bin/env bash
set -euo pipefail

TARGET_ENV="${1:-production}"

case "$TARGET_ENV" in
  production|preview|development) ;;
  *)
    echo "Usage: bash scripts/push_vercel_env.sh [production|preview|development]"
    exit 1
    ;;
esac

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

missing=0
for key in "${required_vars[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    echo "MISSING: $key"
    missing=1
  fi
done

if [[ "$missing" -eq 1 ]]; then
  echo "Aborted: missing required environment variables in your current shell."
  echo "Tip: export variables first, then run this script again."
  exit 1
fi

echo "== Checking Vercel CLI via npx =="
npx --yes vercel --version >/dev/null

echo "== Pushing env vars to Vercel ($TARGET_ENV) =="
for key in "${required_vars[@]}"; do
  value="${!key}"

  # Remove old value if exists to make script idempotent.
  printf 'y\n' | npx --yes vercel env rm "$key" "$TARGET_ENV" >/dev/null 2>&1 || true

  # Add current value.
  printf '%s\n' "$value" | npx --yes vercel env add "$key" "$TARGET_ENV" >/dev/null
  echo "OK: $key"
done

echo "Done."
echo "If this is your first time on this repo, run: npx vercel link"
echo "Then redeploy to apply new env values."
