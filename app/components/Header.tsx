"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getActivityLog, calcStreak } from "@/lib/supabaseApi";
import { FaUserCircle } from "react-icons/fa";
import { HiSearch } from "react-icons/hi";
import type { Profile } from "@/types/Profile";
import EditProfileModal from "@/components/EditProfileModal";
import Button from "@/components/Button";

const API_BASE =
  process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ??
  'https://rootlink-server-v2-774622345521.asia-northeast1.run.app'

type Suggestion = { label: string; type: 'word' | 'phrase' }

function SearchBox({
  value,
  onChange,
  onSubmit,
  isSearching,
  searchError,
  inputRef,
  inputClassName,
  wrapperClassName,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  isSearching: boolean
  searchError: boolean
  inputRef?: React.RefObject<HTMLInputElement>
  inputClassName?: string
  wrapperClassName?: string
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); return }
    const [wordsRes, phrasesRes] = await Promise.all([
      supabase.from('words').select('word').ilike('word', `${q}%`).limit(4),
      supabase.from('phrase_cards').select('phrase').ilike('phrase', `${q}%`).limit(4),
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
    router.push(`/word/${label.replace(/\s+/g, '_')}`)
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
      </form>

      {/* サジェストドロップダウン */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-line rounded-xl shadow-lg z-50 overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={s.label}
              type="button"
              onMouseDown={() => navigate(s.label)}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors ${i === activeIndex ? 'bg-gray-50' : ''}`}
            >
              <span className="text-gray-900">{s.label}</span>
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

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const match = pathname.match(/^\/word\/(.+)$/)
    setSearchValue(match ? decodeURIComponent(match[1]) : '')
  }, [pathname]);

  const doSearch = async (query: string) => {
    if (!query || isSearching) return;
    setIsSearching(true);
    setSearchError(false);
    try {
      const res = await fetch(`${API_BASE}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) { setSearchError(true); return; }
      const r = await res.json();
      if (r?.ok === true && typeof r.redirectTo === 'string') {
        setMobileSearchOpen(false);
        router.push(r.redirectTo);
        return;
      }
      // フレーズとして検索
      const { data: phraseMatch } = await supabase
        .from('phrase_cards').select('id').ilike('phrase', query).limit(1).maybeSingle();
      if (phraseMatch) {
        setMobileSearchOpen(false);
        router.push(`/word/${query.replace(/\s+/g, '_')}`);
      } else {
        setSearchError(true);
      }
    } catch {
      setSearchError(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(searchValue.trim());
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const query = (e as CustomEvent<{ query: string }>).detail.query;
      setSearchValue(query);
      setTimeout(() => doSearch(query), 100);
    };
    window.addEventListener('tutorial-auto-search', handler);
    return () => window.removeEventListener('tutorial-auto-search', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openMobileSearch = () => {
    setSearchValue('');
    setSearchError(false);
    setMobileSearchOpen(true);
    setTimeout(() => mobileInputRef.current?.focus(), 50);
  };

  useEffect(() => {
    const handler = () => openMobileSearch();
    window.addEventListener('open-mobile-search', handler);
    return () => window.removeEventListener('open-mobile-search', handler);
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [profileData, dates] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
        getActivityLog(user.id),
      ]);
      if (profileData.data) setProfile(profileData.data);
      setCurrentStreak(calcStreak(dates));
    };
    load();
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 h-14 bg-white border-b border-line shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] flex items-center px-2 py-1 gap-2">
        <Link href="/" className="shrink-0">
          <img src="/logo.svg" alt="RootLink" className="h-[17px]" />
        </Link>

        {/* PC検索 */}
        <div className="hidden md:flex flex-1 items-center justify-center" data-tutorial="search">
          <SearchBox
            value={searchValue}
            onChange={v => { setSearchValue(v); setSearchError(false); }}
            onSubmit={handleSearch}
            isSearching={isSearching}
            searchError={searchError}
            wrapperClassName="w-full max-w-[400px]"
          />
        </div>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          {!profile && (
            <>
              <Link href="/signup"><Button variant="primary" size="sm">新規登録</Button></Link>
              <Link href="/login"><Button variant="secondary" size="sm">ログイン</Button></Link>
            </>
          )}
          {profile && (
            <>
              {currentStreak > 0 && (
                <span className="flex items-center gap-0.5 text-sm font-bold text-quiz-review tabular-nums select-none">
                  🔥{currentStreak}
                </span>
              )}
              <button onClick={() => setIsModalOpen(true)}>
                {profile.avatar_url
                  ? <img src={profile.avatar_url} className="size-8 rounded-full object-cover" alt="avatar" />
                  : <FaUserCircle className="size-8 text-muted" />
                }
              </button>
            </>
          )}
        </div>
      </header>

      {/* SP: 検索オーバーレイ */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col">
          <div className="flex-1 bg-black/40" onClick={() => setMobileSearchOpen(false)} />
          <div className="bg-white px-4 pt-3 pb-6">
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={() => setMobileSearchOpen(false)} className="text-sm font-bold text-primary">
                閉じる
              </button>
            </div>
            <SearchBox
              value={searchValue}
              onChange={v => { setSearchValue(v); setSearchError(false); }}
              onSubmit={handleSearch}
              isSearching={isSearching}
              searchError={searchError}
              inputRef={mobileInputRef}
              inputClassName="text-base text-black"
              wrapperClassName="h-12"
            />
            {searchError && (
              <p className="mt-2 text-xs text-red-500 pl-4">見つかりませんでした</p>
            )}
          </div>
        </div>
      )}

      <EditProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        profile={profile}
        onUpdated={async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
          if (data) setProfile(data);
        }}
      />
    </>
  );
};

export default Header;
