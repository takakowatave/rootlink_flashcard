"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getActivityLog, calcStreak, recordActivity } from "@/lib/supabaseApi";
import { FaUserCircle } from "react-icons/fa";
import type { Profile } from "@/types/Profile";
import EditProfileModal from "@/components/EditProfileModal";
import Button from "@/components/Button";
import SearchBox from "@/components/SearchBox";
import { PHRASES_PUBLIC } from "@/lib/featureFlags";
import { PROFILE_CREATED_EVENT } from "@/components/AppShell";

const API_BASE =
  process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ??
  'https://rootlink-server-v2-774622345521.asia-northeast1.run.app'

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);

  useEffect(() => {
    const match = pathname.match(/^\/word\/(.+)$/)
    setSearchValue(match ? decodeURIComponent(match[1]) : '')
  }, [pathname]);

  // 単語ページ上での検索は replace (履歴を積まない = 戻るで dashboard に戻れる)。
  // fresh=1 は直近 /resolve 済み単語だと SSR に伝える (Data Cache 空応答での 404 flash 回避)。
  const navigateAfterResolve = (url: string) => {
    const withFresh = url.includes('?') ? `${url}&fresh=1` : `${url}?fresh=1`;
    if (pathname.startsWith('/word/')) {
      router.replace(withFresh);
    } else {
      router.push(withFresh);
    }
  };

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
        navigateAfterResolve(r.redirectTo);
        return;
      }
      const { data: phraseMatch } = PHRASES_PUBLIC
        ? await supabase
            .from('phrase_cards').select('id').ilike('phrase', query).not('meaning_ja', 'is', null).is('skip_reason', null).limit(1).maybeSingle()
        : { data: null };
      if (phraseMatch) {
        navigateAfterResolve(`/word/${query.replace(/\s+/g, '_')}`);
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

  useEffect(() => {
    const loadStreak = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await recordActivity(user.id)
      const dates = await getActivityLog(user.id)
      setCurrentStreak(calcStreak(dates));
    };
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setAuthed(!!user);
      if (!user) { setProfile(null); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();
      if (data) setProfile(data);
    };
    loadProfile();
    loadStreak();

    const onVisible = () => { if (document.visibilityState === 'visible') loadStreak(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('streak-updated', loadStreak);
    window.addEventListener(PROFILE_CREATED_EVENT, loadProfile);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('streak-updated', loadStreak);
      window.removeEventListener(PROFILE_CREATED_EVENT, loadProfile);
    };
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-line shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] pt-[env(safe-area-inset-top)]">
      <div className="h-14 flex items-center px-2 py-1 gap-2">
        <Link href="/" className="shrink-0">
          <img src="/logo.svg" alt="RootLink" className="h-[17px]" />
        </Link>

        {/* PC 検索: lg (1024px) 以上のみ。SP・iPad は Dashboard の右下 FAB
            (Dashboard.tsx) に集約して、ヘッダーには検索バーを置かない。 */}
        <div className="hidden lg:flex flex-1 items-center justify-center" data-tutorial="search">
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
          {authed === false && (
            <>
              <Link href="/signup"><Button variant="primary" size="sm">新規登録</Button></Link>
              <Link href="/login"><Button variant="secondary" size="sm">ログイン</Button></Link>
            </>
          )}
          {authed === true && (
            <>
              {currentStreak > 0 && (
                <span className="flex items-center gap-0.5 text-sm font-bold text-quiz-review tabular-nums select-none">
                  🔥{currentStreak}
                </span>
              )}
              <button onClick={() => setIsModalOpen(true)}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} className="size-8 rounded-full object-cover" alt="avatar" />
                  : <FaUserCircle className="size-8 text-muted" />
                }
              </button>
            </>
          )}
        </div>
      </div>
      </header>

      <EditProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        profile={profile}
        onUpdated={async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();
          if (data) setProfile(data);
        }}
      />
    </>
  );
};

export default Header;
