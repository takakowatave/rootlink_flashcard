"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { FaUserCircle } from "react-icons/fa";
import type { Profile } from "@/types/Profile";
import Button from "../components/button";
import EditProfileModal from "@/components/EditProfileModal";

const API_BASE =
  process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ??
  'https://rootlink-server-v2-774622345521.asia-northeast1.run.app'

const Header = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);

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
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      <header className="bg-white text-black py-2 px-4 md:px-8 flex justify-between items-center">
        {/* 左：ロゴ */}
        <Link href="/">
          <img
            src="/logo.svg"
            alt="logo"
            className="h-6 md:h-8 cursor-pointer"
          />
        </Link>

        {/* 中央：PC用検索フォーム（ログイン済みのみ） */}
        {profile && (
          <form onSubmit={handleSearch} className="hidden md:flex items-center relative w-64 lg:w-80">
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search a word"
              disabled={isSearching}
              className="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm focus:outline-none focus:border-gray-400 disabled:opacity-50"
            />
            {isSearching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="h-3.5 w-3.5 animate-spin text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </span>
            )}
          </form>
        )}

        {/* 右：操作 */}
        <div className="flex items-center gap-4">
          {!profile && (
            <Link href="/login">
              <Button text="ログイン" variant="secondary" />
            </Link>
          )}

          {profile && (
            <>
              {/* PC only nav */}
              <Link href="/wordlist" className="hidden md:block">
                <Button text="単語リスト" variant="secondary" />
              </Link>
              <Link href="/quiz" className="hidden md:block">
                <Button text="クイズ" variant="secondary" />
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

              <div
                className="cursor-pointer"
                onClick={() => setIsModalOpen(true)}
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <FaUserCircle className="w-8 h-8 text-gray-400" />
                )}
              </div>
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
          const {
            data: { user },
          } = await supabase.auth.getUser();
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
