// 記事の書き出しなどで、比べる単語をチェック付きで並べる箱。
// 本文中では <word-list words="farther,further" /> と書く。
export const CHECK_COLOR = '#f97316' // orange-500（ハイライトのオレンジと同系色）

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" className="shrink-0">
      <path
        d="M4 10.5l4 4 8-9"
        fill="none"
        stroke={CHECK_COLOR}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function WordCheckList({ words }: { words: string[] }) {
  if (words.length === 0) return null
  return (
    <ul className="not-prose my-4 space-y-2 rounded-2xl bg-gray-50 px-6 py-4">
      {words.map((w) => (
        <li key={w} className="flex items-center gap-3 text-lg font-semibold text-gray-950">
          <CheckIcon />
          {w}
        </li>
      ))}
    </ul>
  )
}
