'use client'

import { useEffect, useState } from 'react'

// 本番ドメイン以外（localhost・Vercelプレビュー＝developなど）では常に表示する「dev証」バッジ。
// 本番の www.rootlink.app / rootlink.app でのみ非表示。
const PROD_HOSTS = new Set(['www.rootlink.app', 'rootlink.app'])

export default function DevBadge() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(!PROD_HOSTS.has(window.location.hostname))
  }, [])

  if (!show) return null

  return (
    <div className="fixed bottom-2 left-2 z-[9999] pointer-events-none select-none flex flex-col items-center">
      <img src="/dev-badge.png" alt="DEV" className="w-12 h-12 drop-shadow" draggable={false} />
      <span className="text-[10px] font-bold text-gray-500 bg-white/80 px-1 rounded">DEV</span>
    </div>
  )
}
