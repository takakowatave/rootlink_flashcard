'use client'

import { HiBookmark, HiOutlineBookmark } from 'react-icons/hi2'
import { POS_LABEL_JA } from '@/lib/pos'

type Props = {
  word: string
  pos?: string
  meaningJa?: string
  isSaved: boolean
  onToggleSave?: (word: string) => void
}

export default function SavedWordRow({ word, pos, meaningJa, isSaved, onToggleSave }: Props) {
  return (
    <div className="bg-white border-2 border-line rounded-lg px-2 py-2 flex items-center gap-2 w-full h-[52px]">
      <span className="text-base font-medium text-gray-950 leading-6 shrink-0">{word}</span>
      {pos && (
        <span className="border border-muted rounded-full px-2 py-1 text-xs font-medium text-muted shrink-0">
          {POS_LABEL_JA[pos] ?? pos}
        </span>
      )}
      <span className="flex-1 min-w-0 text-sm text-muted leading-5 truncate">
        {meaningJa ?? ''}
      </span>
      <button
        type="button"
        aria-label={isSaved ? '保存済み' : '保存'}
        onClick={() => onToggleSave?.(word)}
        className="shrink-0 p-2 -mr-1"
      >
        {isSaved
          ? <HiBookmark className="size-6 text-muted" />
          : <HiOutlineBookmark className="size-6 text-primary" />}
      </button>
    </div>
  )
}
