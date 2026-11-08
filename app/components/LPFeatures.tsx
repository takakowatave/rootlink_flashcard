'use client'

import Image from 'next/image'
import { lpCopy } from '@/lib/lp-copy'
import type { DisplayLocale } from '@/types/DisplayLocale'

interface Props {
  locale: DisplayLocale
}

const CARDS = [
  { src: '/lp/01.png', reverse: false },
  { src: '/lp/02.png', reverse: true  },
  { src: '/lp/03.png', reverse: false },
] as const

export default function LPFeatures({ locale }: Props) {
  const copy = lpCopy[locale].features

  return (
    <section
      className="flex w-full flex-col items-center gap-[32px] py-[42px] md:gap-[42px] md:py-[80px]"
      style={{ backgroundImage: 'linear-gradient(41.06deg, rgba(0,235,180,0.1) 4.63%, rgba(108,222,109,0.1) 100%)' }}
    >
      <h2 className="text-[32px] font-bold text-primary md:text-[42px]">
        {copy.title}
      </h2>

      <div className="flex w-full max-w-[800px] flex-col gap-[24px] px-2 md:px-6 lg:px-0">
        {copy.items.map((f, i) => {
          const card = CARDS[i]
          return (
            <div
              key={i}
              className={`flex flex-col items-center gap-6 rounded-lg md:flex-row ${
                card.reverse ? 'md:flex-row-reverse' : ''
              }`}
            >
              <div className="w-full shrink-0 md:w-[358px]">
                <Image src={card.src} alt={f.title} width={716} height={580} className="w-full h-auto" sizes="(max-width: 768px) 100vw, 358px" />
              </div>
              <div className="flex flex-1 flex-col items-center gap-4 text-[#333] md:items-start">
                <p className="w-full text-center text-[24px] font-bold leading-[34px] md:text-left md:text-[27px]">
                  {f.title}
                </p>
                <p className="text-[16px] leading-[28px] tracking-[0.64px] md:text-[18px] md:leading-[28px] md:tracking-[0.72px]">
                  {f.body}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
