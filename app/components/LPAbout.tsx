import Image from 'next/image'

export default function LPAbout() {
  return (
    <section className="flex w-full flex-col items-center gap-8 bg-white py-16 md:gap-10 md:py-[60px]">
      <h2 className="text-[26px] font-bold text-[#14b8a6] md:text-[42px]">
        RootLinkとは？
      </h2>

      <div className="flex w-full max-w-[800px] flex-col items-center gap-8 px-5 md:flex-row md:items-start md:gap-12 md:px-6 lg:px-0">

        {/* ── Phone mockup ── */}
        <div className="w-full shrink-0 md:w-[340px]">
          <Image
            src="/lp/mock_.png"
            alt="RootLink アプリ画面"
            width={874}
            height={936}
            className="w-full h-auto block"
            sizes="(max-width: 768px) 80vw, 340px"
          />
        </div>

        {/* ── テキスト ── */}
        <div className="flex flex-col gap-5 md:gap-6 md:pt-4">
          <p className="text-[15px] leading-[30px] tracking-[0.6px] text-[#333] md:text-[18px] md:leading-[32px] md:tracking-[0.72px]">
            RootLinkは
            <strong className="text-[#494f56]">関連性で英単語を理解し、</strong>
            <br />
            <strong className="text-[#494f56]">つながりで覚えるための学習ツール</strong>
            です。
          </p>
          <p className="text-[15px] leading-[36px] tracking-[0.6px] text-[#333] md:text-[18px] md:leading-[38px] md:tracking-[0.72px]">
            「語源のつながり」から学べる辞書×単語帳です。
            検索した単語をその場で意味だけでなく
            語源パーツまで分解して理解できるから、
          </p>
          <p className="text-[18px] font-bold leading-[34px] tracking-[0.72px] text-[#14b8a6] md:text-[23px] md:leading-[36px] md:tracking-[0.92px]">
            単発の暗記で終わらず、
            <br />
            関連語まで芋づる式に覚えられます。
          </p>
        </div>
      </div>
    </section>
  )
}
