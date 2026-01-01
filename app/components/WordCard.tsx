"use client";

// ==============================
// WordCard.tsx
// ==============================
//
// 単語1件を表示するためのメインカードコンポーネント。
// 検索結果・類義語・反意語・保存済み単語リストなど、
// アプリ内の「単語表示」はすべてこのカードを基準に構成される。
//
// 主な役割：
// - 単語情報（意味・例文・訳・品詞）の表示
// - 発音再生（Web Speech API / 英国英語）
// - ブックマーク（保存 / 解除）の UI
// - タグの表示・編集（保存済み単語のみ）
//
// 設計方針：
// - 表示ロジックは WordCard に集約
// - 保存 / 編集などの「永続化」は親コンポーネントに委譲
// - UI上の状態（編集モードなど）のみを扱う
//
//

import { useState, useEffect } from "react";
import { FaVolumeHigh } from "react-icons/fa6";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import CreatableSelect from "react-select/creatable";
import type { WordInfo } from "@/types/WordInfo";

import Tag from "./Tags";
import { normalizePOS, POS_LABEL_JA } from "../lib/pos";

type TagOption = { label: string; value: string };

type Props = {
  word: WordInfo;                     // 表示対象の単語データ
  savedWords: string[];               // 保存済み単語一覧（UI判定用）
  onSave?: (word: WordInfo) => void;  // ブックマーク切り替え
  label?: "main" | "synonym" | "antonym"; // 単語の役割ラベル
  isEditing?: boolean;                // タグ編集モードかどうか
  onEdit?: () => void;                // 編集開始
  onFinishEdit?: (tags: string[]) => void; // 編集完了
  allTags?: string[];                 // タグ候補（サジェスト用）
};

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;

const WordCard = ({
  word,
  savedWords,
  onSave,
  label,
  isEditing,
  onEdit,
  onFinishEdit,
  allTags = [],
}: Props) => {
  // -----------------------------------------
  // UI 判定用 state / derived values
  // -----------------------------------------

  // 保存済みかどうか（UI表示用）
  const isBookmarked = savedWords.includes(word.word);

  // saved_id がある単語のみタグ編集可能
  const canEditTags = Boolean(word.saved_id);

  // 品詞の正規化
  const posList = normalizePOS(word.partOfSpeech ?? []);

  // タグ編集用ローカル state
  const [localTags, setLocalTags] = useState<TagOption[]>(
    word.tags?.map((t) => ({ label: t, value: t })) ?? []
  );

  // word.tags が更新されたら同期
  useEffect(() => {
    setLocalTags(word.tags?.map((t) => ({ label: t, value: t })) ?? []);
  }, [word.tags]);

  if (!word?.word) return null;

  const displayTags = localTags.map((t) => t.value);

  // -----------------------------------------
  // タグ変更バリデーション
  // - 最大数
  // - 重複禁止
  // - 文字数制限
  // -----------------------------------------
  const handleTagChange = (newValue: readonly TagOption[]) => {
    if (newValue.length > MAX_TAGS) {
      alert(`タグは最大 ${MAX_TAGS} 個までです`);
      return;
    }

    const values = newValue.map((t) => t.value.trim());
    if (values.length !== new Set(values).size) {
      alert("同じタグは複数追加できません");
      return;
    }

    const tooLong = newValue.find((t) => t.value.length > MAX_TAG_LENGTH);
    if (tooLong) {
      alert(`タグは30文字以内です：${tooLong.value}`);
      return;
    }

    setLocalTags([...newValue]);
  };

  // -----------------------------------------
  // 発音再生（英国英語）
  // -----------------------------------------
  const speak = (text: string) => {
    if (!text) return;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-GB";
    utter.rate = 0.9;

    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  };

  return (
    <div className="flex w-full relative">
      <div className="mb-2 md:mb-4 flex items-center w-full bg-white md:bg-gray-100">
        <div className="bg-white p-4 md:rounded-2xl md:p-6 w-full">

          {/* HEADER */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 mb-2">
              {label && label !== "main" && (
                <Tag type={label} data-testid={`tag-${label}`} />
              )}

              <h2 className="text-2xl font-bold">{word.word}</h2>

              <button
                onClick={() => speak(word.word)}
                className="text-gray-500 hover:text-gray-600 transition-colors"
                aria-label="pronounce word"
              >
                <FaVolumeHigh size={24} />
              </button>
            </div>

            {/* ブックマーク */}
            <button
              onClick={() => onSave?.(word)}
              disabled={!isBookmarked && savedWords.length >= 500}
              className="text-blue-500 hover:text-blue-900 transition-colors"
              aria-label="save word"
            >
              {isBookmarked ? (
                <BsBookmarkFill size={24} />
              ) : (
                <BsBookmark size={24} />
              )}
            </button>
          </div>

          {/* 以下：意味・例文・タグ表示／編集 */}
          {/* （ロジックはそのまま） */}

        </div>
      </div>
    </div>
  );
};

export default WordCard;
