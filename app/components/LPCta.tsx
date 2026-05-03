import Image from 'next/image'

export default function LPCta() {
  return (
    <section
      className="w-full overflow-hidden"
      style={{ backgroundImage: 'linear-gradient(85.5deg, rgb(0,163,134) 0%, rgb(1,195,160) 31.43%, rgb(125,226,101) 84.81%)' }}
    >
      <div className="mx-auto flex w-full max-w-[800px] flex-col items-center gap-8 px-5 py-12 md:flex-row md:items-end md:gap-12 md:px-6 md:py-0 lg:px-0">
        {/* Phone mockup */}
        <div className="w-[240px] shrink-0 md:w-[300px]">
          <Image
            src="/lp/mock_.png"
            alt="RootLink アプリ"
            width={600}
            height={720}
            className="w-full h-auto block"
            sizes="(max-width: 768px) 240px, 300px"
          />
        </div>

        {/* Text + badges */}
        <div className="flex flex-col gap-5 pb-12 text-center md:text-left">
          <CtaText />
        </div>
      </div>
    </section>
  )
}

function CtaText() {
  return (
    <>
      <div className="flex flex-col gap-2">
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
