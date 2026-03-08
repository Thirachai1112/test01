#!/usr/bin/env bash
set -euo pipefail

TARGET_ENV="${1:-production}"

case "$TARGET_ENV" in
  production|preview|development) ;;
  *)
    echo "Usage: bash scripts/deploy_vercel.sh [production|preview|development]"
    exit 1
    ;;
esac

if [[ ! -f ".vercel/project.json" ]]; then
  echo "No .vercel/project.json found. Linking project first..."
  npx --yes vercel link --yes
fi

echo "Running env preflight..."
bash scripts/check_vercel_env.sh

echo "Pushing env variables to Vercel ($TARGET_ENV)..."
bash scripts/push_vercel_env.sh "$TARGET_ENV"

echo "Deploying..."
if [[ "$TARGET_ENV" == "production" ]]; then
  npx --yes vercel deploy --prod --yes
else
  npx --yes vercel deploy --yes
fi

echo "Done. Run smoke test with:"
echo "bash scripts/smoke_vercel.sh https://<your-vercel-domain>"
