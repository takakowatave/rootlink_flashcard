"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import PaywallContent, { type PaywallPlatform, type PaywallPlanDisplay } from "@/components/PaywallContent"
import type { PaywallVariant } from "@/lib/paywall"
import {
  getPaywallOffering,
  hasAnyPurchaseHistory,
  purchaseNativePlan,
  restoreNativePurchases,
  type PaywallPlanInfo,
} from "@/lib/revenuecat"

type Props = {
  variant: Exclude<PaywallVariant, "none">
  onClose: () => void
}

const EMPTY_PLAN: PaywallPlanInfo = {
  priceString: null,
  price: null,
  currencyCode: null,
  hasFreeTrial: false,
}

// Capacitor.getPlatform() の値。web は import 元コンポーネントで既に別 (UpgradeModal) に振り分け済み。
function detectNativePlatform(): PaywallPlatform {
  if (typeof window === "undefined") return "ios"
  const cap = (window as { Capacitor?: { getPlatform?: () => string } }).Capacitor
  const p = typeof cap?.getPlatform === "function" ? cap.getPlatform() : null
  return p === "android" ? "android" : "ios"
}

export default function NativePaywall({ variant, onClose }: Props) {
  const [monthly, setMonthly] = useState<PaywallPlanInfo>(EMPTY_PLAN)
  const [yearly, setYearly] = useState<PaywallPlanInfo>(EMPTY_PLAN)
  const [loading, setLoading] = useState(true)
  // どのカードのボタンが処理中か。両方同時に押せないよう相互 disable する。
  const [purchasingPlan, setPurchasingPlan] = useState<"monthly" | "yearly" | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const [offeringError, setOfferingError] = useState(false)
  // 過去に購入履歴のあるユーザーだけ「購入を復元」を表示する。
  // 履歴ゼロのユーザーには押しても意味が無いので UI からも消す。
  const [showRestore, setShowRestore] = useState(false)

  const platform = useMemo<PaywallPlatform>(() => detectNativePlatform(), [])

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

  const handlePurchase = async (plan: "monthly" | "yearly") => {
    setPurchasingPlan(plan)
    try {
      const result = await purchaseNativePlan(plan)
      if (result.cancelled) return // ユーザーが閉じただけ → 無言で戻す
      if (!result.ok) {
        toast.error("購入に失敗しました")
        return
      }
      toast.success("プレミアム開始しました")
      // 既知のトレードオフ: Cloud Run webhook が subscriptions を更新する前に reload すると、
      // getUserPlan がまだ free を返してロックが解けないことがある。500ms では webhook 到達が
      // 間に合わない場合もあり得る。恒久対応は Purchases.getCustomerInfo() の entitlement で
      // webhook を待たず判定する optimistic UI だが、それは DeckClient 変更が必要で T4 スコープ外。
      // 実運用で問題が出たら差し替える。
      await new Promise((r) => setTimeout(r, 500))
      window.location.reload()
    } finally {
      setPurchasingPlan(null)
    }
  }

  const handleRestore = async () => {
    setIsRestoring(true)
    try {
      const result = await restoreNativePurchases()
      if (!result.ok) {
        toast.error("復元に失敗しました")
        return
      }
      if (!result.hasActiveEntitlement) {
        toast.error("復元できる購入が見つかりませんでした")
        return
      }
      toast.success("購入を復元しました")
      await new Promise((r) => setTimeout(r, 500))
      window.location.reload()
    } finally {
      setIsRestoring(false)
    }
  }

  // 表示価格。RevenueCat 未取得時は default にフォールバック。
  const yearlyPriceString = yearly.priceString ?? "¥4,800"
  const monthlyPriceString = monthly.priceString ?? "¥500"

  // トライアル有無 (RevenueCat の商品情報で判定)。
  // 月額は既存動作を維持するため、variant==='trial' の場合もトライアル扱いにする。
  const monthlyHasTrial = monthly.hasFreeTrial || variant === "trial"
  const yearlyHasTrial = yearly.hasFreeTrial

  // 年額の「月あたり」「お得額」計算。RevenueCat の price から算出。
  // どちらかの price が取れないときは null にして非表示。
  const currencySymbol = yearly.currencyCode === "JPY" || !yearly.currencyCode ? "¥" : ""
  const yearlyMonthlyEquivalent =
    yearly.price !== null ? `${currencySymbol}${Math.round(yearly.price / 12).toLocaleString()}` : null
  const yearlySavingsValue =
    monthly.price !== null && yearly.price !== null
      ? Math.max(0, Math.round(monthly.price * 12 - yearly.price))
      : null
  const yearlySavings =
    yearlySavingsValue !== null && yearlySavingsValue > 0
      ? `${currencySymbol}${yearlySavingsValue.toLocaleString()}`
      : null

  const monthlyDisplay: PaywallPlanDisplay = {
    priceString: monthlyPriceString,
    hasFreeTrial: monthlyHasTrial,
  }
  const yearlyDisplay: PaywallPlanDisplay = {
    priceString: yearlyPriceString,
    hasFreeTrial: yearlyHasTrial,
    monthlyEquivalent: yearlyMonthlyEquivalent,
    savings: yearlySavings,
  }

  return (
    <PaywallContent
      platform={platform}
      loading={loading}
      offeringError={offeringError}
      monthly={monthlyDisplay}
      yearly={yearlyDisplay}
      purchasingPlan={purchasingPlan}
      onPurchase={handlePurchase}
      onClose={onClose}
      showRestore={showRestore}
      isRestoring={isRestoring}
      onRestore={handleRestore}
    />
  )
}
