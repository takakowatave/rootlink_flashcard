"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getUserPlan } from "@/lib/supabaseApi";
import { useAuthProvider } from "@/lib/useAuthProvider";
import { FaUserCircle } from "react-icons/fa";
import { BsPencil } from "react-icons/bs";
import { MdArrowBackIosNew } from "react-icons/md";
import ModalShell from "@/components/ModalShell";
import EditableField from "@/components/EditableField";
import SettingsSection from "@/components/SettingsSection";
import SettingsRow from "@/components/SettingsRow";
import EmailChangeModal from "@/components/EmailChangeModal";
import PasswordResetConfirmModal from "@/components/PasswordResetConfirmModal";
import DeleteAccountModal from "@/components/DeleteAccountModal";
import EmailSentDialog, { type EmailSentVariant } from "@/components/EmailSentDialog";
import toast from "react-hot-toast";
import type { Profile } from "@/types/Profile";
import LanguageToggle from "@/components/LanguageToggle";
import UpgradeModal from "@/components/UpgradeModal";
import NativePaywall from "@/components/NativePaywall";
import { isNativePlatform } from "@/lib/isNativePlatform";
import { openNativeManageSubscriptions, signOutRevenueCat } from "@/lib/revenuecat";
import { decidePaywallVariant, type PaywallVariant } from "@/lib/paywall";
import type { DisplayLocale } from "@/types/DisplayLocale";
import { DISPLAY_LOCALE_STORAGE_KEY, DISPLAY_LOCALE_EVENT_NAME } from "@/types/DisplayLocale";
import Toggle from "@/components/Toggle";
import InfoBanner from "@/components/InfoBanner";
import Button from "@/components/Button";
import {
  canDeleteReminderSlot,
  clearReminders,
  DEFAULT_REMINDER_SETTINGS,
  ensureReminderPermission,
  loadReminderSettings,
  MAX_REMINDER_SLOTS,
  nextCustomSlotKey,
  nextCustomSlotTime,
  persistAndApplyReminders,
  type ReminderSettings,
  type ReminderSlotKey,
} from "@/lib/reminders";
import { MdAddCircle } from "react-icons/md";
import { HiOutlineTrash } from "react-icons/hi2";

// 'granted' | 'denied' | 'prompt' 等を返す。'prompt' 系は request で聞ける状態、
// 'denied' 以降は OS 設定でしか復帰しない。plugin が無い / エラー時は 'unknown'
// にしてセクション自体は現状維持（グレーアウトも InfoBanner も出さない）。
type NotifPermission = "granted" | "prompt" | "denied" | "unknown";

async function openNotificationSettings(): Promise<void> {
  try {
    const { NativeSettings, IOSSettings, AndroidSettings } = await import(
      "capacitor-native-settings"
    );
    await NativeSettings.open({
      optionIOS: IOSSettings.App,
      optionAndroid: AndroidSettings.AppNotification,
    });
  } catch {
    // plugin unavailable in web preview — silently skip
  }
}

function formatJPDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

// 「現在のプラン」の下に出す補足文言。
// - status=trialing → 「無料期間は○月○日まで」
// - status=active + will_renew=false → 「○月○日で終了します（自動更新なし）」
// - status=active + will_renew=true → 「次回更新日: ○月○日」
// - store が無い (テスター) や日付が取れないケースは何も出さない。
function buildPlanHelperText(params: {
  plan: "premium" | "free" | null;
  status: string | null;
  expiresAt: string | null;
  willRenew: boolean | null;
  store: "stripe" | "app_store" | "play_store" | null;
}): string | null {
  const { plan, status, expiresAt, willRenew, store } = params;
  if (plan !== "premium") return null;
  if (store === null) return null;
  const date = formatJPDate(expiresAt);
  if (!date) return null;
  if (status === "trialing") return `無料期間は ${date} まで`;
  if (status === "active" && willRenew === false) {
    return `${date}で終了します（自動更新なし）`;
  }
  if (status === "active") return `次回更新日: ${date}`;
  return null;
}

async function checkNotificationPermission(): Promise<NotifPermission> {
  try {
    const mod = await import("@capacitor/local-notifications");
    const state = (await mod.LocalNotifications.checkPermissions()).display;
    if (state === "granted") return "granted";
    if (state === "denied") return "denied";
    // prompt / prompt-with-rationale / undetermined 等はまとめて 'prompt'
    return "prompt";
  } catch {
    return "unknown";
  }
}

async function requestNotificationPermission(): Promise<NotifPermission> {
  try {
    const mod = await import("@capacitor/local-notifications");
    const state = (await mod.LocalNotifications.requestPermissions()).display;
    if (state === "granted") return "granted";
    if (state === "denied") return "denied";
    return "prompt";
  } catch {
    return "unknown";
  }
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onUpdated: () => void;
}

const AVATAR_ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const AVATAR_MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onUpdated,
}: Props) {
  const provider = useAuthProvider();
  const [plan, setPlan] = useState<"premium" | "free" | null>(null);
  const [subscriptionStore, setSubscriptionStore] = useState<
    "stripe" | "app_store" | "play_store" | null
  >(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(
    null,
  );
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<
    string | null
  >(null);
  const [subscriptionWillRenew, setSubscriptionWillRenew] = useState<
    boolean | null
  >(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [paywallVariant, setPaywallVariant] = useState<Exclude<PaywallVariant, "none"> | null>(null);
  const [displayLocale, setDisplayLocale] = useState<DisplayLocale>("ja");
  const [email, setEmail] = useState<string>("");
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [emailSent, setEmailSent] = useState<{ variant: EmailSentVariant; sentTo: string } | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(
    DEFAULT_REMINDER_SETTINGS,
  );
  const [notifPermission, setNotifPermission] = useState<NotifPermission>("unknown");

  const API_BASE =
    process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ??
    "https://rootlink-server-v2-774622345521.asia-northeast1.run.app";

  const handleLogout = async () => {
    // 予約済みのローカル通知と保存済み設定は logout 時に必ず片付ける。
    // 別アカウントで再ログインしたときに前ユーザーの reminder が発火するのを防ぐ。
    await clearReminders();
    // RevenueCat の紐付けもリセット。別アカウントに前ユーザーの購入状態が
    // 引き継がれるのを防ぐ。
    await signOutRevenueCat();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleManagePlan = async () => {
    setIsPortalLoading(true);
    try {
      if (subscriptionStore === "app_store" || subscriptionStore === "play_store") {
        const result = await openNativeManageSubscriptions();
        if (!result.ok) toast.error("管理画面を開けませんでした");
        return;
      }
      // subscriptionStore === "stripe" (or フォールバックで null は表示ガードで来ない)
      // native は上の分岐で必ず openNativeManageSubscriptions に流すため、
      // ここで Stripe ポータル URL に window.location.href を代入する経路には
      // 到達しないはずだが、審査 NG の cloaking 事故 (呼び出し漏れ・future
      // refactor) を防ぐ最終防波堤として明示ガード。
      if (isNativePlatform()) return;
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
          locale: "ja",
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

  const handleUpgrade = async () => {
    if (isNativePlatform()) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const variant = await decidePaywallVariant(user.id);
      if (variant !== "none") setPaywallVariant(variant);
      return;
    }
    setShowUpgradeModal(true);
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
    const input = e.target;
    const file = input.files?.[0];
    if (!file || !profile) return;

    if (!AVATAR_ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error("対応形式は JPEG / PNG / WebP / GIF のみです");
      input.value = "";
      return;
    }
    if (file.size > AVATAR_MAX_FILE_SIZE) {
      toast.error("ファイルサイズは 5MB 以下にしてください");
      input.value = "";
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", profile.id);
      if (updErr) throw updErr;
      toast.success("アイコンを更新しました");
      onUpdated();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (/exceeded the maximum allowed size|payload too large/i.test(message)) {
        toast.error("ファイルサイズは 5MB 以下にしてください");
      } else if (/mime type|not allowed|invalid_mime_type/i.test(message)) {
        toast.error("対応形式は JPEG / PNG / WebP / GIF のみです");
      } else {
        toast.error("アップロードに失敗しました");
      }
    } finally {
      setUploading(false);
      input.value = "";
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
        .select("store, status, expires_at, will_renew")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          const store = data?.store;
          setSubscriptionStore(
            store === "stripe" || store === "app_store" || store === "play_store"
              ? store
              : null,
          );
          setSubscriptionStatus(
            typeof data?.status === "string" ? data.status : null,
          );
          setSubscriptionExpiresAt(
            typeof data?.expires_at === "string" ? data.expires_at : null,
          );
          setSubscriptionWillRenew(
            typeof data?.will_renew === "boolean" ? data.will_renew : null,
          );
        });
    });
    const saved = localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY);
    if (saved === "en" || saved === "ja") setDisplayLocale(saved);
    if (isNativePlatform()) {
      setReminderSettings(loadReminderSettings());
      checkNotificationPermission().then(setNotifPermission);
    }
  }, [isOpen]);

  // モーダル表示中にアプリが復帰したら permission を取り直す
  // （端末の設定でトグルを変えて戻ってきた等）
  useEffect(() => {
    if (!isOpen || !isNativePlatform()) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        checkNotificationPermission().then(setNotifPermission);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isOpen]);

  const handleAllowNotifications = async () => {
    if (notifPermission === "denied") {
      // 拒否済みは request しても即 denied が返るので、端末の設定に飛ばす
      await openNotificationSettings();
      return;
    }
    const next = await requestNotificationPermission();
    setNotifPermission(next);
    if (next === "granted") {
      // 許可が取れたのでその場で予約を反映する
      await persistAndApplyReminders(reminderSettings);
    }
  };

  const updateReminderSettings = (patch: (prev: ReminderSettings) => ReminderSettings) => {
    setReminderSettings((prev) => {
      const next = patch(prev);
      // 保存＋通知の予約反映は非同期で走らせる。UI は即時反映で良い。
      void persistAndApplyReminders(next);
      return next;
    });
  };

  // OFF → ON への切替では未許可なら OS ダイアログを出し、拒否済みなら
  // 端末の通知設定を開く。denied のときは呼び出し側でトグルを OFF に戻す。
  const ensurePermissionForOn = async (): Promise<boolean> => {
    const res = await ensureReminderPermission();
    if (res.kind === "denied") {
      setNotifPermission("denied");
      toast.error(
        res.openedSettings
          ? "端末の設定で通知を許可してから再度お試しください"
          : "通知が許可されていないため、リマインダーを設定できません",
      );
      return false;
    }
    if (res.kind === "granted") setNotifPermission("granted");
    return true;
  };

  const handleMasterToggle = async (next: boolean) => {
    if (next && !reminderSettings.masterEnabled) {
      const ok = await ensurePermissionForOn();
      if (!ok) return;
    }
    updateReminderSettings((prev) => ({ ...prev, masterEnabled: next }));
  };

  const handleSlotTimeChange = (key: ReminderSlotKey, time: string) => {
    updateReminderSettings((prev) => ({
      ...prev,
      slots: prev.slots.map((s) => (s.key === key ? { ...s, time } : s)),
    }));
  };

  const handleSlotToggle = async (key: ReminderSlotKey, enabled: boolean) => {
    if (enabled) {
      const current = reminderSettings.slots.find((s) => s.key === key);
      if (current && !current.enabled) {
        const ok = await ensurePermissionForOn();
        if (!ok) return;
      }
    }
    updateReminderSettings((prev) => ({
      ...prev,
      slots: prev.slots.map((s) => (s.key === key ? { ...s, enabled } : s)),
    }));
  };

  const handleAddReminderSlot = () => {
    updateReminderSettings((prev) => {
      if (prev.slots.length >= MAX_REMINDER_SLOTS) return prev;
      return {
        ...prev,
        slots: [
          ...prev.slots,
          {
            key: nextCustomSlotKey(),
            label: "",
            time: nextCustomSlotTime(prev.slots),
            enabled: true,
          },
        ],
      };
    });
  };

  const handleDeleteReminderSlot = (key: ReminderSlotKey) => {
    updateReminderSettings((prev) => {
      const target = prev.slots.find((s) => s.key === key);
      if (!target || !canDeleteReminderSlot(target)) return prev;
      return { ...prev, slots: prev.slots.filter((s) => s.key !== key) };
    });
  };

  // profile 行が無い状態でモーダルが開いたら、その場で自己修復を試みる
  // AppShell のトリガーが効かなかった過去ユーザーの保険
  useEffect(() => {
    if (!isOpen || profile) return;
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (existing || cancelled) {
        onUpdated();
        return;
      }
      const username =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "";
      const avatar_url =
        user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email,
        username,
        avatar_url,
      });
      if (!error && !cancelled) onUpdated();
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, profile, onUpdated]);

  const handleLocaleChange = (locale: DisplayLocale) => {
    setDisplayLocale(locale);
    localStorage.setItem(DISPLAY_LOCALE_STORAGE_KEY, locale);
    window.dispatchEvent(new Event(DISPLAY_LOCALE_EVENT_NAME));
    toast.success(locale === "ja" ? "和英モードに切り替えました" : "英英モードに切り替えました");
  };

  if (!isOpen) return null;

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
            {profile && (
              <>
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
                      accept={AVATAR_ALLOWED_MIME_TYPES.join(",")}
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
              </>
            )}

            <SettingsSection title="アカウント">
              <SettingsRow
                label={
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="whitespace-nowrap">メールアドレス</span>
                    {provider === "google" && (
                      <span className="inline-flex items-center h-5 px-2 border border-primary text-primary text-[10px] font-bold rounded shrink-0 whitespace-nowrap">
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
                    onClick={() => setShowPasswordReset(true)}
                    className="text-sm font-bold text-primary hover:underline whitespace-nowrap"
                  >
                    変更
                  </button>
                </SettingsRow>
              )}
            </SettingsSection>

            <SettingsSection title="設定">
              <SettingsRow
                label="現在のプラン"
                helperText={buildPlanHelperText({
                  plan,
                  status: subscriptionStatus,
                  expiresAt: subscriptionExpiresAt,
                  willRenew: subscriptionWillRenew,
                  store: subscriptionStore,
                })}
              >
                {plan === "premium" ? (
                  <span className="inline-flex items-center h-6 px-2 border border-primary text-primary text-xs font-bold rounded">
                    {subscriptionStore !== null ? "Premium" : "テスター"}
                  </span>
                ) : (
                  <span className="text-sm text-gray-700">Free</span>
                )}
                {plan === "premium" && subscriptionStore !== null && (
                  <button
                    type="button"
                    onClick={handleManagePlan}
                    disabled={isPortalLoading}
                    className="text-sm font-bold text-primary hover:underline whitespace-nowrap disabled:opacity-50"
                  >
                    プランを管理
                  </button>
                )}
                {plan === "free" && (
                  <button
                    type="button"
                    onClick={handleUpgrade}
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

            {isNativePlatform() && (
              <SettingsSection title="通知">
                {(notifPermission === "denied" || notifPermission === "prompt") && (
                  <div className="pt-4 pb-2 flex flex-col gap-3">
                    <InfoBanner
                      title="通知がオフになっています"
                      body="リマインダーを受け取るには、端末の設定で通知を許可してください。"
                    />
                    <Button
                      variant="primary"
                      fullWidth
                      radius="full"
                      onClick={handleAllowNotifications}
                    >
                      通知を許可する
                    </Button>
                  </div>
                )}
                <SettingsRow label="学習リマインダー">
                  <Toggle
                    checked={reminderSettings.masterEnabled}
                    onChange={handleMasterToggle}
                    label="学習リマインダー"
                  />
                </SettingsRow>
                {reminderSettings.slots.map((slot) => {
                  const disabled = !reminderSettings.masterEnabled;
                  const deletable = canDeleteReminderSlot(slot);
                  return (
                    <div
                      key={slot.key}
                      className="flex items-center justify-between py-4 border-b border-line last:border-b-0 gap-2"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <label
                          className={`inline-flex items-center rounded-md border border-slate-400 px-2.5 py-1 cursor-pointer ${
                            disabled ? "opacity-40 cursor-not-allowed" : ""
                          }`}
                        >
                          <input
                            type="time"
                            value={slot.time}
                            disabled={disabled}
                            onChange={(e) => handleSlotTimeChange(slot.key, e.target.value)}
                            // w-[58px] 固定だと Android 12h 表記 (「午前 07:00」) で
                            // 数字が切れるため、内容に合わせて広がるようにする。
                            className="bg-transparent text-[15px] font-medium text-gray-950 tabular-nums outline-none disabled:cursor-not-allowed"
                          />
                        </label>
                        {slot.label && (
                          <span
                            className={`text-base text-gray-950 truncate ${
                              disabled ? "opacity-40" : ""
                            }`}
                          >
                            {slot.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Toggle
                          checked={slot.enabled}
                          onChange={(next) => handleSlotToggle(slot.key, next)}
                          label={`${slot.label || slot.time} の通知`}
                          disabled={disabled}
                        />
                        {deletable && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReminderSlot(slot.key)}
                            disabled={disabled}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40 disabled:hover:text-gray-400"
                            aria-label={`${slot.label || slot.time} を削除`}
                          >
                            <HiOutlineTrash className="size-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="py-4">
                  <button
                    type="button"
                    onClick={handleAddReminderSlot}
                    disabled={
                      !reminderSettings.masterEnabled ||
                      reminderSettings.slots.length >= MAX_REMINDER_SLOTS
                    }
                    className="w-full h-10 flex items-center justify-center gap-1 border border-primary rounded-full text-sm font-medium text-primary disabled:border-slate-300 disabled:text-slate-300 disabled:cursor-not-allowed"
                  >
                    追加
                    <MdAddCircle className="size-6" />
                  </button>
                </div>
              </SettingsSection>
            )}

            <SettingsSection title="アカウント削除">
              <SettingsRow
                label="退会する"
                helperText="すべての学習データが削除されます。Premium加入中の場合は自動的に解約されます。"
              >
                <button
                  type="button"
                  onClick={() => setShowDeleteAccount(true)}
                  className="text-sm font-bold text-red-600 hover:underline whitespace-nowrap"
                >
                  退会手続きへ
                </button>
              </SettingsRow>
            </SettingsSection>

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

      <PasswordResetConfirmModal
        open={showPasswordReset}
        onClose={() => setShowPasswordReset(false)}
        email={email}
        onSent={() => {
          setShowPasswordReset(false);
          setEmailSent({ variant: "password-reset", sentTo: email });
        }}
      />

      <DeleteAccountModal
        open={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
        hasActiveSubscription={subscriptionStore !== null && plan === "premium"}
        onDeleted={() => {
          setShowDeleteAccount(false);
          window.location.href = "/goodbye";
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
      {paywallVariant && (
        <NativePaywall variant={paywallVariant} onClose={() => setPaywallVariant(null)} />
      )}
    </>
  );
}
