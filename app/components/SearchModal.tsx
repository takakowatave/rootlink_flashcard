"use client";

import { useEffect } from "react";
import type { SearchFormProps } from "../types/SearchFormProps";

/**
 * SearchModal
 * - SP（モバイル）専用の検索モーダル
 * - PCでは表示しない（FAB経由でのみ使用）
 * - FAB → このモーダル → 検索実行 → /word/[word] に遷移
 */
export type SearchModalProps = Pick<
  SearchFormProps,
  "input" | "onInputChange" | "onSearch" | "error" | "isLoading" | "formRef"
> & {
  isOpen: boolean;        // モーダル表示制御
  onClose: () => void;    // 閉じる
  inputRef: React.RefObject<HTMLInputElement | null>;
};

const SearchModal = ({
  input,
  isOpen,
  onInputChange,
  onSearch,
  error,
  isLoading,
  onClose,
  formRef,
  inputRef,
}: SearchModalProps) => {
  // モーダル表示時に即フォーカス（SP UX用）
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen, inputRef]);

  if (!isOpen) return null;

  return (
    <>
      {/* overlay（SPのみ想定） */}
      <div className="fixed inset-0 bg-black/40 z-40 md:hidden" />

      {/* bottom sheet */}
      <div className="fixed bottom-0 left-0 w-full bg-white shadow-md p-4 z-50 md:hidden">
        <button
          className="text-blue-600 mb-4"
          onClick={onClose}
        >
          閉じる
        </button>
      </div>
    </>
  );
};

export default SearchModal;
