#!/usr/bin/env bash
# 秘密情報の混入を検査する。
# - .claude/settings.json / .claude/settings.local.json に APIキーの実値が平文で入っていないか
# - リポジトリ内 (未追跡含む) に鍵ファイルが置かれていないか
# - .env / .env.* が git に tracked / not-ignored 状態になっていないか
# 引っかかったら該当箇所を伏字にして表示し exit 1。
set -uo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_root"

fail=0

RED='\033[0;31m'
YEL='\033[0;33m'
NC='\033[0m'

# 値の実態を掴むパターン (単なる env 名参照は除外)
value_re='(sk_live_[A-Za-z0-9]{16,}|sk_test_[A-Za-z0-9]{16,}|rk_live_[A-Za-z0-9]{16,}|whsec_[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}|-----BEGIN[^-]*PRIVATE KEY-----|(SUPABASE_SERVICE_ROLE|service_role)[^A-Za-z_]{0,20}[=:][^=:]{0,20}ey[A-Za-z0-9])'

redact() {
  sed -E \
    -e 's/(sk_live_)[A-Za-z0-9]+/\1****REDACTED****/g' \
    -e 's/(sk_test_)[A-Za-z0-9]+/\1****REDACTED****/g' \
    -e 's/(rk_live_)[A-Za-z0-9]+/\1****REDACTED****/g' \
    -e 's/(whsec_)[A-Za-z0-9]+/\1****REDACTED****/g' \
    -e 's/AKIA[0-9A-Z]{16}/AKIA****REDACTED****/g' \
    -e 's/(-----BEGIN[^-]*PRIVATE KEY-----).*$/\1 ****REDACTED****/g' \
    -e 's/(ey[A-Za-z0-9])[A-Za-z0-9._-]+/\1****REDACTED****/g'
}

# 1) .claude/settings*.json をスキャン
for f in .claude/settings.json .claude/settings.local.json; do
  [ -f "$f" ] || continue
  hits=$(grep -nE "$value_re" "$f" || true)
  if [ -n "$hits" ]; then
    printf "${RED}[NG] %s に秘密情報の実値:${NC}\n" "$f" >&2
    printf '%s\n' "$hits" | redact | sed 's/^/    /' >&2
    fail=1
  fi
done

# 2) 鍵ファイル・cert がリポジトリ配下にないか (追跡外含む)
key_files=$(find . \
    -path ./.git -prune -o \
    -path ./node_modules -prune -o \
    -path ./.next -prune -o \
    -path ./.claude/worktrees -prune -o \
    -type f \( \
      -name '*.jks' -o \
      -name '*.keystore' -o \
      -name '*.p12' -o \
      -name '*.p8' -o \
      -name '*.mobileprovision' -o \
      -name 'keystore.properties' -o \
      -name 'id_rsa' -o \
      -name 'id_ed25519' \
    \) -print 2>/dev/null)
if [ -n "$key_files" ]; then
  printf "${RED}[NG] リポジトリ配下に鍵ファイル / cert:${NC}\n" >&2
  printf '%s\n' "$key_files" | sed 's/^/    /' >&2
  printf "${YEL}    → ~/keys/ 以下に退避すること (CLAUDE.md「秘密情報の扱い」)${NC}\n" >&2
  fail=1
fi

# 3) .env / .env.* が gitignore されているか
env_files=$(find . \
    -path ./.git -prune -o \
    -path ./node_modules -prune -o \
    -path ./.next -prune -o \
    -path ./.claude/worktrees -prune -o \
    -type f \( -name '.env' -o -name '.env.*' \) -print 2>/dev/null)
if [ -n "$env_files" ]; then
  while IFS= read -r ef; do
    [ -z "$ef" ] && continue
    if ! git check-ignore -q "$ef" 2>/dev/null; then
      printf "${RED}[NG] %s が .gitignore に含まれていない (tracked / trackable):${NC}\n" "$ef" >&2
      fail=1
    fi
  done <<< "$env_files"
fi

if [ "$fail" -ne 0 ]; then
  printf "${RED}scan-secrets: 秘密情報の混入を検出。kiko に報告すること。${NC}\n" >&2
  exit 1
fi

printf "scan-secrets: ok\n"
exit 0
