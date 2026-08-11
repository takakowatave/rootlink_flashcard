import { supabase } from "./supabaseClient";
import type { WordInfo } from "@/types/WordInfo";
import type { SavedWordDictionary } from "@/types/Dictionary";

type SavedWordQueryRow = {
  id: string
  word_id: string
  pinned_sense_id: string | null
  created_at: string | null
  words: { id: string; word: string } | null
}

type DictionaryCacheQueryRow = {
  word_id: string
  payload: unknown
}

/* =========================================
 ① 保存トグル（DBは保存状態のみ）
========================================= */
export const FREE_PLAN_LIMIT = 100

export const toggleSaveStatus = async (
  word: WordInfo
): Promise<{ success: boolean; limitReached?: boolean }> => {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return { success: false };

  // words の書き込みは /resolve (Cloud Run, service_role) が担当。
  // ここでは既存 word_id を引くだけ。無ければ保存不可としてUI側で再検索を促す。
  const { data: existingWord, error: wordFetchError } = await supabase
    .from("words")
    .select("id")
    .eq("word", word.word)
    .maybeSingle();

  if (wordFetchError || !existingWord) {
    console.error("words 取得エラー:", wordFetchError);
    return { success: false };
  }

  const wordId: string = existingWord.id;

  // ③ 保存済み確認
  const { data: existingSaved, error: savedCheckError } = await supabase
    .from("saved_words")
    .select("id")
    .eq("user_id", user.id)
    .eq("word_id", wordId)
    .maybeSingle();

  if (savedCheckError) {
    console.error("saved_words check error:", savedCheckError);
    return { success: false };
  }

  // ④ 保存済みなら削除
  if (existingSaved) {
    const { error: deleteError } = await supabase
      .from("saved_words")
      .delete()
      .eq("id", existingSaved.id);

    if (deleteError) {
      console.error("削除エラー:", deleteError);
      return { success: false };
    }

    return { success: true };
  }

  // ⑤ 未保存なら保存（制限チェック — Premiumユーザーはスキップ）
  const plan = await getUserPlan()
  if (plan === "free") {
    const { count, error: countError } = await supabase
      .from("saved_words")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)

    if (countError) {
      console.error("saved_words count error:", countError)
      return { success: false }
    }

    if ((count ?? 0) >= FREE_PLAN_LIMIT) {
      return { success: false, limitReached: true }
    }
  }

  const { error: saveError } = await supabase.from("saved_words").insert({
    user_id: user.id,
    word_id: wordId,
  });

  if (saveError) {
    console.error("保存エラー:", saveError);
    return { success: false };
  }

  return { success: true };
};

/* =========================================
 ② ピン留め更新
========================================= */
export const updatePinnedSense = async (
  savedId: string,
  senseId: string
): Promise<void> => {
  const { error } = await supabase
    .from("saved_words")
    .update({ pinned_sense_id: senseId })
    .eq("id", savedId)

  if (error) {
    console.error("updatePinnedSense error:", error)
  }
}

/* =========================================
 ③ クイズ結果を記録
========================================= */
export const saveQuizResult = async (
  word: string,
  correct: boolean,
  deckId?: string | null
): Promise<void> => {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth?.user
  if (!user) return

  const { error } = await supabase.from("quiz_results").insert({
    user_id: user.id,
    word,
    correct,
    deck_id: deckId ?? null,
  })

  if (error) {
    console.error("saveQuizResult error:", error)
  }
}

/* =========================================
 ④ Premium判定（subscriptions or is_tester）
========================================= */
export const getUserPlan = async (): Promise<"premium" | "free"> => {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth?.user
  if (!user) return "free"

  // is_tester チェック
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_tester")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.is_tester) return "premium"

  // subscriptions チェック
  // Stripe status: active / trialing / past_due / canceled / incomplete / ...
  // premium 扱い: active と trialing のみ（past_due は支払い失敗中なので premium から外す）
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle()

  if (sub?.status === "active" || sub?.status === "trialing") return "premium"

  return "free"
}

/* =========================================
 ⑤ etymology_parts テーブルから同じルートを持つ単語を取得
    partText: "com" / "pon" など
========================================= */
export const fetchWordsByEtymologyPart = async (
  partText: string
): Promise<{ word: string; meaning: string }[]> => {
  if (!partText) return []

  const { data: partRows, error } = await supabase
    .from('etymology_parts')
    .select('word_id')
    .ilike('text', partText)

  if (error || !partRows || partRows.length === 0) return []

  const wordIds = [...new Set(
    (partRows as { word_id: string }[]).map(r => r.word_id).filter(Boolean)
  )]
  if (wordIds.length === 0) return []

  // word_id → word 文字列
  const { data: wordRows } = await supabase
    .from('words')
    .select('id, word')
    .in('id', wordIds)
    .limit(6)

  const words = ((wordRows ?? []) as { id: string; word: string }[]).filter(r => r.word)
  if (words.length === 0) return []

  // dictionary_cache から最初の meaning を取得
  const ids = words.map(r => r.id)
  const { data: cacheRows } = await supabase
    .from('dictionary_cache')
    .select('word_id, payload')
    .in('word_id', ids)

  type CacheRow = { word_id: string; payload: { senseGroups?: { senses?: { definition?: string }[] }[] } }
  const meaningMap = new Map<string, string>()
  for (const row of ((cacheRows ?? []) as CacheRow[])) {
    const def = row.payload?.senseGroups?.[0]?.senses?.[0]?.definition
    if (def) meaningMap.set(row.word_id, def)
  }

  return words.map(r => ({
    word: r.word,
    meaning: meaningMap.get(r.id) ?? '',
  }))
}

/* =========================================
 ⑥ 保存一覧取得（辞書データは取らない）
========================================= */
/* =========================================
 ② 保存一覧取得（saved_words + words + dictionary_cache を返す）
    ※ join名ズレでも動く: 2クエリで dictionary_cache をマージ
========================================= */
export const fetchWordlists = async (userId: string) => {
  // 1) saved_words -> words（ここは安定）
  const { data: savedRows, error: savedErr } = await supabase
    .from("saved_words")
    .select(
      `
      id,
      word_id,
      pinned_sense_id,
      created_at,
      words (
        id,
        word
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (savedErr) {
    console.error("fetchWordlists saved_words error:", savedErr)
    return []
  }

  // Supabase のジョイン結果は TypeScript の推論型と実態が乖離するため unknown 経由でキャスト
  const savedTyped = (savedRows ?? []) as unknown as SavedWordQueryRow[]
  const wordIds = savedTyped.map((row) => row.word_id).filter(Boolean)

  if (wordIds.length === 0) {
    return savedTyped.map((row) => ({
      saved_id: row.id,
      word_id: row.word_id,
      word: row.words?.word ?? '',
      dictionary: null as SavedWordDictionary | null,
      pinned_sense_id: row.pinned_sense_id ?? null,
      created_at: row.created_at ?? '',
    }))
  }

  // 2) dictionary_cache を word_id でまとめて取得（relation名に依存しない）
  const { data: rawRows, error: rawErr } = await supabase
    .from("dictionary_cache")
    .select("word_id, payload")
    .in("word_id", wordIds)

  if (rawErr) {
    console.error("fetchWordlists dictionary_cache error:", rawErr)
    // dictionary_cache が取れなくても一覧は返す（dictionary=null）
    return savedTyped.map((row) => ({
      saved_id: row.id,
      word_id: row.word_id,
      word: row.words?.word ?? '',
      dictionary: null as SavedWordDictionary | null,
      pinned_sense_id: row.pinned_sense_id ?? null,
      created_at: row.created_at ?? '',
    }))
  }

  const cacheTyped = (rawRows ?? []) as DictionaryCacheQueryRow[]
  const payloadByWordId = new Map<string, SavedWordDictionary | null>()
  cacheTyped.forEach((r) => {
    if (r?.word_id) payloadByWordId.set(r.word_id, (r.payload as SavedWordDictionary) ?? null)
  })

  // 3) saved_words と dictionary_cache をマージして返す
  return savedTyped.map((row) => ({
    saved_id: row.id,
    word_id: row.word_id,
    word: row.words?.word ?? '',
    dictionary: payloadByWordId.get(row.word_id) ?? null,
    pinned_sense_id: row.pinned_sense_id ?? null,
    created_at: row.created_at ?? '',
  }))
}

/* =========================================
 word 文字列配列から QuizEntry (word + dictionary) を組み立てる
 - words → dictionary_cache の2クエリ方式 (fetchWordlists と同じ)
 - dictionary_cache に無い word は dictionary=null で返す
========================================= */
export type QuizEntryLite = {
  word: string
  dictionary: SavedWordDictionary | null
  pinned_sense_id: null
}

export const fetchQuizEntriesByWords = async (
  words: string[],
): Promise<QuizEntryLite[]> => {
  if (words.length === 0) return []
  const { data: wordRows } = await supabase
    .from('words')
    .select('id, word')
    .in('word', words)
    .limit(2000)
  const rows = ((wordRows ?? []) as { id: string; word: string }[]).filter((r) => r.word)
  if (rows.length === 0) return []

  const ids = rows.map((r) => r.id)
  const { data: cacheRows } = await supabase
    .from('dictionary_cache')
    .select('word_id, payload')
    .in('word_id', ids)
    .limit(2000)

  const payloadByWordId = new Map<string, SavedWordDictionary | null>()
  for (const r of ((cacheRows ?? []) as { word_id: string; payload: unknown }[])) {
    if (r?.word_id) payloadByWordId.set(r.word_id, (r.payload as SavedWordDictionary) ?? null)
  }

  return rows.map((r) => ({
    word: r.word,
    dictionary: payloadByWordId.get(r.id) ?? null,
    pinned_sense_id: null,
  }))
}

/* =========================================
 「最近学習した単語」用の候補取得
 - quiz_results を answered_at desc で取得 (最大500行)
 - Free プランなら Premium デッキ由来の word を除外
 - 重複除去 → 直近 limit 語 (デフォルト20)
 - 各語の wrongCount / latestAt も返す (呼び出し側で優先度ソート)
========================================= */
export type RecentQuizWord = {
  word: string
  wrongCount: number
  latestAt: string
}

export const fetchRecentQuizWords = async (
  userId: string,
  plan: 'premium' | 'free',
  limit = 20,
): Promise<RecentQuizWord[]> => {
  const { data: qrRows } = await supabase
    .from('quiz_results')
    .select('word, correct, answered_at')
    .eq('user_id', userId)
    .order('answered_at', { ascending: false })
    .limit(500)
  const qr = ((qrRows ?? []) as { word: string; correct: boolean; answered_at: string }[])
    .filter((r) => r.word)
  if (qr.length === 0) return []

  const wrongByWord = new Map<string, number>()
  for (const r of qr) {
    if (!r.correct) wrongByWord.set(r.word, (wrongByWord.get(r.word) ?? 0) + 1)
  }

  let excluded = new Set<string>()
  if (plan === 'free') {
    const uniqueWords = [...new Set(qr.map((r) => r.word))]
    const rows: { deck_id: string; word: string }[] = []
    for (let i = 0; i < uniqueWords.length; i += 200) {
      const { data } = await supabase
        .from('deck_words')
        .select('deck_id, word')
        .in('word', uniqueWords.slice(i, i + 200))
      if (data) rows.push(...(data as { deck_id: string; word: string }[]))
    }
    const deckIds = [...new Set(rows.map((r) => r.deck_id))]
    if (deckIds.length > 0) {
      const { data: deckMeta } = await supabase
        .from('decks')
        .select('id, is_premium')
        .in('id', deckIds)
      const premiumDecks = new Set(
        ((deckMeta ?? []) as { id: string; is_premium: boolean }[])
          .filter((d) => d.is_premium)
          .map((d) => d.id),
      )
      excluded = new Set(rows.filter((r) => premiumDecks.has(r.deck_id)).map((r) => r.word))
    }
  }

  const seen = new Set<string>()
  const results: RecentQuizWord[] = []
  for (const r of qr) {
    if (excluded.has(r.word)) continue
    if (seen.has(r.word)) continue
    seen.add(r.word)
    results.push({
      word: r.word,
      wrongCount: wrongByWord.get(r.word) ?? 0,
      latestAt: r.answered_at,
    })
    if (results.length >= limit) break
  }
  return results
}

export const fetchHardQuizWords = async (
  userId: string,
  plan: 'premium' | 'free',
): Promise<RecentQuizWord[]> => {
  const { data: qrRows } = await supabase
    .from('quiz_results')
    .select('word, correct, answered_at')
    .eq('user_id', userId)
    .order('answered_at', { ascending: false })
    .limit(5000)
  const qr = ((qrRows ?? []) as { word: string; correct: boolean; answered_at: string }[])
    .filter((r) => r.word)
  if (qr.length === 0) return []

  const wrongByWord = new Map<string, number>()
  const latestByWord = new Map<string, string>()
  for (const r of qr) {
    if (!r.correct) wrongByWord.set(r.word, (wrongByWord.get(r.word) ?? 0) + 1)
    if (!latestByWord.has(r.word)) latestByWord.set(r.word, r.answered_at)
  }

  const hardWords = [...wrongByWord.entries()]
    .filter(([, n]) => n >= 2)
    .map(([word]) => word)
  if (hardWords.length === 0) return []

  let excluded = new Set<string>()
  if (plan === 'free') {
    const rows: { deck_id: string; word: string }[] = []
    for (let i = 0; i < hardWords.length; i += 200) {
      const { data } = await supabase
        .from('deck_words')
        .select('deck_id, word')
        .in('word', hardWords.slice(i, i + 200))
      if (data) rows.push(...(data as { deck_id: string; word: string }[]))
    }
    const deckIds = [...new Set(rows.map((r) => r.deck_id))]
    if (deckIds.length > 0) {
      const { data: deckMeta } = await supabase
        .from('decks')
        .select('id, is_premium')
        .in('id', deckIds)
      const premiumDecks = new Set(
        ((deckMeta ?? []) as { id: string; is_premium: boolean }[])
          .filter((d) => d.is_premium)
          .map((d) => d.id),
      )
      excluded = new Set(rows.filter((r) => premiumDecks.has(r.deck_id)).map((r) => r.word))
    }
  }

  return hardWords
    .filter((w) => !excluded.has(w))
    .map((word) => ({
      word,
      wrongCount: wrongByWord.get(word) ?? 0,
      latestAt: latestByWord.get(word) ?? '',
    }))
}

/* =========================================
 保存フレーズ一覧取得（saved_phrase_cards + phrase_cards）
========================================= */
export type SavedPhraseRow = {
  saved_id: string
  phrase_card_id: string
  phrase: string
  meaning_ja: string | null
  meaning_en: string | null
  example_en: string | null
  example_ja: string | null
  type: string | null
  register: string | null
  locale: string | null
  senses: unknown
  created_at: string
}

export const fetchSavedPhrases = async (userId: string): Promise<SavedPhraseRow[]> => {
  const { data, error } = await supabase
    .from('saved_phrase_cards')
    .select(`
      id,
      phrase_card_id,
      phrase_cards (
        id, phrase, meaning_ja, meaning_en, example_en, example_ja,
        type, register, locale, senses, skip_reason, created_at
      )
    `)
    .eq('user_id', userId)
    .limit(500)

  if (error) {
    console.error('fetchSavedPhrases error:', error)
    return []
  }

  type Row = {
    id: string
    phrase_card_id: string
    phrase_cards: {
      id: string
      phrase: string
      meaning_ja: string | null
      meaning_en: string | null
      example_en: string | null
      example_ja: string | null
      type: string | null
      register: string | null
      locale: string | null
      senses: unknown
      skip_reason: string | null
      created_at: string | null
    } | null
  }

  return ((data ?? []) as unknown as Row[])
    .filter((r) => r.phrase_cards && !r.phrase_cards.skip_reason)
    .map((r) => ({
      saved_id: r.id,
      phrase_card_id: r.phrase_card_id,
      phrase: r.phrase_cards!.phrase,
      meaning_ja: r.phrase_cards!.meaning_ja,
      meaning_en: r.phrase_cards!.meaning_en,
      example_en: r.phrase_cards!.example_en,
      example_ja: r.phrase_cards!.example_ja,
      type: r.phrase_cards!.type,
      register: r.phrase_cards!.register,
      locale: r.phrase_cards!.locale,
      senses: r.phrase_cards!.senses,
      created_at: r.phrase_cards!.created_at ?? '',
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

/* =========================================
 ③ デッキ単語取得（deck_words + dictionary_cache）
========================================= */
export const fetchDeckWords = async (deckId: string) => {
  const { data: deckRows } = await supabase
    .from('deck_words')
    .select('word, meaning')
    .eq('deck_id', deckId)
    .limit(2000)

  if (!deckRows || deckRows.length === 0) return []

  const wordTexts = deckRows.map(r => r.word)

  const { data: wordRows } = await supabase
    .from('words')
    .select('id, word')
    .in('word', wordTexts)
    .limit(2000)

  const wordIdByWord = new Map((wordRows ?? []).map(r => [r.word, r.id]))
  const wordIds = [...wordIdByWord.values()]

  const cacheByWordId = new Map<string, SavedWordDictionary | null>()
  if (wordIds.length > 0) {
    const { data: cacheRows } = await supabase
      .from('dictionary_cache')
      .select('word_id, payload')
      .in('word_id', wordIds)
      .limit(2000)
    ;(cacheRows ?? []).forEach(r => {
      cacheByWordId.set(r.word_id, (r.payload as SavedWordDictionary) ?? null)
    })
  }

  return deckRows.map(row => ({
    word: row.word,
    meaning: (row.meaning as string | null) ?? null,
    dictionary: cacheByWordId.get(wordIdByWord.get(row.word) ?? '') ?? null,
    pinned_sense_id: null as string | null,
  }))
}

/* =========================================
 アクティビティログ（草）
========================================= */

function localDateStr(): string {
  // YYYY-MM-DD をローカルタイムゾーンで返す
  return new Date().toLocaleDateString('sv')
}

export async function recordActivity(userId: string): Promise<void> {
  const today = localDateStr()
  await supabase
    .from('user_activity_log')
    .upsert({ user_id: userId, activity_date: today }, { onConflict: 'user_id,activity_date' })
}

export async function getActivityLog(userId: string): Promise<string[]> {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const { data } = await supabase
    .from('user_activity_log')
    .select('activity_date')
    .eq('user_id', userId)
    .gte('activity_date', oneYearAgo.toLocaleDateString('sv'))
    .order('activity_date', { ascending: false })
    .limit(400)
  return (data ?? []).map(r => r.activity_date as string)
}

export function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const sorted = [...dates].sort().reverse()
  const today = localDateStr()
  const d = new Date(); d.setDate(d.getDate() - 1)
  const yesterday = d.toLocaleDateString('sv')

  // 今日または昨日から連続していない場合はストリーク0
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0

  let streak = 0
  let expected = sorted[0]
  for (const d of sorted) {
    if (d === expected) {
      streak++
      const prev = new Date(expected)
      prev.setDate(prev.getDate() - 1)
      expected = prev.toLocaleDateString('sv')
    } else {
      break
    }
  }
  return streak
}

/* =========================================
 ストリーク
========================================= */
export type StreakInfo = {
  current_streak: number
  longest_streak: number
  last_activity_date: string | null
}

export async function getStreak(userId: string): Promise<StreakInfo | null> {
  const { data } = await supabase
    .from('user_streaks')
    .select('current_streak, longest_streak, last_activity_date')
    .eq('user_id', userId)
    .single()
  return (data as StreakInfo) ?? null
}

export async function updateStreak(userId: string): Promise<StreakInfo> {
  const today = new Date().toISOString().slice(0, 10)

  const { data: existing } = await supabase
    .from('user_streaks')
    .select('current_streak, longest_streak, last_activity_date')
    .eq('user_id', userId)
    .single()

  if (!existing) {
    // 初回
    const row = { user_id: userId, current_streak: 1, longest_streak: 1, last_activity_date: today }
    await supabase.from('user_streaks').insert(row)
    return { current_streak: 1, longest_streak: 1, last_activity_date: today }
  }

  const last = existing.last_activity_date
  if (last === today) {
    // 今日すでに記録済み
    return existing as StreakInfo
  }

  const yd = new Date(); yd.setDate(yd.getDate() - 1)
  const yesterday = yd.toLocaleDateString('sv')
  const newStreak = last === yesterday ? existing.current_streak + 1 : 1
  const newLongest = Math.max(newStreak, existing.longest_streak)

  await supabase.from('user_streaks').update({
    current_streak: newStreak,
    longest_streak: newLongest,
    last_activity_date: today,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId)

  return { current_streak: newStreak, longest_streak: newLongest, last_activity_date: today }
}