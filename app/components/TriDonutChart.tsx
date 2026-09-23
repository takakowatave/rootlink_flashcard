import QuizStatusHelp from '@/components/QuizStatusHelp'

type Props = {
  mastered: number
  review: number
  hard: number
  unseen: number
  /** リング下の凡例 (未習得432 / 要復習17 …) を出すか。default true */
  showLegend?: boolean
  /** リングのサイズ (px)。default 180 */
  size?: number
}

export default function TriDonutChart({
  mastered, review, hard, unseen, showLegend = true, size = 180,
}: Props) {
  const total = mastered + review + hard + unseen
  const stroke = Math.max(10, Math.round(size * 16 / 180))
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r
  const mFrac = total === 0 ? 0 : mastered / total
  const rFrac = total === 0 ? 0 : review / total
  const hFrac = total === 0 ? 0 : hard / total
  const pct = total === 0 ? 0 : Math.round(mFrac * 100)

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
      {showLegend && (
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
      )}
    </div>
  )
}
