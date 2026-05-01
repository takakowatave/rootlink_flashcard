'use client'

import Image from 'next/image'
import type { ReactNode } from 'react'

// ── Feature 1: 語源パーツ — 画像 ──────────────────────────
function EtymologyCard() {
  return (
    <div className="relative h-[200px] w-full overflow-hidden rounded-xl bg-white shadow-[0_0_20px_rgba(0,0,0,0.08)] md:h-[243px] md:w-[358px]">
      <Image
        src="/lp/mock2.png"
        alt="語源パーツ画面"
        fill
        className="object-cover object-top"
        sizes="(max-width: 768px) 100vw, 358px"
      />
    </div>
  )
}

// ── Feature 2: あ/A トグル — アニメなし ───────────────────
function ToggleCard() {
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-white shadow-[0_0_20px_rgba(0,0,0,0.08)] md:h-[243px] md:w-[358px]">
      <div className="flex items-center justify-center gap-8 p-8 md:h-[243px]">
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border-b-[6px] border-r-[6px] border-[#99f6e4] bg-[#f0fdfa]">
          <span className="text-center text-5xl font-medium leading-none text-[#115e59]">あ</span>
        </div>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="#14b8a6" className="shrink-0 opacity-50">
          <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z" />
        </svg>
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border-b-[6px] border-r-[6px] border-[#38bdf8] bg-[#e0f2fe]">
          <span className="text-center text-5xl font-medium leading-none text-[#0369a1]">A</span>
        </div>
      </div>
    </div>
  )
}

// ── Feature 3: クイズ — 画像 ──────────────────────────────
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
            className={`flex flex-col items-center gap-6 rounded-lg md:flex-row ${
              f.reverse ? 'md:flex-row-reverse' : ''
            }`}
          >
            {f.card}
            <div className="flex flex-1 flex-col items-start gap-4 text-[#333]">
              <p className="w-full text-center text-[20px] font-bold leading-[34px] md:text-left md:text-[27px]">
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
