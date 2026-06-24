'use client'

type Props = {
  streak: number
  longest: number
}

export default function StreakBadge({ streak, longest }: Props) {
  const isActive = streak > 0

  return (
    <div className="flex items-center gap-3">
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${isActive ? 'bg-orange-50' : 'bg-gray-100'}`}>
        <span className={`text-xl leading-none ${isActive ? '' : 'grayscale opacity-40'}`}>🔥</span>
        <span className={`text-sm font-bold tabular-nums ${isActive ? 'text-orange-500' : 'text-gray-400'}`}>
          {streak}
        </span>
        <span className={`text-xs ${isActive ? 'text-orange-400' : 'text-gray-400'}`}>日</span>
      </div>
      {longest > 1 && (
        <span className="text-xs text-gray-400">最長 {longest}日</span>
      )}
    </div>
  )
}
