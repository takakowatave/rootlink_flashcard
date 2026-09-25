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

// プラットフォーム別の請求・解約案内。
// ここだけプラットフォームで差し替える。他の文言は全 3 面で同一。
const BILLING_LINES: Record<PaywallPlatform, string[]> = {
  ios: [
    "支払いは購入確定時に Apple ID に請求されます",
    "自動更新は現在の期間終了の24時間前までにキャンセルしない限り継続されます",
    "App Store の [設定] → [Apple ID] → [サブスクリプション] からいつでも解約できます",
  ],
  android: [
    "支払いは購入確定時に Google アカウントに請求されます",
    "自動更新は現在の期間終了の24時間前までにキャンセルしない限り継続されます",
    "Google Play の [アカウント] → [お支払いと定期購入] → [定期購入] からいつでも解約できます",
  ],
  web: [
    "支払いは Stripe を通じて決済されます",
    "自動更新は現在の期間終了までにキャンセルしない限り継続されます",
    "マイページの [プランを管理] からいつでも解約できます",
  ],
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
  const monthlyCtaLabel = monthly?.hasFreeTrial ? "14日間無料ではじめる" : "月額プランで始める"
  const yearlyCtaLabel = yearly?.hasFreeTrial ? "14日間無料ではじめる" : "年額プランで始める"

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
        <h2 className="text-lg font-semibold text-gray-900 mb-1">プランのアップグレード</h2>
        <p className="text-sm text-gray-500 mb-4">
          有料デッキ・クイズ・辞書が使い放題。いつでも解約できます。
        </p>

        {offeringError ? (
          <div className="text-sm text-gray-500 mb-4">
            プラン情報の取得に失敗しました。しばらくしてからもう一度お試しください。
          </div>
        ) : (
          <>
            {/* 年額プラン (枠を強調) */}
            <div className="relative border border-line rounded-xl p-4 mb-2">
              <span className="absolute -top-2 right-3 inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold text-white bg-gradient-to-r from-amber-400 via-pink-500 to-fuchsia-500 shadow-sm">
                おすすめ
              </span>
              <div className="flex items-baseline justify-between mb-1">
                <span className="font-semibold text-gray-900 text-sm">年額プラン</span>
                <div>
                  <span className="text-xl font-bold text-gray-900">
                    {loading ? "…" : yearly?.priceString ?? ""}
                  </span>
                  <span className="text-xs text-gray-500"> / 年</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs mb-3">
                {yearly?.monthlyEquivalent && (
                  <span className="text-gray-600">月あたり{yearly.monthlyEquivalent}</span>
                )}
                {yearly?.savings && (
                  <span className="inline-flex items-center h-5 px-2 rounded-full font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm">
                    年{yearly.savings}お得
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
                {purchasingPlan === "yearly" ? "処理中..." : yearlyCtaLabel}
              </Button>
            </div>

            {/* 月額プラン */}
            <div className="border border-line rounded-xl p-4 mb-4">
              <div className="flex items-baseline justify-between mb-3">
                <span className="font-semibold text-gray-900 text-sm">月額プラン</span>
                <div>
                  <span className="text-xl font-bold text-gray-900">
                    {loading ? "…" : monthly?.priceString ?? ""}
                  </span>
                  <span className="text-xs text-gray-500"> / 月</span>
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
                {purchasingPlan === "monthly" ? "処理中..." : monthlyCtaLabel}
              </Button>
            </div>

            {/* 特典リスト */}
            <ul className="text-sm text-gray-700 space-y-2 mb-4 px-1">
              <li>
                <span className="font-medium">
                  ✓ 有料デッキ
                  {paidDecks ? `${paidDecks.count}本(${paidDecks.totalWords.toLocaleString()}語)` : "…"}
                  が使い放題
                </span>
                {paidDecks && paidDecks.displayNames.length > 0 && (
                  <span className="block pl-4 text-xs text-gray-500 mt-0.5">
                    {paidDecks.displayNames.join("、")}
                  </span>
                )}
              </li>
              <li className="font-medium">
                ✓ 辞書で調べた単語を無制限に保存
                <span className="block pl-4 text-xs text-gray-500 mt-0.5 font-normal">
                  無料プランは{FREE_PLAN_LIMIT}件まで
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
                {isRestoring ? "復元中..." : "購入を復元"}
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
                自動更新について
                {autoRenewOpen ? <HiChevronUp className="size-4" /> : <HiChevronDown className="size-4" />}
              </button>
              {autoRenewOpen && (
                <div className="text-[11px] text-gray-500 leading-relaxed space-y-2 pt-2">
                  <p>
                    選択したプランで自動的に課金が
                    {monthly?.hasFreeTrial || yearly?.hasFreeTrial ? "開始されます" : "継続されます"}。
                    <br />■ 月額プラン {monthly?.priceString ?? ""} / 月
                    {monthly?.hasFreeTrial && "（14日間無料後）"}
                    <br />■ 年額プラン {yearly?.priceString ?? ""} / 年
                    {yearly?.hasFreeTrial && "（14日間無料後）"}
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {BILLING_LINES[platform].map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setOpenDoc("terms")} className="underline">
                      利用規約
                    </button>
                    <button type="button" onClick={() => setOpenDoc("privacy")} className="underline">
                      プライバシーポリシー
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <Button onClick={onClose} variant="secondary" size="md" radius="lg" fullWidth>
          閉じる
        </Button>
      </div>

      <ModalShell
        open={openDoc !== null}
        onClose={() => setOpenDoc(null)}
        headerRight={
          <button
            type="button"
            onClick={() => setOpenDoc(null)}
            className="p-2 -mr-1 rounded-full hover:bg-gray-100 text-muted"
            aria-label="閉じる"
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
