"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FaUserCircle } from "react-icons/fa";
import type { Profile } from "@/types/Profile";
import Button from "../components/button";
import EditProfileModal from "@/components/EditProfileModal";
import LanguageToggle from "@/components/LanguageToggle";

type DisplayLocale = "en" | "ja";

const DISPLAY_LOCALE_STORAGE_KEY = "displayLocale";

const Header = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [displayLocale, setDisplayLocale] = useState<DisplayLocale>("en");

  // localStorage から表示言語を読む
  useEffect(() => {
    const savedLocale = window.localStorage.getItem(
      DISPLAY_LOCALE_STORAGE_KEY
    );

    if (savedLocale === "en" || savedLocale === "ja") {
      setDisplayLocale(savedLocale);
    }
  }, []);

  // 表示言語を localStorage と他コンポーネントへ同期する
  const handleChangeDisplayLocale = (locale: DisplayLocale) => {
    setDisplayLocale(locale);
    window.localStorage.setItem(DISPLAY_LOCALE_STORAGE_KEY, locale);
    window.dispatchEvent(new CustomEvent("display-locale-change"));
  };

  // プロフィール読み込み
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

        {/* 右：日英トグル + 既存操作 */}
        <div className="flex items-center gap-4">
          <LanguageToggle
            value={displayLocale}
            onChange={handleChangeDisplayLocale}
          />

          {!profile && (
            <Link href="login">
              <Button text="ログイン" variant="secondary" />
            </Link>
          )}

          {profile && (
            <>
              <Link href="/wordlist">
                <Button text="単語リスト" variant="secondary" />
              </Link>

              {/* プロフィールアイコン → モーダル */}
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

      {/* プロフィール編集モーダル */}
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