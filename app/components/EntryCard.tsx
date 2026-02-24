'use client'

import type { ReactNode } from 'react'

type Pronunciation = {
  lang: string
}

type Props = {
  headword: string
  pronunciation?: Pronunciation
  isBookmarked: boolean
  onSave?: () => void | Promise<void>
  searchForm?: ReactNode
  children: ReactNode
}

export default function EntryCard({
  headword,
  pronunciation,
  isBookmarked,
  onSave,
  searchForm,
  children,
}: Props) {
  return (
    <div className="max-w-2xl mx-auto mt-6 px-4">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">
              Entry
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {headword}
            </h1>
            {pronunciation && (
              <p className="mt-1 text-sm text-gray-500">
                /{pronunciation.lang}/
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {searchForm}
            {onSave && (
              <button
                type="button"
                onClick={onSave}
                className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <span
                  className={
                    'mr-1 text-lg ' +
                    (isBookmarked ? 'text-yellow-400' : 'text-gray-300')
                  }
                >
                  ★
                </span>
                {isBookmarked ? '保存済み' : '保存'}
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-4">
          {children}
        </div>
      </div>
    </div>
  )
}