import Image from 'next/image'
import { lpCopy } from '@/lib/lp-copy'
import type { DisplayLocale } from '@/types/DisplayLocale'

interface Props {
  locale: DisplayLocale
}

export default function LPAbout({ locale }: Props) {
  const copy = lpCopy[locale].about

  return (
    <section className="flex w-full flex-col items-center gap-8 bg-white pt-[42px] md:gap-10 md:pt-[60px]">
      <h2 className="text-[32px] font-bold text-[#14b8a6] md:text-[42px]">
        {copy.title}
      </h2>

      <div className="flex w-full max-w-[800px] flex-col items-center gap-8 px-4 md:flex-row-reverse md:items-start md:gap-12 md:px-6 lg:px-0">

        {/* ── テキスト ── */}
        <div className="flex flex-col gap-5 md:gap-6 md:pt-4 text-center md:text-left">
          <p className="text-[16px] leading-[32px] tracking-[0.64px] text-[#333] md:text-[18px] md:leading-[32px] md:tracking-[0.72px]">
            {copy.intro.lead}
            <strong className="text-[#494f56]">{copy.intro.strong}</strong>
            {copy.intro.tail}
          </p>
          <p className="text-[16px] leading-[34px] tracking-[0.64px] text-[#333] md:text-[18px] md:leading-[38px] md:tracking-[0.72px]">
            {copy.body}
          </p>
          <p className="text-[22px] font-bold leading-[36px] tracking-[0.88px] text-[#14b8a6] md:text-[23px] md:leading-[36px] md:tracking-[0.92px]">
            {copy.highlight}
          </p>
        </div>

        {/* ── Phone mockup ── */}
        <div className="w-[285px] shrink-0 md:w-[340px]">
          <Image
            src="/lp/mock_.png"
            alt="RootLink"
            width={874}
            height={936}
            className="w-full h-auto block"
            sizes="(max-width: 768px) 285px, 340px"
          />
        </div>
      </div>
    </section>
  )
}
