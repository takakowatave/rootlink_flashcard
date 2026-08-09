"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabaseClient";
import { getUserPlan } from "@/lib/supabaseApi";
import { useAuthProvider } from "@/lib/useAuthProvider";
import { FaUserCircle } from "react-icons/fa";
import { BsChevronLeft, BsChevronRight, BsPencil } from "react-icons/bs";
import toast from "react-hot-toast";
import type { Profile } from "@/types/Profile";
import LanguageToggle from "@/components/LanguageToggle";
import UpgradeModal from "@/components/UpgradeModal";
import type { DisplayLocale } from "@/types/DisplayLocale";
import { DISPLAY_LOCALE_STORAGE_KEY, DISPLAY_LOCALE_EVENT_NAME } from "@/types/DisplayLocale";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onUpdated: () => void;
}

interface FormData {
  display_name: string;
}

// サーバー側 /account/delete が未実装のため、UIを隠す
const DELETE_ACCOUNT_ENABLED = false;

export default function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onUpdated,
}: Props) {
  const { register, handleSubmit, setValue } = useForm<FormData>();
  const provider = useAuthProvider();
  const [plan, setPlan] = useState<"premium" | "free" | null>(null);
  const [hasStripeSubscription, setHasStripeSubscription] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [displayLocale, setDisplayLocale] = useState<DisplayLocale>("ja");
  const [email, setEmail] = useState<string>("");
  const [editingName, setEditingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const API_BASE =
    process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ??
    "https://rootlink-server-v2-774622345521.asia-northeast1.run.app";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleManagePlan = async () => {
    setIsPortalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_BASE}/stripe/portal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          origin: window.location.origin,
          locale: navigator.language.startsWith("ja") ? "ja" : "auto",
        }),
      });
      const data = await res.json();
      if (data.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast.error("サブスクリプション情報が見つかりません");
      }
    } catch {
      toast.error("エラーが発生しました");
    } finally {
      setIsPortalLoading(false);
    }
  };

  const handleResetPassword = async () => {
    // Google 認証ユーザーはパスワードを持たない。UI からは辿れないが
    // 将来のルート追加や古いリンク経由での誤起動に備えた二重防御
    if (provider !== "email") return;
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) toast.error("送信に失敗しました");
    else toast.success("登録メールアドレスに再設定用リンクを送信しました");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", profile.id);
      if (updErr) throw updErr;
      toast.success("アイコンを更新しました");
      onUpdated();
    } catch {
      toast.error("アップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (profile) setValue("display_name", profile.username ?? "");
  }, [profile, setValue]);

  useEffect(() => {
    if (!isOpen) return;
    getUserPlan().then(setPlan);
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setEmail(user.email ?? "");
      supabase
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => setHasStripeSubscription(!!data?.stripe_customer_id));
    });
    const saved = localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY);
    if (saved === "en" || saved === "ja") setDisplayLocale(saved);
  }, [isOpen]);

  const handleLocaleChange = (locale: DisplayLocale) => {
    setDisplayLocale(locale);
    localStorage.setItem(DISPLAY_LOCALE_STORAGE_KEY, locale);
    window.dispatchEvent(new Event(DISPLAY_LOCALE_EVENT_NAME));
    toast.success(locale === "ja" ? "和英モードに切り替えました" : "英英モードに切り替えました");
  };

  if (!isOpen || !profile) return null;

  const onSubmit = async (data: FormData) => {
    const { error } = await supabase
      .from("profiles")
      .update({ username: data.display_name })
      .eq("id", profile.id);

    if (error) {
      toast.error("更新に失敗しました");
      return;
    }
    toast.success("保存しました");
    setEditingName(false);
    onUpdated();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 sm:items-center overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="bg-surface w-full min-h-full sm:min-h-0 sm:max-w-md sm:max-h-[calc(100dvh-64px)] sm:rounded-2xl sm:my-8 shadow-xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header — SP: back arrow / PC: 設定タイトル + 閉じる */}
          <div className="flex items-center justify-between px-3 sm:px-6 h-14 border-b border-line flex-shrink-0">
            <button
              onClick={onClose}
              className="sm:hidden p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-700"
              aria-label="戻る"
            >
              <BsChevronLeft size={22} />
            </button>
            <h2 className="hidden sm:block text-base font-bold text-gray-950">設定</h2>
            <button
              onClick={onClose}
              className="hidden sm:block text-sm text-muted hover:text-gray-700"
            >
              閉じる
            </button>
          </div>

          <div className="px-5 sm:px-6 pt-4 pb-8 flex flex-col gap-6 sm:flex-1 sm:min-h-0 sm:overflow-y-auto">
            {/* アバター */}
            <div className="flex justify-center pt-2">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <FaUserCircle className="w-full h-full text-gray-400" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-line shadow-sm flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  aria-label="アイコン変更"
                >
                  <BsPencil size={14} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
            </div>

            {/* 名前 */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-500">名前</p>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex items-center bg-white border border-line rounded-lg h-12 px-3">
                  <input
                    {...register("display_name")}
                    onFocus={() => setEditingName(true)}
                    onBlur={handleSubmit(onSubmit)}
                    className="flex-1 bg-transparent text-base text-gray-950 outline-none"
                    placeholder="表示名"
                  />
                  <BsPencil size={16} className="text-muted flex-shrink-0" />
                </div>
                {editingName && (
                  <p className="text-[11px] text-muted mt-1">フォーカスを外すと自動保存されます</p>
                )}
              </form>
            </div>

            {/* 現在のプラン */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-500">現在のプラン</p>
              <div className="flex items-center justify-between bg-white border border-line rounded-lg h-12 px-3">
                {plan === "premium" ? (
                  <span className="inline-flex items-center h-6 px-2 border border-primary text-primary text-xs font-bold rounded">
                    Premium
                  </span>
                ) : (
                  <span className="text-sm text-gray-700">Free</span>
                )}
                {plan === "premium" && hasStripeSubscription ? (
                  <button
                    type="button"
                    onClick={handleManagePlan}
                    disabled={isPortalLoading}
                    className="h-7 px-3 border border-primary text-primary text-xs font-bold rounded disabled:opacity-50"
                  >
                    プランを管理
                  </button>
                ) : plan === "premium" ? null : (
                  <button
                    type="button"
                    onClick={() => setShowUpgradeModal(true)}
                    className="h-7 px-3 border border-primary text-primary text-xs font-bold rounded"
                  >
                    アップグレード
                  </button>
                )}
              </div>
            </div>

            {/* 辞書の表示言語 */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-500">辞書の表示言語</p>
              <LanguageToggle value={displayLocale} onChange={handleLocaleChange} />
              <p className="text-xs text-muted">英英モードと和英モードの切り替えができます。</p>
            </div>

            {/* メールアドレス */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-gray-500">メールアドレス</p>
                {provider === "google" && (
                  <span className="inline-flex items-center h-5 px-2 border border-primary text-primary text-[10px] font-bold rounded">
                    Googleアカウント
                  </span>
                )}
              </div>
              <div className="flex items-center bg-white border border-line rounded-lg h-12 px-3">
                <p className="flex-1 text-base text-gray-950 truncate">{email || "—"}</p>
              </div>
            </div>

            {/* パスワード (email 認証のみ) */}
            {provider === "email" && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-gray-500">パスワード</p>
                <div className="flex items-center bg-white border border-line rounded-lg h-12 px-3">
                  <p className="flex-1 text-base text-gray-950 tracking-widest">••••••••</p>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-sm font-bold text-primary hover:underline"
                  >
                    再設定
                  </button>
                </div>
              </div>
            )}

            {/* アカウント削除 — サーバー側実装まで hidden */}
            {DELETE_ACCOUNT_ENABLED && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-gray-500">アカウント削除</p>
                <button
                  type="button"
                  className="flex items-center justify-between bg-white border border-line rounded-lg h-12 px-3 text-left hover:bg-gray-50"
                >
                  <span className="text-base text-red-600">退会手続きへ</span>
                  <BsChevronRight size={20} className="text-muted" />
                </button>
              </div>
            )}

            {/* ログアウト */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="px-8 h-11 rounded-full bg-gray-100 text-sm font-bold text-gray-700 hover:bg-gray-200"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </div>
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} reason="upgrade" />
      )}
    </>
  );
}
