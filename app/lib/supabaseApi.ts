import { supabase } from "./supabaseClient";
import type { WordInfo } from "@/types/WordInfo";

/* =========================================
 ① 保存トグル（DBは保存状態のみ）
========================================= */
export const toggleSaveStatus = async (
  word: WordInfo
): Promise<{ success: boolean }> => {
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

    // lib/supabaseApi.ts（toggleSaveStatus 内）
  // words を作った直後に oxford_raw を upsert（dictionary が渡ってきた時だけ）
  const raw = (word as any).dictionary
  if (raw) {
    const { error: upsertErr } = await supabase
      .from("oxford_raw")
      .upsert(
        {
          word_id: wordId,
          payload: raw,
          fetched_at: new Date().toISOString(),
        },
        { onConflict: "word_id" }
      )

    if (upsertErr) {
      console.error("oxford_raw upsert error:", upsertErr)
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

  // ⑤ 未保存なら保存
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
 ② 保存一覧取得（辞書データは取らない）
========================================= */
/* =========================================
 ② 保存一覧取得（saved_words + words + oxford_raw を返す）
    ※ join名ズレでも動く: 2クエリで oxford_raw をマージ
========================================= */
export const fetchWordlists = async (userId: string) => {
  // 1) saved_words -> words（ここは安定）
  const { data: savedRows, error: savedErr } = await supabase
    .from("saved_words")
    .select(
      `
      id,
      word_id,
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

  const wordIds = (savedRows ?? [])
    .map((row: any) => row.word_id)
    .filter(Boolean)

  if (wordIds.length === 0) {
    return (savedRows ?? []).map((row: any) => ({
      saved_id: row.id,
      word_id: row.word_id,
      word: row.words?.word,
      dictionary: null,
    }))
  }

  // 2) oxford_raw を word_id でまとめて取得（relation名に依存しない）
  const { data: rawRows, error: rawErr } = await supabase
    .from("oxford_raw")
    .select("word_id, payload")
    .in("word_id", wordIds)

  if (rawErr) {
    console.error("fetchWordlists oxford_raw error:", rawErr)
    // oxford_raw が取れなくても一覧は返す（dictionary=null）
    return (savedRows ?? []).map((row: any) => ({
      saved_id: row.id,
      word_id: row.word_id,
      word: row.words?.word,
      dictionary: null,
    }))
  }

  const payloadByWordId = new Map<string, any>()
  ;(rawRows ?? []).forEach((r: any) => {
    if (r?.word_id) payloadByWordId.set(r.word_id, r.payload ?? null)
  })

  // 3) saved_words と oxford_raw をマージして返す
  return (savedRows ?? []).map((row: any) => ({
    saved_id: row.id,
    word_id: row.word_id,
    word: row.words?.word,
    dictionary: payloadByWordId.get(row.word_id) ?? null,
  }))
}