"use client";

// オンボーディングの学習時間帯ステップと設定画面の通知セクションで
// 共有する ON/OFF スイッチ。Figma xe5UwVx38JWu5doqwXczQu / node 2841-4454
// の切替スイッチと同じ見た目（51x31, primary / slate-300, 27x27 knob）。

interface Props {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
}

export default function Toggle({ checked, onChange, label, disabled = false }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        if (disabled) return
        onChange(!checked)
      }}
      className={`relative h-[31px] w-[51px] rounded-full transition-colors shrink-0 ${
        checked ? 'bg-primary' : 'bg-slate-300'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-[27px] rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[20px]' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
