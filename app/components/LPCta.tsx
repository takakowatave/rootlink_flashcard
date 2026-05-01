import Image from 'next/image'

export default function LPCta() {
  return (
    <section
      className="relative w-full overflow-hidden py-14 md:py-0 md:h-[432px]"
      style={{ backgroundImage: 'linear-gradient(85.5deg, rgb(0,163,134) 0%, rgb(1,195,160) 31.43%, rgb(125,226,101) 84.81%)' }}
    >
      {/* Phone mockup — desktop: absolute left, mobile: centered above text */}
      <div className="flex flex-col items-center gap-8 px-5 md:hidden">
        <div className="relative h-[320px] w-[240px] overflow-hidden rounded-2xl shadow-xl">
          <Image
            src="/lp/mock2.png"
            alt="RootLink アプリ"
            fill
            className="object-cover object-top"
            sizes="240px"
          />
        </div>
        <CtaText />
      </div>

      {/* Desktop layout */}
      <div className="relative hidden h-full w-full md:block">
        {/* Phone mockup */}
        <div
          className="absolute overflow-hidden rounded-2xl shadow-xl"
          style={{ left: 257, top: 18, width: 308, height: 414 }}
        >
          <Image
            src="/lp/mock2.png"
            alt="RootLink アプリ"
            fill
            className="object-cover object-top"
            sizes="308px"
          />
        </div>

        {/* Text + badges — positioned right side */}
        <div className="absolute flex flex-col gap-5" style={{ left: 634, top: 128, width: 449 }}>
          <CtaText />
        </div>
      </div>
    </section>
  )
}

function CtaText() {
  return (
    <>
      <div className="flex flex-col gap-2 text-center md:text-left">
        <p className="text-[36px] font-bold leading-none text-white md:text-[44px]">2026.06</p>
        <p className="text-[24px] font-bold leading-tight text-white md:text-[34px]">
          公式アプリリリース予定
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
        <div className="relative h-[54px] w-[145px]">
          <Image
            src="/lp/appstore.png"
            alt="Download on the App Store"
            fill
            className="object-contain"
            sizes="145px"
          />
        </div>
        <div className="relative h-[54px] w-[180px]">
          <Image
            src="/lp/googleplay.png"
            alt="Get it on Google Play"
            fill
            className="object-contain"
            sizes="180px"
          />
        </div>
      </div>
    </>
  )
}
