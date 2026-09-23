import type { ReactNode } from 'react'

// 記事中の「英文 + 和訳」の例文をまとめて置くボックス。
// 本文の地の文と見分けがつくように薄いグレーを敷く。
// 文字はどちらも読みやすさを優先し、英文を黒に近い濃さ、和訳をそれに次ぐ濃さにする。
export default function ExampleBlock({ lines }: { lines: ReactNode[] }) {
  if (lines.length === 0) return null
  return (
    <div className="not-prose my-4 rounded-2xl bg-gray-50 px-5 py-4">
      {lines.map((line, i) => (
        <p
          key={i}
          className={
            i === 0
              ? 'text-base leading-relaxed text-gray-950'
              : 'mt-1 text-base leading-relaxed text-gray-800'
          }
        >
          {line}
        </p>
      ))}
    </div>
  )
}
