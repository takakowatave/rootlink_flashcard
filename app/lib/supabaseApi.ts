import { supabase } from "./supabaseClient";
import type { WordInfo } from "@/types/WordInfo";

/* ------------------------------------------
  Supabase JOIN の戻り型（手動で型を定義）
------------------------------------------- */
type SavedWordTagRow = {
  tag: {
    name: string;
  } | null;
};

type JoinedWordRow = {
  id: string;
  word_id: string;
  words: {
    id: string;
    word: string;
    meaning: string;
    partOfSpeech: string;
    pronunciation: string;
    example: string;
    translation: string;
  }[];
  saved_word_tags: SavedWordTagRow[];
};

/* =========================================
 ① 単語を保存（words → saved_words）
========================================= */
export const saveWord = async (word: WordInfo): Promise<boolean> => {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return false;

  const { data: insertedWord, error: wordErr } = await supabase
    .from("words")
    .upsert(
      {
        id: word.word_id,
        word: word.word,
        meaning: word.meaning,
        partOfSpeech: word.partOfSpeech,
        pronunciation: word.pronunciation,
        example: word.example,
        translation: word.translation,
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (wordErr || !insertedWord) {
    console.log("words 保存エラー:", wordErr?.message);
    return false;
  }

  const { error: saveErr } = await supabase
    .from("saved_words")
    .insert({
      user_id: user.id,
      word_id: insertedWord.id,
      status: "saved",
    });

  if (saveErr) {
    console.log("保存エラー:", saveErr.message);
    return false;
  }

  return true;
};

/* =========================================
 ② 単語削除（saved_words）
========================================= */
export const deleteWord = async (word: WordInfo): Promise<boolean> => {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return false;

  const { error } = await supabase
    .from("saved_words")
    .delete()
    .eq("user_id", user.id)
    .eq("word_id", word.word_id);

  if (error) {
    console.log("削除エラー:", error.message);
    return false;
  }

  return true;
};

/* =========================================
 ③ 保存済みかチェック
========================================= */
export const checkIfWordExists = async (word: WordInfo): Promise<WordInfo | null> => {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("saved_words")
    .select(`
      id,
      word_id,
      words!inner (
        id,
        word,
        meaning,
        partOfSpeech,
        pronunciation,
        example,
        translation
      ),
      saved_word_tags (
        tag:tag_id ( name )
      )
    `)
    .eq("user_id", user.id)
    .eq("word_id", word.word_id)
    .maybeSingle();

  if (error || !data) return null;

  // 型の強制（Supabase の誤推論を修正）
  const row = data as unknown as JoinedWordRow;

  const w = Array.isArray(row.words) ? row.words[0] : row.words;

  return {
    saved_id: row.id,
    word_id: row.word_id,
  
    word: w.word,
    meaning: w.meaning,
    example: w.example,
    translation: w.translation,
  
    partOfSpeech: Array.isArray(w.partOfSpeech)
      ? w.partOfSpeech
      : [w.partOfSpeech], // ← ★ 修正ポイント
  
    pronunciation: w.pronunciation,
  
    tags:
      row.saved_word_tags
        ?.map((t) => t.tag?.name)
        .filter((name): name is string => Boolean(name)) ?? [],
  };
  
};

/* =========================================
 ④ 保存 or 削除（トグル）
========================================= */
export const toggleSaveStatus = async (word: WordInfo, isSaved: boolean) => {
  if (isSaved) {
    const success = await deleteWord(word);
    return { success, word };
  }

  const success = await saveWord(word);
  return { success, word };
};

/* =========================================
 ⑤ 保存単語一覧を取得（JOIN 完全版）
========================================= */
export const fetchWordlists = async (userId: string): Promise<WordInfo[]> => {
  const { data, error } = await supabase
    .from("saved_words")
    .select(`
      id,
      word_id,
      words!inner (
        id,
        word,
        meaning,
        partOfSpeech,
        pronunciation,
        example,
        translation
      ),
      saved_word_tags (
        tag:tag_id ( name )
      )
    `)
    .eq("user_id", userId);

  if (error || !data) return [];

  // Supabase の JOIN の戻り型を正しく扱う
  const rows = data as unknown as JoinedWordRow[];

  return rows.map((row) => {
    const w = Array.isArray(row.words) ? row.words[0] : row.words;
  
    return {
      saved_id: row.id,
      word_id: row.word_id,
  
      word: w.word,
      meaning: w.meaning,
      partOfSpeech: Array.isArray(w.partOfSpeech)
        ? w.partOfSpeech
        : [w.partOfSpeech], // ← ★ 修正ポイント
  
      pronunciation: w.pronunciation,
      example: w.example,
      translation: w.translation,
  
      tags:
        row.saved_word_tags
          ?.map((t) => t.tag?.name)
          .filter((name): name is string => Boolean(name)) ?? [],
  
      label: "main",
    };
  });
  
};
