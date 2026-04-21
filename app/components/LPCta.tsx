'use client'

import Image from 'next/image'

export default function LPCta() {
  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="mx-auto flex max-w-[980px] flex-col items-center gap-8 px-4 md:px-6">

        {/* バッジ */}
        <span className="rounded-full bg-[#e7f8f5] px-4 py-1.5 text-[13px] font-semibold text-[#00AD82]">
          Coming Soon
        </span>

        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-[28px] font-bold text-[#1a2438] md:text-[36px]">
            RootLink for iOS / Android
          </h2>
          <p className="text-[15px] leading-relaxed text-[#5a6a7e] md:text-[16px]">
            2026年6月、モバイルアプリとして正式リリース予定。
            <br className="hidden md:block" />
            いつでもどこでも語源から英単語を学べるようになります。
          </p>
        </div>

        {/* リリース時期 */}
        <div className="flex items-center gap-3">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#00AD82]" />
          <span className="text-[22px] font-bold tracking-widest text-[#00AD82] md:text-[26px]">
            2026.06
          </span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#00AD82]" />
        </div>

        {/* ストアバッジ */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="opacity-50 grayscale">
            <Image
              src="/lp/appstore.png"
              alt="Download on the App Store"
              width={160}
              height={54}
              className="h-[48px] w-auto object-contain"
            />
          </div>
          <div className="opacity-50 grayscale">
            <Image
              src="/lp/googleplay.png"
              alt="Get it on Google Play"
              width={180}
              height={54}
              className="h-[48px] w-auto object-contain"
            />
          </div>
        </div>

        <p className="text-[12px] text-[#a0aec0]">
          ※ 現在はWebブラウザ版のみご利用いただけます
        </p>
      </div>
    </section>
  )
}
