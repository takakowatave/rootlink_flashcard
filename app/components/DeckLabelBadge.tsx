'use client'

type Props = {
  label: string
}

export default function DeckLabelBadge({ label }: Props) {
  return (
    <div className="mb-3 text-sm font-semibold text-gray-700">
      {label}
    </div>
  )
}
