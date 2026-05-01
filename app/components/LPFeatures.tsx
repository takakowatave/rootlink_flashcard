'use client'

import Image from 'next/image'
import type { ReactNode } from 'react'

// ── Feature 1: 語源パーツ card ─────────────────────────────
const ETYMOLOGY_PARTS = [
  { root: 'com', meaning: '共に', words: ['combine', 'compete', 'commit'] },
  { root: 'pon', meaning: '置く', words: ['compose', 'deposit', 'expose'] },
]

function EtymologyCard() {
  return (
    <div className="flex h-auto w-full flex-col items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-[#f0fdfa] p-3 shadow-[0_0_20px_rgba(0,0,0,0.08)] md:h-[243px] md:w-[358px]">
      <p className="text-xl font-semibold text-black md:text-2xl">component</p>
      <div className="flex w-full gap-2">
        {ETYMOLOGY_PARTS.map(part => (
          <div key={part.root} className="flex flex-1 flex-col items-start gap-1.5 rounded-lg bg-[#cbfbf1] p-2">
            <div className="flex items-center gap-1.5">
              <span className="rounded-3xl border-2 border-[#00d5be] bg-white pl-1.5 pr-2.5 py-0.5 text-sm font-medium text-[#00786f]">
                {part.root}
              </span>
              <span className="text-xs font-medium text-[#00786f]">{part.meaning}</span>
            </div>
            <div className="ml-1.5 flex flex-col gap-1 border-l-2 border-[#99f6e4] pl-2">
              {part.words.map(w => (
                <div key={w} className="flex items-center gap-1.5">
                  <span className="rounded-2xl bg-[#f0fdfa] px-2 py-0.5 text-xs font-medium text-[#009689]">{w}</span>
                  <span className="text-xs text-[#009689]">{part.meaning}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Feature 2: あ/A toggle card ────────────────────────────
function ToggleCard() {
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-white shadow-[0_0_20px_rgba(0,0,0,0.08)] md:h-[243px] md:w-[358px]">
      {/* Desktop layout — absolute tiles */}
      <div className="hidden md:block">
        {/* Autorenew icon background */}
        <div
          className="absolute left-[6px] top-[-46px] flex size-[336px] items-center justify-center opacity-[0.61]"
          style={{ animation: 'orbit-spin 70s linear infinite' }}
        >
          <div style={{ transform: 'rotate(35deg)' }}>
            <svg width="241" height="241" viewBox="0 0 24 24" fill="#14b8a6">
              <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z" />
            </svg>
          </div>
        </div>
        {/* あ tile */}
        <div className="absolute left-10 top-[125px] flex h-[98px] w-[92px] flex-col items-center justify-center rounded-lg border-b-[6px] border-r-[6px] border-[#99f6e4] bg-[#f0fdfa]">
          <span className="text-center text-[60px] font-medium leading-none text-[#115e59]">あ</span>
        </div>
        {/* A tile */}
        <div className="absolute left-[217px] top-3 flex h-[98px] w-[92px] flex-col items-center justify-center rounded-lg border-b-[6px] border-r-[6px] border-[#38bdf8] bg-[#e0f2fe]">
          <span className="text-center text-[60px] font-medium leading-none text-[#0369a1]">A</span>
        </div>
      </div>

      {/* Mobile/tablet layout — flex tiles */}
      <div className="flex items-center justify-center gap-8 p-6 md:hidden">
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border-b-4 border-r-4 border-[#99f6e4] bg-[#f0fdfa]">
          <span className="text-center text-5xl font-medium leading-none text-[#115e59]">あ</span>
        </div>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="#14b8a6" className="shrink-0 opacity-60">
          <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z" />
        </svg>
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border-b-4 border-r-4 border-[#38bdf8] bg-[#e0f2fe]">
          <span className="text-center text-5xl font-medium leading-none text-[#0369a1]">A</span>
        </div>
      </div>
    </div>
  )
}

// ── Feature 3: クイズカード ────────────────────────────────
function QuizCard() {
  return (
    <div className="relative h-[200px] w-full overflow-hidden rounded-xl bg-white shadow-[0_0_20px_rgba(0,0,0,0.08)] md:h-[243px] md:w-[358px]">
      <Image
        src="/lp/screenshot-quiz.png"
        alt="フラッシュカード画面"
        fill
        className="object-cover object-top"
        sizes="(max-width: 768px) 100vw, 358px"
      />
    </div>
  )
}

// ── Features list ──────────────────────────────────────────
const FEATURES: {
  card: ReactNode
  reverse: boolean
  title: string
  body: string
}[] = [
  {
    card: <EtymologyCard />,
    reverse: false,
    title: '語源パーツで未知語を推測',
    body: '初めて見た単語でも、語根がわかれば意味が推測できます。知らない単語を「なんとなく読む」から「構造で読む」へ。',
  },
  {
    card: <ToggleCard />,
    reverse: true,
    title: '和英⇄英英のモード切り替え',
    body: 'ボタン一つで和英⇄英英を切り替えられます。まずは日本語で意味をつかみ、慣れてきたら英英モードで英語のまま考える力をつけられます。',
  },
  {
    card: <QuizCard />,
    reverse: false,
    title: 'フラッシュカードで記憶を定着',
    body: 'せっかくストックした単語を眠らせていませんか？保存した単語はそのままクイズ形式でテストできます。検索するだけで復習の仕組みが自然にできあがります。',
  },
]

// ── Section ────────────────────────────────────────────────
export default function LPFeatures() {
  return (
    <section
      className="flex w-full flex-col items-center gap-10 py-16 md:gap-[42px] md:py-[80px]"
      style={{ backgroundImage: 'linear-gradient(41.06deg, rgba(0,235,180,0.1) 4.63%, rgba(108,222,109,0.1) 100%)' }}
    >
      <h2 className="text-[24px] font-bold text-[#00ad82] md:text-[42px]">
        RootLinkの3つの特徴
      </h2>

      <div className="flex w-full max-w-[800px] flex-col gap-8 px-5 md:px-6 lg:px-0">
        {FEATURES.map((f, i) => (
          <div
            key={i}
            className={`flex flex-col items-center gap-6 rounded-lg md:flex-row md:gap-6 ${
              f.reverse ? 'md:flex-row-reverse' : ''
            }`}
          >
            {f.card}
            <div className="flex flex-1 flex-col items-start gap-4 text-[#333]">
              <p className="text-[20px] font-bold leading-[34px] text-center md:text-[27px] md:text-left">
                {f.title}
              </p>
              <p className="text-[15px] leading-[26px] tracking-[0.6px] md:text-[18px] md:leading-[28px] md:tracking-[0.72px]">
                {f.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
