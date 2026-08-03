'use client'

import { HiLockClosed } from 'react-icons/hi2'

type Props = {
  label?: string
  title: string
  imageSrc?: string
  imageContain?: boolean
  isLocked?: boolean
  onClick: () => void
  className?: string
}

export default function DeckCard({ label, title, imageSrc, imageContain, isLocked, onClick, className }: Props) {
  return (
    <button
      onClick={onClick}
      className={`relative bg-white border border-line rounded-3xl px-6 py-4 flex flex-col items-center justify-between gap-3 hover:border-muted transition-colors active:scale-[0.98] cursor-pointer ${className ?? ''}`}
    >
      {isLocked && (
        <span
          aria-label="プレミアム限定"
          className="absolute top-3 left-3 size-10 rounded-full bg-slate-200 flex items-center justify-center"
        >
          <HiLockClosed className="size-5 text-slate-400" />
        </span>
      )}
      <div className="text-center leading-6 tracking-[-0.33px]">
        {label && <p className="text-[22px] font-bold text-gray-950">{label}</p>}
        <p className="text-[22px] font-bold text-gray-950">{title}</p>
      </div>
      {imageSrc ? (
        imageContain ? (
          <div className="w-full aspect-[544/400] flex items-center justify-center">
            <img
              src={imageSrc}
              alt=""
              className="h-full aspect-square rounded-full object-cover"
            />
          </div>
        ) : (
          <img
            src={imageSrc}
            alt=""
            className="w-full aspect-[544/400] object-cover rounded-2xl"
          />
        )
      ) : (
        <div className="w-full aspect-[544/400]" />
      )}
    </button>
  )
}
