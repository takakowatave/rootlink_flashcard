import Image from 'next/image'

export default function LPCta() {
  return (
    <section
      className="flex w-full flex-col items-center overflow-hidden pt-[32px] md:pt-[60px]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,60,50,0.12) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,60,50,0.12) 1px, transparent 1px),
          linear-gradient(88.89deg, rgb(0,163,134) 0%, rgb(1,195,160) 31.43%, rgb(125,226,101) 84.81%)
        `,
        backgroundSize: '32px 32px, 32px 32px, 100% 100%',
      }}
    >
      <div className="flex w-full max-w-[800px] flex-col items-center gap-8 px-5 md:flex-row md:items-end md:gap-12 md:px-6 lg:px-0">

        {/* テキスト — SP: 上 / PC: 右 */}
        <div className="order-1 md:order-2 flex flex-col gap-3 text-center md:text-left">
          <p className="text-[34px] font-bold leading-none text-white md:text-[44px]">2026.06</p>
          <p className="text-[31px] font-bold leading-tight text-white md:text-[34px]">
            公式アプリリリース予定
          </p>
          {/* バッジ — PC のみここに表示 */}
          <div className="hidden md:flex flex-wrap items-center gap-4 pb-[80px]">
            <div className="relative h-[54px] w-[145px]">
              <Image src="/lp/appstore.png" alt="Download on the App Store" fill className="object-contain" sizes="145px" />
            </div>
            <div className="relative h-[54px] w-[180px]">
              <Image src="/lp/googleplay.png" alt="Get it on Google Play" fill className="object-contain" sizes="180px" />
            </div>
          </div>
        </div>

        {/* スマホ画像 — SP: 下 / PC: 左 */}
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

      {/* バッジ — SP のみ、スマホ画像の下 */}
      <div className="md:hidden flex items-center justify-center gap-2 pb-8 pt-2">
        <div className="relative h-[52px] w-[156px]">
          <Image src="/lp/appstore.png" alt="Download on the App Store" fill className="object-contain" sizes="156px" />
        </div>
        <div className="relative h-[52px] w-[176px]">
          <Image src="/lp/googleplay.png" alt="Get it on Google Play" fill className="object-contain" sizes="176px" />
        </div>
      </div>
    </section>
  )
}
