'use client'

import { HiOutlineArrowLeft } from 'react-icons/hi2'

type Props = {
  step: number
  totalSteps: number
  // 戻るボタンの挙動。null を渡したら disabled 状態で描画 (header の形は保つ)
  onBack: (() => void) | null
}

// Figma 2613:6938 の Expansion-panel-header 準拠の進捗バー。
// 左に戻る矢印、右に progress-bar + "step / totalSteps" テキスト。
// 進捗バーを出さない画面 (ウェルカム・利用規約) ではこのコンポーネント自体を使わず、
// 使う側で独自に arrow だけの 56px ヘッダーを描く。
export default function OnboardingProgressBar({ step, totalSteps, onBack }: Props) {
  const pct = Math.min(100, Math.max(0, (step / totalSteps) * 100))
  const canBack = onBack !== null
  return (
    <div className="flex items-center gap-3 h-14 px-2 border-b border-line">
      <button
        type="button"
        onClick={canBack ? onBack : undefined}
        disabled={!canBack}
        aria-label="戻る"
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
