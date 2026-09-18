'use client'

import { useRouter } from 'next/navigation'
import { MdArrowBackIosNew } from 'react-icons/md'
import { HiSearch } from 'react-icons/hi'
import Breadcrumb, { type BreadcrumbItem } from './Breadcrumb'

// Figma xe5UwVx38JWu5doqwXczQu / 2897:6526
// 戻るボタン＋検索バーを1つの 56px ヘッダーにまとめる。ロゴのヘッダーとは
// 相互排他（AppShell 側で SP のロゴ Header を隠す）。PC はロゴ Header を残し
// パンくずをここに出す。
//
// 幅: 外側の sticky 帯は常に viewport 100% (ロゴ Header と同じ)。
// 中身だけを max-w-[600px] mx-auto で中央寄せする。呼び出し側の
// max-w ラッパの外側に配置する運用が前提。
export default function PageHeader({ items }: { items: BreadcrumbItem[] }) {
  const router = useRouter()
  return (
    <>
      {/* SP: 戻る + 検索の 56px ヘッダー */}
      <div className="md:hidden sticky top-0 z-30 bg-white border-b border-line pt-[env(safe-area-inset-top)]">
        <div className="max-w-[600px] mx-auto h-14 flex items-center gap-2 px-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 text-muted shrink-0"
            aria-label="戻る"
          >
            <MdArrowBackIosNew className="size-6" />
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('open-mobile-search'))}
            className="flex-1 min-w-0 h-[33px] flex items-center gap-2 bg-white border border-line rounded-full pl-4 pr-3 text-left"
            aria-label="検索を開く"
          >
            <span className="flex-1 min-w-0 truncate text-sm text-muted">知らない語を検索</span>
            <HiSearch className="size-5 text-muted shrink-0" />
          </button>
        </div>
      </div>
      {/* PC: パンくず */}
      <div className="hidden md:block max-w-[600px] mx-auto md:px-4 pt-6">
        <Breadcrumb items={items} />
      </div>
    </>
  )
}
