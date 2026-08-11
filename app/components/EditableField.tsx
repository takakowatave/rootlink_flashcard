"use client";

import { useState } from "react";
import { TextInput } from "./TextInput";
import Button from "./Button";

interface Props {
  label: string;
  value: string;
  placeholder?: string;
  type?: "text" | "email";
  helperText?: string;
  disabled?: boolean;
  editLabel?: string;
  saveLabel?: string;
  cancelLabel?: string;
  emptyLabel?: string;
  validate?: (draft: string) => string | undefined;
  onSave: (draft: string) => Promise<void> | void;
}

export default function EditableField({
  label,
  value,
  placeholder,
  type = "text",
  helperText,
  disabled,
  editLabel = "変更",
  saveLabel = "保存",
  cancelLabel = "キャンセル",
  emptyLabel = "—",
  validate,
  onSave,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const startEdit = () => {
    setDraft(value);
    setError(undefined);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setError(undefined);
  };

  const save = async () => {
    if (validate) {
      const message = validate(draft);
      if (message) {
        setError(message);
        return;
      }
    }
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
      setError(undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-3 py-4 border-b border-line last:border-b-0">
        <label className="text-sm text-gray-600">{label}</label>
        <TextInput
          type={type}
          value={draft}
          placeholder={placeholder}
          helperText={helperText}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          error={error ? { type: "manual", message: error } : undefined}
        />
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="tertiary" size="sm" onClick={cancel} disabled={saving}>
            {cancelLabel}
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={save} disabled={saving}>
            {saving ? "保存中..." : saveLabel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-4 border-b border-line last:border-b-0">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-4">
        <div className="text-sm text-gray-600 md:flex-shrink-0 md:w-40">{label}</div>
        <div className="flex items-center justify-between gap-3 md:flex-1 md:justify-end">
          <p className="flex-1 text-base text-gray-900 truncate md:flex-none">
            {value || emptyLabel}
          </p>
          {!disabled && (
            <button
              type="button"
              onClick={startEdit}
              className="text-sm font-bold text-primary hover:underline whitespace-nowrap"
            >
              {editLabel}
            </button>
          )}
        </div>
      </div>
      {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  );
}
