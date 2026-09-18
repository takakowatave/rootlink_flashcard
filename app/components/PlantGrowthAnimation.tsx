'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

// オンボーディング「毎日ログインして木を育てましょう」画面で、
// /plant/lv1.png → lv5.png を順に切り替えて Lv5 で停止するアニメ。
//
// - 1 枚あたり 0.6 秒 (kiko の指示)。Lv5 に到達したら停止して残す。
// - 表示領域は親の幅いっぱいの正方形 (aspect-square)。呼び出し側の
//   カード幅に高さを合わせる。
// - 全 5 枚を priority で並列プリロードして切替時の flash を防ぐ。
const LEVELS = [1, 2, 3, 4, 5] as const
const FRAME_MS = 600

export default function PlantGrowthAnimation() {
  const [level, setLevel] = useState<(typeof LEVELS)[number]>(1)

  useEffect(() => {
    if (level >= 5) return
    const timer = setTimeout(() => {
      setLevel((prev) => (prev < 5 ? ((prev + 1) as (typeof LEVELS)[number]) : prev))
    }, FRAME_MS)
    return () => clearTimeout(timer)
  }, [level])

  return (
    <div className="relative w-full aspect-square">
      {LEVELS.map((lv) => (
        <Image
          key={lv}
          src={`/plant/lv${lv}.png`}
          alt=""
          fill
          priority
          sizes="(max-width: 640px) 90vw, 600px"
          className={`object-contain transition-opacity duration-200 ${
            lv === level ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
    </div>
  )
}
