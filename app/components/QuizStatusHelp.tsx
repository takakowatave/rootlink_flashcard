'use client'

import { useEffect, useState } from 'react'
import { HiQuestionMarkCircle } from 'react-icons/hi'
import { BsX } from 'react-icons/bs'
import { useDisplayLocale } from '@/lib/useDisplayLocale'

export default function QuizStatusHelp() {
  const [open, setOpen] = useState(false)
  const locale = useDisplayLocale()
  const L = locale === 'en'
    ? {
        aria: 'Open status guide',
        close: 'Close',
        title: 'What each status means',
        cats: [
          { label: 'New',      dot: 'bg-line',        desc: 'Words you have not been quizzed on yet' },
          { label: 'Review',   dot: 'bg-quiz-review', desc: 'Words you got wrong in your last session' },
          { label: 'Mastered', dot: 'bg-primary-mid', desc: 'Words you got right in your last session' },
          { label: 'Tough',    dot: 'bg-quiz-hard',   desc: 'Words you have missed 2 or more times' },
        ],
      }
    : {
        aria: 'ステータスの見方を開く',
        close: '閉じる',
        title: 'ステータスの見方',
        cats: [
          { label: '未習得', dot: 'bg-line',        desc: 'まだ出題されていない単語' },
          { label: '要復習', dot: 'bg-quiz-review', desc: '直前の復習で間違えた単語' },
          { label: '習得済', dot: 'bg-primary-mid', desc: '直前の復習で正解した単語' },
          { label: '苦手',   dot: 'bg-quiz-hard',   desc: 'これまでに2回以上間違えた単語' },
        ],
      }

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
        aria-label={L.aria}
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
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-primary-subtle text-gray-400"
              aria-label={L.close}
            >
              <BsX size={24} />
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-4">{L.title}</h2>
            <ul className="flex flex-col gap-4">
              {L.cats.map(c => (
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
