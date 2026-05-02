'use client'

import { useEffect, useRef, useState } from 'react'
import { MdAddCircle } from 'react-icons/md'
import { HiSpeakerWave, HiOutlineBookmark } from 'react-icons/hi2'
import { DEMO } from '@/lib/lp-data'

const CYCLE_MS  = 4500
const TYPING_MS = 90

export default function LPAbout() {
  const [wordIdx,  setWordIdx]  = useState(0)
  const [typed,    setTyped]    = useState('')
  const [showTree, setShowTree] = useState(false)
  const [treeKey,  setTreeKey]  = useState(0)

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
        setTimeout(() => { setTreeKey(k => k + 1); setShowTree(true) }, 250)
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

        {/* ── Phone mockup ── */}
        <div className="shrink-0">
          <div
            className="mx-auto overflow-hidden rounded-[36px] border border-[#d1d5db] bg-white"
            style={{
              width: 300,
              boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)',
            }}
          >
            {/* App header */}
            <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="5" r="4" fill="#00AD82" />
                  <circle cx="4"  cy="15" r="2.5" fill="none" stroke="#00AD82" strokeWidth="1.5" />
                  <circle cx="16" cy="15" r="2.5" fill="none" stroke="#00AD82" strokeWidth="1.5" />
                  <line x1="10" y1="9" x2="4"  y2="12.5" stroke="#00AD82" strokeWidth="1.5" />
                  <line x1="10" y1="9" x2="16" y2="12.5" stroke="#00AD82" strokeWidth="1.5" />
                </svg>
                <span className="text-[13px] font-bold text-[#00AD82]">RootLink</span>
              </div>
              <span className="rounded-full border border-[#00AD82] px-2.5 py-0.5 text-[10px] font-medium text-[#00AD82]">
                単語リスト
              </span>
            </div>

            {/* Screen content */}
            <div className="flex flex-col gap-2.5 px-4 py-4">
              {/* Word + icons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[22px] font-semibold leading-8 text-black">
                    {typed}
                    <span className="ml-px inline-block h-5 w-[2px] animate-pulse bg-[#00AD82] align-middle" />
                  </span>
                  <HiSpeakerWave className="size-5 text-[#90a1b9]" />
                </div>
                <HiOutlineBookmark className="size-5 text-[#00AD82]" />
              </div>

              {/* Etymology hook card */}
              <div
                key={treeKey}
                className="flex flex-col gap-2 rounded-lg bg-[#f0fdfa] p-2"
                style={{ opacity: showTree ? 1 : 0, transition: 'opacity 0.5s ease' }}
              >
                <div className="flex gap-2">
                  {demo.roots.map((root, ri) => (
                    <div key={root.root} className="flex flex-1 flex-col gap-1.5 rounded-lg bg-[#cbfbf1] px-2 py-2">
                      {/* Root badge */}
                      <div className="flex flex-wrap items-center gap-1">
                        <div className="flex items-center gap-0.5 rounded-full border-2 border-[#00d5be] bg-white pl-0.5 pr-2 py-0.5">
                          <MdAddCircle className="size-4 shrink-0 text-[#00786f]" />
                          <span className="text-[11px] font-medium text-[#00786f]">{root.root}</span>
                        </div>
                        <span className="text-[11px] font-medium text-[#00786f]">{root.gloss}</span>
                      </div>
                      {/* Related words */}
                      <div className="flex flex-col gap-1 pl-1">
                        {root.words.map((word, wi) => (
                          <span
                            key={word}
                            className="rounded-full bg-[#f0fdfa] px-2 py-0.5 text-[11px] text-[#009689]"
                            style={{
                              opacity: showTree ? 1 : 0,
                              transition: `opacity 0.35s ease ${0.1 + ri * 0.12 + wi * 0.08}s`,
                            }}
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
