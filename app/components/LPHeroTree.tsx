'use client'

import { useRef, useLayoutEffect, useState } from 'react'

type Props = {
  root: string
  gloss: string
  words: [string, string, string]
}

// root.svg のパス分岐 Y 座標（SVG 内座標）
const BRANCH_YS  = [51.8045, 119.316, 186.827] as const
const SVG_W      = 41
const SVG_H      = 189
const TRUNK_X    = 2   // root.svg のトランク x
const PILL_H     = 46  // ピルの高さ概算 (py-3×2 + text)

const PILL_CLASSES   = ['tree-pill-1', 'tree-pill-2', 'tree-pill-3'] as const
const BRANCH_CLASSES = ['tree-branch-1', 'tree-branch-2', 'tree-branch-3'] as const

type Layout = {
  svgLeft:    number
  svgTop:     number
  pillLeft:   number
  pillTops:   number[]
  glossLeft:  number
  glossTop:   number
  containerW: number
  containerH: number
}

function defaultLayout(): Layout {
  return {
    svgLeft:    55.5,
    svgTop:     66,
    pillLeft:   94,
    pillTops:   [91.8, 159.32, 226.83],
    glossLeft:  130,
    glossTop:   35.5,
    containerW: 310,
    containerH: 290,
  }
}

export default function LPHeroTree({ root, gloss, words }: Props) {
  const badgeRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<Layout>(defaultLayout)

  useLayoutEffect(() => {
    const el = badgeRef.current
    if (!el) return
    const bw = el.offsetWidth
    const bh = el.offsetHeight

    // トランクがバッジ水平中心から出る
    const svgLeft   = Math.floor(bw / 2) - TRUNK_X
    // SVG はバッジ直下から開始
    const svgTop    = bh
    const pillLeft  = svgLeft + SVG_W
    // ピル top = SVG top + branch Y end - ピル半高さ
    const pillTops  = BRANCH_YS.map(by => svgTop + by - PILL_H / 2)
    const glossLeft = bw + 12
    const glossTop  = bh / 2
    const containerW = pillLeft + 190
    const containerH = svgTop + SVG_H + PILL_H / 2 + 12

    setLayout({ svgLeft, svgTop, pillLeft, pillTops, glossLeft, glossTop, containerW, containerH })
  }, [root])

  return (
    <div className="relative" style={{ width: layout.containerW, height: layout.containerH }}>

      {/* ルートバッジ（ボーダーなし） */}
      <div
        ref={badgeRef}
        className="tree-root-badge absolute left-0 top-0 flex items-center justify-center rounded-[90px] px-[26px] pb-[20px] pt-[18px]"
        style={{ backgroundImage: 'linear-gradient(87.4deg, #01c3a0 0%, #7de265 103.77%)' }}
      >
        <span className="text-[40px] font-bold leading-none text-white">{root}</span>
      </div>

      {/* 語義ラベル */}
      <div
        className="absolute whitespace-nowrap text-[24px] font-bold text-[#14b8a6]"
        style={{ left: layout.glossLeft, top: layout.glossTop, transform: 'translateY(-50%)' }}
      >
        {gloss}
      </div>

      {/* コネクター SVG — バッジ直下から開始 */}
      <svg
        className="connector-glow pointer-events-none absolute"
        style={{ left: layout.svgLeft, top: layout.svgTop }}
        width={SVG_W}
        height={SVG_H}
        viewBox="0 0 41 189"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`cg-${root}`} gradientUnits="userSpaceOnUse" x1="2" y1="0" x2="41" y2="189">
            <stop offset="0%"   stopColor="#01C3A0" />
            <stop offset="50%"  stopColor="#7DE265" />
            <stop offset="100%" stopColor="#01C3A0" />
          </linearGradient>
        </defs>
        <path
          className={BRANCH_CLASSES[0]}
          d="M2 0V31.8045C2 42.8502 10.9543 51.8045 22 51.8045H40.5059"
          stroke={`url(#cg-${root})`} strokeWidth="4" pathLength="1"
        />
        <path
          className={BRANCH_CLASSES[1]}
          d="M2 0V99.3157C2 110.361 10.9543 119.316 22 119.316H40.5059"
          stroke={`url(#cg-${root})`} strokeWidth="4" pathLength="1"
        />
        <path
          className={BRANCH_CLASSES[2]}
          d="M2 0V166.827C2 177.872 10.9543 186.827 22 186.827H40.5059"
          stroke={`url(#cg-${root})`} strokeWidth="4" pathLength="1"
        />
      </svg>

      {/* 単語ピル */}
      {words.map((word, i) => {
        const rootIdx = word.toLowerCase().indexOf(root.toLowerCase())
        const before  = rootIdx > 0 ? word.slice(0, rootIdx) : ''
        const bold    = rootIdx >= 0 ? word.slice(rootIdx, rootIdx + root.length) : word
        const after   = rootIdx >= 0 ? word.slice(rootIdx + root.length) : ''

        return (
          <div
            key={i}
            className={`${PILL_CLASSES[i]} absolute flex items-center justify-center rounded-full border-4 border-[#01c3a0] bg-white px-4 py-3`}
            style={{ left: layout.pillLeft, top: layout.pillTops[i] }}
          >
            <span className="text-[28px] lowercase leading-none text-[#01c3a0]">
              {before && <span className="font-normal">{before}</span>}
              <span className="font-bold">{bold}</span>
              {after  && <span className="font-normal">{after}</span>}
            </span>
          </div>
        )
      })}
    </div>
  )
}
