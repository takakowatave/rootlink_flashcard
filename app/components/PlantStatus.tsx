// 累計ログイン日数に応じて鉢植えを育てる表示。
// しきい値は定数なので運用しながら調整可。
type PlantLevel = { level: number; minDays: number; src: string }

const PLANT_LEVELS: PlantLevel[] = [
  { level: 1, minDays: 0, src: '/plant/lv1.png' },
  { level: 2, minDays: 7, src: '/plant/lv2.png' },
  { level: 3, minDays: 30, src: '/plant/lv3.png' },
  { level: 4, minDays: 100, src: '/plant/lv4.png' },
  { level: 5, minDays: 365, src: '/plant/lv5.png' },
  { level: 6, minDays: 500, src: '/plant/lv5.png' },
  { level: 7, minDays: 730, src: '/plant/lv5.png' },
  { level: 8, minDays: 1000, src: '/plant/lv5.png' },
  { level: 9, minDays: 1500, src: '/plant/lv5.png' },
  { level: 10, minDays: 2000, src: '/plant/lv5.png' },
]

function resolveLevel(loginDays: number) {
  let current = PLANT_LEVELS[0]
  for (const lv of PLANT_LEVELS) {
    if (loginDays >= lv.minDays) current = lv
  }
  const next = PLANT_LEVELS.find((lv) => lv.minDays > loginDays) ?? null
  const daysToNext = next ? next.minDays - loginDays : null
  return { current, next, daysToNext }
}

export default function PlantStatus({ loginDays }: { loginDays: number }) {
  const { current, next, daysToNext } = resolveLevel(loginDays)
  const levelLabel = `Lv.${String(current.level).padStart(2, '0')}`

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-r border-line shrink-0">
      <img
        src={current.src}
        alt={`鉢植え ${levelLabel}`}
        className="size-12 rounded-full select-none shrink-0"
        draggable={false}
      />
      <div>
        <p className="text-xs text-muted leading-snug">単語を覚えて<br />鉢植えを育てよう</p>
        <p className="text-sm font-bold text-gray-950 mt-0.5">{levelLabel}</p>
        {next && daysToNext !== null && (
          <p className="text-[11px] text-muted mt-0.5">
            あと{daysToNext}日でLv.{String(next.level).padStart(2, '0')}
          </p>
        )}
      </div>
    </div>
  )
}
