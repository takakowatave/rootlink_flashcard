'use client'

import { useEffect, useState } from 'react'
import { HiQuestionMarkCircle } from 'react-icons/hi'
import { BsX } from 'react-icons/bs'

const CATEGORIES: { label: string; dot: string; desc: string }[] = [
  { label: '未習得', dot: 'bg-gray-300',    desc: 'まだクイズで出題されていない単語' },
  { label: '要復習', dot: 'bg-quiz-review', desc: '直前のクイズで間違えた単語' },
  { label: '習得済', dot: 'bg-primary',     desc: '直前のクイズで正解した単語' },
  { label: '苦手',   dot: 'bg-[#C70036]',   desc: 'これまでに2回以上間違えた単語' },
]

export default function QuizStatusHelp() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-primary hover:opacity-80 leading-none"
        aria-label="ステータスの見方を開く"
      >
        <HiQuestionMarkCircle className="size-5" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 text-gray-400"
              aria-label="閉じる"
            >
              <BsX size={24} />
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-4">ステータスの見方</h2>
            <ul className="flex flex-col gap-4">
              {CATEGORIES.map(c => (
                <li key={c.label} className="flex items-start gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${c.dot}`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{c.label}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{c.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
