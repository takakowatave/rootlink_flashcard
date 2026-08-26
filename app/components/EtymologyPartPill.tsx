'use client'

type Props = {
  partText: string
}

export default function EtymologyPartPill({ partText }: Props) {
  return (
    <span className="rounded-xl border-2 border-green-500 bg-white px-4 py-1 text-sm leading-none text-green-600">
      {partText}
    </span>
  )
}
