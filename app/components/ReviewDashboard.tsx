'use client'

import { useState } from 'react'
import Button from '@/components/Button'
import TriDonutChart from '@/components/TriDonutChart'
import ChapterListItem from '@/components/ChapterListItem'
import { REVIEW_PERIODS, type ReviewPeriod } from '@/lib/reviewPeriod'

export type ReviewPeriodStats = {
  count: number
  mastered: number
  review: number
  hard: number
  unseen: number
}

const PERIOD_LABEL: Record<ReviewPeriod, string> = {
  yesterday: '昨日',
  week: '1週間',
  month: '1ヶ月',
  all: '全期間',
}

type Props = {
  initialPeriod: ReviewPeriod
  statsByPeriod: Record<ReviewPeriod, ReviewPeriodStats>
  onStart: (period: ReviewPeriod) => void
  onBack: () => void
}

/**
 * /quiz?period=X で開く「復習デッキ」の入口画面。
 * デッキ画面 (/decks/[id]) と同じ構造 (上にドーナツ + 下に章リスト) で、
 * 章 = 期間 (昨日 / 1週間 / 1ヶ月 / 全期間) を縦に並べる。
 * Dashboard の復習カードから初期の期間が選択済みで渡ってくる。
 * スタートボタンで初めてクイズが開始される (自動開始しない)。
 */
export default function ReviewDashboard({ initialPeriod, statsByPeriod, onStart, onBack }: Props) {
  const [selected, setSelected] = useState<ReviewPeriod>(initialPeriod)
  const current = statsByPeriod[selected]

  return (
    <div className="flex flex-col bg-white" style={{ height: '100dvh' }}>
      <header className="h-10 bg-white border-b border-line shadow-[0_1px_1px_rgba(0,0,0,0.05)] flex items-center px-2 shrink-0">
        <Button onClick={onBack} variant="secondary" size="sm">戻る</Button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[700px] mx-auto px-4 pt-6 pb-4 w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-line p-6 mb-4">
            <p className="text-xs text-gray-500 text-center mb-4">
              期間を選んで、その期間に学習した単語を復習できます
            </p>

            <div className="flex justify-center mb-6">
              <TriDonutChart
                mastered={current.mastered}
                review={current.review}
                hard={current.hard}
                unseen={current.unseen}
                size={234}
              />
            </div>

            <p className="text-sm font-semibold text-gray-400 mb-3">期間</p>
            <div className="rounded-xl border border-line overflow-hidden">
              <div className="flex flex-col divide-y divide-line">
                {REVIEW_PERIODS.map((period, i) => {
                  const s = statsByPeriod[period]
                  return (
                    <ChapterListItem
                      key={period}
                      chapterNo={i + 1}
                      label={PERIOD_LABEL[period]}
                      mastered={s.mastered}
                      total={s.count}
                      highlighted={period === selected}
                      onClick={() => setSelected(period)}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          <Button
            onClick={() => onStart(selected)}
            disabled={current.count === 0}
            variant="primary"
            size="lg"
            fullWidth
          >
            スタート ({current.count}語)
          </Button>
        </div>
      </div>
    </div>
  )
}
