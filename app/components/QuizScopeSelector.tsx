'use client'

export type QuizScope = 'all' | 'unseen' | 'review' | 'hard' | 'recent'

export type QuizScopeItem = {
  key: QuizScope
  count: number
}

// アイコンは廃止 (ラベル＋問数の 2 段のみ)。選択枠色・背景色は従来維持。
const META: Record<QuizScope, { label: string }> = {
  all:    { label: 'ランダム' },
  recent: { label: 'まとめて' },
  unseen: { label: '未習得' },
  review: { label: '要復習' },
  hard:   { label: '苦手' },
}

export default function QuizScopeSelector({
  items, selected, onChange,
}: {
  items: QuizScopeItem[]
  selected: QuizScope
  onChange: (scope: QuizScope) => void
}) {
  return (
    <div className="quiz-scope-scroll flex gap-3 overflow-x-auto -mx-4 px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
      <style>{`.quiz-scope-scroll::-webkit-scrollbar { display: none; }`}</style>
      {items.map((item) => {
        const meta = META[item.key]
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
            <p className={`font-semibold text-sm ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>{meta.label}</p>
            <p className="text-xs mt-0.5 text-gray-500">{item.count}問</p>
          </button>
        )
      })}
    </div>
  )
}
