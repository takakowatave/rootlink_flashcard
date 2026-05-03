import Image from 'next/image'

export default function LPCta() {
  return (
    <section
      className="flex w-full flex-col items-center overflow-hidden pt-[32px] md:pt-[60px]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,60,50,0.12) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,60,50,0.12) 1px, transparent 1px),
          linear-gradient(85.5deg, rgb(0,163,134) 0%, rgb(1,195,160) 31.43%, rgb(125,226,101) 84.81%)
        `,
        backgroundSize: '32px 32px, 32px 32px, 100% 100%',
      }}
    >
      <div className="flex w-full max-w-[800px] flex-col items-center gap-8 px-5 py-0 md:flex-row md:items-end md:gap-12 md:px-6 lg:px-0">
        {/* Text + badges — order-1 on mobile (top), order-2 on desktop (right) */}
        <div className="order-1 md:order-2 flex flex-col gap-4 text-center md:text-left">
          <CtaText />
        </div>

        {/* Phone mockup — order-2 on mobile (bottom), order-1 on desktop (left) */}
        <div className="order-2 md:order-1 w-[276px] shrink-0 md:w-[300px]">
          <Image
            src="/lp/mock_.png"
            alt="RootLink アプリ"
            width={874}
            height={936}
            className="w-full h-auto block"
            sizes="(max-width: 768px) 276px, 300px"
          />
        </div>
      </div>
    </section>
  )
}

function CtaText() {
  return (
    <>
      <div className="flex flex-col gap-3">
        <p className="text-[34px] font-bold leading-none text-white md:text-[44px]">2026.06</p>
        <p className="text-[31px] font-bold leading-tight text-white md:text-[34px]">
          公式アプリリリース予定
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start pb-[80px]">
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
