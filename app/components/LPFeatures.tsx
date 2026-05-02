'use client'

import Image from 'next/image'
import type { ReactNode } from 'react'

// ── Feature 1: 語源パーツ — 画像 ──────────────────────────
function EtymologyCard() {
  return (
    <div className="relative h-[200px] w-full md:h-[243px] md:w-[358px]">
      <Image
        src="/lp/01.png"
        alt="語源パーツ画面"
        fill
        className="object-contain"
        sizes="(max-width: 768px) 100vw, 358px"
      />
    </div>
  )
}

// ── Feature 2: あ/A トグル — 画像 ─────────────────────────
function ToggleCard() {
  return (
    <div className="relative h-[200px] w-full md:h-[243px] md:w-[358px]">
      <Image
        src="/lp/02.png"
        alt="和英・英英切り替え画面"
        fill
        className="object-contain"
        sizes="(max-width: 768px) 100vw, 358px"
      />
    </div>
  )
}

// ── Feature 3: フラッシュカード — 画像 ───────────────────
function QuizCard() {
  return (
    <div className="relative h-[200px] w-full md:h-[243px] md:w-[358px]">
      <Image
        src="/lp/03.png"
        alt="フラッシュカード画面"
        fill
        className="object-contain"
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
