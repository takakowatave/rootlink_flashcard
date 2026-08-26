'use client'

type Props = {
  partText: string
}

export default function EtymologyPartPill({ partText }: Props) {
  return (
    <span className="inline-flex items-center rounded-full border-2 border-primary bg-white px-3 py-1 text-sm font-medium leading-none text-primary">
      {partText}
    </span>
  )
}
