"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { HiX } from "react-icons/hi"
import Button from "@/components/Button"
import ModalShell from "@/components/ModalShell"
import TermsContent from "@/components/TermsContent"
import PrivacyContent from "@/components/PrivacyContent"
import type { PaywallVariant } from "@/lib/paywall"
import {
  getPaywallOffering,
  hasAnyPurchaseHistory,
  purchaseNativePlan,
  restoreNativePurchases,
  type PaywallPlanInfo,
} from "@/lib/revenuecat"

type LegalDoc = "terms" | "privacy" | null

type Props = {
  variant: Exclude<PaywallVariant, 'none'>
  onClose: () => void
}

const EMPTY_PLAN: PaywallPlanInfo = {
  priceString: null,
  price: null,
  currencyCode: null,
  hasFreeTrial: false,
}

export default function NativePaywall({ variant, onClose }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly')
  const [monthly, setMonthly] = useState<PaywallPlanInfo>(EMPTY_PLAN)
  const [yearly, setYearly] = useState<PaywallPlanInfo>(EMPTY_PLAN)
  const [loading, setLoading] = useState(true)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [offeringError, setOfferingError] = useState(false)
  const [openDoc, setOpenDoc] = useState<LegalDoc>(null)
  // 過去に購入履歴のあるユーザーだけ「購入を復元」を表示する。
  // 履歴ゼロのユーザーには押しても意味が無いので UI からも消す。
  const [showRestore, setShowRestore] = useState(false)

  useEffect(() => {
    let cancelled = false
    getPaywallOffering()
      .then((summary) => {
        if (cancelled) return
        if (!summary) {
          setOfferingError(true)
          return
        }
        setMonthly(summary.monthly)
        setYearly(summary.yearly)
      })
      .catch(() => {
        if (!cancelled) setOfferingError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    hasAnyPurchaseHistory().then((v) => {
      if (!cancelled) setShowRestore(v)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handlePurchase = async () => {
    setIsPurchasing(true)
    try {
      const result = await purchaseNativePlan(selectedPlan)
      if (result.cancelled) return  // ユーザーが閉じただけ → 無言で戻す
      if (!result.ok) {
        toast.error('購入に失敗しました')
        return
      }
      toast.success('プレミアム開始しました')
      // 既知のトレードオフ: Cloud Run webhook が subscriptions を更新する前に reload すると、
      // getUserPlan がまだ free を返してロックが解けないことがある。500ms では webhook 到達が
      // 間に合わない場合もあり得る。恒久対応は Purchases.getCustomerInfo() の entitlement で
      // webhook を待たず判定する optimistic UI だが、それは DeckClient 変更が必要で T4 スコープ外。
      // 実運用で問題が出たら差し替える。
      await new Promise((r) => setTimeout(r, 500))
      window.location.reload()
    } finally {
      setIsPurchasing(false)
    }
  }

  const handleRestore = async () => {
    setIsRestoring(true)
    try {
      const result = await restoreNativePurchases()
      if (!result.ok) {
        toast.error('復元に失敗しました')
        return
      }
      if (!result.hasActiveEntitlement) {
        toast.error('復元できる購入が見つかりませんでした')
        return
      }
      toast.success('購入を復元しました')
      await new Promise((r) => setTimeout(r, 500))
      window.location.reload()
    } finally {
      setIsRestoring(false)
    }
  }

  // 表示価格。RevenueCat 未取得時は「¥○○」の default にフォールバック。
  const yearlyPrice = yearly.priceString ?? '¥4,800'
  const monthlyPrice = monthly.priceString ?? '¥500'

  // 選択中プランのトライアル有無 (RevenueCat の商品情報で判定)。
  // 月額は既存動作を維持するため、variant==='trial' の場合もトライアル扱いにする。
  const selectedPlanInfo = selectedPlan === 'yearly' ? yearly : monthly
  const monthlyHasTrial = monthly.hasFreeTrial || variant === 'trial'
  const yearlyHasTrial = yearly.hasFreeTrial
  const selectedHasTrial = selectedPlan === 'yearly' ? yearlyHasTrial : monthlyHasTrial

  // CTA: 月額はトライアルあれば「14日間無料で試す」、無ければ「月額プランで始める」。
  //      年額はトライアルあれば「14日間無料で試す」、無ければ「年額プランで始める」。
  const ctaLabel =
    selectedPlan === 'monthly'
      ? monthlyHasTrial
        ? '14日間無料で試す'
        : '月額プランで始める'
      : yearlyHasTrial
        ? '14日間無料で試す'
        : '年額プランで始める'

  // ボタン下の 1 行サマリ。トライアル有無・年/月で 4 パターン。
  const planLabel = selectedPlan === 'yearly' ? '年額' : '月額'
  const priceForSummary = selectedPlanInfo.priceString ??
    (selectedPlan === 'yearly' ? yearlyPrice : monthlyPrice)
  const ctaSummary = selectedHasTrial
    ? `14日間無料、その後 ${planLabel}${priceForSummary}。いつでも解約できます`
    : `${planLabel}${priceForSummary}。いつでも解約できます`

  // 年額の「お得額」計算。月額 × 12 - 年額。
  // どちらかの price が取れないときは表示しない。
  const yearlySavings =
    monthly.price !== null && yearly.price !== null
      ? Math.max(0, Math.round(monthly.price * 12 - yearly.price))
      : null
  const yearlyMonthlyEquivalent =
    yearly.price !== null ? Math.round(yearly.price / 12) : null
  const currencySymbol = yearly.currencyCode === 'JPY' || !yearly.currencyCode ? '¥' : ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 overflow-y-auto py-8"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {selectedHasTrial ? '14日間無料で試す' : 'プレミアムプラン'}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {selectedHasTrial
            ? '有料デッキとクイズが14日間無料。いつでも解約できます。'
            : '有料デッキとクイズをご利用いただけます。'}
        </p>

        {offeringError ? (
          <div className="text-sm text-gray-500 mb-4">
            プラン情報の取得に失敗しました。しばらくしてからもう一度お試しください。
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              <button
                type="button"
                className={`relative w-full border rounded-xl p-4 text-left transition-colors ${
                  selectedPlan === 'yearly'
                    ? 'border-primary bg-primary-subtle'
                    : 'border-line hover:border-muted'
                }`}
                onClick={() => setSelectedPlan('yearly')}
              >
                <span className="absolute -top-2 right-3 inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold text-white bg-gradient-to-r from-amber-400 via-pink-500 to-fuchsia-500 shadow-sm">
                  おすすめ
                </span>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="font-semibold text-gray-900 text-sm">年額プラン</span>
                  <div>
                    <span className="text-xl font-bold text-gray-900">
                      {loading ? '…' : yearlyPrice}
                    </span>
                    <span className="text-xs text-gray-500"> / 年</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-600">
                    月あたり{currencySymbol}{yearlyMonthlyEquivalent ?? 400}
                  </span>
                  {yearlySavings !== null && yearlySavings > 0 && (
                    <span className="inline-flex items-center h-5 px-2 rounded-full font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm">
                      年{currencySymbol}{yearlySavings.toLocaleString()}お得
                    </span>
                  )}
                </div>
              </button>

              <button
                type="button"
                className={`w-full border rounded-xl p-4 text-left transition-colors ${
                  selectedPlan === 'monthly'
                    ? 'border-primary bg-primary-subtle'
                    : 'border-line hover:border-muted'
                }`}
                onClick={() => setSelectedPlan('monthly')}
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-gray-900 text-sm">月額プラン</span>
                  <div>
                    <span className="text-xl font-bold text-gray-900">
                      {loading ? '…' : monthlyPrice}
                    </span>
                    <span className="text-xs text-gray-500"> / 月</span>
                  </div>
                </div>
              </button>
            </div>

            <ul className="text-sm text-gray-700 space-y-2 mb-4 px-1">
              <li>
                <span className="font-medium">✓ 有料デッキ10本(2,607語)が使い放題</span>
                <span className="block pl-4 text-xs text-gray-500 mt-0.5">
                  TOEIC 860+ / 990+、IELTS、TOEFL、英検 準1級・1級
                </span>
              </li>
              <li className="font-medium">✓ 単語保存 無制限</li>
            </ul>

            <Button
              onClick={handlePurchase}
              disabled={isPurchasing || loading}
              variant="primary"
              size="md"
              radius="lg"
              fullWidth
            >
              {isPurchasing ? '処理中...' : ctaLabel}
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2 mb-3">{ctaSummary}</p>

            {showRestore && (
              <button
                type="button"
                onClick={handleRestore}
                disabled={isRestoring}
                className="w-full text-xs text-gray-500 underline py-1 mb-4 disabled:opacity-40"
              >
                {isRestoring ? '復元中...' : '購入を復元'}
              </button>
            )}

            <div className="border-t border-line pt-3 text-[11px] text-gray-500 leading-relaxed space-y-2">
              <p className="font-semibold text-gray-600">自動更新について</p>
              <p>
                選択したプランで自動的に課金が
                {selectedHasTrial ? '開始されます' : '継続されます'}。
                <br />■ 月額プラン {monthlyPrice} / 月
                {monthlyHasTrial && '（14日間無料後）'}
                <br />■ 年額プラン {yearlyPrice} / 年
                {yearlyHasTrial && '（14日間無料後）'}
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>支払いは購入確定時に Apple ID / Google アカウントに請求されます</li>
                <li>自動更新は現在の期間終了の24時間前までにキャンセルしない限り継続されます</li>
                <li>購入後は App Store / Google Play の設定から自動更新を管理・解約できます</li>
              </ul>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpenDoc("terms")}
                  className="underline"
                >
                  利用規約
                </button>
                <button
                  type="button"
                  onClick={() => setOpenDoc("privacy")}
                  className="underline"
                >
                  プライバシーポリシー
                </button>
              </div>
            </div>
          </>
        )}

        <Button
          onClick={onClose}
          variant="tertiary"
          size="md"
          fullWidth
          className="text-gray-400 hover:bg-transparent hover:text-gray-600 mt-3"
        >
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
