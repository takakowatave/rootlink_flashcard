'use client'

import { ReactNode, useEffect, useState } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  isLoading: boolean
  error: string | null
}

const ROOTS = [
  {
    key: 'per',
    meaning: '完全に',
    words: ['perturbation', 'perceive', 'persist'],
  },
  {
    key: 'turb',
    meaning: '乱れる',
    words: ['perturbation', 'turbulent', 'disturb'],
  },
]

function highlightRoot(word: string, root: string): ReactNode {
  const idx = word.toLowerCase().indexOf(root.toLowerCase())
  if (idx === -1) return <span>{word}</span>
  return (
    <>
      {word.slice(0, idx)}
      <span className="font-bold text-teal-500">{word.slice(idx, idx + root.length)}</span>
      {word.slice(idx + root.length)}
    </>
  )
}

export default function LPHero({ value, onChange, onSubmit, isLoading, error }: Props) {
  const [ready, setReady] = useState(false)
  useEffect(() => { setReady(true) }, [])

  const anim = (delay: number): React.CSSProperties =>
    ready
      ? { animation: `lp-sprout 0.5s ease-out ${delay}s both` }
      : { opacity: 0 }

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
              <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="perturb"
                disabled={isLoading}
                className="flex-1 bg-transparent text-xl text-gray-700 outline-none placeholder:text-gray-300 disabled:opacity-50"
              />
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

      {/* Etymology trees */}
      <div className="flex flex-col gap-10 sm:flex-row sm:gap-16 md:gap-28">
        {ROOTS.map((root, ri) => (
          <div key={root.key} className="flex flex-col">
            <div className="mb-5 flex items-center gap-3" style={anim(0.3 + ri * 0.1)}>
              <span
                className="rounded-full px-5 py-2 text-lg font-bold text-white shadow-sm"
                style={{ background: 'linear-gradient(135deg, #34d399, #059669)' }}
              >
                {root.key}
              </span>
              <span className="text-base text-gray-400">{root.meaning}</span>
            </div>
            <div className="flex flex-col gap-3 border-l-2 border-teal-200 pl-6">
              {root.words.map((word, wi) => (
                <div key={`${root.key}-${wi}`} className="relative" style={anim(0.5 + ri * 0.1 + wi * 0.12)}>
                  <div className="absolute -left-6 top-1/2 h-px w-5 -translate-y-1/2 bg-teal-200" />
                  <div className="rounded-2xl border border-teal-200 bg-white px-5 py-2.5 text-base text-gray-700 shadow-sm">
                    {highlightRoot(word, root.key)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
