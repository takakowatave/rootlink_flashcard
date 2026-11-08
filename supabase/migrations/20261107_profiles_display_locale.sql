-- profiles.display_locale: ユーザーが明示的に選んだ表示言語を端末横断で保存する。
-- 'ja' / 'en' のみ許可。NULL = 未設定（client 側で ?lang / Accept-Language / navigator.language で解決）。
-- CLAUDE.md の「localStorage を端末横断ストレージとして扱うのは禁止」ルールに合わせ、
-- ログインユーザーの選択はここに置くのが最終形。
-- 2026-11-07 適用済み (Supabase MCP apply_migration)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_locale TEXT
  CHECK (display_locale IS NULL OR display_locale IN ('ja', 'en'));
