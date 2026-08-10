'use client'

import { useEffect, useLayoutEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FaLink, FaXTwitter, FaLine, FaFacebook, FaThreads } from 'react-icons/fa6'

type Props = {
  open: boolean
  onClose: () => void
  shareUrl: string
  shareText: string
  anchorRef?: React.RefObject<HTMLElement | null>
}

type Item = {
  key: string
  label: string
  icon: React.ReactNode
  bg: string
  onClick: () => void
}

const MENU_WIDTH = 280
const MENU_GAP = 8

export default function ShareMenu({ open, onClose, shareUrl, shareText, anchorRef }: Props) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useLayoutEffect(() => {
    if (!open || !anchorRef?.current) {
      setPos(null)
      return
    }
    const compute = () => {
      const el = anchorRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const rawLeft = rect.right - MENU_WIDTH
      const left = Math.max(8, Math.min(rawLeft, window.innerWidth - MENU_WIDTH - 8))
      setPos({ top: rect.bottom + MENU_GAP, left })
    }
    compute()
    window.addEventListener('resize', compute)
    window.addEventListener('scroll', compute, true)
    return () => {
      window.removeEventListener('resize', compute)
      window.removeEventListener('scroll', compute, true)
    }
  }, [open, anchorRef])

  if (!open) return null

  const openWindow = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
    onClose()
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('リンクをコピーしました')
      onClose()
    } catch {
      toast.error('コピーに失敗しました')
    }
  }

  // X は word ページ URL を渡して OGP プレビュー（twitter:card=summary_large_image + card.png）で画像を出す。
  const shareToX = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'noopener,noreferrer'
    )
    onClose()
  }

  const items: Item[] = [
    {
      key: 'copy',
      label: 'リンクをコピー',
      icon: <FaLink />,
      bg: 'bg-gray-400',
      onClick: copyLink,
    },
    {
      key: 'x',
      label: 'X',
      icon: <FaXTwitter />,
      bg: 'bg-black',
      onClick: shareToX,
    },
    {
      key: 'line',
      label: 'LINE',
      icon: <FaLine />,
      bg: 'bg-[#06C755]',
      onClick: () => openWindow(
        `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
      ),
    },
    {
      key: 'facebook',
      label: 'Facebook',
      icon: <FaFacebook />,
      bg: 'bg-[#1877F2]',
      onClick: () => openWindow(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
      ),
    },
    {
      key: 'threads',
      label: 'Threads',
      icon: <FaThreads />,
      bg: 'bg-black',
      onClick: () => openWindow(
        `https://www.threads.net/intent/post?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
      ),
    },
  ]

  const pcStyle: React.CSSProperties = pos
    ? { top: pos.top, left: pos.left, width: MENU_WIDTH }
    : { top: 64, right: 16, width: MENU_WIDTH }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
        aria-label="閉じる"
      />

      {/* PC: floating popover anchored to trigger */}
      <div
        className="hidden md:block fixed z-50 bg-white rounded-2xl shadow-xl border border-line overflow-hidden"
        style={pcStyle}
        role="dialog"
        aria-label="共有"
      >
        <button
          type="button"
          onClick={items[0].onClick}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
        >
          <FaLink className="size-4 text-gray-700" />
          <span className="text-sm text-gray-950">リンクをコピー</span>
        </button>
        <div className="border-t border-line" />
        {items.slice(1).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
          >
            <span className="size-4 text-gray-700 flex items-center justify-center">
              {item.icon}
            </span>
            <span className="text-sm text-gray-950">{item.label}</span>
          </button>
        ))}
      </div>

      {/* SP: bottom sheet */}
      <div
        className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-xl pb-[env(safe-area-inset-bottom)]"
        role="dialog"
        aria-label="共有"
      >
        <p className="px-5 pt-4 pb-2 text-sm text-gray-950">共有</p>
        <div className="flex justify-between px-4 pt-2 pb-4">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={item.onClick}
              className="flex flex-col items-center gap-2 flex-shrink-0"
            >
              <span
                className={`size-[54px] rounded-full ${item.bg} flex items-center justify-center text-white text-2xl`}
              >
                {item.icon}
              </span>
              <span className="text-xs text-gray-950 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full h-14 border-t border-line text-base text-gray-950"
        >
          キャンセル
        </button>
      </div>
    </>
  )
}
