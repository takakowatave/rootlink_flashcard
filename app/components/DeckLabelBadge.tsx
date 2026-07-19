'use client'

type Props = {
  label: string
}

export default function DeckLabelBadge({ label }: Props) {
  return (
    <h3 className="mb-3 text-2xl font-bold text-gray-950 tracking-tight">
      {label}
    </h3>
  )
}
