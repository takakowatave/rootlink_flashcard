'use client'

import { useRef, useLayoutEffect, useState } from 'react'

type Props = {
  root: string
  gloss: string
  words: [string, string, string]
  compact?: boolean
}

// ── Desktop (lg) constants ──────────────────────────────────
const BRANCH_YS_LG  = [51.8045, 119.316, 186.827] as const
const SVG_W_LG      = 41
const SVG_H_LG      = 189
const TRUNK_X       = 2
const PILL_H_LG     = 46

// ── Mobile compact (sm) constants ──────────────────────────
const BRANCH_YS_SM  = [32, 77.8, 121.8] as const
const SVG_W_SM      = 19
const SVG_H_SM      = 122
const PILL_H_SM     = 34

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

function defaultLayout(compact: boolean): Layout {
  if (compact) {
    return {
      svgLeft:    32,
      svgTop:     46,
      pillLeft:   49,
      pillTops:   [61, 106.8, 150.8],
      glossLeft:  72,
      glossTop:   23,
      containerW: 171,
      containerH: 185,
    }
  }
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

export default function LPHeroTree({ root, gloss, words, compact = false }: Props) {
  const badgeRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<Layout>(() => defaultLayout(compact))

  useLayoutEffect(() => {
    const el = badgeRef.current
    if (!el) return
    const bw = el.offsetWidth
    const bh = el.offsetHeight

    const SVG_W   = compact ? SVG_W_SM   : SVG_W_LG
    const SVG_H   = compact ? SVG_H_SM   : SVG_H_LG
    const PILL_H  = compact ? PILL_H_SM  : PILL_H_LG
    const BRANCH_YS = compact ? BRANCH_YS_SM : BRANCH_YS_LG

    const svgLeft   = Math.floor(bw / 2) - TRUNK_X
    const svgTop    = bh
    const pillLeft  = svgLeft + SVG_W
    const pillTops  = BRANCH_YS.map(by => svgTop + by - PILL_H / 2)
    const glossLeft = bw + 8
    const glossTop  = bh / 2
    const containerW = compact ? pillLeft + 125 : pillLeft + 190
    const containerH = svgTop + SVG_H + PILL_H / 2 + 12

    setLayout({ svgLeft, svgTop, pillLeft, pillTops, glossLeft, glossTop, containerW, containerH })
  }, [root, compact])

  const SVG_W  = compact ? SVG_W_SM  : SVG_W_LG
  const SVG_H  = compact ? SVG_H_SM  : SVG_H_LG
  const BRANCH_YS = compact ? BRANCH_YS_SM : BRANCH_YS_LG

  // SVG paths for compact vs desktop
  const paths = compact
    ? [
        `M2 0V${BRANCH_YS[0] - 13}C2 ${BRANCH_YS[0]} 10 ${BRANCH_YS[0]} 10 ${BRANCH_YS[0]}H19`,
        `M2 0V${BRANCH_YS[1] - 13}C2 ${BRANCH_YS[1]} 10 ${BRANCH_YS[1]} 10 ${BRANCH_YS[1]}H19`,
        `M2 0V${BRANCH_YS[2] - 13}C2 ${BRANCH_YS[2]} 10 ${BRANCH_YS[2]} 10 ${BRANCH_YS[2]}H19`,
      ]
    : [
        'M2 0V31.8045C2 42.8502 10.9543 51.8045 22 51.8045H40.5059',
        'M2 0V99.3157C2 110.361 10.9543 119.316 22 119.316H40.5059',
        'M2 0V166.827C2 177.872 10.9543 186.827 22 186.827H40.5059',
      ]

  return (
    <div className="relative" style={{ width: layout.containerW, height: layout.containerH }}>

      {/* ルートバッジ */}
      <div
        ref={badgeRef}
        className={`tree-root-badge absolute left-0 top-0 flex items-center justify-center rounded-[90px] ${
          compact
            ? 'px-3 py-[10px]'
            : 'px-[26px] pb-[20px] pt-[18px]'
        }`}
        style={{ backgroundImage: 'linear-gradient(87.4deg, #01c3a0 0%, #7de265 103.77%)' }}
      >
        <span className={`font-bold leading-none text-white ${compact ? 'text-[26px]' : 'text-[40px]'}`}>
          {root}
        </span>
      </div>

      {/* 語義ラベル */}
      <div
        className={`absolute whitespace-nowrap font-bold text-[#14b8a6] ${compact ? 'text-[20px]' : 'text-[24px]'}`}
        style={{ left: layout.glossLeft, top: layout.glossTop, transform: 'translateY(-50%)' }}
      >
        {gloss}
      </div>

      {/* コネクター SVG */}
      <svg
        className="connector-glow pointer-events-none absolute"
        style={{ left: layout.svgLeft, top: layout.svgTop }}
        width={SVG_W}
        height={SVG_H}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`cg-${root}`} gradientUnits="userSpaceOnUse" x1="2" y1="0" x2={SVG_W} y2={SVG_H}>
            <stop offset="0%"   stopColor="#00AD82" />
            <stop offset="50%"  stopColor="#7DE265" />
            <stop offset="100%" stopColor="#00AD82" />
          </linearGradient>
        </defs>
        {paths.map((d, i) => (
          <path
            key={i}
            className={BRANCH_CLASSES[i]}
            d={d}
            stroke={`url(#cg-${root})`}
            strokeWidth={compact ? 3 : 4}
            pathLength="1"
          />
        ))}
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
            className={`${PILL_CLASSES[i]} absolute flex items-center justify-center rounded-full bg-white ${
              compact
                ? 'px-3 py-2 border-[3px] border-[#01c3a0]'
                : 'px-4 py-3 border-4 border-[#01c3a0]'
            }`}
            style={{ left: layout.pillLeft, top: layout.pillTops[i] }}
          >
            <span className={`lowercase leading-none text-[#01c3a0] ${compact ? 'text-[18px]' : 'text-[28px]'}`}>
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
