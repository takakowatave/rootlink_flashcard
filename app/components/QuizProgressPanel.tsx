'use client'

import type { ReactNode } from 'react'
import CardShell from '@/components/CardShell'
import TriDonutChart from '@/components/TriDonutChart'
import QuizScopeSelector, { type QuizScope, type QuizScopeItem } from '@/components/QuizScopeSelector'
import Button from '@/components/Button'

type Props = {
  header?: ReactNode
  mastered: number
  review: number
  unseen: number
  scopeItems?: QuizScopeItem[]
  selectedScope?: QuizScope
  onScopeChange?: (scope: QuizScope) => void
  buttonLabel: string
  buttonDisabled?: boolean
  onStart: () => void
}

export default function QuizProgressPanel({
  header,
  mastered,
  review,
  unseen,
  scopeItems,
  selectedScope,
  onScopeChange,
  buttonLabel,
  buttonDisabled,
  onStart,
}: Props) {
  const hasScope =
    scopeItems && selectedScope && onScopeChange && scopeItems.some(i => i.count > 0)

  return (
    <>
      <CardShell>
        {header && <div className="mb-2">{header}</div>}
        <div className="flex justify-center py-2">
          <TriDonutChart mastered={mastered} review={review} unseen={unseen} />
        </div>
        {hasScope && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-400 mb-2">出題範囲</p>
            <QuizScopeSelector
              items={scopeItems!}
              selected={selectedScope!}
              onChange={onScopeChange!}
            />
          </div>
        )}
      </CardShell>
      <div className="mx-auto max-w-[600px] md:px-4 mt-2 mb-6">
        <Button
          onClick={onStart}
          disabled={buttonDisabled}
          variant="primary"
          size="lg"
          fullWidth
        >
          {buttonLabel}
        </Button>
      </div>
    </>
  )
}
