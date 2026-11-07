"use client"

import { useEffect, useState } from "react"
import { HiChevronDown, HiChevronUp, HiX } from "react-icons/hi"
import Button from "@/components/Button"
import ModalShell from "@/components/ModalShell"
import TermsContent from "@/components/TermsContent"
import PrivacyContent from "@/components/PrivacyContent"
import { supabase } from "@/lib/supabaseClient"
import { FREE_PLAN_LIMIT } from "@/lib/supabaseApi"
import { toShortName, sortDecksByDifficulty } from "@/lib/deckDisplay"
import { useDisplayLocale } from "@/lib/useDisplayLocale"
import { messages } from "@/lib/i18n/messages"

// Paywall の見た目・文言は Android / iOS / Web で完全に共通。
// 違うのは (1) 購入処理 (2) 解約案内文だけ。ここでは表示層だけを持ち、
// 購入は onPurchase / onRestore で呼び出し側 (NativePaywall / UpgradeModal) に委譲する。
// 解約案内は platform prop で分岐する。

export type PaywallPlatform = "ios" | "android" | "web"

export type PaywallPlanDisplay = {
  priceString: string
  hasFreeTrial: boolean
  // 年額カード用。無ければ非表示。
  monthlyEquivalent?: string | null
  savings?: string | null
}

export type PaywallPlanKey = "monthly" | "yearly"

type Props = {
  platform: PaywallPlatform
  loading?: boolean
  offeringError?: boolean
  monthly: PaywallPlanDisplay | null
  yearly: PaywallPlanDisplay | null
  purchasingPlan: PaywallPlanKey | null
  onPurchase: (plan: PaywallPlanKey) => void
  onClose: () => void
  // native のみ「購入を復元」を表示する。web は復元概念が無いので undefined。
  showRestore?: boolean
  isRestoring?: boolean
  onRestore?: () => void
}

type LegalDoc = "terms" | "privacy" | null

type PaidDeckSummary = {
  count: number
  totalWords: number
  displayNames: string[]
}

export default function PaywallContent({
  platform,
  loading = false,
  offeringError = false,
  monthly,
  yearly,
  purchasingPlan,
  onPurchase,
  onClose,
  showRestore = false,
  isRestoring = false,
  onRestore,
}: Props) {
  const locale = useDisplayLocale()
  const p = messages[locale].paywall
  const BILLING_LINES: Record<PaywallPlatform, readonly string[]> = {
    ios: p.billingIos,
    android: p.billingAndroid,
    web: p.billingWeb,
  }
  const [openDoc, setOpenDoc] = useState<LegalDoc>(null)
  // 自動更新についての開閉。初期は閉じる。
  const [autoRenewOpen, setAutoRenewOpen] = useState(false)
  const [paidDecks, setPaidDecks] = useState<PaidDeckSummary | null>(null)

  useEffect(() => {
    let cancelled = false
    // 有料デッキの本数・累計語数・名前一覧は decks テーブルの実データから取り出す。
    // 固定値をハードコードすると新規デッキ追加時に更新漏れが起きるため。
    supabase
      .from("decks")
      .select("name, label, word_count, is_premium")
      .eq("is_premium", true)
      .eq("is_official", true)
      .order("label")
      .order("name")
      .limit(100)
      .then(({ data }) => {
        if (cancelled || !data) return
        const rows = data as { name: string; label: string; word_count: number | null; is_premium: boolean }[]
        const sorted = sortDecksByDifficulty(rows)
        const totalWords = sorted.reduce((sum, d) => sum + (d.word_count ?? 0), 0)
        const displayNames = sorted.map((d) => `${d.label} ${toShortName(d.name, d.label)}`.trim())
        setPaidDecks({ count: sorted.length, totalWords, displayNames })
      })
    return () => {
      cancelled = true
    }
  }, [])

  // ボタン文言。トライアルがあれば「14日間無料ではじめる」、無ければ「〇〇プランで始める」。
  const monthlyCtaLabel = monthly?.hasFreeTrial ? p.trialCta : p.monthlyCta
  const yearlyCtaLabel = yearly?.hasFreeTrial ? p.trialCta : p.yearlyCta

  const purchaseDisabled = purchasingPlan !== null || loading

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 overflow-y-auto py-8"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{p.title}</h2>
        <p className="text-sm text-gray-500 mb-4">
          {p.subtitle}
        </p>

        {offeringError ? (
          <div className="text-sm text-gray-500 mb-4">
            {p.offeringError}
          </div>
        ) : (
          <>
            {/* 年額プラン (枠を強調) */}
            <div className="relative border border-line rounded-xl p-4 mb-2">
              <span className="absolute -top-2 right-3 inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold text-white bg-gradient-to-r from-amber-400 via-pink-500 to-fuchsia-500 shadow-sm">
                {p.recommended}
              </span>
              <div className="flex items-baseline justify-between mb-1">
                <span className="font-semibold text-gray-900 text-sm">{p.yearlyPlan}</span>
                <div>
                  <span className="text-xl font-bold text-gray-900">
                    {loading ? "…" : yearly?.priceString ?? ""}
                  </span>
                  <span className="text-xs text-gray-500">{p.perYear}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs mb-3">
                {yearly?.monthlyEquivalent && (
                  <span className="text-gray-600">{p.monthlyEquivalent(yearly.monthlyEquivalent)}</span>
                )}
                {yearly?.savings && (
                  <span className="inline-flex items-center h-5 px-2 rounded-full font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm">
                    {p.yearlyDiscount(yearly.savings)}
                  </span>
                )}
              </div>
              <Button
                onClick={() => onPurchase("yearly")}
                disabled={purchaseDisabled}
                variant="primary"
                size="md"
                radius="lg"
                fullWidth
              >
                {purchasingPlan === "yearly" ? p.processing : yearlyCtaLabel}
              </Button>
            </div>

            {/* 月額プラン */}
            <div className="border border-line rounded-xl p-4 mb-4">
              <div className="flex items-baseline justify-between mb-3">
                <span className="font-semibold text-gray-900 text-sm">{p.monthlyPlan}</span>
                <div>
                  <span className="text-xl font-bold text-gray-900">
                    {loading ? "…" : monthly?.priceString ?? ""}
                  </span>
                  <span className="text-xs text-gray-500">{p.perMonth}</span>
                </div>
              </div>
              <Button
                onClick={() => onPurchase("monthly")}
                disabled={purchaseDisabled}
                variant="primary"
                size="md"
                radius="lg"
                fullWidth
              >
                {purchasingPlan === "monthly" ? p.processing : monthlyCtaLabel}
              </Button>
            </div>

            {/* 特典リスト */}
            <ul className="text-sm text-gray-700 space-y-2 mb-4 px-1">
              <li>
                <span className="font-medium">
                  {paidDecks
                    ? p.featureDecks(paidDecks.count, paidDecks.totalWords.toLocaleString())
                    : p.featureDecksLoading}
                </span>
                {paidDecks && paidDecks.displayNames.length > 0 && (
                  <span className="block pl-4 text-xs text-gray-500 mt-0.5">
                    {paidDecks.displayNames.join(locale === 'ja' ? '、' : ', ')}
                  </span>
                )}
              </li>
              <li className="font-medium">
                {p.featureUnlimited}
                <span className="block pl-4 text-xs text-gray-500 mt-0.5 font-normal">
                  {p.freePlanLimit(FREE_PLAN_LIMIT)}
                </span>
              </li>
            </ul>

            {showRestore && onRestore && (
              <button
                type="button"
                onClick={onRestore}
                disabled={isRestoring}
                className="w-full text-xs text-gray-500 underline py-1 mb-4 disabled:opacity-40"
              >
                {isRestoring ? p.restoring : p.restore}
              </button>
            )}

            {/* 自動更新について (トグル開閉、初期は閉じる) */}
            <div className="border-t border-line pt-3 mb-3">
              <button
                type="button"
                onClick={() => setAutoRenewOpen((v) => !v)}
                aria-expanded={autoRenewOpen}
                className="w-full flex items-center justify-between text-xs font-semibold text-gray-600 py-1"
              >
                {p.autoRenewTitle}
                {autoRenewOpen ? <HiChevronUp className="size-4" /> : <HiChevronDown className="size-4" />}
              </button>
              {autoRenewOpen && (
                <div className="text-[11px] text-gray-500 leading-relaxed space-y-2 pt-2">
                  <p>
                    {(monthly?.hasFreeTrial || yearly?.hasFreeTrial) ? p.autoRenewStart : p.autoRenewContinue}
                    <br />{p.autoRenewMonthly(monthly?.priceString ?? '')}
                    {monthly?.hasFreeTrial && p.autoRenewAfterTrial}
                    <br />{p.autoRenewYearly(yearly?.priceString ?? '')}
                    {yearly?.hasFreeTrial && p.autoRenewAfterTrial}
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {BILLING_LINES[platform].map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}

        {/* 利用規約・プライバシーポリシー (App Store 審査 3.1.2 対応: トグル内に隠さず常に表示)
            本文は W3 で英訳予定。EN ユーザーが開いても現時点は日本語のまま。 */}
        <div className="flex justify-center gap-4 text-xs text-gray-500 mb-3">
          <button type="button" onClick={() => setOpenDoc("terms")} className="underline">
            {p.terms}
          </button>
          <button type="button" onClick={() => setOpenDoc("privacy")} className="underline">
            {p.privacy}
          </button>
        </div>

        <Button onClick={onClose} variant="secondary" size="md" radius="lg" fullWidth>
          {p.close}
        </Button>
      </div>

      <ModalShell
        open={openDoc !== null}
        onClose={() => setOpenDoc(null)}
        headerRight={
          <button
            type="button"
            onClick={() => setOpenDoc(null)}
            className="p-2 -mr-1 rounded-full hover:bg-primary-subtle text-muted"
            aria-label={p.close}
          >
            <HiX className="size-5" />
          </button>
        }
      >
        <div className="px-6 py-8">
          {openDoc === "terms" && <TermsContent />}
          {openDoc === "privacy" && <PrivacyContent />}
        </div>
      </ModalShell>
    </div>
  )
}
