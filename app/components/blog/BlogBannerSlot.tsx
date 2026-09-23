import type { ReactNode } from 'react'

// サイドカラムのバナー枠。中身が決まるまでは何も描画しない。
// 画像やリンクを差し込むときは children に渡す。
export default function BlogBannerSlot({ children }: { children?: ReactNode }) {
  if (!children) return null
  return <div className="overflow-hidden rounded-2xl border border-line bg-white">{children}</div>
}
