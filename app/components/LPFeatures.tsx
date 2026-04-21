'use client'

import Image from 'next/image'

const FEATURES = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="9" r="5" fill="url(#g1)" />
        <circle cx="6" cy="26" r="4" fill="#e7f8f5" stroke="#01C3A0" strokeWidth="1.5" />
        <circle cx="26" cy="26" r="4" fill="#e7f8f5" stroke="#01C3A0" strokeWidth="1.5" />
        <line x1="16" y1="14" x2="6" y2="22" stroke="#01C3A0" strokeWidth="1.5" />
        <line x1="16" y1="14" x2="26" y2="22" stroke="#01C3A0" strokeWidth="1.5" />
        <defs>
          <linearGradient id="g1" x1="11" y1="4" x2="21" y2="14" gradientUnits="userSpaceOnUse">
            <stop stopColor="#01C3A0" />
            <stop offset="1" stopColor="#7DE265" />
          </linearGradient>
        </defs>
      </svg>
    ),
    title: '語源ツリーで\n単語を理解する',
    body: '単語を語根・接頭辞・接尾辞に分解。なぜその意味になるのかを語源から把握できます。',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="3" y="8" width="26" height="18" rx="4" fill="#e7f8f5" stroke="#01C3A0" strokeWidth="1.5" />
        <rect x="8" y="3" width="16" height="6" rx="2" fill="url(#g2)" />
        <line x1="10" y1="16" x2="22" y2="16" stroke="#01C3A0" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="10" y1="21" x2="18" y2="21" stroke="#7DE265" strokeWidth="1.5" strokeLinecap="round" />
        <defs>
          <linearGradient id="g2" x1="8" y1="3" x2="24" y2="9" gradientUnits="userSpaceOnUse">
            <stop stopColor="#01C3A0" />
            <stop offset="1" stopColor="#7DE265" />
          </linearGradient>
        </defs>
      </svg>
    ),
    title: '英英辞書 × AI で\n深く学ぶ',
    body: 'Oxford辞書のデータをAIが学習者向けにリライト。語義・用例・ニュアンスをわかりやすく提示します。',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="6" width="24" height="20" rx="4" fill="#e7f8f5" stroke="#01C3A0" strokeWidth="1.5" />
        <path d="M12 16 L15 19 L20 13" stroke="#01C3A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="24" cy="8" r="4" fill="url(#g3)" />
        <path d="M22.5 8 L23.5 9 L25.5 7" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="g3" x1="20" y1="4" x2="28" y2="12" gradientUnits="userSpaceOnUse">
            <stop stopColor="#01C3A0" />
            <stop offset="1" stopColor="#7DE265" />
          </linearGradient>
        </defs>
      </svg>
    ),
    title: 'フラッシュカードで\n記憶を定着',
    body: '保存した単語をクイズ形式で確認。正解・不正解を記録し、苦手な単語を重点的に復習できます。',
    img: '/lp/screenshot-quiz.png',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M6 10 C6 7.8 7.8 6 10 6 L22 6 C24.2 6 26 7.8 26 10 L26 22 C26 24.2 24.2 26 22 26 L10 26 C7.8 26 6 24.2 6 22 Z" fill="#e7f8f5" stroke="#01C3A0" strokeWidth="1.5" />
        <circle cx="11" cy="13" r="1.5" fill="#01C3A0" />
        <circle cx="16" cy="13" r="1.5" fill="#7DE265" />
        <circle cx="21" cy="13" r="1.5" fill="#01C3A0" />
        <line x1="10" y1="19" x2="22" y2="19" stroke="#01C3A0" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
        <circle cx="26" cy="6" r="4" fill="url(#g4)" />
        <path d="M24 6 L26 8 L28 5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="g4" x1="22" y1="2" x2="30" y2="10" gradientUnits="userSpaceOnUse">
            <stop stopColor="#01C3A0" />
            <stop offset="1" stopColor="#7DE265" />
          </linearGradient>
        </defs>
      </svg>
    ),
    title: '同語根の単語を\nまとめて習得',
    body: '同じ語根を持つ単語を芋づる式に探索。関連語のネットワークを広げながら語彙を増やせます。',
  },
]

export default function LPFeatures() {
  return (
    <section className="w-full bg-[#f8fafb] py-16 md:py-20">
      <div className="mx-auto max-w-[980px] px-4 md:px-6">
        <h2 className="mb-12 text-center text-[28px] font-bold text-[#1a2438] md:text-[36px]">
          RootLinkの
          <span className="bg-gradient-to-r from-[#01C3A0] to-[#7DE265] bg-clip-text text-transparent">
            4つの特徴
          </span>
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-[0_2px_12px_0_rgba(0,0,0,0.06)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#f0faf8]">
                  {f.icon}
                </div>
                <h3 className="text-[16px] font-bold leading-snug text-[#1a2438] whitespace-pre-line">
                  {f.title}
                </h3>
              </div>
              <p className="text-[14px] leading-[26px] text-[#5a6a7e]">{f.body}</p>
              {f.img && (
                <div className="overflow-hidden rounded-xl border border-[#e7edf4]">
                  <Image
                    src={f.img}
                    alt={f.title}
                    width={480}
                    height={240}
                    className="w-full object-cover"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
