"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabaseClient";
import { getUserPlan } from "@/lib/supabaseApi";
import { FaUserCircle } from "react-icons/fa";
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

export default function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onUpdated,
}: Props) {
  const {
    register,
    handleSubmit,
    setValue,
  } = useForm<FormData>();
  const [plan, setPlan] = useState<"premium" | "free" | null>(null);
  const [hasStripeSubscription, setHasStripeSubscription] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [displayLocale, setDisplayLocale] = useState<DisplayLocale>('ja');
  const [email, setEmail] = useState<string>("");
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
        body: JSON.stringify({ origin: window.location.origin, locale: navigator.language.startsWith("ja") ? "ja" : "auto" }),
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

  const handleChangeEmail = async () => {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) toast.error("送信に失敗しました");
    else toast.success("変更手続きのメールを送信しました");
  };

  const handleChangePassword = async () => {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) toast.error("送信に失敗しました");
    else toast.success("パスワード再設定メールを送信しました");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updErr } = await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", profile.id);
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
    if (profile) {
      setValue("display_name", profile.username ?? "");
    }
  }, [profile, setValue]);

  useEffect(() => {
    if (isOpen) {
      getUserPlan().then(setPlan);
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        setEmail(user.email ?? "");
        supabase
          .from("subscriptions")
          .select("stripe_customer_id")
          .eq("user_id", user.id)
          .maybeSingle()
          .then(({ data }) => {
            setHasStripeSubscription(!!data?.stripe_customer_id);
          });
      });
      const saved = localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY);
      if (saved === 'en' || saved === 'ja') setDisplayLocale(saved);
    }
  }, [isOpen]);

  const handleLocaleChange = (locale: DisplayLocale) => {
    setDisplayLocale(locale);
    localStorage.setItem(DISPLAY_LOCALE_STORAGE_KEY, locale);
    window.dispatchEvent(new Event(DISPLAY_LOCALE_EVENT_NAME));
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
    onUpdated();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 sm:items-center overflow-y-auto">
        <div className="bg-surface w-full min-h-full sm:min-h-0 sm:max-w-md sm:rounded-2xl sm:my-8 shadow-xl overflow-hidden">
          {/* close bar (SP top) */}
          <div className="flex items-center justify-end px-4 py-3 sm:hidden">
            <button onClick={onClose} className="text-sm text-muted">閉じる</button>
          </div>
          <div className="hidden sm:flex items-center justify-between px-6 py-4 border-b border-line">
            <h2 className="text-base font-bold text-gray-950">設定</h2>
            <button onClick={onClose} className="text-sm text-muted">閉じる</button>
          </div>

          <div className="px-4 sm:px-6 py-6 flex flex-col gap-8">
            {/* プロフィール */}
            <section className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-gray-950">プロフィール</h3>

              <div className="flex items-center gap-2">
                <div className="w-20 h-20 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center shrink-0">
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
                  className="h-6 px-2 border border-primary text-primary text-xs font-bold rounded"
                >
                  {uploading ? "..." : "アップロード"}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
                <label className="text-sm text-gray-800">表示される名前</label>
                <input
                  {...register("display_name")}
                  onBlur={handleSubmit(onSubmit)}
                  className="h-10 border border-line rounded px-2 text-sm text-gray-800 bg-white"
                />
              </form>
            </section>

            <div className="h-px bg-line" />

            {/* 設定 */}
            <section className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-gray-950">設定</h3>

              <div className="flex items-center justify-between h-14 border-b border-line">
                <p className="text-sm text-gray-800">現在のプラン</p>
                {plan === "premium" ? (
                  hasStripeSubscription ? (
                    <button
                      type="button"
                      onClick={handleManagePlan}
                      disabled={isPortalLoading}
                      className="h-6 px-2 border border-primary text-primary text-xs font-bold rounded disabled:opacity-50"
                    >
                      {isPortalLoading ? "..." : "Premium"}
                    </button>
                  ) : (
                    <span className="h-6 px-2 border border-primary text-primary text-xs font-bold rounded inline-flex items-center">
                      Premium
                    </span>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowUpgradeModal(true)}
                    className="h-6 px-2 border border-primary text-primary text-xs font-bold rounded"
                  >
                    アップグレード
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between h-[50px] border-b border-line">
                <p className="text-sm text-gray-800">辞書の表示言語</p>
                <LanguageToggle value={displayLocale} onChange={handleLocaleChange} />
              </div>
            </section>

            {/* セキュリティ */}
            <section className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-gray-950">セキュリティ</h3>

              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-800">メールアドレス</p>
                <p className="text-xs text-muted">{email || "—"}</p>
                <button
                  type="button"
                  onClick={handleChangeEmail}
                  className="h-8 px-4 border border-primary text-primary text-sm font-bold rounded self-start"
                >
                  変更
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-800">パスワード</p>
                <p className="text-xs text-muted tracking-widest">••••••</p>
                <button
                  type="button"
                  onClick={handleChangePassword}
                  className="h-8 px-4 border border-primary text-primary text-sm font-bold rounded self-start"
                >
                  変更
                </button>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-red-700 self-start py-2"
              >
                ログアウト
              </button>
            </section>
          </div>
        </div>
      </div>
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} reason="upgrade" />}
    </>
  );
}
