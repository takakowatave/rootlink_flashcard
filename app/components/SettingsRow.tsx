"use client";

import { ReactNode } from "react";

interface Props {
  label: ReactNode;
  children: ReactNode;
  helperText?: ReactNode;
  /** true にすると編集ステート等で行全体を縦に展開する（左右分割しない）*/
  stacked?: boolean;
}

export default function SettingsRow({ label, children, helperText, stacked }: Props) {
  return (
    <div className="flex flex-col gap-2 py-4 border-b border-line last:border-b-0">
      {stacked ? (
        <>
          <div className="text-sm text-gray-600">{label}</div>
          <div>{children}</div>
        </>
      ) : (
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-4">
          <div className="text-sm text-gray-600 md:flex-shrink-0 md:w-40">{label}</div>
          <div className="flex items-center justify-between gap-3 md:flex-1 md:justify-end">
            {children}
          </div>
        </div>
      )}
      {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  );
}
