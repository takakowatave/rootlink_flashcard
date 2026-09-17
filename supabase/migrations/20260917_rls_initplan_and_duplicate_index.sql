-- Supabase performance advisor 対策:
--   1) auth_rls_initplan (WARN, 21 件)
--      RLS ポリシー内で auth.uid() を素で使うと行ごとに再評価されるため、
--      (select auth.uid()) に置き換えてプランナに1回だけ評価させる。
--      ポリシーの条件そのものは変えない。
--   2) duplicate_index (WARN, 1 件)
--      saved_words に saved_words_user_id_word_id_key と unique_user_word の
--      同一 UNIQUE インデックスがあるので、後発の unique_user_word を落として
--      1本にする。

begin;

-- =========================================================================
-- 1) auth_rls_initplan: (select auth.uid()) への置換
--
-- 各ポリシーを DROP して同じ role / cmd / permissive で再作成する。
-- 条件は auth.uid() → (select auth.uid()) 以外変えない。
-- =========================================================================

-- profiles
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  as permissive
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "user_can_delete_own_profile" on public.profiles;
create policy "user_can_delete_own_profile"
  on public.profiles
  as permissive
  for delete
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "プロフィール更新（本人のみ）" on public.profiles;
create policy "プロフィール更新（本人のみ）"
  on public.profiles
  as permissive
  for update
  to public
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "ログインしたユーザーは自分のページが見れる" on public.profiles;
create policy "ログインしたユーザーは自分のページが見れる"
  on public.profiles
  as permissive
  for select
  to authenticated
  using ((select auth.uid()) = id);

-- quiz_results
drop policy if exists "users can insert own results" on public.quiz_results;
create policy "users can insert own results"
  on public.quiz_results
  as permissive
  for insert
  to public
  with check ((select auth.uid()) = user_id);

drop policy if exists "users can read own results" on public.quiz_results;
create policy "users can read own results"
  on public.quiz_results
  as permissive
  for select
  to public
  using ((select auth.uid()) = user_id);

-- saved_phrase_cards
drop policy if exists "own" on public.saved_phrase_cards;
create policy "own"
  on public.saved_phrase_cards
  as permissive
  for all
  to public
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- saved_word_tags (subquery 中の auth.uid() を差し替え)
drop policy if exists "Users manage their own saved word tags" on public.saved_word_tags;
create policy "Users manage their own saved word tags"
  on public.saved_word_tags
  as permissive
  for all
  to public
  using (
    exists (
      select 1 from saved_words
      where saved_words.id = saved_word_tags.saved_word_id
        and saved_words.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from saved_words
      where saved_words.id = saved_word_tags.saved_word_id
        and saved_words.user_id = (select auth.uid())
    )
  );

-- saved_words (4 本の "Enable ..." 系 + 3 本の "Users can ..." 系 = 7 本)
drop policy if exists "Enable delete for users based on user_id" on public.saved_words;
create policy "Enable delete for users based on user_id"
  on public.saved_words
  as permissive
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Enable insert for users based on user_id" on public.saved_words;
create policy "Enable insert for users based on user_id"
  on public.saved_words
  as permissive
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Enable update for users based on user_id" on public.saved_words;
create policy "Enable update for users based on user_id"
  on public.saved_words
  as permissive
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Enable users to view their own data only" on public.saved_words;
create policy "Enable users to view their own data only"
  on public.saved_words
  as permissive
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can delete their own saved words" on public.saved_words;
create policy "Users can delete their own saved words"
  on public.saved_words
  as permissive
  for delete
  to public
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own saved words" on public.saved_words;
create policy "Users can insert their own saved words"
  on public.saved_words
  as permissive
  for insert
  to public
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own saved words" on public.saved_words;
create policy "Users can read their own saved words"
  on public.saved_words
  as permissive
  for select
  to public
  using ((select auth.uid()) = user_id);

-- subscriptions
drop policy if exists "Users can read own subscription" on public.subscriptions;
create policy "Users can read own subscription"
  on public.subscriptions
  as permissive
  for select
  to public
  using ((select auth.uid()) = user_id);

-- tag
drop policy if exists "Users can delete their own tags" on public.tag;
create policy "Users can delete their own tags"
  on public.tag
  as permissive
  for delete
  to public
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own tags" on public.tag;
create policy "Users can insert their own tags"
  on public.tag
  as permissive
  for insert
  to public
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own tags" on public.tag;
create policy "Users can read their own tags"
  on public.tag
  as permissive
  for select
  to public
  using ((select auth.uid()) = user_id);

-- user_activity_log
drop policy if exists "Users can manage their own activity log" on public.user_activity_log;
create policy "Users can manage their own activity log"
  on public.user_activity_log
  as permissive
  for all
  to public
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- word_mastery
drop policy if exists "Users can manage own mastery" on public.word_mastery;
create policy "Users can manage own mastery"
  on public.word_mastery
  as permissive
  for all
  to public
  using ((select auth.uid()) = user_id);

-- =========================================================================
-- 2) duplicate_index: saved_words の同一 UNIQUE インデックスを 1 本にする
--
-- saved_words_user_id_word_id_key と unique_user_word は同じカラムペア
-- (user_id, word_id) の UNIQUE。
--   - unique_user_word は UNIQUE 制約 (contype='u') とその supporting index
--   - saved_words_user_id_word_id_key は plain UNIQUE index (制約なし)
-- UNIQUE 制約を残したいので、plain index の方を落とす。
-- =========================================================================

drop index if exists public.saved_words_user_id_word_id_key;

commit;
