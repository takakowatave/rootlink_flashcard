import type { DisplayLocale } from '@/types/DisplayLocale'

type Props = {
  explanation?: string | null
  // アメリカ英語での言い方。イギリス英語の表現にだけ渡す
  usEquivalent?: string | null
  displayLocale: DisplayLocale
}

// フレーズの解説ボックス（Figma: phrase / etymologyhook と同じ teal-50 の囲み）
export default function PhraseNotes({ explanation, usEquivalent, displayLocale }: Props) {
  if (!explanation && !usEquivalent) return null
  const usLabel = displayLocale === 'ja' ? 'アメリカでは：' : 'In American English: '
  return (
    <div className="w-full rounded bg-primary-subtle px-2 py-2 text-sm text-primary-dark">
      {explanation && <p>{explanation}</p>}
      {usEquivalent && <p>{usLabel}{usEquivalent}</p>}
    </div>
  )
}
