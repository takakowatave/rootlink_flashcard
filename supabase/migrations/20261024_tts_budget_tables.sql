-- 例文音声 TTS (OpenAI gpt-4o-mini-tts) の暴走防止ゲート用テーブル。
-- 2026-10-24 時点で既に Supabase cloud 側には apply 済み。履歴として追加する。

-- 日次 call 数カウンタ (kind ごと)
CREATE TABLE IF NOT EXISTS public.tts_daily_counters (
  period_date date NOT NULL,
  kind        text NOT NULL,
  count       integer NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (period_date, kind)
);

ALTER TABLE public.tts_daily_counters ENABLE ROW LEVEL SECURITY;
-- anon / authenticated には何も付けない (service_role 専用運用)。
REVOKE ALL ON public.tts_daily_counters FROM anon;
REVOKE ALL ON public.tts_daily_counters FROM authenticated;

-- 同じ example テキストで TTS が失敗したときのクールダウン記録。
CREATE TABLE IF NOT EXISTS public.tts_failures (
  text_hash   text PRIMARY KEY,
  reason      text NOT NULL,
  failed_at   timestamptz NOT NULL DEFAULT now(),
  retry_after timestamptz NOT NULL
);

ALTER TABLE public.tts_failures ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tts_failures FROM anon;
REVOKE ALL ON public.tts_failures FROM authenticated;

-- 「上限未満なら +1 して新しい count を返す。超えたら -1」の atomic 関数。
CREATE OR REPLACE FUNCTION public.bump_tts_counter(
  p_date  date,
  p_kind  text,
  p_limit integer
) RETURNS integer
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  new_count integer;
BEGIN
  INSERT INTO public.tts_daily_counters (period_date, kind, count, updated_at)
  VALUES (p_date, p_kind, 1, now())
  ON CONFLICT (period_date, kind) DO UPDATE
    SET count = public.tts_daily_counters.count + 1,
        updated_at = now()
    WHERE public.tts_daily_counters.count < p_limit
  RETURNING count INTO new_count;

  RETURN COALESCE(new_count, -1);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bump_tts_counter(date, text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bump_tts_counter(date, text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.bump_tts_counter(date, text, integer) FROM authenticated;
