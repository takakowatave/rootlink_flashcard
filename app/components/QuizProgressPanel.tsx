'use client'

import type { ReactNode } from 'react'
import CardShell from '@/components/CardShell'
import TriDonutChart from '@/components/TriDonutChart'
import QuizScopeSelector, { type QuizScope, type QuizScopeItem } from '@/components/QuizScopeSelector'
import Button from '@/components/Button'

export type QuizDefaultMode = 'example' | 'word'

type Props = {
  header?: ReactNode
  mastered: number
  review: number
  hard: number
  unseen: number
  scopeItems?: QuizScopeItem[]
  selectedScope?: QuizScope
  onScopeChange?: (scope: QuizScope) => void
  buttonLabel: string
  buttonDisabled?: boolean
  onStart: () => void
  // 設定ブロック（任意）: 渡された時のみ表示
  settings?: {
    defaultMode: QuizDefaultMode
    onDefaultModeChange: (m: QuizDefaultMode) => void
    questionCount: number
    onQuestionCountChange: (n: number) => void
    questionCountMax: number
    questionCountMin?: number
    autoPlayAudio: boolean
    onAutoPlayAudioChange: (v: boolean) => void
    autoPlayHeadword: boolean
    onAutoPlayHeadwordChange: (v: boolean) => void
  }
}

function ModeSegmented({
  value,
  onChange,
}: {
  value: QuizDefaultMode
  onChange: (m: QuizDefaultMode) => void
}) {
  return (
    <div className="inline-flex border border-divider rounded-[4px] overflow-hidden">
      <button
        type="button"
        onClick={() => onChange('example')}
        className={`px-6 h-8 text-sm font-bold transition-colors ${
          value === 'example' ? 'bg-primary-light text-primary-hover' : 'bg-white text-dim'
        }`}
      >
        例文
      </button>
      <button
        type="button"
        onClick={() => onChange('word')}
        className={`px-6 h-8 text-sm transition-colors ${
          value === 'word' ? 'bg-primary-light text-primary-hover font-bold' : 'bg-white text-dim font-normal'
        }`}
      >
        単語
      </button>
    </div>
  )
}

function CountStepper({
  value,
  onChange,
  min,
  max,
}: {
  value: number
  onChange: (n: number) => void
  min: number
  max: number
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n))
  return (
    <div className="inline-flex items-center gap-4">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label="減らす"
        className="size-8 rounded-full border border-line bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-lg leading-none hover:bg-gray-50 transition-colors"
      >
        −
      </button>
      <span className="min-w-[2ch] text-center text-lg font-semibold text-gray-900 tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label="増やす"
        className="size-8 rounded-full border border-line bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-lg leading-none hover:bg-gray-50 transition-colors"
      >
        +
      </button>
    </div>
  )
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[31px] w-[51px] rounded-full transition-colors shrink-0 ${
        checked ? 'bg-primary' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-[27px] rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[20px]' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function SettingRow({
  label,
  control,
}: {
  label: string
  control: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-1 py-1">
      <span className="text-sm font-semibold text-gray-800">{label}</span>
      {control}
    </div>
  )
}

export default function QuizProgressPanel({
  header,
  mastered,
  review,
  hard,
  unseen,
  scopeItems,
  selectedScope,
  onScopeChange,
  buttonLabel,
  buttonDisabled,
  onStart,
  settings,
}: Props) {
  const hasScope = scopeItems && selectedScope && onScopeChange

  return (
    <>
      <CardShell>
        {header && <div className="mb-2">{header}</div>}
        <div className="flex justify-center py-2">
          <TriDonutChart mastered={mastered} review={review} hard={hard} unseen={unseen} />
        </div>
        {hasScope && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-400 mb-2">出題範囲</p>
            <QuizScopeSelector
              items={scopeItems!}
              selected={selectedScope!}
              onChange={onScopeChange!}
            />
          </div>
        )}
      </CardShell>

      {settings && (
        <>
          <CardShell>
            <SettingRow
              label="デフォルト表示設定"
              control={
                <ModeSegmented
                  value={settings.defaultMode}
                  onChange={settings.onDefaultModeChange}
                />
              }
            />
          </CardShell>
          <CardShell>
            <SettingRow
              label="一回の問題数"
              control={
                <CountStepper
                  value={settings.questionCount}
                  onChange={settings.onQuestionCountChange}
                  min={settings.questionCountMin ?? 5}
                  max={settings.questionCountMax}
                />
              }
            />
          </CardShell>
          <CardShell>
            <SettingRow
              label="例文音声の自動再生"
              control={
                <ToggleSwitch
                  checked={settings.autoPlayAudio}
                  onChange={settings.onAutoPlayAudioChange}
                  label="例文音声の自動再生"
                />
              }
            />
          </CardShell>
          <CardShell>
            <SettingRow
              label="見出し語音声の自動再生"
              control={
                <ToggleSwitch
                  checked={settings.autoPlayHeadword}
                  onChange={settings.onAutoPlayHeadwordChange}
                  label="見出し語音声の自動再生"
                />
              }
            />
          </CardShell>
        </>
      )}

      {/* CTA 下部スペーサー: フローティングボタンに隠れる領域を確保 */}
      <div aria-hidden className="h-24" />

      {/* 下部フローティング CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-line px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-[600px]">
          <Button
            onClick={onStart}
            disabled={buttonDisabled}
            variant="primary"
            size="lg"
            fullWidth
          >
            {buttonLabel}
          </Button>
        </div>
      </div>
    </>
  )
}
