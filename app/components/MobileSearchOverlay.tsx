'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { PHRASES_PUBLIC } from '@/lib/featureFlags'
import SearchBox from './SearchBox'

const API_BASE =
  process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ??
  'https://rootlink-server-v2-774622345521.asia-northeast1.run.app'

// SP は全画面白 / PC は中央ダイアログの検索オーバーレイ。
// `open-mobile-search` イベントを受けて開く。Header の中に置くと
// isBackHeader (/wordlist, /word/*, /decks*) の SP で祖先ごと
// display:none になり反応しないので AppShell 直下に独立配置する。
export default function MobileSearchOverlay() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = () => {
      setValue('')
      setSearchError(false)
      setOpen(true)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
    window.addEventListener('open-mobile-search', handler)
    return () => window.removeEventListener('open-mobile-search', handler)
  }, [])

  const doSearch = async (query: string) => {
    if (!query || isSearching) return
    setIsSearching(true)
    setSearchError(false)
    try {
      const res = await fetch(`${API_BASE}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      if (!res.ok) { setSearchError(true); return }
      const r = await res.json()
      if (r?.ok === true && typeof r.redirectTo === 'string') {
        setOpen(false)
        router.push(r.redirectTo)
        return
      }
      const { data: phraseMatch } = PHRASES_PUBLIC
        ? await supabase
            .from('phrase_cards').select('id').ilike('phrase', query).not('meaning_ja', 'is', null).is('skip_reason', null).limit(1).maybeSingle()
        : { data: null }
      if (phraseMatch) {
        setOpen(false)
        router.push(`/word/${query.replace(/\s+/g, '_')}`)
      } else {
        setSearchError(true)
      }
    } catch {
      setSearchError(true)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doSearch(value.trim())
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-white md:bg-black/40"
        onClick={() => setOpen(false)}
        aria-label="閉じる"
      />
      <div
        className="fixed z-50 inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[560px] md:max-w-[90vw] md:h-auto md:rounded-2xl md:shadow-xl md:bg-white flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] md:pt-0 md:pb-0"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-4 pt-3 pb-6 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-base font-bold text-gray-950 hidden md:block">単語を検索</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm font-bold text-primary md:ml-auto"
            >
              閉じる
            </button>
          </div>
          <SearchBox
            value={value}
            onChange={v => { setValue(v); setSearchError(false) }}
            onSubmit={handleSubmit}
            isSearching={isSearching}
            searchError={searchError}
            inputRef={inputRef}
            inputClassName="text-base text-black"
            wrapperClassName="h-12"
          />
          {searchError && (
            <p className="mt-2 text-xs text-red-500 pl-4">見つかりませんでした</p>
          )}
        </div>
      </div>
    </>
  )
}
