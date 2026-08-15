'use client'

type Props = {
  label?: string
  title: string
  wordCount?: number
  imageSrc?: string
  isPremium?: boolean
  disabled?: boolean
  onClick: () => void
  className?: string
}

export default function DeckCard({ label, title, wordCount, imageSrc, isPremium, disabled, onClick, className }: Props) {
  const displayTitle = label ? `${label} ${title}` : title
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      className={`relative bg-white border border-line rounded-2xl py-3 flex flex-col items-center justify-center gap-3 overflow-hidden transition-colors ${
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'hover:border-muted active:scale-[0.98] cursor-pointer'
      } ${className ?? ''}`}
    >
      {isPremium && (
        <span
          aria-label="プレミアム限定"
          className="absolute top-0 left-0 size-[30px] rounded-br-[9px] bg-premium flex items-center justify-center"
        >
          <img src="/premium-crown.svg" alt="" width={18} height={18} />
        </span>
      )}
      <p className="text-[18px] font-bold text-gray-950 tracking-[-0.27px] leading-[21px] whitespace-nowrap">
        {displayTitle}
      </p>
      <div className="w-[118px] h-[74px] overflow-hidden">
        {imageSrc && (
          <img src={imageSrc} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      {typeof wordCount === 'number' && (
        <p className="py-1 text-[12px] leading-none text-slate-500 tracking-[-0.18px]">
          {wordCount} 語
        </p>
      )}
    </button>
  )
}
