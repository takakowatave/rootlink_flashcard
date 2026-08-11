import QuizStatusHelp from '@/components/QuizStatusHelp'

type Props = {
  mastered: number
  review: number
  hard: number
  unseen: number
}

export default function TriDonutChart({ mastered, review, hard, unseen }: Props) {
  const total = mastered + review + hard + unseen
  if (total === 0) return null
  const size = 180
  const stroke = 16
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r
  const mFrac = mastered / total
  const rFrac = review / total
  const hFrac = hard / total
  const pct = Math.round(mFrac * 100)

  const seg = (start: number, len: number) => ({
    strokeDasharray: `${len * circ} ${(1 - len) * circ}`,
    strokeDashoffset: -(start * circ),
  })

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* background (未習得 track) */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
          {/* 習得済 (teal-mint) */}
          {mastered > 0 && (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#00d5be" strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={seg(0, mFrac).strokeDasharray}
              strokeDashoffset={seg(0, mFrac).strokeDashoffset}
            />
          )}
          {/* 要復習 (orange) */}
          {review > 0 && (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ff8904" strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={seg(mFrac, rFrac).strokeDasharray}
              strokeDashoffset={seg(mFrac, rFrac).strokeDashoffset}
            />
          )}
          {/* 苦手 (red) */}
          {hard > 0 && (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#C70036" strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={seg(mFrac + rFrac, hFrac).strokeDasharray}
              strokeDashoffset={seg(mFrac + rFrac, hFrac).strokeDashoffset}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-gray-900 leading-none">{pct}<span className="text-xl font-normal text-gray-500">%</span></span>
          <span className="text-sm text-gray-400 mt-1">習得済</span>
        </div>
      </div>
      <div className="flex items-center gap-5 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-line inline-block" />
          <span className="text-gray-500">未習得 <strong className="text-gray-700">{unseen}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-quiz-review inline-block" />
          <span className="text-gray-500">要復習 <strong className="text-gray-700">{review}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-mid inline-block" />
          <span className="text-gray-500">習得済 <strong className="text-gray-700">{mastered}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-quiz-hard inline-block" />
          <span className="text-gray-500">苦手 <strong className="text-gray-700">{hard}</strong></span>
        </div>
        <QuizStatusHelp />
      </div>
    </div>
  )
}
