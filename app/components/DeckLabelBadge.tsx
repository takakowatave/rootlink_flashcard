'use client'

const LABEL_STYLES: Record<string, { badge: string; dot: string }> = {
  TOEIC: { badge: 'bg-blue-50 text-blue-600 border-blue-200',       dot: 'bg-blue-400' },
  IELTS: { badge: 'bg-teal-50 text-teal-600 border-teal-200',       dot: 'bg-teal-400' },
  TOEFL: { badge: 'bg-violet-50 text-violet-600 border-violet-200', dot: 'bg-violet-400' },
  英検:  { badge: 'bg-orange-50 text-orange-600 border-orange-200', dot: 'bg-orange-400' },
}

const PRIMARY_STYLE = { badge: 'bg-primary/5 text-primary border-primary/20', dot: 'bg-primary' }
const FALLBACK_STYLE = { badge: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' }

type Props = {
  label: string
  variant?: 'label' | 'primary'
}

export default function DeckLabelBadge({ label, variant = 'label' }: Props) {
  const style = variant === 'primary'
    ? PRIMARY_STYLE
    : (LABEL_STYLES[label] ?? FALLBACK_STYLE)
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-semibold ${style.badge}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
        {label}
      </div>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}
