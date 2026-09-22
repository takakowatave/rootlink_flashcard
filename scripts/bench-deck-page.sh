#!/usr/bin/env bash
# デッキ画面 / 章画面の SSR TTFB を計測するスクリプト。
#
# 使い方:
#   ./scripts/bench-deck-page.sh                             # develop preview の全 official デッキ
#   ./scripts/bench-deck-page.sh eiken-grade-1               # 特定デッキだけ
#   ./scripts/bench-deck-page.sh eiken-grade-1 toeic-990     # 複数デッキ
#   BASE_URL=https://www.rootlink.app ./scripts/bench-deck-page.sh eiken-grade-1  # 本番
#
# 出力: 各画面ごとに 3 回 curl して total / ttfb / size を表示。
# キャッシュを避けるため ?nc=<random> を付ける (Vercel Data Cache は URL query
# を含めた完全一致なので新規 URL 扱いされる)。

set -euo pipefail

BASE_URL="${BASE_URL:-https://rootlink-flashcard-git-develop-kikos-projects-678edb16.vercel.app}"

if [[ $# -eq 0 ]]; then
  # /decks から公開デッキ slug を拾う
  echo "== Discovering decks from $BASE_URL/decks"
  mapfile -t SLUGS < <(curl -s "$BASE_URL/decks" | grep -oE 'href="/decks/[^"]+"' | sed -E 's|.*/decks/([^"]+)"|\1|' | sort -u)
else
  SLUGS=("$@")
fi

for slug in "${SLUGS[@]}"; do
  echo ""
  echo "===== $slug ====="
  echo "-- deck page  ($BASE_URL/decks/$slug)"
  for i in 1 2 3; do
    curl -o /dev/null -s -w "  try $i: total=%{time_total}s ttfb=%{time_starttransfer}s size=%{size_download}bytes\n" \
      "$BASE_URL/decks/$slug?nc=$RANDOM$RANDOM"
  done
  echo "-- chapter 1  ($BASE_URL/decks/$slug/chapters/1)"
  for i in 1 2 3; do
    curl -o /dev/null -s -w "  try $i: total=%{time_total}s ttfb=%{time_starttransfer}s size=%{size_download}bytes\n" \
      "$BASE_URL/decks/$slug/chapters/1?nc=$RANDOM$RANDOM"
  done
done

echo ""
echo "== done"
