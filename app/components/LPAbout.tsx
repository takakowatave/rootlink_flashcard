'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

export default function LPAbout() {
  const mockRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = mockRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); observer.disconnect() }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="flex w-full flex-col items-center gap-8 bg-white py-16 md:gap-10 md:py-[60px]">
      <h2 className="text-[26px] font-bold text-[#14b8a6] md:text-[42px]">
        RootLinkとは？
      </h2>

      <div className="flex w-full max-w-[980px] flex-col items-center gap-8 px-5 md:flex-row md:items-center md:gap-12 md:px-6 lg:px-0">

        {/* Phone mockup — scroll-triggered float-in */}
        <div
          ref={mockRef}
          className="relative shrink-0 overflow-hidden rounded-2xl shadow-lg"
          style={{
            width: 'clamp(220px, 48vw, 308px)',
            height: 'clamp(315px, 68vw, 429px)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(48px)',
            transition: 'opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <Image
            src="/lp/mock2.png"
            alt="RootLink アプリ画面"
            fill
            className="object-cover object-top"
            sizes="(max-width: 768px) 48vw, 308px"
          />
        </div>

        {/* Text */}
        <div className="flex flex-col gap-5 md:gap-6">
          <p className="text-[15px] leading-[30px] tracking-[0.6px] text-[#333] md:text-[18px] md:leading-[32px] md:tracking-[0.72px]">
            RootLinkは
            <strong className="text-[#494f56]">関連性で英単語を理解し、</strong>
            <br />
            <strong className="text-[#494f56]">つながりで覚えるための学習ツール</strong>
            です。
          </p>
          <p className="text-[15px] leading-[36px] tracking-[0.6px] text-[#333] md:text-[18px] md:leading-[38px] md:tracking-[0.72px]">
            「語源のつながり」から学べる辞書×単語帳です。
            <br />
            検索した単語をその場で意味だけでなく
            <br />
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
