import type { ReactNode } from 'react'

// 記事本文のタイポグラフィ設定。本文サイズ・見出し・引用・コードはここだけで管理する。
const PROSE_CLASS = [
  'prose prose-base max-w-none',
  'prose-headings:text-gray-950 prose-headings:font-semibold',
  'prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4',
  'prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3',
  'prose-p:text-gray-800 prose-p:leading-relaxed',
  'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
  'prose-blockquote:border-l-4 prose-blockquote:border-primary',
  'prose-blockquote:not-italic prose-blockquote:text-gray-700',
  'prose-blockquote:bg-primary-subtle prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r',
  'prose-code:text-primary-hover prose-code:before:content-none prose-code:after:content-none',
  'prose-pre:bg-gray-100 prose-pre:border prose-pre:border-line',
  'prose-pre:text-gray-900 [&_pre_code]:text-gray-900 prose-pre:text-base',
  'prose-hr:border-line',
  // <mark> は蛍光ペン風のハイライト（下40%だけ薄いオレンジ＝ティールの補色）
  '[&_mark]:bg-transparent [&_mark]:bg-[linear-gradient(transparent_60%,#fed7aa_60%)] [&_mark]:font-semibold [&_mark]:text-gray-950 [&_mark]:px-0.5',
  'prose-strong:text-gray-950',
].join(' ')

export default function BlogProse({ children }: { children: ReactNode }) {
  return <div className={PROSE_CLASS}>{children}</div>
}
