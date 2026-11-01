'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'
import QuizProgressPanel from '@/components/QuizProgressPanel'
import type { QuizScope } from '@/components/QuizScopeSelector'
import type { ReviewPeriod } from '@/lib/reviewPeriod'

export type ReviewPeriodStats = {
  mastered: number
  review: number
  hard: number
  unseen: number
  /** 出題範囲 chips 用の件数。他デッキと同じ 4 スコープ */
  scopes: { all: number; unseen: number; review: number; hard: number }
}

const PERIOD_LABEL: Record<ReviewPeriod, string> = {
  yesterday: '昨日',
  week: '1週間',
  month: '1ヶ月',
  all: '全期間',
}

type Props = {
  period: ReviewPeriod
  stats: ReviewPeriodStats
  onStart: (scope: QuizScope) => void
}

/**
 * /quiz?period=X の着地画面。他デッキの章画面と同じ構造 (PageHeader でパンくず +
 * QuizProgressPanel で donut + 出題範囲 chips + 設定 + はじめる) に揃える。
 * 期間 (昨日/週/月/全) ごとに母集団を変え、出題範囲 (ランダム/未習得/要復習/苦手)
 * を他デッキと同じ UI で選べる。
 */
export default function ReviewDashboard({ period, stats, onStart }: Props) {
  const [scope, setScope] = useState<QuizScope>('all')

  // scope が 0 件なら 'all' にフォールバック (他デッキと同じ振る舞い)
  useEffect(() => {
    if (stats.scopes[scope === 'recent' ? 'all' : scope] === 0 && stats.scopes.all > 0) {
      setScope('all')
    }
  }, [stats, scope])

  const breadcrumb = [
    { label: 'ホーム', href: '/' },
    { label: '復習' },
    { label: PERIOD_LABEL[period] },
  ]

  const currentCount = scope === 'recent' ? stats.scopes.all : stats.scopes[scope]

  return (
    <>
      <PageHeader
        items={breadcrumb}
        showSearch={false}
        title={`復習 / ${PERIOD_LABEL[period]}`}
      />
      <QuizProgressPanel
        mastered={stats.mastered}
        review={stats.review}
        hard={stats.hard}
        unseen={stats.unseen}
        scopeItems={[
          { key: 'all', count: stats.scopes.all },
          { key: 'unseen', count: stats.scopes.unseen },
          { key: 'review', count: stats.scopes.review },
          { key: 'hard', count: stats.scopes.hard },
        ]}
        selectedScope={scope}
        onScopeChange={setScope}
        buttonLabel="はじめる"
        buttonDisabled={currentCount === 0}
        onStart={() => onStart(scope)}
      />
    </>
  )
}
