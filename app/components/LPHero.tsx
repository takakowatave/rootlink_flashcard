'use client'

import { useEffect, useRef, useState } from 'react'
import LPHeroTree from '@/components/LPHeroTree'
import { DEMO } from '@/lib/lp-data'

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  isLoading: boolean
  error: string | null
}

const CYCLE_MS   = 3800
const TYPING_MS  = 90

export default function LPHero({ value, onChange, onSubmit, isLoading, error }: Props) {
  const [ready,    setReady]    = useState(false)
  const [wordIdx,  setWordIdx]  = useState(0)
  const [typed,    setTyped]    = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cycleRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { setReady(true) }, [])

  // タイピングアニメーション
  const startTyping = (idx: number) => {
    if (typingRef.current) clearInterval(typingRef.current)
    const word = DEMO[idx].word
    setTyped('')
    setShowCursor(true)
    let i = 0
    typingRef.current = setInterval(() => {
      i++
      setTyped(word.slice(0, i))
      if (i >= word.length) {
        clearInterval(typingRef.current!)
        typingRef.current = null
      }
    }, TYPING_MS)
  }

  // ワードサイクリング
  useEffect(() => {
    if (value) return // ユーザーが入力中はアニメーション停止
    startTyping(0)
    cycleRef.current = setInterval(() => {
      setWordIdx(prev => {
        const next = (prev + 1) % DEMO.length
        startTyping(next)
        return next
      })
    }, CYCLE_MS)
    return () => {
      if (cycleRef.current)  clearInterval(cycleRef.current)
      if (typingRef.current) clearInterval(typingRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const anim = (delay: number): React.CSSProperties =>
    ready
      ? { animation: `lp-sprout 0.5s ease-out ${delay}s both` }
      : { opacity: 0 }

  const displayText = value || typed

  return (
    <div
      className="flex min-h-screen flex-col items-center px-6 pb-24 pt-14"
      style={{
        backgroundColor: '#edfafa',
        backgroundImage: `
          linear-gradient(rgba(20,184,166,0.15) 1px, transparent 1px),
          linear-gradient(90deg, rgba(20,184,166,0.15) 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
      }}
    >
      {/* Headline */}
      <h1
        className="mb-10 text-center text-4xl font-bold leading-tight tracking-tight text-gray-800 md:text-6xl"
        style={anim(0)}
      >
        関連性で単語を<span className="text-teal-400">芋づる式</span>に覚えよう
      </h1>

      {/* Search bar */}
      <div className="mb-16 w-full max-w-xl" style={anim(0.15)}>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit() }}>
          <div className="lp-search-glow rounded-full p-[2.5px] shadow-sm">
            <div className="flex items-center rounded-full bg-white px-6 py-3.5">
              <div className="relative flex-1">
                <input
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-transparent text-xl text-gray-700 outline-none disabled:opacity-50"
                  style={{ caretColor: 'transparent' }}
                />
                {/* タイピングアニメーション表示（ユーザー未入力時） */}
                {!value && (
                  <div className="pointer-events-none absolute inset-0 flex items-center text-xl text-gray-700">
                    <span>{typed}</span>
                    <span className={`lp-cursor ml-[1px] inline-block h-5 w-[2px] bg-teal-400 ${showCursor ? '' : 'opacity-0'}`} />
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="ml-3 text-gray-300 transition-colors hover:text-teal-400 disabled:opacity-50"
              >
                {isLoading ? (
                  <svg className="h-6 w-6 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </form>
        {error && (
          <p className="mt-3 text-center text-sm text-red-500">英語として確認できませんでした</p>
        )}
      </div>

      {/* Etymology trees — wordIdxが変わるたびにre-mountしてアニメーションリセット */}
      <div className="flex flex-col gap-10 sm:flex-row sm:gap-16 md:gap-28" style={anim(0.3)}>
        {DEMO[wordIdx].roots.map((root) => (
          <LPHeroTree
            key={`${wordIdx}-${root.root}`}
            root={root.root}
            gloss={root.gloss}
            words={root.words}
          />
        ))}
      </div>
    </div>
  )
}
