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
      className="bg-white border border-slate-200 rounded-3xl px-6 py-4 flex flex-col items-center justify-between gap-3 hover:border-gray-400 transition-colors active:scale-[0.98] cursor-pointer"
    >
      <div className="text-center leading-6 tracking-[-0.33px]">
        <p className="text-[22px] font-bold text-gray-950">{label}</p>
        <p className="text-[22px] font-bold text-gray-950">{title}</p>
      </div>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt=""
          className="w-full aspect-[500/308] object-cover rounded-2xl"
        />
      ) : (
        <div className="w-full aspect-[500/308]" />
      )}
    </button>
  )
}
