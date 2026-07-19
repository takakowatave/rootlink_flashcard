'use client'

type Props = {
  label: string
  title: string
  imageSrc?: string
  onClick: () => void
}

export default function DeckCard({ label, title, imageSrc, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-2xl px-6 py-4 flex flex-col items-center justify-between aspect-square shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:border-primary/40 hover:shadow-[0_0_0_2px_rgba(20,184,166,0.08)] transition-all active:scale-[0.98] cursor-pointer overflow-hidden"
    >
      <div className="text-center leading-tight tracking-[-0.33px]">
        <p className="text-3xl font-bold text-gray-950">{label}</p>
        <p className="text-3xl font-bold text-gray-950">{title}</p>
      </div>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt=""
          className="w-[118px] h-[74px] object-cover"
        />
      ) : (
        <div className="w-[118px] h-[74px]" />
      )}
    </button>
  )
}
