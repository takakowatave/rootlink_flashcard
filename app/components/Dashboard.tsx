'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import confetti from 'canvas-confetti'
import { HiChevronRight } from 'react-icons/hi'
import { HiXMark } from 'react-icons/hi2'
import { FaShareNodes } from 'react-icons/fa6'
import { supabase } from '@/lib/supabaseClient'
import { recordActivity, getActivityLog, calcStreak, getUserPlan } from '@/lib/supabaseApi'
import PlantStatus from '@/components/PlantStatus'
import { getPlantImageSrc, resolveGrowth } from '@/lib/plantGrowth'
import SharedDeckCard from '@/components/DeckCard'
import WordlistEmptyCard from '@/components/WordlistEmptyCard'
import Button from '@/components/Button'
import ShareMenu from '@/components/ShareMenu'
import { shareViaClipboardAndX } from '@/lib/shareToX'
import { isNativePlatform } from '@/lib/isNativePlatform'
import { LABEL_ORDER, toShortName, getDeckImage, sortDecksByDifficulty } from '@/lib/deckDisplay'
import {
  fetchReviewCandidates,
  filterByPeriod,
  REVIEW_PERIODS,
  type ReviewPeriod,
} from '@/lib/reviewPeriod'

type Deck = {
  id: string
  name: string
  label: string
  word_count: number
  is_premium: boolean
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

function WeeklyStreak({ streak, activityDates, compact = false }: { streak: number; activityDates: string[]; compact?: boolean }) {
  const dateSet = new Set(activityDates)
  const weekDates = getWeekDates()

  return (
    <div className="bg-white rounded-xl border border-line px-5 py-4 flex items-center gap-6">
      {!compact && (
        <>
          {/* 連続日数 */}
          <div className="flex flex-col items-center shrink-0">
            <p className="text-xs text-muted mb-0.5">連続ログイン</p>
            <div className="flex items-end gap-1">
              <span className="text-5xl font-black text-quiz-review tabular-nums leading-none">{streak}</span>
              <span className="text-lg font-bold text-quiz-review mb-1">日</span>
            </div>
          </div>

          <div className="w-px self-stretch bg-line shrink-0" />
        </>
      )}

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

function ShareButton({
  onClick,
  isSharing,
  buttonRef,
}: {
  onClick: () => void
  isSharing: boolean
  buttonRef?: React.Ref<HTMLButtonElement>
}) {
  return (
    <Button
      ref={buttonRef}
      onClick={onClick}
      disabled={isSharing}
      variant="primary"
      size="md"
      radius="full"
      className="mt-2"
    >
      <FaShareNodes className="size-4" />
      {isSharing ? '準備中...' : 'SNSでシェア'}
    </Button>
  )
}

// Figma 2603:6294 準拠: 円形・モーダル枠の外側右上に浮かべる close
function ModalCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="absolute -top-3 -right-3 size-10 rounded-full bg-slate-50 shadow-[0_0_8px_rgba(144,161,185,0.6)] flex items-center justify-center text-gray-700 hover:bg-white"
      aria-label="閉じる"
    >
      <HiXMark className="size-5" />
    </button>
  )
}

// Figma: xe5UwVx38JWu5doqwXczQu / node 2604-6015
// レベルアップした瞬間のみ表示 (日次の streak お祝いモーダルは廃止)
function LevelUpModal({
  level,
  streak,
  plantLevel,
  plantSrc,
  onClose,
}: {
  level: number
  streak: number
  plantLevel: number
  plantSrc: string
  onClose: () => void
}) {
  const [isSharing, setIsSharing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  // マウント時にコンフェッティを打ち上げる (レベルアップ瞬間のみ発火)
  useEffect(() => {
    const duration = 1500
    const end = Date.now() + duration
    const colors = ['#ff8904', '#00d5be', '#009689', '#fbbf24']
    const tick = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
        disableForReducedMotion: true,
      })
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
        disableForReducedMotion: true,
      })
      if (Date.now() < end) requestAnimationFrame(tick)
    }
    tick()
  }, [])

  const cardUrl = `/share/streak/${streak}/card.png?lv=${plantLevel}&up=1`
  const filename = `rootlink-level-${level}.png`
  const shareText = `単語学習でLv.${level}に成長🌱 ${streak}日連続学習中\n\n#RootLink #英単語 #語源学習`
  const shareUrl = 'https://www.rootlink.app'

  const handleShare = async () => {
    if (isSharing) return
    // Native app は @capacitor/share で直接画像添付。Web は全部 ShareMenu 経由 (OGP)
    if (isNativePlatform()) {
      setIsSharing(true)
      try {
        await shareViaClipboardAndX({ cardUrl, filename, shareText, shareUrl })
      } catch (err) {
        console.error('SHARE FAILED:', err)
        toast.error('シェアに失敗しました')
      } finally {
        setIsSharing(false)
      }
      return
    }
    setMenuOpen(true)
  }

  const handleShareX = async () => {
    setIsSharing(true)
    try {
      await shareViaClipboardAndX({ cardUrl, filename, shareText, shareUrl })
    } catch (err) {
      console.error('SHARE X FAILED:', err)
      toast.error('シェアに失敗しました')
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        onClick={onClose}
      >
        <div
          className="relative bg-white rounded-[36px] pt-6 pb-8 px-12 flex flex-col items-center gap-4 shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <ModalCloseButton onClose={onClose} />

          <p className="text-[25px] font-extrabold text-orange-400 text-center w-full leading-none">
            レベルアップ！
          </p>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={plantSrc} alt="" className="size-[200px] object-contain" />

          <div className="flex flex-col items-center text-center">
            <p className="text-[25px] font-bold text-orange-400 leading-8">
              連続{streak}日学習中
            </p>
            <p className="text-base font-bold text-gray-950 leading-7">
              毎日ログインして育てよう
            </p>
          </div>

          <ShareButton onClick={handleShare} isSharing={isSharing} buttonRef={btnRef} />
        </div>
      </div>
      <ShareMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        shareUrl={shareUrl}
        shareText={shareText}
        anchorRef={btnRef}
        onShareX={handleShareX}
      />
    </>
  )
}

// Figma: xe5UwVx38JWu5doqwXczQu / node 2603-4643
// 普通の時 (日次ログイン時) に1日1回表示。植物の成長進捗を表示する。
function StreakModal({
  streak,
  plantLevel,
  plantSrc,
  progressRatio,
  pointsToNext,
  onClose,
}: {
  streak: number
  plantLevel: number
  plantSrc: string
  progressRatio: number
  pointsToNext: number | null
  onClose: () => void
}) {
  const [isSharing, setIsSharing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  const cardUrl = `/share/streak/${streak}/card.png?lv=${plantLevel}`
  const filename = `rootlink-streak-${streak}days.png`
  const shareText = `${streak}日連続で英単語学習🔥\n\n#RootLink #英単語 #語源学習`
  const shareUrl = `https://www.rootlink.app/share/streak/${streak}?lv=${plantLevel}`

  const handleShare = async () => {
    if (isSharing) return
    // Native app は @capacitor/share で直接画像添付。Web は全部 ShareMenu 経由 (OGP)
    if (isNativePlatform()) {
      setIsSharing(true)
      try {
        await shareViaClipboardAndX({ cardUrl, filename, shareText, shareUrl })
      } catch (err) {
        console.error('SHARE FAILED:', err)
        toast.error('シェアに失敗しました')
      } finally {
        setIsSharing(false)
      }
      return
    }
    setMenuOpen(true)
  }

  const handleShareX = async () => {
    setIsSharing(true)
    try {
      await shareViaClipboardAndX({ cardUrl, filename, shareText, shareUrl })
    } catch (err) {
      console.error('SHARE X FAILED:', err)
      toast.error('シェアに失敗しました')
    } finally {
      setIsSharing(false)
    }
  }

  const progressPct = Math.max(0, Math.min(100, Math.round(progressRatio * 100)))

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        onClick={onClose}
      >
        <div
          className="relative bg-white rounded-[36px] pt-6 pb-8 px-12 flex flex-col items-center gap-4 shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <ModalCloseButton onClose={onClose} />

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={plantSrc} alt="" className="size-[200px] object-contain" />

          <div className="flex flex-col items-center gap-2 w-full">
            <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {pointsToNext != null && (
              <p className="text-sm text-slate-400">あと{pointsToNext}ptで次の進化</p>
            )}
          </div>

          <div className="flex flex-col items-center text-center">
            <p className="text-[25px] font-bold text-orange-400 leading-8">
              連続{streak}日学習中
            </p>
            <p className="text-base font-bold text-gray-950 leading-7">
              毎日ログインして育てよう
            </p>
          </div>

          <ShareButton onClick={handleShare} isSharing={isSharing} buttonRef={btnRef} />
        </div>
      </div>
      <ShareMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        shareUrl={shareUrl}
        shareText={shareText}
        anchorRef={btnRef}
        onShareX={handleShareX}
      />
    </>
  )
}

type DeckItem = {
  key: string
  label?: string
  title: string
  imageSrc?: string
  wordCount?: number
  isPremium?: boolean
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
            wordCount={item.wordCount}
            isPremium={item.isPremium}
            href={item.href}
            className="shrink-0 w-[146px] sm:w-[180px]"
          />
        ))}
      </div>
    </section>
  )
}

const LEVEL_STORAGE_KEY = 'plant_level_last_seen'
// クイズセッションが完了した直後のみ true。Dashboard がレベル比較する際のゲート。
const QUIZ_COMPLETED_FLAG = 'plant_quiz_completed'
// 日次 StreakModal は 1日1回のみ (最後に出した日付を保存)
const STREAK_MODAL_KEY = 'streak_modal_last_shown'

const REVIEW_PERIOD_LABEL: Record<ReviewPeriod, string> = {
  yesterday: '昨日',
  week: '1週間',
  month: '1ヶ月',
  all: '全期間',
}

export default function Dashboard() {
  const router = useRouter()
  const [streak, setStreak] = useState(0)
  const [savedCount, setSavedCount] = useState(0)
  const [masteredCount, setMasteredCount] = useState(0)
  const [quizAttemptCount, setQuizAttemptCount] = useState(0)
  const [activityDates, setActivityDates] = useState<string[]>([])
  const [decks, setDecks] = useState<Deck[]>([])
  const [activeDeckIds, setActiveDeckIds] = useState<string[]>([])
  const [plan, setPlan] = useState<'premium' | 'free'>('free')
  const [levelUpTo, setLevelUpTo] = useState<number | null>(null)
  const [showStreakModal, setShowStreakModal] = useState(false)
  const [reviewCounts, setReviewCounts] = useState<Record<ReviewPeriod, number>>({
    yesterday: 0, week: 0, month: 0, all: 0,
  })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()

      await recordActivity(user.id)

      const [savedData, quizData, decksData, dates] = await Promise.all([
        supabase.from('saved_words').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('quiz_results').select('word, correct, answered_at').eq('user_id', user.id).gte('answered_at', oneYearAgo).order('answered_at', { ascending: false }).limit(5000),
        supabase.from('decks').select('id, name, label, word_count, is_premium').order('label').order('name').limit(100),
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
        setQuizAttemptCount(quizData.data.length)
      }
      if (decksData.data) setDecks(decksData.data as Deck[])
      const userPlan = await getUserPlan()
      setPlan(userPlan)

      // 復習カード用の期間別件数
      const candidates = await fetchReviewCandidates(user.id, userPlan)
      setReviewCounts({
        yesterday: filterByPeriod(candidates, 'yesterday').length,
        week: filterByPeriod(candidates, 'week').length,
        month: filterByPeriod(candidates, 'month').length,
        all: candidates.length,
      })

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

      // レベルアップ検出: クイズを完了した直後の Dashboard 訪問時のみ判定発火。
      // ランダムなリロード / 日次ログインでは発火させない。
      const currentLevel = resolveGrowth(
        quizData.data?.length ?? 0,
        dates.length,
      ).current.level
      const storedLevelRaw = localStorage.getItem(LEVEL_STORAGE_KEY)
      const storedLevel = storedLevelRaw != null ? parseInt(storedLevelRaw, 10) : null
      const quizJustCompleted = sessionStorage.getItem(QUIZ_COMPLETED_FLAG) === '1'
      let levelUpFired = false
      if (quizJustCompleted) {
        sessionStorage.removeItem(QUIZ_COMPLETED_FLAG)
        if (storedLevel != null && currentLevel > storedLevel) {
          setLevelUpTo(currentLevel)
          levelUpFired = true
        }
      }
      // フラグ有無に関わらず現在レベルで同期 (次回比較の基準)
      localStorage.setItem(LEVEL_STORAGE_KEY, String(currentLevel))

      // 日次 StreakModal: レベルアップが発火する日は出さない (二重モーダル回避)
      if (!levelUpFired && currentStreak > 0) {
        const today = new Date().toLocaleDateString('sv')
        const lastShown = localStorage.getItem(STREAK_MODAL_KEY)
        if (lastShown !== today) {
          setShowStreakModal(true)
          localStorage.setItem(STREAK_MODAL_KEY, today)
        }
      }
    }

    load()
  }, [])

  const myDeckItem: DeckItem = {
    key: 'my-wordlist',
    title: 'オリジナル単語帳',
    href: '/wordlist',
    imageSrc: getPlantImageSrc(quizAttemptCount, activityDates.length),
    wordCount: savedCount,
  }
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
        wordCount: d.word_count,
        isPremium: d.is_premium && plan === 'free',
        href: `/decks/${d.id}`,
      }
    })
  const historyItems = activeDeckItems.slice(0, 5)
  const examItems: DeckItem[] = LABEL_ORDER.flatMap(label =>
    sortDecksByDifficulty(decks.filter(d => d.label === label))
      .map(d => {
        const shortName = toShortName(d.name, d.label)
        return {
          key: d.id,
          label: d.label,
          title: shortName,
          imageSrc: getDeckImage(d.label, shortName),
          wordCount: d.word_count,
          isPremium: d.is_premium && plan === 'free',
          href: `/decks/${d.id}`,
        }
      })
  )

  return (
    <>
      {levelUpTo !== null && (() => {
        const growth = resolveGrowth(quizAttemptCount, activityDates.length)
        return (
          <LevelUpModal
            level={levelUpTo}
            streak={streak}
            plantLevel={growth.current.level}
            plantSrc={growth.current.src}
            onClose={() => setLevelUpTo(null)}
          />
        )
      })()}
      {showStreakModal && levelUpTo === null && (() => {
        const growth = resolveGrowth(quizAttemptCount, activityDates.length)
        return (
          <StreakModal
            streak={streak}
            plantLevel={growth.current.level}
            plantSrc={growth.current.src}
            progressRatio={growth.progressRatio}
            pointsToNext={growth.pointsToNext}
            onClose={() => setShowStreakModal(false)}
          />
        )
      })()}

      <div className="bg-surface min-h-screen">
        <div className="flex justify-center w-full">
          <div className="flex flex-col gap-6 w-full max-w-[812px] px-4 py-3">

            {/* 利用状況 */}
            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-bold text-gray-950">利用状況</h2>

              {/* SP: Figma準拠 コンパクト複合カード (鉢植え部は PlantStatus 経由でロジック統一) */}
              <div className="sm:hidden bg-white rounded-2xl border border-line p-4 flex items-center gap-3">
                <div className="pr-3 border-r border-line shrink-0">
                  <p className="text-[11px] text-muted mb-0.5">連続ログイン</p>
                  <div className="flex items-baseline gap-0.5 leading-none">
                    <span className="text-[40px] font-black text-quiz-review tabular-nums">{streak}</span>
                    <span className="text-base font-bold text-quiz-review">日</span>
                  </div>
                </div>
                <PlantStatus variant="compact" quizCount={quizAttemptCount} loginDays={activityDates.length} />
              </div>

              {/* PC: 既存レイアウト維持 */}
              <div className="hidden sm:block">
                <WeeklyStreak streak={streak} activityDates={activityDates} />
              </div>
              <div className="hidden sm:flex bg-white rounded-xl border border-line items-stretch overflow-hidden">
                <PlantStatus quizCount={quizAttemptCount} loginDays={activityDates.length} />
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

              {/* SP: weekly-streak-card は下に単独で（連続日数は複合カードに既に出してるので非表示） */}
              <div className="sm:hidden">
                <WeeklyStreak streak={streak} activityDates={activityDates} compact />
              </div>
            </section>

            {/* オリジナル単語帳 */}
            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-bold text-gray-950">オリジナル単語帳</h2>
              {savedCount > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
                  <SharedDeckCard
                    title={myDeckItem.title}
                    imageSrc={myDeckItem.imageSrc}
                    wordCount={myDeckItem.wordCount}
                    href={myDeckItem.href}
                    className="shrink-0 w-[146px] sm:w-[180px]"
                  />
                </div>
              ) : (
                <WordlistEmptyCard
                  onClick={() => router.push('/wordlist')}
                />
              )}
            </section>

            {/* 復習 (期間別4枚固定) */}
            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-bold text-gray-950">復習</h2>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
                {REVIEW_PERIODS.map((period) => (
                  <SharedDeckCard
                    key={period}
                    title={REVIEW_PERIOD_LABEL[period]}
                    imageSrc="/dashboard/recent-words.png"
                    wordCount={reviewCounts[period]}
                    disabled={reviewCounts[period] === 0}
                    href={`/quiz?period=${period}`}
                    className="shrink-0 w-[146px] sm:w-[180px]"
                  />
                ))}
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
