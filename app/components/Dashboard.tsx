'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HiChevronRight } from 'react-icons/hi'
import { supabase } from '@/lib/supabaseClient'
import { recordActivity, getActivityLog, calcStreak } from '@/lib/supabaseApi'
import PlantStatus, { getPlantImageSrc } from '@/components/PlantStatus'
import SharedDeckCard from '@/components/DeckCard'
import { LABEL_ORDER, toShortName, getDeckImage } from '@/lib/deckDisplay'

type Deck = {
  id: string
  name: string
  label: string
  word_count: number
}

const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日']

function getWeekDates(): { date: string; label: string; isToday: boolean; isFuture: boolean }[] {
  const today = new Date()
  const todayStr = today.toLocaleDateString('sv')
  // 今週の月曜日を起点にする
  const dayOfWeek = today.getDay() // 0=日, 1=月...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)

  return DAY_LABELS.map((label, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = d.toLocaleDateString('sv')
    return {
      date: dateStr,
      label,
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
    }
  })
}

function WeeklyStreak({ streak, activityDates }: { streak: number; activityDates: string[] }) {
  const dateSet = new Set(activityDates)
  const weekDates = getWeekDates()

  return (
    <div className="bg-white rounded-xl border border-line px-5 py-4 flex items-center gap-6">
      {/* 連続日数 */}
      <div className="flex flex-col items-center shrink-0">
        <p className="text-xs text-muted mb-0.5">連続ログイン</p>
        <div className="flex items-end gap-1">
          <span className="text-5xl font-black text-quiz-review tabular-nums leading-none">{streak}</span>
          <span className="text-lg font-bold text-quiz-review mb-1">日</span>
        </div>
      </div>

      <div className="w-px self-stretch bg-line shrink-0" />

      {/* 今週カレンダー */}
      <div className="flex gap-2 flex-1 justify-around">
        {weekDates.map(({ date, label, isToday, isFuture }) => {
          const active = dateSet.has(date)
          return (
            <div key={date} className="flex flex-col items-center gap-1">
              <p className={`text-[11px] font-medium ${isToday ? 'text-quiz-review' : 'text-muted'}`}>{label}</p>
              <div
                className={`size-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  active
                    ? 'bg-quiz-review border-quiz-review text-white'
                    : isFuture
                    ? 'border-dashed border-line bg-transparent'
                    : isToday
                    ? 'border-quiz-review border-dashed bg-transparent'
                    : 'border-line bg-transparent'
                }`}
              >
                {active && (
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StreakModal({ streak, onClose }: { streak: number; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl px-10 py-8 flex flex-col items-center gap-3 shadow-2xl mx-4"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-6xl select-none">🔥</p>
        <p className="text-5xl font-black text-quiz-review tabular-nums">{streak}日目</p>
        <p className="text-base font-medium text-gray-700">今日も継続中！</p>
      </div>
    </div>
  )
}

type DeckItem = {
  key: string
  label?: string
  title: string
  imageSrc?: string
  imageContain?: boolean
  href: string
}

function DeckSection({
  title,
  items,
  moreHref,
}: {
  title: string
  items: DeckItem[]
  moreHref?: string
}) {
  const router = useRouter()
  if (items.length === 0) return null
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-950">{title}</h2>
        {moreHref && (
          <Link
            href={moreHref}
            className="flex items-center gap-0.5 text-sm text-muted hover:text-gray-700"
          >
            もっと見る
            <HiChevronRight className="size-4" />
          </Link>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {items.map(item => (
          <SharedDeckCard
            key={item.key}
            label={item.label}
            title={item.title}
            imageSrc={item.imageSrc}
            imageContain={item.imageContain}
            onClick={() => router.push(item.href)}
            className="shrink-0 w-[180px]"
          />
        ))}
      </div>
    </section>
  )
}

const MODAL_STORAGE_KEY = 'streak_modal_last_shown'

export default function Dashboard() {
  const [streak, setStreak] = useState(0)
  const [savedCount, setSavedCount] = useState(0)
  const [masteredCount, setMasteredCount] = useState(0)
  const [activityDates, setActivityDates] = useState<string[]>([])
  const [decks, setDecks] = useState<Deck[]>([])
  const [activeDeckIds, setActiveDeckIds] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()

      await recordActivity(user.id)

      const [savedData, quizData, decksData, dates] = await Promise.all([
        supabase.from('saved_words').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('quiz_results').select('word, correct').eq('user_id', user.id).gte('created_at', oneYearAgo).limit(5000),
        supabase.from('decks').select('id, name, label, word_count').order('label').order('name').limit(100),
        getActivityLog(user.id),
      ])

      const currentStreak = calcStreak(dates)
      setStreak(currentStreak)
      setActivityDates(dates)
      window.dispatchEvent(new Event('streak-updated'))
      if (savedData.count != null) setSavedCount(savedData.count)
      if (quizData.data) {
        const masteredWords = new Set(quizData.data.filter(r => r.correct).map(r => r.word))
        setMasteredCount(masteredWords.size)
      }
      if (decksData.data) setDecks(decksData.data as Deck[])

      // quiz済み単語からアクティブなデッキIDを特定（最近学習した順）
      const quizWords = [...new Set((quizData.data ?? []).map(r => r.word))].slice(0, 500)
      if (quizWords.length > 0) {
        const deckWordRows: { deck_id: string; word: string }[] = []
        for (let i = 0; i < quizWords.length; i += 200) {
          const { data } = await supabase.from('deck_words').select('deck_id, word').in('word', quizWords.slice(i, i + 200))
          if (data) deckWordRows.push(...data)
        }
        const deckIdByWord = new Map(deckWordRows.map(r => [r.word, r.deck_id]))
        const seen = new Set<string>()
        const ordered: string[] = []
        for (const { word } of (quizData.data ?? [])) {
          const deckId = deckIdByWord.get(word)
          if (deckId && !seen.has(deckId)) { seen.add(deckId); ordered.push(deckId) }
        }
        setActiveDeckIds(ordered)
      }

      // 今日まだモーダルを出していなければ表示
      const today = new Date().toLocaleDateString('sv')
      const lastShown = localStorage.getItem(MODAL_STORAGE_KEY)
      if (currentStreak > 0 && lastShown !== today) {
        setShowModal(true)
        localStorage.setItem(MODAL_STORAGE_KEY, today)
      }
    }

    load()
  }, [])

  const myDeckItem: DeckItem = {
    key: 'my-wordlist',
    title: 'My単語帳',
    href: '/wordlist',
    imageSrc: getPlantImageSrc(activityDates.length),
    imageContain: true,
  }
  const myDeckEntry: DeckItem[] = savedCount > 0 ? [myDeckItem] : []
  const activeDeckItems: DeckItem[] = activeDeckIds
    .map(id => decks.find(d => d.id === id))
    .filter((d): d is Deck => d !== undefined)
    .map(d => {
      const shortName = toShortName(d.name, d.label)
      return {
        key: d.id,
        label: d.label,
        title: shortName,
        imageSrc: getDeckImage(d.label, shortName),
        href: `/decks/${d.id}`,
      }
    })
  const historyItems = [...myDeckEntry, ...activeDeckItems.slice(0, myDeckEntry.length > 0 ? 4 : 5)]
  const examItems: DeckItem[] = LABEL_ORDER.flatMap(label =>
    decks
      .filter(d => d.label === label)
      .map(d => {
        const shortName = toShortName(d.name, d.label)
        return {
          key: d.id,
          label: d.label,
          title: shortName,
          imageSrc: getDeckImage(d.label, shortName),
          href: `/decks/${d.id}`,
        }
      })
  )

  return (
    <>
      {showModal && <StreakModal streak={streak} onClose={() => setShowModal(false)} />}

      <div className="bg-surface min-h-screen">
        <div className="flex justify-center w-full">
          <div className="flex flex-col gap-6 w-full max-w-[812px] px-4 py-3">

            {/* 利用状況 */}
            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-bold text-gray-950">利用状況</h2>

              <WeeklyStreak streak={streak} activityDates={activityDates} />

              <div className="bg-white rounded-xl border border-line flex items-stretch overflow-hidden">
                <PlantStatus loginDays={activityDates.length} />
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
            <DeckSection title="試験対策" items={examItems} moreHref="/decks" />

          </div>
        </div>
      </div>
    </>
  )
}
