'use client'

import { useState, useEffect, useCallback } from 'react'
import { HiX } from 'react-icons/hi'
import { supabase } from '@/lib/supabaseClient'

const STORAGE_KEY = 'rootlink_tutorial_v1_seen'
const PADDING = 10

type Step = {
  emoji: string
  title: string
  description: string
  selector?: string
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
    description: '検索バーに英単語を入力してみてください。語源フック・発音・意味・例文がまとめて表示されます。',
    selector: '[data-tutorial="search"]',
  },
  {
    emoji: '🔖',
    title: '気になった単語を保存',
    description: 'ブックマークアイコンをタップすると、単語リストに保存できます。後でいつでも復習できます。',
    selector: '[data-tutorial="save-button"]',
  },
  {
    emoji: '📌',
    title: '多義語はピン止めで整理',
    description: '複数の意味がある単語は、覚えたい意味だけピン留めできます。ピンアイコンをタップして選んでみましょう。',
    selector: '[data-tutorial="pin-button"]',
  },
  {
    emoji: '🃏',
    title: 'クイズで定着させよう',
    description: '保存した単語はクイズで復習できます。○/×形式で素早くチェック。間違えた単語だけ再挑戦もできます。',
  },
]

type SpotlightRect = { top: number; left: number; width: number; height: number }

export default function TutorialOverlay() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<SpotlightRect | null>(null)

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY)
    if (seen) return
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setVisible(true)
    })
  }, [])

  const updateRect = useCallback(() => {
    const selector = STEPS[step]?.selector
    if (!selector) { setRect(null); return }
    const el = document.querySelector(selector)
    if (!el) { setRect(null); return }
    const r = el.getBoundingClientRect()
    setRect({ top: r.top - PADDING, left: r.left - PADDING, width: r.width + PADDING * 2, height: r.height + PADDING * 2 })
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [step])

  useEffect(() => {
    if (!visible) return
    updateRect()
    window.addEventListener('resize', updateRect)
    return () => window.removeEventListener('resize', updateRect)
  }, [visible, updateRect])

  const close = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1)
    else close()
  }

  if (!visible) return null

  const current = STEPS[step]
  const hasSpotlight = rect !== null

  // Tooltip position: below spotlight if in upper half, above if lower half
  const tooltipTop = hasSpotlight
    ? rect.top + rect.height > window.innerHeight / 2
      ? rect.top - 8  // above (translate up via transform)
      : rect.top + rect.height + 8  // below
    : null
  const tooltipAbove = hasSpotlight && rect.top + rect.height > window.innerHeight / 2

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Spotlight overlay: 4 dark panels around the target */}
      {hasSpotlight ? (
        <>
          <div className="fixed inset-x-0 top-0 bg-black/70 pointer-events-auto" style={{ height: Math.max(0, rect.top) }} />
          <div className="fixed inset-x-0 bottom-0 bg-black/70 pointer-events-auto" style={{ top: rect.top + rect.height }} />
          <div className="fixed left-0 bg-black/70 pointer-events-auto" style={{ top: rect.top, width: Math.max(0, rect.left), height: rect.height }} />
          <div className="fixed right-0 bg-black/70 pointer-events-auto" style={{ top: rect.top, left: rect.left + rect.width, height: rect.height }} />
          {/* Spotlight ring */}
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

      {/* Tooltip card */}
      <div
        className="fixed left-1/2 -translate-x-1/2 pointer-events-auto"
        style={
          hasSpotlight && tooltipTop !== null
            ? tooltipAbove
              ? { bottom: window.innerHeight - rect.top + 8, left: '50%', transform: 'translateX(-50%)' }
              : { top: rect.top + rect.height + 8, left: '50%', transform: 'translateX(-50%)' }
            : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
        }
      >
        <div className="relative bg-white rounded-2xl w-[min(340px,90vw)] p-6 shadow-2xl">
          {/* Skip */}
          <button
            onClick={close}
            className="absolute top-3 right-3 p-1 text-muted hover:text-gray-600 transition-colors"
            aria-label="スキップ"
          >
            <HiX className="size-4" />
          </button>

          {/* Emoji */}
          <div className="text-3xl text-center mb-3 select-none">{current.emoji}</div>

          {/* Title */}
          <h2 className="text-base font-bold text-center text-gray-900 mb-2">{current.title}</h2>

          {/* Description */}
          <p className="text-sm text-gray-600 text-center leading-relaxed mb-5">{current.description}</p>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mb-4">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`block size-1.5 rounded-full transition-colors ${i === step ? 'bg-primary' : 'bg-gray-200'}`}
              />
            ))}
          </div>

          {/* Button */}
          <button
            onClick={next}
            className="w-full bg-primary text-white rounded-full py-2.5 text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            {step < STEPS.length - 1 ? '次へ' : 'はじめる'}
          </button>
        </div>
      </div>
    </div>
  )
}
