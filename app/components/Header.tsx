"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { FaUserCircle } from "react-icons/fa";
import { HiSearch } from "react-icons/hi";
import type { Profile } from "@/types/Profile";
import EditProfileModal from "@/components/EditProfileModal";

const API_BASE =
  process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ??
  'https://rootlink-server-v2-774622345521.asia-northeast1.run.app'

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const match = pathname.match(/^\/word\/(.+)$/)
    if (match) setSearchValue(decodeURIComponent(match[1]))
  }, [pathname]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchValue.trim();
    if (!trimmed || isSearching) return;
    setIsSearching(true);
    try {
      const res = await fetch(`${API_BASE}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      });
      if (!res.ok) return;
      const r = await res.json();
      if (r?.ok === true && typeof r.redirectTo === 'string') {
        setMobileSearchOpen(false);
        router.push(r.redirectTo);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const openMobileSearch = () => {
    setMobileSearchOpen(true);
    setTimeout(() => mobileInputRef.current?.focus(), 50);
  };

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single<Profile>();
      if (data) setProfile(data);
    };
    load();
  }, []);

  return (
    <>
      <header className="h-10 bg-white border-b border-[#e2e8f0] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] flex items-center px-2 py-1 gap-2">
        {/* ロゴ */}
        <Link href="/" className="shrink-0">
          <img src="/logo.svg" alt="RootLink" className="h-[17px]" />
        </Link>

        {/* 中央：検索フォーム（ログイン済みのみ） */}
        {profile && (
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 items-center justify-center"
          >
            <div className="flex items-center w-full max-w-[400px] h-8 bg-white border border-[#e2e8f0] rounded-full pl-4 pr-2 gap-2">
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder=""
                disabled={isSearching}
                className="flex-1 min-w-0 text-sm text-black bg-transparent outline-none disabled:opacity-50"
              />
              {isSearching ? (
                <svg className="size-5 animate-spin text-[#90a1b9] shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <HiSearch className="size-5 text-[#90a1b9] shrink-0" />
              )}
            </div>
          </form>
        )}

        {/* 右：アクション */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {!profile && (
            <Link href="/login">
              <button className="h-8 px-4 rounded-full border border-[#009689] text-[#009689] text-xs font-medium">
                ログイン
              </button>
            </Link>
          )}

          {profile && (
            <>
              {/* PC only nav */}
              <Link href="/wordlist" className="hidden md:block">
                <button className="h-8 px-4 rounded-full border border-[#009689] text-[#009689] text-xs font-medium">
                  単語リスト
                </button>
              </Link>

              {/* SP: 検索アイコン */}
              <button
                type="button"
                onClick={openMobileSearch}
                className="md:hidden p-2 text-gray-400 hover:text-teal-500 transition-colors"
                aria-label="検索"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              <button onClick={() => setIsModalOpen(true)}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} className="size-8 rounded-full object-cover" alt="avatar" />
                ) : (
                  <FaUserCircle className="size-8 text-[#90a1b9]" />
                )}
              </button>
            </>
          )}
        </div>
      </header>

      {/* SP: 検索オーバーレイ */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/40 flex flex-col">
          <div className="bg-white px-4 py-3 flex items-center gap-3 shadow">
            <form onSubmit={handleSearch} className="flex-1 flex items-center relative">
              <input
                ref={mobileInputRef}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search a word"
                disabled={isSearching}
                className="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-base focus:outline-none focus:border-teal-400 disabled:opacity-50"
              />
              {isSearching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="h-4 w-4 animate-spin text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </span>
              )}
            </form>
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-sm shrink-0"
            >
              キャンセル
            </button>
          </div>
          <div className="flex-1" onClick={() => setMobileSearchOpen(false)} />
        </div>
      )}

      <EditProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        profile={profile}
        onUpdated={async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single<Profile>();
          if (data) setProfile(data);
        }}
      />
    </>
  );
};

export default Header;
