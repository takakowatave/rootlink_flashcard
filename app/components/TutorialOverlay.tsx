'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { HiX } from 'react-icons/hi'
import { supabase } from '@/lib/supabaseClient'

export const KEY_SEEN = 'rootlink_tutorial_v6_seen'
export const KEY_STEP = 'rootlink_tutorial_v6_step'
export const TOTAL_STEPS = 7  // 0-4: global, 5: QuizDashboard, 6: QuizCard

const PADDING = 10

type Step = {
  emoji: string
  title: string
  description: string
  selector?: string
  requiredPath?: RegExp
  waitHint?: string
  autoSearch?: string  // このステップを「次へ」したとき自動検索するワード
}

// グローバルで処理するステップ（0〜4）
const STEPS: Step[] = [
  {
    emoji: '🌱',
    title: 'ようこそ RootLink へ！',
    description: '語源（ルーツ）から英単語を深く理解するアプリです。暗記に頼らず「なぜその意味なのか」を語根から学ぶことで、単語が自然と頭に定着します。',
  },
  {
    emoji: '🔍',
    title: '何か検索してみよう',
    description: '検索バーに英単語を入力してみましょう。語源・発音・意味・例文がまとめて表示されます。',
    selector: '[data-tutorial="search"]',
    autoSearch: 'component',
  },
  {
    emoji: '🌳',
    title: '語源パーツとは？',
    description: '単語を構成する語根・接頭辞・接尾辞をツリー形式で表示します。ここを押すと同じ語根を持つ単語の一覧も見られます。',
    selector: '[data-tutorial="etymology-tree"]',
    requiredPath: /^\/word\//,
  },
  {
    emoji: '🔖',
    title: '気になった単語を保存',
    description: '右上のブックマークアイコンをタップすると単語リストに保存できます。後でいつでも復習できます。',
    selector: '[data-tutorial="save-button"]',
    requiredPath: /^\/word\//,
  },
  {
    emoji: '📌',
    title: '多義語はピン止めで整理',
    description: '複数の意味がある単語は、覚えたい意味だけピン留めできます。意味の右のピンアイコンをタップして選んでみましょう。',
    selector: '[data-tutorial="pin-button"]',
    requiredPath: /^\/word\//,
  },
]

// step 5, 6 はそれぞれ QuizDashboard / QuizClient 内で処理
const QUIZ_STEP_INDEX = STEPS.length  // = 5

type SpotlightRect = { top: number; left: number; width: number; height: number }

export default function TutorialOverlay() {
  const pathname = usePathname()
  const [authed, setAuthed] = useState(false)
  const [step, setStep] = useState<number | null>(null)
  const [visible, setVisible] = useState(false)
  const [waitMode, setWaitMode] = useState(false)
  const [quizPending, setQuizPending] = useState(false)
  const [rect, setRect] = useState<SpotlightRect | null>(null)

  useEffect(() => {
    if (localStorage.getItem(KEY_SEEN)) return
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const saved = localStorage.getItem(KEY_STEP)
        const savedStep = saved ? parseInt(saved, 10) : 0
        if (savedStep >= QUIZ_STEP_INDEX) {
          setQuizPending(true)
          setAuthed(true)
          return
        }
        setStep(savedStep)
        setAuthed(true)
      }
    })
  }, [])

  // クイズページに着いたら quizPending トーストを閉じる（QuizDashboard が引き継ぐ）
  useEffect(() => {
    if (quizPending && /^\/quiz/.test(pathname)) {
      setQuizPending(false)
    }
  }, [quizPending, pathname])

  useEffect(() => {
    if (!authed || step === null) return
    const current = STEPS[step]
    if (!current) return

    if (current.requiredPath && !current.requiredPath.test(pathname)) {
      setVisible(false)
      if (current.waitHint) {
        const timer = setTimeout(() => setWaitMode(true), 100)
        return () => clearTimeout(timer)
      }
      return
    }

    setWaitMode(false)
    const timer = setTimeout(() => setVisible(true), 300)
    return () => clearTimeout(timer)
  }, [authed, step, pathname])

  const updateRect = useCallback(() => {
    if (step === null) return
    const selector = STEPS[step]?.selector
    if (!selector) { setRect(null); return }
    const el = Array.from(document.querySelectorAll(selector))
      .find((e) => e.getBoundingClientRect().width > 0) ?? null
    if (!el) { setRect(null); return }
    const r = el.getBoundingClientRect()
    setRect({
      top: r.top - PADDING,
      left: r.left - PADDING,
      width: r.width + PADDING * 2,
      height: r.height + PADDING * 2,
    })
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [step])

  useEffect(() => {
    if (!visible) return
    updateRect()
    window.addEventListener('resize', updateRect)
    return () => window.removeEventListener('resize', updateRect)
  }, [visible, updateRect])

  const advance = () => {
    const current = step !== null ? STEPS[step] : null
    const next = (step ?? 0) + 1

    // 自動検索ステップ：次へを押したらシステムが検索を実行してページ遷移
    if (current?.autoSearch) {
      window.dispatchEvent(
        new CustomEvent('tutorial-auto-search', { detail: { query: current.autoSearch } })
      )
    }

    if (next >= QUIZ_STEP_INDEX) {
      localStorage.setItem(KEY_STEP, String(QUIZ_STEP_INDEX))
      setVisible(false)
      setStep(null)
      setQuizPending(true)
    } else {
      localStorage.setItem(KEY_STEP, String(next))
      setStep(next)
      setVisible(false)
    }
  }

  // クイズページ待ちトースト
  if (quizPending) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto">
        <div className="bg-gray-900 text-white text-sm rounded-2xl px-5 py-3.5 shadow-xl flex items-center gap-3 max-w-[320px]">
          <span className="shrink-0 text-lg">🃏</span>
          <p className="leading-snug">単語が溜まってきたらクイズページで復習できます 🃏</p>
          <button
            onClick={() => setQuizPending(false)}
            className="shrink-0 text-white/50 hover:text-white ml-1"
            aria-label="閉じる"
          >
            <HiX className="size-4" />
          </button>
        </div>
      </div>
    )
  }

  if (waitMode && step !== null && STEPS[step]?.waitHint) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto">
        <div className="bg-gray-900 text-white text-sm rounded-2xl px-5 py-3.5 shadow-xl flex items-center gap-3 max-w-[320px]">
          <span className="shrink-0 text-lg">{STEPS[step].emoji}</span>
          <p className="leading-snug">{STEPS[step].waitHint}</p>
          <button
            onClick={() => setWaitMode(false)}
            className="shrink-0 text-white/50 hover:text-white ml-1"
            aria-label="閉じる"
          >
            <HiX className="size-4" />
          </button>
        </div>
      </div>
    )
  }

  if (!visible || step === null) return null

  const current = STEPS[step]
  const hasSpotlight = rect !== null
  const below = hasSpotlight && rect.top < window.innerHeight / 2

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {hasSpotlight ? (
        <>
          <svg className="fixed inset-0 pointer-events-auto" style={{ width: '100vw', height: '100vh' }}>
            <defs>
              <mask id="tutorial-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect x={rect.left} y={rect.top} width={rect.width} height={rect.height} rx="12" ry="12" fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.7)" mask="url(#tutorial-mask)" />
          </svg>
          <div
            className="fixed rounded-xl pointer-events-none"
            style={{
              top: rect.top, left: rect.left, width: rect.width, height: rect.height,
              boxShadow: '0 0 0 3px #00AD82, 0 0 20px rgba(0,173,130,0.4)',
            }}
          />
        </>
      ) : (
        <div className="fixed inset-0 bg-black/70 pointer-events-auto" />
      )}

      <div
        className="fixed pointer-events-auto"
        style={
          hasSpotlight
            ? below
              ? { top: rect.top + rect.height + 12, left: '50%', transform: 'translateX(-50%)' }
              : { bottom: window.innerHeight - rect.top + 12, left: '50%', transform: 'translateX(-50%)' }
            : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
        }
      >
        <div className="relative bg-white rounded-2xl w-[min(340px,90vw)] p-6 shadow-2xl">
          <button onClick={advance} className="absolute top-3 right-3 p-1 text-muted hover:text-gray-600 transition-colors" aria-label="スキップ">
            <HiX className="size-4" />
          </button>

          <div className="text-3xl text-center mb-3 select-none">{current.emoji}</div>
          <h2 className="text-base font-bold text-center text-gray-900 mb-2">{current.title}</h2>
          <p className="text-sm text-gray-600 text-center leading-relaxed mb-5">{current.description}</p>

          <div className="flex justify-center gap-1.5 mb-4">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <span key={i} className={`block size-1.5 rounded-full transition-colors ${i === step ? 'bg-primary' : 'bg-gray-200'}`} />
            ))}
          </div>

          <button
            onClick={advance}
            className="w-full bg-primary text-white rounded-full py-2.5 text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            {current.autoSearch ? 'component を検索する' : '次へ'}
          </button>
        </div>
      </div>
    </div>
  )
}
