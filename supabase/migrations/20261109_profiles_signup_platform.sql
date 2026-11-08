-- profiles.signup_platform: 登録したプラットフォーム（iOS/Android/Web の割合を追うため）。
-- 'ios' / 'android' / 'web' のみ許可。NULL = 不明。
-- AppShell 起動時に Capacitor.getPlatform() で NULL のときだけ 1 回書き込む（最初の端末を記録）。
-- 既存ユーザーは auth.sessions.user_agent から判定できる分だけ埋める。
-- Mac の WebView（Safari 表記なし）は iPad/Mac 上の iOS アプリか判別しきれないため NULL のまま。
-- 2026-11-09 適用済み (Supabase MCP apply_migration)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signup_platform TEXT
  CHECK (signup_platform IS NULL OR signup_platform IN ('ios', 'android', 'web'));

UPDATE public.profiles p
SET signup_platform = x.platform
FROM (
  SELECT DISTINCT ON (s.user_id) s.user_id,
    CASE
      WHEN s.user_agent ~ 'iPhone' AND s.user_agent ~ 'Mobile/15E148$' THEN 'ios'
      WHEN s.user_agent ~ 'Android' AND s.user_agent ~ '; wv\)' THEN 'android'
      WHEN s.user_agent ~ '(Windows NT|CriOS|Safari/)' THEN 'web'
    END AS platform
  FROM auth.sessions s
  ORDER BY s.user_id, s.created_at
) x
WHERE x.user_id = p.id AND x.platform IS NOT NULL AND p.signup_platform IS NULL;
