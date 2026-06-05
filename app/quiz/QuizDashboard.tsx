'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type MasteryStats = {
  unlearned: number
  needs_review: number
  mastered: number
  total: number
}

type QuizMode = 'all' | 'review'

function DonutChart({ stats }: { stats: MasteryStats }) {
  const { mastered, needs_review, total } = stats
  if (total === 0) return null

  const r = 80
  const cx = 100
  const cy = 100
  const C = 2 * Math.PI * r

  const masteredLen = (mastered / total) * C
  const reviewLen = (needs_review / total) * C
  const unlearnedLen = C - masteredLen - reviewLen
  const masteredPct100 = Math.round((mastered / total) * 100)

  return (
    <div className="relative flex items-center justify-center">
      <svg width="180" height="180" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="18" />
        {unlearnedLen > 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#d1d5db" strokeWidth="18"
            strokeDasharray={`${unlearnedLen} ${C - unlearnedLen}`}
            strokeDashoffset={C - (masteredLen + reviewLen)} />
        )}
        {reviewLen > 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#FF7B3A" strokeWidth="18"
            strokeDasharray={`${reviewLen} ${C - reviewLen}`}
            strokeDashoffset={C - masteredLen} />
        )}
        {masteredLen > 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#00AD82" strokeWidth="18"
            strokeDasharray={`${masteredLen} ${C - masteredLen}`}
            strokeDashoffset={C} />
        )}
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-gray-900">{masteredPct100}<span className="text-lg font-medium text-gray-400">%</span></span>
        <span className="text-xs text-gray-400 mt-0.5">習得済</span>
      </div>
    </div>
  )
}

export default function QuizDashboard({ onStart, onBack }: { onStart: (mode: QuizMode) => void, onBack: () => void }) {
  const [stats, setStats] = useState<MasteryStats>({ unlearned: 0, needs_review: 0, mastered: 0, total: 0 })

  const [savedTotal, setSavedTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedMode, setSelectedMode] = useState<QuizMode>('all')

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return

      const { count } = await supabase
        .from('saved_words')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', auth.user.id)
      setSavedTotal(count ?? 0)

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

      setStats({ unlearned, needs_review: masteryMap.needs_review, mastered: masteryMap.mastered, total: count ?? 0 })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col" style={{ height: '100dvh' }}>
        <header className="h-10 bg-white border-b border-[#e2e8f0] flex items-center px-2 shrink-0">
          <button onClick={onBack} className="h-8 px-4 rounded-full border border-[#009689] text-[#009689] text-xs font-medium">戻る</button>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400 text-sm">読み込み中...</div>
        </div>
      </div>
    )
  }

  if (savedTotal === 0) {
    return (
      <div className="flex flex-col" style={{ height: '100dvh' }}>
        <header className="h-10 bg-white border-b border-[#e2e8f0] flex items-center px-2 shrink-0">
          <button onClick={onBack} className="h-8 px-4 rounded-full border border-[#009689] text-[#009689] text-xs font-medium">戻る</button>
        </header>
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-gray-400 text-sm text-center">単語リストに単語を保存するとクイズができます</p>
        </div>
      </div>
    )
  }

  const modes: { key: QuizMode; label: string; count: number; color: string }[] = [
    { key: 'all', label: 'ランダム', count: stats.total, color: '#009689' },
    { key: 'review', label: '要復習', count: stats.needs_review, color: '#FF7B3A' },
  ]

  return (
    <div className="flex flex-col bg-[#f8fafc]" style={{ height: '100dvh' }}>
      {/* ヘッダー */}
      <header className="h-10 bg-white border-b border-[#e2e8f0] shadow-[0_1px_1px_rgba(0,0,0,0.05)] flex items-center px-2 shrink-0">
        <button onClick={onBack} className="h-8 px-4 rounded-full border border-[#009689] text-[#009689] text-xs font-medium hover:bg-[#cbfbf1] transition-colors">
          戻る
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[700px] mx-auto px-4 pt-8 pb-4 w-full">

          {/* ドーナツ */}
          <div className="flex justify-center mb-4">
            <DonutChart stats={stats} />
          </div>

          {/* 統計バッジ */}
          <div className="flex justify-center gap-4 mb-8">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-xs text-gray-500">未習得 <strong className="text-gray-800">{stats.unlearned}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#FF7B3A]" />
              <span className="text-xs text-gray-500">要復習 <strong className="text-gray-800">{stats.needs_review}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#00AD82]" />
              <span className="text-xs text-gray-500">習得済 <strong className="text-gray-800">{stats.mastered}</strong></span>
            </div>
          </div>

          {/* モード選択タブ */}
          <p className="text-xs font-semibold text-gray-400 mb-3">出題範囲</p>
          <div className="flex gap-3 mb-8">
            {modes.map(m => (
              <button
                key={m.key}
                onClick={() => setSelectedMode(m.key)}
                disabled={m.key === 'review' && m.count === 0}
                className={`flex-1 py-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                  selectedMode === m.key
                    ? 'border-[#009689] bg-[#f0fdfa]'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className={`text-sm font-bold ${selectedMode === m.key ? 'text-[#009689]' : 'text-gray-600'}`}>{m.label}</span>
                <span className={`text-xs ${selectedMode === m.key ? 'text-[#009689]' : 'text-gray-400'}`}>{m.count}問</span>
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* スタートボタン（固定フッター） */}
      <div className="bg-[#f8fafc] border-t border-gray-100 shrink-0 py-4">
        <div className="max-w-[700px] mx-auto px-4">
        <button
          onClick={() => onStart(selectedMode)}
          disabled={selectedMode === 'review' && stats.needs_review === 0}
          className="w-full py-4 rounded-2xl bg-[#009689] text-white font-bold text-base active:scale-95 transition-all hover:bg-[#007a6f] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          スタート
        </button>
        </div>
      </div>
    </div>
  )
}
