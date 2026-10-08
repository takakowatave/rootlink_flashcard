-- App Store Guideline 5.1.1(v) 対応で、ネイティブも登録なしで使い始められる。
-- 代わりに「新しい単語（dictionary_cache に無い）の検索」をユーザー単位・日次で数えて、
-- 無料枠は 1 日 20 回で停止する。premium は無制限。
--
-- カウントするのは Oxford / OpenAI を叩く経路（cache miss）のみ。cache hit は数えない。
-- 書き込みは Cloud Run (service_role) 経由。クライアントは直接触らない。

create table if not exists public.daily_new_word_searches (
  user_id uuid not null references auth.users (id) on delete cascade,
  period_date date not null,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, period_date)
);

alter table public.daily_new_word_searches enable row level security;

-- クライアント (anon / authenticated) からは一切見せない。
-- service_role は RLS をバイパスするのでポリシー不要。
revoke all on public.daily_new_word_searches from anon, authenticated;

-- 当日分を +1 して現在値を返す RPC。service_role から呼ぶ。
-- upsert を 1 文で済ませてレース時の二重加算を避ける。
create or replace function public.bump_new_word_search(
  p_user_id uuid,
  p_period_date date
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.daily_new_word_searches as t (user_id, period_date, count, updated_at)
  values (p_user_id, p_period_date, 1, now())
  on conflict (user_id, period_date)
  do update set
    count = t.count + 1,
    updated_at = now()
  returning count into v_count;
  return v_count;
end;
$$;

revoke all on function public.bump_new_word_search(uuid, date) from public;
grant execute on function public.bump_new_word_search(uuid, date) to service_role;
