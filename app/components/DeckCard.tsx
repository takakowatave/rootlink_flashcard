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
      className="bg-white rounded-2xl px-6 py-4 flex flex-col items-center justify-between aspect-square hover:bg-gray-50 transition-colors active:scale-[0.98] cursor-pointer"
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
