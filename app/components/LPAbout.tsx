'use client'

import { DEMO } from '@/lib/lp-data'

// ── キャンバス定数 ────────────────────────────────────
const W = 520
const H = 380
const CX = 260  // 水平中心
const CY = 190  // 垂直中心
const R  = 160  // 軌道半径

// 30° オフセットの正六角形配置（2・4・6・8・10・12時）
// 各スロット = ノード中心座標。軌道回転時も全ノードがキャンバス内に収まる
const SLOTS = [
  { lx: Math.round(CX + R * Math.sin(Math.PI / 6)),  ly: Math.round(CY - R * Math.cos(Math.PI / 6))  },  // 2時
  { lx: Math.round(CX + R * Math.sin(Math.PI / 2)),  ly: Math.round(CY - R * Math.cos(Math.PI / 2))  },  // 3時
  { lx: Math.round(CX + R * Math.sin(5 * Math.PI / 6)), ly: Math.round(CY - R * Math.cos(5 * Math.PI / 6)) }, // 5時
  { lx: Math.round(CX + R * Math.sin(7 * Math.PI / 6)), ly: Math.round(CY - R * Math.cos(7 * Math.PI / 6)) }, // 7時
  { lx: Math.round(CX + R * Math.sin(3 * Math.PI / 2)), ly: Math.round(CY - R * Math.cos(3 * Math.PI / 2)) }, // 9時
  { lx: Math.round(CX + R * Math.sin(11 * Math.PI / 6)), ly: Math.round(CY - R * Math.cos(11 * Math.PI / 6)) }, // 11時
]

type Props = { wordIdx: number }

export default function LPAbout({ wordIdx }: Props) {
  const demo = DEMO[wordIdx]
  const related = [...demo.roots[0].words, ...demo.roots[1].words]

  return (
    <section className="flex w-full flex-col items-center gap-10 bg-white py-16 md:py-[60px]">
      <h2 className="text-[32px] font-bold text-[#14b8a6] md:text-[42px]">
        RootLinkとは？
      </h2>

      <div className="flex w-full max-w-[980px] flex-col items-center gap-10 px-4 md:flex-row md:items-center md:gap-12 md:px-0">

        {/* ── ネットワーク図 ── */}
        <div
          key={wordIdx}
          className="relative shrink-0"
          style={{ width: W, height: H }}
        >
          {/* 軌道グループ：SVG ラインと周辺ノードがまとめて回転 */}
          <div
            className="absolute inset-0"
            style={{
              transformOrigin: `${CX}px ${CY}px`,
              animation: 'orbit-spin 70s linear infinite',
            }}
          >
            {/* 接続線 SVG */}
            <svg
              className="absolute inset-0 overflow-visible"
              width={W} height={H}
              viewBox={`0 0 ${W} ${H}`}
              fill="none"
            >
              {SLOTS.map((s, i) => (
                <line
                  key={i}
                  x1={CX} y1={CY}
                  x2={s.lx} y2={s.ly}
                  stroke="#e7edf4"
                  strokeWidth="4"
                  pathLength="1"
                  strokeDasharray="1"
                  strokeDashoffset="1"
                  style={{
                    animation: `grow-path 0.45s ease-out ${0.15 + i * 0.08}s forwards`,
                  }}
                />
              ))}
            </svg>

            {/* 周辺ノード：ピボット→逆回転→ノードピル */}
            {SLOTS.map((s, i) => (
              <div
                key={i}
                className="absolute"
                style={{ left: s.lx, top: s.ly }}
              >
                {/* 逆回転でテキストを常に正立させる */}
                <div style={{ animation: 'orbit-counter-spin 70s linear infinite' }}>
                  <div
                    className="absolute flex min-w-[120px] items-center justify-center rounded-full border-4 border-[#e7edf4] bg-white px-4 py-3"
                    style={{
                      transform: 'translate(-50%, -50%)',
                      opacity: 0,
                      animation: `node-appear 0.4s ease-out ${0.55 + i * 0.1}s forwards`,
                    }}
                  >
                    <span className="text-[17px] font-bold leading-none text-[#6b7a8d]">
                      {related[i]}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 中心ノード：回転しない */}
          <div
            className="absolute flex items-center justify-center rounded-[90px] px-5 pb-3 pt-[10px]"
            style={{
              left: CX, top: CY,
              backgroundImage: 'linear-gradient(85.75deg, #01c3a0 0%, #7de265 103.77%)',
              animation: 'fade-in-centered 0.4s ease-out forwards',
              opacity: 0,
            }}
          >
            <span className="text-[22px] font-bold leading-none text-white">
              {demo.word}
            </span>
          </div>
        </div>

        {/* ── テキスト ── */}
        <div className="flex flex-col gap-6">
          <p className="text-[16px] leading-[32px] tracking-[0.64px] text-[#333] md:text-[18px] md:tracking-[0.72px]">
            RootLinkは
            <strong className="text-[#494f56]">関連性で英単語を理解し、</strong>
            <br />
            <strong className="text-[#494f56]">つながりで覚えるための学習ツール</strong>
            です。
          </p>
          <p className="text-[16px] leading-[38px] tracking-[0.64px] text-[#333] md:text-[18px] md:tracking-[0.72px]">
            「語源のつながり」から学べる辞書×単語帳です。
            <br />
            検索した単語をその場で意味だけでなく
            <br />
            語源パーツまで分解して理解できるから、
          </p>
          <p className="text-[20px] font-bold leading-[36px] tracking-[0.8px] text-[#14b8a6] md:text-[23px] md:tracking-[0.92px]">
            単発の暗記で終わらず、
            <br />
            関連語まで芋づる式に覚えられます。
          </p>
        </div>
      </div>
    </section>
  )
}
