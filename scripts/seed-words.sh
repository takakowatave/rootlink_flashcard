#!/usr/bin/env bash
# 単語シードスクリプト
#
# scripts/seed-words.txt の単語を Cloud Run /resolve に投げて
# dictionary_cache を蓄積する。トリガー sync_etymology_part_words により
# etymology_part_words も自動展開される。
#
# 使い方:
#   ./scripts/seed-words.sh           # 全件実行
#   ./scripts/seed-words.sh --dry-run # 実行する単語数だけ表示
#
# Supabase に既にキャッシュ済みの単語はスキップされる（要 SUPABASE_SERVICE_ROLE_KEY）
# キーがない場合は全件投げる（重複は Cloud Run 側でキャッシュヒットになるので無害）

set -euo pipefail

API_URL="${CLOUDRUN_API_URL:-https://rootlink-server-v2-774622345521.asia-northeast1.run.app}"
WORD_FILE="$(dirname "$0")/seed-words.txt"
LOG_FILE="$(dirname "$0")/seed-words.log"
RATE_LIMIT_SEC="${RATE_LIMIT_SEC:-1}"   # 1単語あたり待機秒
DRY_RUN=false

[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

# 単語リスト読み込み（コメント・空行除去・重複除去）
WORDS=()
while IFS= read -r line; do
  WORDS+=("$line")
done < <(grep -v '^#\|^$' "$WORD_FILE" | tr '[:upper:]' '[:lower:]' | sort -u)
TOTAL=${#WORDS[@]}

echo "Seed words: $TOTAL"
echo "API: $API_URL"
echo "Rate limit: ${RATE_LIMIT_SEC}s/word"

if $DRY_RUN; then
  echo "(dry-run) 実際には投げない"
  exit 0
fi

echo "Logging to: $LOG_FILE"
: > "$LOG_FILE"

SUCCESS=0
FAIL=0
SKIP=0
i=0

for word in "${WORDS[@]}"; do
  i=$((i + 1))
  printf "[%3d/%3d] %s ... " "$i" "$TOTAL" "$word"

  http_code=$(curl -s -o /tmp/seed-resp.json -w "%{http_code}" \
    -X POST "$API_URL/resolve" \
    -H "Content-Type: application/json" \
    --max-time 60 \
    -d "{\"query\":\"$word\"}" || echo "000")

  if [[ "$http_code" == "200" ]]; then
    ok=$(jq -r '.ok // false' /tmp/seed-resp.json 2>/dev/null || echo "false")
    if [[ "$ok" == "true" ]]; then
      echo "OK"
      SUCCESS=$((SUCCESS + 1))
      echo "$word OK" >> "$LOG_FILE"
    else
      echo "NOT_FOUND"
      SKIP=$((SKIP + 1))
      echo "$word NOT_FOUND" >> "$LOG_FILE"
    fi
  else
    echo "FAIL ($http_code)"
    FAIL=$((FAIL + 1))
    echo "$word FAIL $http_code" >> "$LOG_FILE"
  fi

  sleep "$RATE_LIMIT_SEC"
done

echo ""
echo "===== Summary ====="
echo "Total:     $TOTAL"
echo "Success:   $SUCCESS"
echo "Not found: $SKIP"
echo "Failed:    $FAIL"
echo "Log:       $LOG_FILE"
