'use client'

import { useEffect, useRef, useState } from 'react'
import LPHeroTree from '@/components/LPHeroTree'
import { DEMO } from '@/lib/lp-data'

const CYCLE_MS  = 4200
const TYPING_MS = 95

const SCALE     = 0.65
const TREE_W    = 310
const TREE_H    = 290

export default function LPAbout() {
  const [wordIdx,    setWordIdx]    = useState(0)
  const [typed,      setTyped]      = useState('')
  const [showTree,   setShowTree]   = useState(false)
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cycleRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  const startTyping = (idx: number) => {
    if (typingRef.current) clearInterval(typingRef.current)
    const word = DEMO[idx].word
    setTyped('')
    setShowTree(false)
    let i = 0
    typingRef.current = setInterval(() => {
      i++
      setTyped(word.slice(0, i))
      if (i >= word.length) {
        clearInterval(typingRef.current!)
        typingRef.current = null
        setTimeout(() => setShowTree(true), 250)
      }
    }, TYPING_MS)
  }

  useEffect(() => {
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
  }, [])

  const demo = DEMO[wordIdx]

  return (
    <section className="flex w-full flex-col items-center gap-8 bg-white py-16 md:gap-10 md:py-[60px]">
      <h2 className="text-[26px] font-bold text-[#14b8a6] md:text-[42px]">
        RootLinkとは？
      </h2>

      <div className="flex w-full max-w-[980px] flex-col items-center gap-8 px-5 md:flex-row md:items-center md:gap-12 md:px-6 lg:px-0">

        {/* ── アプリモックアップ（アニメ） ── */}
        <div className="w-full shrink-0 md:w-auto">
          <div
            className="mx-auto overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_8px_40px_rgba(0,173,130,0.12)]"
            style={{ width: 'min(480px, 100%)' }}
          >
            {/* ヘッダー・検索バー */}
            <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-2.5">
              <span className="shrink-0 text-sm font-bold text-[#00AD82]">RootLink</span>
              <div className="flex flex-1 items-center gap-2 rounded-full border border-[#01c3a0] bg-gray-50 px-3 py-1.5">
                <span className="flex-1 text-sm text-gray-700">{typed}</span>
                <span className="inline-block h-3.5 w-[2px] animate-pulse bg-[#00AD82]" />
                <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* 語源ツリーエリア */}
            <div
              className="flex items-start justify-center gap-6 px-4 py-5"
              style={{
                minHeight: Math.round(TREE_H * SCALE) + 40,
                backgroundImage: 'linear-gradient(223.03deg, rgb(231,253,247) 4.88%, rgb(240,252,241) 102.37%)',
              }}
            >
              {showTree && demo.roots.map(root => (
                <div
                  key={`${wordIdx}-${root.root}`}
                  style={{
                    width:    Math.round(TREE_W * SCALE),
                    height:   Math.round(TREE_H * SCALE),
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ transform: `scale(${SCALE})`, transformOrigin: 'top left' }}>
                    <LPHeroTree {...root} />
                  </div>
                </div>
              ))}

              {!showTree && (
                <div style={{ height: Math.round(TREE_H * SCALE) }} className="flex w-full items-center justify-center">
                  <span className="text-sm text-gray-300">検索中…</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── テキスト ── */}
        <div className="flex flex-col gap-5 md:gap-6">
          <p className="text-[15px] leading-[30px] tracking-[0.6px] text-[#333] md:text-[18px] md:leading-[32px] md:tracking-[0.72px]">
            RootLinkは
            <strong className="text-[#494f56]">関連性で英単語を理解し、</strong>
            <br />
            <strong className="text-[#494f56]">つながりで覚えるための学習ツール</strong>
            です。
          </p>
          <p className="text-[15px] leading-[36px] tracking-[0.6px] text-[#333] md:text-[18px] md:leading-[38px] md:tracking-[0.72px]">
            「語源のつながり」から学べる辞書×単語帳です。
            <br />
            検索した単語をその場で意味だけでなく
            <br />
            語源パーツまで分解して理解できるから、
          </p>
          <p className="text-[18px] font-bold leading-[34px] tracking-[0.72px] text-[#14b8a6] md:text-[23px] md:leading-[36px] md:tracking-[0.92px]">
            単発の暗記で終わらず、
            <br />
            関連語まで芋づる式に覚えられます。
          </p>
        </div>
      </div>
    </section>
  )
}
