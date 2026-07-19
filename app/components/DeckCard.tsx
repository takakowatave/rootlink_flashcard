'use client'

type Props = {
  label?: string
  title: string
  imageSrc?: string
  onClick: () => void
  className?: string
}

export default function DeckCard({ label, title, imageSrc, onClick, className }: Props) {
  return (
    <button
      onClick={onClick}
      className={`bg-white border border-line rounded-3xl px-6 py-4 flex flex-col items-center justify-between gap-3 hover:border-muted transition-colors active:scale-[0.98] cursor-pointer ${className ?? ''}`}
    >
      <div className="text-center leading-6 tracking-[-0.33px]">
        {label && <p className="text-[22px] font-bold text-gray-950">{label}</p>}
        <p className="text-[22px] font-bold text-gray-950">{title}</p>
      </div>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt=""
          className="w-full aspect-[544/400] object-cover rounded-2xl"
        />
      ) : (
        <div className="w-full aspect-[544/400]" />
      )}
    </button>
  )
}
