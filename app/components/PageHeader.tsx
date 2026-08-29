'use client'

import { useRouter } from 'next/navigation'
import { MdArrowBackIosNew } from 'react-icons/md'
import Breadcrumb, { type BreadcrumbItem } from './Breadcrumb'

export default function PageHeader({ items }: { items: BreadcrumbItem[] }) {
  const router = useRouter()
  return (
    <>
      {/* SP: 戻るヘッダー */}
      <div className="md:hidden sticky top-0 z-30 bg-white border-b border-line pt-[env(safe-area-inset-top)] h-[calc(3.5rem+env(safe-area-inset-top))] flex items-center px-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-muted"
          aria-label="戻る"
        >
          <MdArrowBackIosNew className="size-6" />
        </button>
      </div>
      {/* PC: パンくず */}
      <div className="hidden md:block max-w-[600px] mx-auto md:px-4 pt-6">
        <Breadcrumb items={items} />
      </div>
    </>
  )
}
