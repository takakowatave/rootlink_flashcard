export default function TriDonutChart({ mastered, review, unseen }: { mastered: number; review: number; unseen: number }) {
  const total = mastered + review + unseen
  if (total === 0) return null
  const size = 180
  const stroke = 16
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r
  const mFrac = mastered / total
  const rFrac = review / total
  const pct = Math.round((mastered / total) * 100)

  const seg = (start: number, len: number) => ({
    strokeDasharray: `${len * circ} ${(1 - len) * circ}`,
    strokeDashoffset: -(start * circ),
  })

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* background */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
          {/* 習得済 (green) */}
          {mastered > 0 && (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#4ade80" strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={seg(0, mFrac).strokeDasharray}
              strokeDashoffset={seg(0, mFrac).strokeDashoffset}
            />
          )}
          {/* 要復習 (orange) */}
          {review > 0 && (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#fb923c" strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={seg(mFrac, rFrac).strokeDasharray}
              strokeDashoffset={seg(mFrac, rFrac).strokeDashoffset}
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
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />
          <span className="text-gray-500">未習得 <strong className="text-gray-700">{unseen}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />
          <span className="text-gray-500">要復習 <strong className="text-gray-700">{review}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
          <span className="text-gray-500">習得済 <strong className="text-gray-700">{mastered}</strong></span>
        </div>
      </div>
    </div>
  )
}
