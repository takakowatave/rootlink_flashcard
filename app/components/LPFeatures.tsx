'use client'

import Image from 'next/image'
import type { ReactNode } from 'react'
import { MdAddCircle } from 'react-icons/md'

// ── Feature 1: 語源パーツ — 画像 ──────────────────────────
function EtymologyCard() {
  return (
    <div className="relative h-[200px] w-full overflow-hidden rounded-xl bg-white shadow-[0_0_20px_rgba(0,0,0,0.08)] md:h-[243px] md:w-[358px]">
      <Image
        src="/lp/about-phone.png"
        alt="語源パーツ画面"
        fill
        className="object-cover object-top"
        sizes="(max-width: 768px) 100vw, 358px"
      />
    </div>
  )
}

// ── Feature 2: あ/A トグル — Figma 実装 ───────────────────
function ToggleCard() {
  return (
    <div className="relative h-[243px] w-full overflow-hidden rounded-xl bg-white shadow-[0_0_20px_rgba(0,0,0,0.08)] md:w-[358px]">
      {/* autorenew 背景 */}
      <div
        className="absolute flex items-center justify-center"
        style={{ left: 6.43, top: -46.44, width: 336.12, height: 336.12 }}
      >
        <div style={{ transform: 'rotate(35.47deg)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lp/autorenew.png" alt="" style={{ width: 241, height: 241, opacity: 0.61 }} />
        </div>
      </div>
      {/* あ タイル */}
      <div
        className="absolute flex items-center justify-center rounded-[8px] border-b-[6px] border-r-[6px] border-[#99f6e4] bg-[#f0fdfa]"
        style={{ left: 39.99, top: 125.12, width: 92, height: 98 }}
      >
        <span className="text-[60px] font-medium leading-none text-[#115e59]">あ</span>
      </div>
      {/* A タイル */}
      <div
        className="absolute flex items-center justify-center rounded-[8px] border-b-[6px] border-r-[6px] border-[#38bdf8] bg-[#e0f2fe]"
        style={{ left: 216.99, top: 12.12, width: 92, height: 98 }}
      >
        <span className="text-[60px] font-medium leading-none text-[#0369a1]">A</span>
      </div>
    </div>
  )
}

// ── Feature 3: フラッシュカード — 語源カード ─────────────
function QuizCard() {
  const roots = [
    { root: 'com', gloss: '共に', words: ['combine', 'compare', 'compete'] },
    { root: 'pon', gloss: '置く', words: ['opponent', 'postpone', 'proponent'] },
  ]
  return (
    <div className="flex h-[200px] w-full flex-col gap-2 rounded-xl bg-[#f0fdfa] p-3 shadow-[0_0_20px_rgba(0,0,0,0.08)] md:h-[243px] md:w-[358px]">
      <div className="flex flex-1 gap-2">
        {roots.map(root => (
          <div key={root.root} className="flex flex-1 flex-col gap-2 rounded-lg bg-[#cbfbf1] px-2 py-2">
            <div className="flex flex-wrap items-center gap-1">
              <div className="flex items-center gap-0.5 rounded-full border-2 border-[#00d5be] bg-white pl-1 pr-2.5 py-0.5">
                <MdAddCircle className="size-[18px] shrink-0 text-[#00786f]" />
                <span className="text-[13px] font-medium text-[#00786f]">{root.root}</span>
              </div>
              <span className="text-[12px] font-medium text-[#00786f]">{root.gloss}</span>
            </div>
            <div className="flex flex-col gap-1.5 pl-2">
              {root.words.map(word => (
                <span key={word} className="rounded-full bg-[#f0fdfa] px-2.5 py-1 text-[12px] text-[#009689]">
                  {word}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
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
