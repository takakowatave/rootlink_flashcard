'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type MasteryStats = {
  unlearned: number
  needs_review: number
  mastered: number
  total: number
}

function DonutChart({ stats }: { stats: MasteryStats }) {
  const { mastered, needs_review, unlearned, total } = stats
  if (total === 0) return null

  const masteredPct = mastered / total
  const reviewPct = needs_review / total

  const r = 80
  const cx = 100
  const cy = 100
  const C = 2 * Math.PI * r

  const masteredLen = masteredPct * C
  const reviewLen = reviewPct * C
  const unlearnedLen = C - masteredLen - reviewLen

  // strokeDashoffset: 12時スタート = C*0.25、各セグメントは前の長さ分ずらす
  const masteredPct100 = Math.round(masteredPct * 100)

  return (
    <div className="relative flex items-center justify-center">
      <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
        {/* 背景（グレー全周） */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="20" />

        {/* 未習得（薄グレー）- 一番下に描画 */}
        {unlearnedLen > 0 && (
          <circle
            cx={cx} cy={cy} r={r}
            fill="none" stroke="#d1d5db" strokeWidth="20"
            strokeDasharray={`${unlearnedLen} ${C - unlearnedLen}`}
            strokeDashoffset={C - (masteredLen + reviewLen)}
          />
        )}

        {/* 要復習（オレンジ） */}
        {reviewLen > 0 && (
          <circle
            cx={cx} cy={cy} r={r}
            fill="none" stroke="#FF7B3A" strokeWidth="20"
            strokeDasharray={`${reviewLen} ${C - reviewLen}`}
            strokeDashoffset={C - masteredLen}
          />
        )}

        {/* 習得済（緑） - 一番上に描画 */}
        {masteredLen > 0 && (
          <circle
            cx={cx} cy={cy} r={r}
            fill="none" stroke="#00AD82" strokeWidth="20"
            strokeDasharray={`${masteredLen} ${C - masteredLen}`}
            strokeDashoffset={C}
          />
        )}
      </svg>
      {/* 中央テキスト */}
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-gray-900">{masteredPct100}<span className="text-lg font-medium text-gray-400">%</span></span>
        <span className="text-xs text-gray-400 mt-0.5">習得済</span>
      </div>
    </div>
  )
}

export default function QuizDashboard({ onStart, onBack }: { onStart: (mode: 'all' | 'review') => void, onBack: () => void }) {
  const [stats, setStats] = useState<MasteryStats>({ unlearned: 0, needs_review: 0, mastered: 0, total: 0 })
  const [savedTotal, setSavedTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return

      // 保存単語総数
      const { count } = await supabase
        .from('saved_words')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', auth.user.id)
      setSavedTotal(count ?? 0)

      // mastery集計
      const { data: mastery } = await supabase
        .from('word_mastery')
        .select('status')
        .eq('user_id', auth.user.id)
        .limit(5000)

      const masteryMap = { unlearned: 0, needs_review: 0, mastered: 0 }
      for (const row of mastery ?? []) {
        if (row.status in masteryMap) masteryMap[row.status as keyof typeof masteryMap]++
      }

      const learned = masteryMap.needs_review + masteryMap.mastered
      const unlearned = Math.max(0, (count ?? 0) - learned)

      setStats({
        unlearned,
        needs_review: masteryMap.needs_review,
        mastered: masteryMap.mastered,
        total: count ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">読み込み中...</div>
      </div>
    )
  }

  if (savedTotal === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 px-4">
        <p className="text-gray-400 text-sm text-center">単語リストに単語を保存するとクイズができます</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ minHeight: '100dvh' }}>
      {/* ヘッダー */}
      <header className="h-10 bg-white border-b border-[#e2e8f0] shadow-[0_1px_1px_rgba(0,0,0,0.05)] flex items-center px-2 shrink-0">
        <button
          onClick={onBack}
          className="h-8 px-4 rounded-full border border-[#009689] text-[#009689] text-xs font-medium hover:bg-[#cbfbf1] transition-colors"
        >
          戻る
        </button>
      </header>

    <div className="max-w-md mx-auto px-4 py-8 w-full">
      {/* ドーナツグラフ */}
      <div className="flex justify-center mb-6">
        <DonutChart stats={stats} />
      </div>

      {/* 統計 */}
      <div className="flex justify-around mb-8">
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl font-bold text-gray-800">{stats.unlearned}<span className="text-sm font-normal text-gray-400 ml-0.5">問</span></span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-300" />
            <span className="text-xs text-gray-400">未習得</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl font-bold text-gray-800">{stats.needs_review}<span className="text-sm font-normal text-gray-400 ml-0.5">問</span></span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#FF7B3A]" />
            <span className="text-xs text-gray-400">要復習</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl font-bold text-gray-800">{stats.mastered}<span className="text-sm font-normal text-gray-400 ml-0.5">問</span></span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#00AD82]" />
            <span className="text-xs text-gray-400">習得済</span>
          </div>
        </div>
      </div>

      {/* ボタン */}
      <div className="flex gap-3">
        <button
          onClick={() => onStart('all')}
          className="flex-1 py-4 rounded-2xl border border-[#009689] text-[#009689] font-bold text-base active:scale-95 transition-all hover:bg-[#cbfbf1]"
        >
          ランダム
        </button>
        <button
          onClick={() => onStart('review')}
          disabled={stats.needs_review === 0}
          className="flex-1 py-4 rounded-2xl bg-[#009689] text-white font-bold text-base active:scale-95 transition-all hover:bg-[#007a6f] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          復習 {stats.needs_review}問
        </button>
      </div>
    </div>
    </div>
  )
}
