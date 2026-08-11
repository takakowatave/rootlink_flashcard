"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getUserPlan } from "@/lib/supabaseApi";
import { useAuthProvider } from "@/lib/useAuthProvider";
import { FaUserCircle } from "react-icons/fa";
import { BsChevronRight, BsPencil } from "react-icons/bs";
import { MdArrowBackIosNew } from "react-icons/md";
import ModalShell from "@/components/ModalShell";
import EditableField from "@/components/EditableField";
import SettingsSection from "@/components/SettingsSection";
import SettingsRow from "@/components/SettingsRow";
import EmailChangeModal from "@/components/EmailChangeModal";
import EmailSentDialog, { type EmailSentVariant } from "@/components/EmailSentDialog";
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

// サーバー側 /account/delete が未実装のため、UIを隠す
const DELETE_ACCOUNT_ENABLED = false;

export default function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onUpdated,
}: Props) {
  const provider = useAuthProvider();
  const [plan, setPlan] = useState<"premium" | "free" | null>(null);
  const [hasStripeSubscription, setHasStripeSubscription] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [displayLocale, setDisplayLocale] = useState<DisplayLocale>("ja");
  const [email, setEmail] = useState<string>("");
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [emailSent, setEmailSent] = useState<{ variant: EmailSentVariant; sentTo: string } | null>(
    null,
  );
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error("送信に失敗しました");
      return;
    }
    setEmailSent({ variant: "password-reset", sentTo: email });
  };

  const handleSaveDisplayName = async (draft: string) => {
    if (!profile) return;
    const { error } = await supabase
      .from("profiles")
      .update({ username: draft })
      .eq("id", profile.id);
    if (error) {
      throw new Error("更新に失敗しました");
    }
    toast.success("保存しました");
    onUpdated();
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

  void hasStripeSubscription;

  return (
    <>
      <ModalShell
        open
        onClose={onClose}
        headerLeft={
          <>
            <button
              onClick={onClose}
              className="md:hidden p-2 rounded-full hover:bg-gray-100 text-muted"
              aria-label="戻る"
            >
              <MdArrowBackIosNew className="size-6" />
            </button>
            <h2 className="hidden md:block text-base font-bold text-gray-950 pl-2">設定</h2>
          </>
        }
        headerRight={
          <button
            onClick={onClose}
            className="hidden md:block text-sm text-muted hover:text-gray-700 px-2"
          >
            閉じる
          </button>
        }
      >
        <div className="px-5 md:px-6 pt-4 pb-8 flex flex-col gap-8">
            {/* アバター */}
            <div className="flex justify-center pt-2">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center">
                  {profile.avatar_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
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

            <SettingsSection title="プロフィール">
              <EditableField
                label="表示名"
                value={profile.username ?? ""}
                placeholder="表示名を入力"
                emptyLabel="未設定"
                onSave={handleSaveDisplayName}
              />
            </SettingsSection>

            <SettingsSection title="アカウント">
              <SettingsRow
                label={
                  <span className="flex items-center gap-2">
                    メールアドレス
                    {provider === "google" && (
                      <span className="inline-flex items-center h-5 px-2 border border-primary text-primary text-[10px] font-bold rounded">
                        Googleアカウント
                      </span>
                    )}
                  </span>
                }
                helperText={
                  provider === "google"
                    ? "Googleアカウントで管理されているため変更できません。"
                    : undefined
                }
              >
                <p className="flex-1 text-base text-gray-900 truncate md:flex-none">{email || "—"}</p>
                {provider === "email" && email && (
                  <button
                    type="button"
                    onClick={() => setShowEmailChange(true)}
                    className="text-sm font-bold text-primary hover:underline whitespace-nowrap"
                  >
                    変更
                  </button>
                )}
              </SettingsRow>

              {provider === "email" && (
                <SettingsRow label="パスワード">
                  <p className="flex-1 text-base text-gray-900 tracking-widest md:flex-none">
                    ••••••••
                  </p>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-sm font-bold text-primary hover:underline whitespace-nowrap"
                  >
                    再設定用メールを送信
                  </button>
                </SettingsRow>
              )}
            </SettingsSection>

            <SettingsSection title="設定">
              <SettingsRow label="現在のプラン">
                {plan === "premium" ? (
                  <span className="inline-flex items-center h-6 px-2 border border-primary text-primary text-xs font-bold rounded">
                    Premium
                  </span>
                ) : (
                  <span className="text-sm text-gray-700">Free</span>
                )}
                {plan === "premium" ? (
                  <button
                    type="button"
                    onClick={handleManagePlan}
                    disabled={isPortalLoading}
                    className="text-sm font-bold text-primary hover:underline whitespace-nowrap disabled:opacity-50"
                  >
                    プランを管理
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowUpgradeModal(true)}
                    className="text-sm font-bold text-primary hover:underline whitespace-nowrap"
                  >
                    アップグレード
                  </button>
                )}
              </SettingsRow>

              <SettingsRow
                label="辞書の表示言語"
                helperText="英英モードと和英モードの切り替えができます。"
              >
                <LanguageToggle value={displayLocale} onChange={handleLocaleChange} />
              </SettingsRow>
            </SettingsSection>

            {/* アカウント削除 — サーバー側実装まで hidden */}
            {DELETE_ACCOUNT_ENABLED && (
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-600">アカウント削除</label>
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
      </ModalShell>

      <EmailChangeModal
        open={showEmailChange}
        onClose={() => setShowEmailChange(false)}
        currentEmail={email}
        onSent={(newEmail) => {
          setShowEmailChange(false);
          setEmailSent({ variant: "email-change", sentTo: newEmail });
        }}
      />

      {emailSent && (
        <EmailSentDialog
          open
          sentTo={emailSent.sentTo}
          variant={emailSent.variant}
          onClose={() => setEmailSent(null)}
        />
      )}

      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} reason="upgrade" />
      )}
    </>
  );
}
