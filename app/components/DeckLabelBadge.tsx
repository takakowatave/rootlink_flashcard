'use client'

type Props = {
  label: string
}

export default function DeckLabelBadge({ label }: Props) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="text-sm font-semibold text-gray-700">
        {label}
      </div>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}
