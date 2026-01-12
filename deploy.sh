#!/bin/bash
set -e

# .env.local を読み込む
if [ -f .env.local ]; then
  set -a
  source .env.local
  set +a
else
  echo ".env.local not found"
  exit 1
fi

gcloud run deploy rootlink-server-v2 \
  --source . \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-build-env-vars="NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL},NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
