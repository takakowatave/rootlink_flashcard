import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import QuizClient from '@/quiz/QuizClient'
import type { ReviewPeriod } from '@/lib/reviewPeriod'

type Params = { params: { period: string } }

const VALID: ReviewPeriod[] = ['yesterday', 'week', 'month', 'all']

export default function ReviewPeriodPage({ params }: Params) {
  const period = params.period as ReviewPeriod
  if (!VALID.includes(period)) notFound()
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-400">読み込み中...</div>}>
      <QuizClient initialPeriodProp={period} />
    </Suspense>
  )
}
