'use client'

import { HiOutlineArrowLeft } from 'react-icons/hi2'
import { useLocale } from '@/lib/LocaleProvider'
import { messages } from '@/lib/i18n/messages'

type Props = {
  step: number
  totalSteps: number
  onBack: (() => void) | null
}

export default function OnboardingProgressBar({ step, totalSteps, onBack }: Props) {
  const locale = useLocale()
  const t = messages[locale].common
  const pct = Math.min(100, Math.max(0, (step / totalSteps) * 100))
  const canBack = onBack !== null
  return (
    <div className="flex items-center gap-3 h-14 px-2 border-b border-line">
      <button
        type="button"
        onClick={canBack ? onBack : undefined}
        disabled={!canBack}
        aria-label={t.back}
        className="size-6 flex items-center justify-center disabled:opacity-30"
      >
        <HiOutlineArrowLeft className="size-5 text-gray-700" />
      </button>
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-sm text-gray-400 tabular-nums whitespace-nowrap">
          {step} / {totalSteps}
        </span>
      </div>
    </div>
  )
}
