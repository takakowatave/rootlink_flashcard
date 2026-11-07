'use client'

import { useDisplayLocale } from '@/lib/useDisplayLocale'
import { messages } from '@/lib/i18n/messages'

export type QuizScope = 'all' | 'unseen' | 'review' | 'hard' | 'recent'

export type QuizScopeItem = {
  key: QuizScope
  count: number
}

export default function QuizScopeSelector({
  items, selected, onChange,
}: {
  items: QuizScopeItem[]
  selected: QuizScope
  onChange: (scope: QuizScope) => void
}) {
  const locale = useDisplayLocale()
  const q = messages[locale].quiz

  const labelOf = (key: QuizScope): string => {
    switch (key) {
      case 'all':    return q.scopeAll
      case 'recent': return q.scopeRecent
      case 'unseen': return q.scopeUnseen
      case 'review': return q.scopeReview
      case 'hard':   return q.scopeHard
    }
  }

  return (
    <div className="quiz-scope-scroll flex gap-3 overflow-x-auto -mx-4 px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
      <style>{`.quiz-scope-scroll::-webkit-scrollbar { display: none; }`}</style>
      {items.map((item) => {
        const label = labelOf(item.key)
        const isSelected = selected === item.key
        const isEmpty = item.count === 0
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            disabled={isEmpty}
            className={`flex-shrink-0 w-[104px] py-3 px-2 rounded-2xl border-2 text-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              isSelected ? 'border-primary bg-primary-subtle' : 'border-line bg-white'
            }`}
          >
            <p className={`font-semibold text-sm ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>{label}</p>
            <p className="text-xs mt-0.5 text-gray-500">{item.count}{q.scopeItemsSuffix}</p>
          </button>
        )
      })}
    </div>
  )
}
