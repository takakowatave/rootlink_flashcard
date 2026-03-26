'use client'

type DisplayLocale = 'en' | 'ja'

type LanguageToggleProps = {
  value: DisplayLocale
  onChange: (locale: DisplayLocale) => void
}

// 日英表示を切り替える再利用用トグル。
export default function LanguageToggle({
  value,
  onChange,
}: LanguageToggleProps) {
  return (
    <div
      className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 p-1"
      role="group"
      aria-label="Language toggle"
    >
      {/* 英英モードに切り替えるボタン */}
      <button
        type="button"
        onClick={() => onChange('en')}
        aria-pressed={value === 'en'}
        className={[
          'rounded-full px-3 py-1 text-xs font-medium transition',
          value === 'en'
            ? 'bg-white text-zinc-900 shadow-sm'
            : 'text-zinc-500 hover:text-zinc-700',
        ].join(' ')}
      >
        EN
      </button>

      {/* 日英モードに切り替えるボタン */}
      <button
        type="button"
        onClick={() => onChange('ja')}
        aria-pressed={value === 'ja'}
        className={[
          'rounded-full px-3 py-1 text-xs font-medium transition',
          value === 'ja'
            ? 'bg-white text-zinc-900 shadow-sm'
            : 'text-zinc-500 hover:text-zinc-700',
        ].join(' ')}
      >
        JA
      </button>
    </div>
  )
}