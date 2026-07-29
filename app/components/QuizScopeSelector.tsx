'use client'

import { HiSparkles, HiBookOpen, HiArrowPath, HiFire } from 'react-icons/hi2'
import type { ReactNode } from 'react'

export type QuizScope = 'all' | 'unseen' | 'review' | 'hard'

export type QuizScopeItem = {
  key: QuizScope
  count: number
}

const META: Record<QuizScope, { label: string; icon: ReactNode; selectedClass: string; iconColor: string }> = {
  all: {
    label: 'ランダム',
    icon: <HiSparkles className="size-5" />,
    selectedClass: 'border-primary bg-primary-subtle',
    iconColor: 'text-primary',
  },
  unseen: {
    label: '未学習',
    icon: <HiBookOpen className="size-5" />,
    selectedClass: 'border-gray-400 bg-gray-50',
    iconColor: 'text-gray-500',
  },
  review: {
    label: '要復習',
    icon: <HiArrowPath className="size-5" />,
    selectedClass: 'border-quiz-review bg-orange-50',
    iconColor: 'text-quiz-review',
  },
  hard: {
    label: '苦手',
    icon: <HiFire className="size-5" />,
    selectedClass: 'border-red-400 bg-red-50',
    iconColor: 'text-red-500',
  },
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
              isSelected ? meta.selectedClass : 'border-line bg-white'
            }`}
          >
            <div className={`flex justify-center mb-1.5 ${isSelected ? meta.iconColor : 'text-gray-400'}`}>{meta.icon}</div>
            <p className={`font-semibold text-sm ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>{meta.label}</p>
            <p className="text-xs mt-0.5 text-gray-500">{item.count}問</p>
          </button>
        )
      })}
    </div>
  )
}
