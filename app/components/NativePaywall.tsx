"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import Button from "@/components/Button"
import type { PaywallVariant } from "@/lib/paywall"
import {
  getCurrentOffering,
  purchaseNativePlan,
  restoreNativePurchases,
} from "@/lib/revenuecat"

type Props = {
  variant: Exclude<PaywallVariant, 'none'>
  onClose: () => void
}

type Prices = {
  monthly: string | null
  yearly: string | null
}

export default function NativePaywall({ variant, onClose }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly')
  const [prices, setPrices] = useState<Prices>({ monthly: null, yearly: null })
  const [loading, setLoading] = useState(true)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [offeringError, setOfferingError] = useState(false)

  useEffect(() => {
    let cancelled = false
    getCurrentOffering()
      .then((offering) => {
        if (cancelled) return
        if (!offering) {
          setOfferingError(true)
          return
        }
        setPrices({
          monthly: offering.monthly?.product.priceString ?? null,
          yearly: offering.annual?.product.priceString ?? null,
        })
      })
      .catch(() => {
        if (!cancelled) setOfferingError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
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
      toast.success('購入を復元しました')
      await new Promise((r) => setTimeout(r, 500))
      window.location.reload()
    } finally {
      setIsRestoring(false)
    }
  }

  const isTrialVariant = variant === 'trial'
  const yearlyPrice = prices.yearly ?? '¥4,800'
  const monthlyPrice = prices.monthly ?? '¥500'

  const ctaLabel = isTrialVariant ? '14日間無料で試す' : 'アップグレードする'
  const selectedPriceString = selectedPlan === 'yearly' ? yearlyPrice : monthlyPrice
  const selectedPeriod = selectedPlan === 'yearly' ? '年' : '月'
  const ctaSummary = isTrialVariant
    ? `14日間無料、その後 ${selectedPriceString} / ${selectedPeriod}`
    : `${selectedPriceString} / ${selectedPeriod}`

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
          {isTrialVariant ? '14日間無料で試す' : 'プレミアムプラン'}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {isTrialVariant
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
                  <span className="text-gray-600">月あたり¥400</span>
                  <span className="inline-flex items-center h-5 px-2 rounded-full font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm">
                    年¥1,200お得
                  </span>
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

            <button
              type="button"
              onClick={handleRestore}
              disabled={isRestoring}
              className="w-full text-xs text-gray-500 underline py-1 mb-4 disabled:opacity-40"
            >
              {isRestoring ? '復元中...' : '購入を復元'}
            </button>

            <div className="border-t border-line pt-3 text-[11px] text-gray-500 leading-relaxed space-y-2">
              <p className="font-semibold text-gray-600">自動更新について</p>
              {isTrialVariant ? (
                <p>
                  14日間の無料トライアル後、選択したプランで自動的に課金が開始されます。
                  <br />■ 月額プラン ¥500 / 月（14日間無料後）
                  <br />■ 年額プラン ¥4,800 / 年（14日間無料後）
                </p>
              ) : (
                <p>
                  選択したプランで自動的に課金が継続されます。
                  <br />■ 月額プラン ¥500 / 月
                  <br />■ 年額プラン ¥4,800 / 年
                </p>
              )}
              <ul className="list-disc list-inside space-y-1">
                <li>支払いは購入確定時に Apple ID / Google アカウントに請求されます</li>
                <li>自動更新は現在の期間終了の24時間前までにキャンセルしない限り継続されます</li>
                <li>購入後は App Store / Google Play の設定から自動更新を管理・解約できます</li>
              </ul>
              <div className="flex gap-3 pt-1">
                <a
                  href="https://www.rootlink.app/terms"
                  target="_blank"
                  rel="noopener"
                  className="underline"
                >
                  利用規約
                </a>
                <a
                  href="https://www.rootlink.app/privacy"
                  target="_blank"
                  rel="noopener"
                  className="underline"
                >
                  プライバシーポリシー
                </a>
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
    </div>
  )
}
