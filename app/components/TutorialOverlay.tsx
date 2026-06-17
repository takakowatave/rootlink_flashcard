'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { HiX } from 'react-icons/hi'
import { supabase } from '@/lib/supabaseClient'

const KEY_SEEN = 'rootlink_tutorial_v5_seen'
const KEY_STEP = 'rootlink_tutorial_v5_step'
const PADDING = 10

type Step = {
  emoji: string
  title: string
  description: string
  selector?: string
  requiredPath?: RegExp
  waitHint?: string  // requiredPath待ち中に表示する案内
}

const STEPS: Step[] = [
  {
    emoji: '🌱',
    title: 'ようこそ RootLink へ！',
    description: '語源（ルーツ）から英単語を深く理解するアプリです。暗記に頼らず「なぜその意味なのか」を語根から学ぶことで、単語が自然と頭に定着します。',
  },
  {
    emoji: '🔍',
    title: '単語を検索する',
    description: '上の検索バーに英単語を入力してみてください。語源・発音・意味・例文がまとめて表示されます。',
    selector: '[data-tutorial="search"]',
  },
  {
    emoji: '🔖',
    title: '気になった単語を保存',
    description: '右上のブックマークアイコンをタップすると単語リストに保存できます。後でいつでも復習できます。',
    selector: '[data-tutorial="save-button"]',
    requiredPath: /^\/word\//,
    waitHint: '検索して単語の詳細ページを開くと、次のヒントが表示されます 👆',
  },
  {
    emoji: '📌',
    title: '多義語はピン止めで整理',
    description: '複数の意味がある単語は、覚えたい意味だけピン留めできます。意味の右のピンアイコンをタップして選んでみましょう。',
    selector: '[data-tutorial="pin-button"]',
    requiredPath: /^\/word\//,
  },
  {
    emoji: '🃏',
    title: 'クイズで定着させよう',
    description: '保存した単語はクイズで復習できます。○/×形式で素早くチェック。間違えた単語だけ再挑戦もできます。',
    selector: '[data-tutorial="quiz-start"]',
    requiredPath: /^\/quiz/,
    waitHint: 'クイズページを開くと、次のヒントが表示されます 🃏',
  },
]

type SpotlightRect = { top: number; left: number; width: number; height: number }

export default function TutorialOverlay() {
  const pathname = usePathname()
  const [authed, setAuthed] = useState(false)
  const [step, setStep] = useState<number | null>(null)
  const [visible, setVisible] = useState(false)
  const [waitMode, setWaitMode] = useState(false)  // 正しいページに到達するまでの案内
  const [rect, setRect] = useState<SpotlightRect | null>(null)

  // 認証チェック（初回のみ）
  useEffect(() => {
    if (localStorage.getItem(KEY_SEEN)) return
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const saved = localStorage.getItem(KEY_STEP)
        setStep(saved ? parseInt(saved, 10) : 0)
        setAuthed(true)
      }
    })
  }, [])

  // パスが変わったとき or ステップが変わったときに表示判定
  useEffect(() => {
    if (!authed || step === null) return
    const current = STEPS[step]
    if (!current) return

    if (current.requiredPath && !current.requiredPath.test(pathname)) {
      // 正しいページにいない → waitMode で案内を出す（waitHint があれば）
      setVisible(false)
      if (current.waitHint) {
        const timer = setTimeout(() => setWaitMode(true), 100)
        return () => clearTimeout(timer)
      }
      return
    }

    // 正しいページに来た → waitMode を閉じてステップ表示
    setWaitMode(false)
    const timer = setTimeout(() => setVisible(true), 300)
    return () => clearTimeout(timer)
  }, [authed, step, pathname])

  // スポットライト対象要素の座標取得
  const updateRect = useCallback(() => {
    if (step === null) return
    const selector = STEPS[step]?.selector
    if (!selector) { setRect(null); return }
    // 複数ある場合（PC/SP兼用）は画面上に見えている要素を使う
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
    const next = (step ?? 0) + 1
    if (next >= STEPS.length) {
      // 完了
      localStorage.setItem(KEY_SEEN, '1')
      localStorage.removeItem(KEY_STEP)
      setVisible(false)
      setStep(null)
    } else {
      localStorage.setItem(KEY_STEP, String(next))
      setStep(next)
      setVisible(false) // 次ステップの表示判定は useEffect に委ねる
    }
  }

  // waitMode：正しいページへの案内トースト
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
  const isLastStep = step === STEPS.length - 1

  // ツールチップ位置：スポットライトの上半分 → 下に、下半分 → 上に
  const below = hasSpotlight && rect.top < window.innerHeight / 2

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* オーバーレイ */}
      {hasSpotlight ? (
        <>
          {/* SVGマスクで角丸の穴をきれいに開ける */}
          <svg
            className="fixed inset-0 pointer-events-auto"
            style={{ width: '100vw', height: '100vh' }}
          >
            <defs>
              <mask id="tutorial-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={rect.left} y={rect.top}
                  width={rect.width} height={rect.height}
                  rx="12" ry="12"
                  fill="black"
                />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.7)" mask="url(#tutorial-mask)" />
          </svg>
          {/* スポットライトリング */}
          <div
            className="fixed rounded-xl pointer-events-none"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              boxShadow: '0 0 0 3px #00AD82, 0 0 20px rgba(0,173,130,0.4)',
            }}
          />
        </>
      ) : (
        <div className="fixed inset-0 bg-black/70 pointer-events-auto" />
      )}

      {/* カード */}
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
          <button
            onClick={advance}
            className="absolute top-3 right-3 p-1 text-muted hover:text-gray-600 transition-colors"
            aria-label="スキップ"
          >
            <HiX className="size-4" />
          </button>

          <div className="text-3xl text-center mb-3 select-none">{current.emoji}</div>
          <h2 className="text-base font-bold text-center text-gray-900 mb-2">{current.title}</h2>
          <p className="text-sm text-gray-600 text-center leading-relaxed mb-5">{current.description}</p>

          <div className="flex justify-center gap-1.5 mb-4">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`block size-1.5 rounded-full transition-colors ${i === step ? 'bg-primary' : 'bg-gray-200'}`}
              />
            ))}
          </div>

          <button
            onClick={advance}
            className="w-full bg-primary text-white rounded-full py-2.5 text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            {isLastStep ? 'はじめる' : '次へ'}
          </button>
        </div>
      </div>
    </div>
  )
}
