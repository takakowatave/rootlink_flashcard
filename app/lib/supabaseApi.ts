import { supabase } from "./supabaseClient";
import type { WordInfo } from "@/types/WordInfo";
import type { SavedWordDictionary } from "@/types/Dictionary";

type SavedWordQueryRow = {
  id: string
  word_id: string
  pinned_sense_id: string | null
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

  // ① words に存在するか確認
  const { data: existingWord, error: wordFetchError } = await supabase
    .from("words")
    .select("id")
    .eq("word", word.word)
    .maybeSingle();

  if (wordFetchError) {
    console.error("words 取得エラー:", wordFetchError);
    return { success: false };
  }

  let wordId: string;
  

  // ② 無ければ作る（辞書データは保存しない）
  if (!existingWord) {
    const { data: newWord, error: wordInsertError } = await supabase
      .from("words")
      .insert({ word: word.word })
      .select("id")
      .single();

    if (wordInsertError || !newWord) {
      console.error("words 作成エラー:", wordInsertError);
      return { success: false };
    }

    wordId = newWord.id;
  } else {
    wordId = existingWord.id;
  }

  // words を作った直後に dictionary_cache を upsert（dictionary が渡ってきた時だけ）
  const raw = word.dictionary
  if (raw) {
    const { error: upsertErr } = await supabase
      .from("dictionary_cache")
      .upsert(
        {
          word_id: wordId,
          payload: raw,
          fetched_at: new Date().toISOString(),
        },
        { onConflict: "word_id" }
      )

    if (upsertErr) {
      console.error("dictionary_cache upsert error:", upsertErr)
    }
  }

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
  correct: boolean
): Promise<void> => {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth?.user
  if (!user) return

  const { error } = await supabase.from("quiz_results").insert({
    user_id: user.id,
    word,
    correct,
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
 ⑤ 保存一覧取得（辞書データは取らない）
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
      words (
        id,
        word
      )
    `
    )
    .eq("user_id", userId)

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
  }))
}