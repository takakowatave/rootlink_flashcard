#!/bin/bash
# 全デッキのキャッシュウォームアップを順番に実行する

set -e
cd "$(dirname "$0")/.."
export $(cat .env.local | xargs) 2>/dev/null

DECKS=(
  "TOEIC 730+"
  "TOEFL 60"
  "TOEFL 80"
  "TOEFL 100"
  "IELTS 5.5"
  "IELTS 6.5"
  "IELTS 7.5"
  "英検 準1級"
  "英検 1級"
)

for deck in "${DECKS[@]}"; do
  echo ""
  echo "========================================"
  echo "▶ $deck"
  echo "========================================"
  node scripts/prefetch-deck-words.mjs --deck "$deck" --limit 500 --delay 1200
done

echo ""
echo "✅ 全デッキ処理完了"
