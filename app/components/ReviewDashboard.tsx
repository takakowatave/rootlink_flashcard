'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'
import QuizProgressPanel from '@/components/QuizProgressPanel'
import type { QuizScope } from '@/components/QuizScopeSelector'
import type { QuizSettings } from '@/lib/quizSettings'
import type { ReviewPeriod } from '@/lib/reviewPeriod'
import { useDisplayLocale } from '@/lib/useDisplayLocale'
import { messages } from '@/lib/i18n/messages'

export type ReviewPeriodStats = {
  mastered: number
  review: number
  hard: number
  unseen: number
  /** 出題範囲 chips 用の件数。他デッキと同じ 4 スコープ */
  scopes: { all: number; unseen: number; review: number; hard: number }
}

const PERIOD_LABEL_JA: Record<ReviewPeriod, string> = {
  yesterday: '昨日',
  week: '1週間',
  month: '1ヶ月',
  all: '全期間',
}

const PERIOD_LABEL_EN: Record<ReviewPeriod, string> = {
  yesterday: 'Yesterday',
  week: 'Past 7 days',
  month: 'Past 30 days',
  all: 'All time',
}

type Props = {
  period: ReviewPeriod
  stats: ReviewPeriodStats
  settings: QuizSettings
  onSettingChange: <K extends keyof QuizSettings>(key: K, value: QuizSettings[K]) => void
  onStart: (scope: QuizScope) => void
}

/**
 * /quiz?period=X の着地画面。他デッキの章画面と同じ構造 (PageHeader でパンくず +
 * QuizProgressPanel で donut + 出題範囲 chips + 問題数設定 + はじめる) に揃える。
 * 期間 (昨日/週/月/全) ごとに母集団を変え、出題範囲 (ランダム/未習得/要復習/苦手)
 * を他デッキと同じ UI で選べる。問題数ステッパー・音声設定も同じ。
 */
export default function ReviewDashboard({ period, stats, settings, onSettingChange, onStart }: Props) {
  const locale = useDisplayLocale()
  const commonCopy = messages[locale].common
  const dashCopy = messages[locale].dashboard
  const quizSessionCopy = messages[locale].quizSession
  const PERIOD_LABEL = locale === 'en' ? PERIOD_LABEL_EN : PERIOD_LABEL_JA
  const reviewLabel = dashCopy.reviewTitle
  const [scope, setScope] = useState<QuizScope>('all')

  // scope が 0 件なら 'all' にフォールバック (他デッキと同じ振る舞い)
  useEffect(() => {
    if (stats.scopes[scope === 'recent' ? 'all' : scope] === 0 && stats.scopes.all > 0) {
      setScope('all')
    }
  }, [stats, scope])

  const breadcrumb = [
    { label: commonCopy.home, href: '/' },
    { label: reviewLabel },
    { label: PERIOD_LABEL[period] },
  ]

  const currentCount = scope === 'recent' ? stats.scopes.all : stats.scopes[scope]

  return (
    <>
      <PageHeader
        items={breadcrumb}
        showSearch={false}
        title={`${reviewLabel} / ${PERIOD_LABEL[period]}`}
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
        buttonLabel={quizSessionCopy.howToStart}
        buttonDisabled={currentCount === 0}
        onStart={() => onStart(scope)}
        settings={currentCount > 0 ? {
          defaultMode: settings.defaultMode,
          onDefaultModeChange: (v) => onSettingChange('defaultMode', v),
          questionCount: settings.questionCount,
          onQuestionCountChange: (v) => onSettingChange('questionCount', v),
          questionCountMax: Math.max(5, Math.min(100, currentCount)),
          questionCountMin: 5,
          autoPlayAudio: settings.autoPlayAudio,
          onAutoPlayAudioChange: (v) => onSettingChange('autoPlayAudio', v),
          autoPlayHeadword: settings.autoPlayHeadword,
          onAutoPlayHeadwordChange: (v) => onSettingChange('autoPlayHeadword', v),
        } : undefined}
      />
    </>
  )
}
