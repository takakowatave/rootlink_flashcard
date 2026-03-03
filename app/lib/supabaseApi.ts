import { supabase } from "./supabaseClient";
import type { WordInfo } from "@/types/WordInfo";

/* =========================================
 ① 保存トグル
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

  // ② 無ければ作る（辞書データも保存）
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

    /* =========================
       辞書データ保存
    ========================= */
    if (word.senses) {
      for (const [pos, senseList] of Object.entries(word.senses)) {
        // lexical_entries insert
        const { error: leInsertError } = await supabase
          .from("lexical_entries")
          .insert({
            word_id: wordId,
            part_of_speech: pos,
          });

        if (leInsertError) {
          console.error("lexical_entries insert error:", leInsertError);
          continue;
        }

        // id再取得（INSERTと分離）
        const { data: lexicalEntry, error: leSelectError } =
          await supabase
            .from("lexical_entries")
            .select("id")
            .eq("word_id", wordId)
            .eq("part_of_speech", pos)
            .order("id", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (leSelectError || !lexicalEntry) {
          console.error("lexical_entries select error:", leSelectError);
          continue;
        }

        // senses insert
        for (let i = 0; i < senseList.length; i++) {
          const sense = senseList[i];

          const { error: senseError } = await supabase
            .from("senses")
            .insert({
              lexical_entry_id: lexicalEntry.id,
              definition_en: sense.meaning,
              example_en: sense.example ?? null,
              sense_order: i + 1,
            });

          if (senseError) {
            console.error("senses insert error:", senseError);
          }
        }
      }
    }
  } else {
    wordId = existingWord.id;
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
  const { error: saveError } = await supabase
    .from("saved_words")
    .insert({
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
 ② 保存一覧取得
========================================= */
export const fetchWordlists = async (
  userId: string
): Promise<WordInfo[]> => {
  const { data, error } = await supabase
    .from("saved_words")
    .select(`
      id,
      word_id,
      words (
        id,
        word,
        lexical_entries (
          id,
          part_of_speech,
          senses (
            id,
            definition_en,
            example_en,
            sense_order
          )
        )
      )
    `)
    .eq("user_id", userId);

  if (error) {
    console.error("fetchWordlists error:", error);
    return [];
  }

  return (data ?? []).map((row: any) => {
    const grouped: Record<string, any[]> = {};

    row.words?.lexical_entries?.forEach((le: any) => {
      const pos = le.part_of_speech ?? "unknown";

      const sorted = [...(le.senses ?? [])].sort(
        (a, b) => (a.sense_order ?? 0) - (b.sense_order ?? 0)
      );

      if (!grouped[pos]) grouped[pos] = [];

      sorted.forEach((s: any) => {
        grouped[pos].push({
          meaning: s.definition_en,
          example: s.example_en,
        });
      });
    });

    return {
      saved_id: row.id,
      word_id: row.word_id,
      word: row.words?.word,
      senses: grouped,
    };
  });
};