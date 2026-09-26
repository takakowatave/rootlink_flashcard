'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { HiSearch } from 'react-icons/hi'
import { supabase } from '@/lib/supabaseClient'
import { displayPhrase } from '@/lib/phraseDisplay'
import { PHRASES_PUBLIC } from '@/lib/featureFlags'

type Suggestion = { label: string; type: 'word' | 'phrase' }

export type SearchBoxProps = {
  value: string
  onChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  isSearching: boolean
  searchError: boolean
  inputRef?: React.RefObject<HTMLInputElement>
  inputClassName?: string
  wrapperClassName?: string
}

export default function SearchBox({
  value,
  onChange,
  onSubmit,
  isSearching,
  searchError,
  inputRef,
  inputClassName,
  wrapperClassName,
}: SearchBoxProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const router = useRouter()
  const pathname = usePathname()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); return }
    const [wordsRes, phrasesRes] = await Promise.all([
      supabase.from('words').select('word').ilike('word', `${q}%`).limit(4),
      PHRASES_PUBLIC
        ? supabase.from('phrase_cards').select('phrase').ilike('phrase', `${q}%`).not('meaning_ja', 'is', null).is('skip_reason', null).limit(4)
        : Promise.resolve({ data: [] as { phrase: string }[] }),
    ])
    const wordItems: Suggestion[] = (wordsRes.data ?? []).map(r => ({ label: r.word, type: 'word' }))
    const phraseItems: Suggestion[] = (phrasesRes.data ?? []).map(r => ({ label: r.phrase, type: 'phrase' }))
    setSuggestions([...wordItems, ...phraseItems].slice(0, 6))
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(value.trim()), 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [value, fetchSuggestions])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const navigate = (label: string) => {
    setShowSuggestions(false)
    setSuggestions([])
    // 単語ページ上での検索は履歴を積まずに replace (連続検索の戻る先を dashboard に)。
    // fresh=1 は SSR 側で Data Cache を bypass するフラグ (404 flash 回避)。
    const url = `/word/${label.replace(/\s+/g, '_')}?fresh=1`
    if (pathname.startsWith('/word/')) {
      router.replace(url)
    } else {
      router.push(url)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, suggestions.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, -1)) }
    if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); navigate(suggestions[activeIndex].label) }
    if (e.key === 'Escape') { setShowSuggestions(false) }
  }

  return (
    <div ref={wrapperRef} className={`relative ${wrapperClassName ?? ''}`}>
      <form onSubmit={onSubmit}>
        <div className={`flex items-center gap-2 ${wrapperClassName?.includes('h-12') ? 'h-12' : 'h-8'} bg-white border rounded-full pl-4 pr-2 ${searchError ? 'border-red-400' : 'border-line'}`}>
          <input
            ref={inputRef}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            value={value}
            onChange={e => { onChange(e.target.value); setShowSuggestions(true); setActiveIndex(-1) }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search a word or phrase..."
            disabled={isSearching}
            className={`flex-1 min-w-0 bg-transparent outline-none disabled:opacity-50 ${inputClassName ?? 'text-sm text-black'}`}
          />
          {isSearching ? (
            <svg className="size-5 animate-spin text-muted shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <HiSearch className="size-5 text-muted shrink-0" />
          )}
        </div>
        {/* iOS Safari / Capacitor WebView は「submit 可能な button が form 内に居ないと
            キーボードの Search/Go ボタンで submit が発火しない」ケースがある。
            見せない submit を 1 個だけ置いて確実に submit 経路を確保する。 */}
        <button type="submit" aria-hidden="true" tabIndex={-1} className="hidden" />
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-line rounded-xl shadow-lg z-50 overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={s.label}
              type="button"
              // mousedown で preventDefault し input の blur を抑止 → onClick が確実に発火する。
              // iOS/Android WebView では以前 onMouseDown={navigate} だったが、ジェスチャによっては
              // mousedown が発火せず tap が拾えないケースがあった (Bug: mim → mimic 候補タップ無反応)。
              onMouseDown={e => e.preventDefault()}
              onClick={() => navigate(s.label)}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors ${i === activeIndex ? 'bg-gray-50' : ''}`}
            >
              <span className="text-gray-900">{s.type === 'phrase' ? displayPhrase(s.label) : s.label}</span>
              {s.type === 'phrase' && (
                <span className="text-[11px] text-muted border border-line rounded px-1.5 py-0.5 shrink-0">phrase</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
