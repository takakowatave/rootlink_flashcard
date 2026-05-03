import Image from 'next/image'

export default function LPCta() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ backgroundImage: 'linear-gradient(85.5deg, rgb(0,163,134) 0%, rgb(1,195,160) 31.43%, rgb(125,226,101) 84.81%)' }}
    >
      {/* ── SP layout ── */}
      <div className="flex flex-col items-center gap-6 px-5 py-14 md:hidden">
        <CtaText />
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden md:flex w-full justify-center py-10">
        <div className="flex w-full max-w-[800px] items-center gap-10 px-6 lg:px-0">
          {/* Phone mockup */}
          <div className="shrink-0 w-[280px]">
            <Image
              src="/lp/mock_.png"
              alt="RootLink アプリ"
              width={560}
              height={670}
              className="w-full h-auto block"
              sizes="280px"
            />
          </div>
          {/* Text + badges */}
          <div className="flex flex-col gap-5">
            <CtaText />
          </div>
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
