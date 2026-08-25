// 鉢植えの成長状態を表示するコンポーネント。
// ロジック・しきい値・文言は lib/plantGrowth.ts に集約。PC/SP どちらもここを経由すること。
import { resolveGrowth, GROWTH_HEADING, formatLevelLabel } from '@/lib/plantGrowth'

export { getPlantImageSrc } from '@/lib/plantGrowth'

type Variant = 'default' | 'compact'

export default function PlantStatus({
  quizCount,
  loginDays,
  variant = 'default',
}: {
  quizCount: number
  loginDays: number
  variant?: Variant
}) {
  const { current, next, pointsToNext, progressRatio } = resolveGrowth(quizCount, loginDays)
  const levelLabel = formatLevelLabel(current.level)
  const nextText =
    next && pointsToNext !== null
      ? `あと${pointsToNext}ptでLv.${String(next.level).padStart(2, '0')}`
      : null

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="bg-orange-50 rounded-full size-[72px] flex items-center justify-center overflow-hidden shrink-0">
          <img
            src={current.src}
            alt={`鉢植え ${levelLabel}`}
            className="size-full object-contain"
            draggable={false}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs leading-tight text-gray-950 mb-2">
            {GROWTH_HEADING.split('\n').map((line, i) => (
              <span key={i} className="block">{line}</span>
            ))}
          </p>
          <div className="bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${Math.round(progressRatio * 100)}%` }}
            />
          </div>
          {nextText && (
            <p className="text-[10px] text-muted mt-1 leading-tight">{nextText}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-r border-line shrink-0">
      <img
        src={current.src}
        alt={`鉢植え ${levelLabel}`}
        className="size-20 select-none shrink-0 object-contain"
        draggable={false}
      />
      <div className="min-w-0">
        <p className="text-xs text-muted leading-snug">
          {GROWTH_HEADING.split('\n').map((line, i) => (
            <span key={i} className="block">{line}</span>
          ))}
        </p>
        <p className="text-sm font-bold text-gray-950 mt-0.5">{levelLabel}</p>
        <div className="bg-slate-200 h-2 rounded-full overflow-hidden mt-1">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${Math.round(progressRatio * 100)}%` }}
          />
        </div>
        {nextText && (
          <p className="text-[11px] text-muted mt-0.5">{nextText}</p>
        )}
      </div>
    </div>
  )
}
