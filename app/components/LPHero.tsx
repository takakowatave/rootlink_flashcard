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
  const [ready,     setReady]     = useState(false)
  const [wordIdx,   setWordIdx]   = useState(0)
  const [typed,     setTyped]     = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const [showTree,  setShowTree]  = useState(false)
  const [isCompact, setIsCompact] = useState(true)
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cycleRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { setReady(true) }, [])

  useEffect(() => {
    const check = () => setIsCompact(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const startTyping = (idx: number) => {
    if (typingRef.current) clearInterval(typingRef.current)
    const word = DEMO[idx].word
    setTyped('')
    setShowCursor(true)
    setShowTree(false)
    let i = 0
    typingRef.current = setInterval(() => {
      i++
      setTyped(word.slice(0, i))
      if (i >= word.length) {
        clearInterval(typingRef.current!)
        typingRef.current = null
        setShowTree(true)
      }
    }, TYPING_MS)
  }

  useEffect(() => {
    if (value) return
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
  }, [value])

  const anim = (delay: number): React.CSSProperties =>
    ready
      ? { animation: `lp-sprout 0.5s ease-out ${delay}s both` }
      : { opacity: 0 }

  return (
    <div
      className="flex flex-col items-center px-6 pb-16 pt-14"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,150,137,0.07) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,150,137,0.07) 1px, transparent 1px),
          linear-gradient(223.03deg, rgb(231,253,247) 4.88%, rgb(240,252,241) 102.37%)
        `,
        backgroundSize: '32px 32px, 32px 32px, 100% 100%',
      }}
    >
      {/* Headline */}
      <h1
        className="mb-8 text-center text-[38px] font-bold leading-tight tracking-tight text-gray-800 md:text-6xl"
        style={anim(0)}
      >
        関連性で単語を<br className="md:hidden" /><span className="text-primary">芋づる式</span>に覚えよう
      </h1>

      {/* Search bar */}
      <div className="mb-6 w-full max-w-[600px]" style={anim(0.15)}>
        {/* SP: タップでボトムシートを開く */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('open-mobile-search'))}
          className="md:hidden w-full text-left"
          aria-label="検索"
        >
          <div
            className="p-[6px] rounded-[90px] pointer-events-none"
            style={{ backgroundImage: `linear-gradient(87deg, rgba(105,219,197,0.85) 0%, rgba(172,237,165,0.75) 100%)` }}
          >
            <div className="flex items-center rounded-[84px] bg-white pl-8 pr-6 h-[50px]">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-0 flex items-center text-[26px] text-gray-800">
                  <span>{typed}</span>
                  <span className={`lp-cursor ml-[1px] inline-block h-[1em] w-[3px] bg-primary ${showCursor ? '' : 'opacity-0'}`} />
                </div>
              </div>
              <svg className="h-8 w-8 ml-3 text-[#01c3a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </button>
        {/* PC: 完全に装飾のみ */}
        <div
          className="hidden md:block p-[6px] rounded-[90px] pointer-events-none select-none"
          style={{ backgroundImage: `linear-gradient(87deg, rgba(105,219,197,0.85) 0%, rgba(172,237,165,0.75) 100%)` }}
        >
          <div className="flex items-center rounded-[84px] bg-white pl-8 pr-6 h-[68px]">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-0 flex items-center text-[38px] text-gray-800">
                <span>{typed}</span>
                <span className={`lp-cursor ml-[1px] inline-block h-[1em] w-[3px] bg-primary ${showCursor ? '' : 'opacity-0'}`} />
              </div>
            </div>
            <svg className="h-8 w-8 ml-3 text-[#01c3a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Trees */}
      <div
        className="flex w-full max-w-[600px] flex-row items-start justify-between transition-opacity duration-500"
        style={{ opacity: (!value && showTree) ? 1 : 0 }}
      >
        {DEMO[wordIdx].roots.map((root) => (
          <LPHeroTree
            key={`${wordIdx}-${root.root}`}
            root={root.root}
            gloss={root.gloss}
            words={root.words}
            compact={isCompact}
          />
        ))}
      </div>
    </div>
  )
}
