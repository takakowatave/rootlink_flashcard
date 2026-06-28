'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { updateStreak } from '@/lib/supabaseApi'

type Deck = {
  id: string
  name: string
  label: string
  word_count: number
}

type DayActivity = {
  date: string
  count: number
}

function getActivityColor(count: number): string {
  if (count === 0) return '#e8eaee'
  if (count <= 2) return '#93e7a2'
  if (count <= 5) return '#3ebe5e'
  if (count <= 9) return '#2f984a'
  return '#216435'
}

function buildActivityGrid(activities: DayActivity[]): number[] {
  const activityMap = new Map(activities.map(a => [a.date, a.count]))
  const today = new Date()
  const result: number[] = []
  for (let i = 363; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    result.push(activityMap.get(d.toISOString().slice(0, 10)) ?? 0)
  }
  return result
}

function ActivityGrid({ activities }: { activities: DayActivity[] }) {
  const data = buildActivityGrid(activities)
  return (
    <div className="bg-white rounded-lg px-4 py-3 overflow-x-auto">
      <div className="flex gap-[2.5px]">
        {Array.from({ length: 52 }, (_, w) => (
          <div key={w} className="flex flex-col gap-[2.5px]">
            {Array.from({ length: 7 }, (_, d) => {
              const count = data[w * 7 + d] ?? 0
              return (
                <div
                  key={d}
                  className="rounded-[2px]"
                  style={{ width: 11, height: 11, backgroundColor: getActivityColor(count) }}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function DeckCard({ name, onClick }: { name: string; onClick: () => void }) {
  const needsTwoLines = name.replace(/[^\s\-–]/g, '').length > 0 || name.length > 10
  return (
    <button
      onClick={onClick}
      className="bg-white border border-line rounded-2xl px-6 py-4 flex flex-col items-center justify-between shrink-0 hover:border-primary/40 hover:shadow-sm transition-all active:scale-[0.98]"
      style={{ width: 146, height: needsTwoLines ? 176 : 152 }}
    >
      <div className="flex items-center justify-center text-center">
        <p className="font-bold text-[22px] tracking-tight text-gray-950 leading-6">{name}</p>
      </div>
      <div className="flex items-center justify-center size-20 select-none text-5xl leading-none">
        🌱
      </div>
    </button>
  )
}

function DeckSection({
  title,
  items,
}: {
  title: string
  items: Array<{ name: string; href: string }>
}) {
  const router = useRouter()
  if (items.length === 0) return null
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold text-gray-950">{title}</h2>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {items.map((item, i) => (
          <DeckCard key={i} name={item.name} onClick={() => router.push(item.href)} />
        ))}
      </div>
    </section>
  )
}

const LABEL_ORDER = ['TOEIC', 'IELTS', 'TOEFL', '英検']

export default function Dashboard() {
  const [streak, setStreak] = useState(0)
  const [savedCount, setSavedCount] = useState(0)
  const [masteredCount, setMasteredCount] = useState(0)
  const [activities, setActivities] = useState<DayActivity[]>([])
  const [decks, setDecks] = useState<Deck[]>([])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()

      const [streakData, savedData, quizData, decksData] = await Promise.all([
        updateStreak(user.id),
        supabase.from('saved_words').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('quiz_results').select('word, correct, created_at').eq('user_id', user.id).gte('created_at', oneYearAgo).limit(5000),
        supabase.from('decks').select('id, name, label, word_count').order('label').order('name').limit(100),
      ])

      if (streakData) setStreak(streakData.current_streak)
      if (savedData.count != null) setSavedCount(savedData.count)

      if (quizData.data) {
        const masteredWords = new Set(
          quizData.data.filter(r => r.correct).map(r => r.word)
        )
        setMasteredCount(masteredWords.size)

        const dayMap = new Map<string, number>()
        for (const row of quizData.data) {
          const date = (row.created_at as string).slice(0, 10)
          dayMap.set(date, (dayMap.get(date) ?? 0) + 1)
        }
        setActivities(Array.from(dayMap, ([date, count]) => ({ date, count })))
      }

      if (decksData.data) setDecks(decksData.data as Deck[])
    }

    load()
  }, [])

  const myDeck = { name: 'My単語帳', href: '/wordlist' }
  const deckItems = decks.map(d => ({ name: d.name, href: `/decks/${d.id}` }))

  const historyItems = [myDeck, ...deckItems.slice(0, 4)]
  const studyingItems = [myDeck, ...deckItems.slice(0, 3)]
  const examItems = LABEL_ORDER.flatMap(label =>
    decks.filter(d => d.label === label).map(d => ({ name: d.name, href: `/decks/${d.id}` }))
  )

  return (
    <div className="bg-surface min-h-screen">
      <div className="flex justify-center w-full">
        <div className="flex flex-col gap-6 w-full max-w-[812px] px-4 py-3">

          {/* 利用状況 */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-950">利用状況</h2>
              {streak > 0 && (
                <div className="flex items-center gap-1 bg-orange-100 border border-red-500 rounded-full px-2.5 py-0.5 text-xs font-semibold text-red-500">
                  <span>{streak}日目</span>
                  <span>🔥</span>
                </div>
              )}
            </div>

            <ActivityGrid activities={activities} />

            <div className="bg-white rounded-xl border border-line flex items-stretch overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-r border-line shrink-0">
                <div className="text-4xl select-none leading-none">🌱</div>
                <div>
                  <p className="text-xs text-muted leading-snug">単語を覚えて<br />鉢植えを育てよう</p>
                  <p className="text-sm font-bold text-gray-950 mt-0.5">Lv.01</p>
                </div>
              </div>
              <div className="flex-1 px-6 py-3 border-r border-line flex flex-col justify-center">
                <p className="text-xs text-muted">学習中の単語数</p>
                <p className="text-2xl font-bold text-gray-950 tracking-tight tabular-nums">
                  {savedCount.toLocaleString()}
                </p>
              </div>
              <div className="flex-1 px-6 py-3 flex flex-col justify-center">
                <p className="text-xs text-muted">覚えた単語数</p>
                <p className="text-2xl font-bold text-gray-950 tracking-tight tabular-nums">
                  {masteredCount.toLocaleString()}
                </p>
              </div>
            </div>
          </section>

          <DeckSection title="履歴" items={historyItems} />
          <DeckSection title="学習中" items={studyingItems} />
          {examItems.length > 0 && (
            <DeckSection title="試験対策" items={examItems} />
          )}

        </div>
      </div>
    </div>
  )
}
