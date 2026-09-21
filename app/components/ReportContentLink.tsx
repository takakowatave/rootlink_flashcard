'use client'

import { useState } from 'react'
import { HiOutlineFlag } from 'react-icons/hi2'
import ReportContentModal from './ReportContentModal'

type Props = {
  kind: 'word' | 'phrase'
  content: string
}

// 単語/フレーズ詳細ページの末尾に置く「この内容を報告」導線。
// トリガー (text link) と ReportContentModal の open state を1コンポーネントに
// まとめて、呼び出し側は content と kind を渡すだけにする。
export default function ReportContentLink({ kind, content }: Props) {
  const [open, setOpen] = useState(false)
  const kindLabel = kind === 'word' ? '単語' : 'フレーズ'

  return (
    <>
      <div className="w-full mx-auto max-w-[600px] px-4 mt-3 mb-6 flex justify-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-gray-700 transition-colors"
        >
          <HiOutlineFlag className="size-4" />
          この{kindLabel}の内容を報告
        </button>
      </div>
      <ReportContentModal
        open={open}
        onClose={() => setOpen(false)}
        kind={kind}
        content={content}
      />
    </>
  )
}
