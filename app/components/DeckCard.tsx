'use client'

type Props = {
  title: string
  wordCount: number
  imageSrc?: string
  onClick: () => void
}

export default function DeckCard({ title, wordCount, imageSrc, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-3xl text-left shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:border-primary/40 hover:shadow-[0_0_0_2px_rgba(20,184,166,0.08)] transition-all active:scale-[0.98] cursor-pointer overflow-hidden"
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt=""
          className="w-full aspect-[4/3] object-cover"
        />
      ) : (
        <div className="w-full aspect-[4/3] bg-gray-100" />
      )}
      <div className="p-4">
        <p className="text-2xl font-bold text-gray-900 tracking-tight leading-snug">
          {title}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          {wordCount.toLocaleString()} words
        </p>
      </div>
    </button>
  )
}
