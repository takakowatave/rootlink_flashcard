'use client'

import { useRouter } from 'next/navigation'

type DeckGroup = {
  label: string
  decks: { name: string; shortName: string; wordCount: number; id: string }[]
}

const LABEL_STYLES: Record<string, { badge: string; dot: string }> = {
  TOEIC: { badge: 'bg-blue-50 text-blue-600 border-blue-200', dot: 'bg-blue-400' },
  IELTS: { badge: 'bg-teal-50 text-teal-600 border-teal-200', dot: 'bg-teal-400' },
  TOEFL: { badge: 'bg-violet-50 text-violet-600 border-violet-200', dot: 'bg-violet-400' },
  英検: { badge: 'bg-orange-50 text-orange-600 border-orange-200', dot: 'bg-orange-400' },
}

// 静的データ（DBと同期済み）
const DECK_GROUPS: DeckGroup[] = [
  {
    label: 'TOEIC',
    decks: [
      { id: '987c37d0-6053-490f-8949-b3f1f6cb121d', name: 'TOEIC 600+', shortName: '600+', wordCount: 480 },
      { id: 'bd189d85-4a9b-48e8-9c5a-0bfdcdcfef19', name: 'TOEIC 730+', shortName: '730+', wordCount: 379 },
      { id: '3c432bc7-766e-4882-88a9-55ddcbb7b308', name: 'TOEIC 860+', shortName: '860+', wordCount: 292 },
      { id: 'd64d8a2f-ea22-422a-838f-19bb4a55850d', name: 'TOEIC 990+', shortName: '990+', wordCount: 191 },
    ],
  },
  {
    label: 'IELTS',
    decks: [
      { id: '69524dec-d44b-45bd-8807-de0a1b5755bd', name: 'IELTS 5.5', shortName: '5.5', wordCount: 269 },
      { id: 'a5eebca9-e2ad-4e7e-b4a2-9db20dfb17fe', name: 'IELTS 6.5', shortName: '6.5', wordCount: 342 },
      { id: 'b8d7ee35-d4dd-400b-989b-85946c53212a', name: 'IELTS 7.5', shortName: '7.5', wordCount: 167 },
    ],
  },
  {
    label: 'TOEFL',
    decks: [
      { id: '0cdb13ba-9060-4e84-8d01-b64a8a906e67', name: 'TOEFL 60', shortName: 'iBT 60', wordCount: 200 },
      { id: '21086a87-e458-452f-a105-57fc4bf6971c', name: 'TOEFL 80', shortName: 'iBT 80', wordCount: 200 },
      { id: 'd57aef47-1190-4bd9-9ce6-23eb495eeb43', name: 'TOEFL 100', shortName: 'iBT 100', wordCount: 200 },
    ],
  },
  {
    label: '英検',
    decks: [
      { id: 'ba7d9ef3-6b98-4011-8e62-2aa35779336a', name: '英検 準1級', shortName: '準1級', wordCount: 363 },
      { id: 'fd534c6c-13d2-4d01-a819-0120ec1c5b1b', name: '英検 1級', shortName: '1級', wordCount: 383 },
    ],
  },
]

export default function LPDecks() {
  const router = useRouter()

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-[860px] mx-auto">
        {/* タイトル */}
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-primary leading-tight mb-4">
            試験対策の教材も充実
          </h2>
          <p className="text-[15px] text-gray-500 leading-relaxed">
            RootLinkは試験対策にも対応。オリジナルの単語帳も作れますが、<br className="hidden sm:inline" />
            幅広い試験対策の教材も用意しています。
          </p>
        </div>

        {/* デッキグループ */}
        <div className="flex flex-col gap-10">
          {DECK_GROUPS.map(group => {
            const style = LABEL_STYLES[group.label] ?? { badge: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' }
            return (
              <div key={group.label}>
                {/* ラベルヘッダー */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-semibold ${style.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    {group.label}
                  </div>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                {/* カードグリッド */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {group.decks.map(deck => (
                    <button
                      key={deck.id}
                      onClick={() => router.push(`/decks/${deck.id}`)}
                      className="bg-white border border-gray-200 rounded-lg p-6 text-left shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:border-primary/40 hover:shadow-[0_0_0_2px_rgba(20,184,166,0.08)] transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <p className="text-2xl font-bold text-gray-900 tracking-tight leading-snug">
                        {deck.shortName}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {deck.wordCount.toLocaleString()} words
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
