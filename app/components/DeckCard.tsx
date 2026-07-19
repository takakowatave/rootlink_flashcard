'use client'

type Props = {
  title: string
  wordCount: number
  onClick: () => void
}

export default function DeckCard({ title, wordCount, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-6 text-left shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:border-primary/40 hover:shadow-[0_0_0_2px_rgba(20,184,166,0.08)] transition-all active:scale-[0.98] cursor-pointer"
    >
      <p className="text-2xl font-bold text-gray-900 tracking-tight leading-snug">
        {title}
      </p>
      <p className="text-sm text-gray-400 mt-1">
        {wordCount.toLocaleString()} words
      </p>
    </button>
  )
}
