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
  pricePerMonthString: null,
  pricePerMonth: null,
  pricePerYear: null,
  hasFreeTrial: false,
}

// store の currencyCode に合わせて金額を整形する。
// - JPY: 整数 (小数 0 桁)
// - USD 等: 通貨のデフォルト桁数 (Intl が処理)
// currencyCode が取れない場合は null を返して非表示にする (通貨記号のない裸の数字は出さない)。
function formatCurrency(value: number, currencyCode: string | null): string | null {
  if (!currencyCode) return null
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'symbol',
      maximumFractionDigits: currencyCode === 'JPY' ? 0 : undefined,
    }).format(value)
  } catch {
    return null
  }
}

// Capacitor.getPlatform() の値。web は import 元コンポーネントで既に別 (UpgradeModal) に振り分け済み。
function detectNativePlatform(): PaywallPlatform {
  if (typeof window === "undefined") return "ios"
  const cap = (window as { Capacitor?: { getPlatform?: () => string } }).Capacitor
  const p = typeof cap?.getPlatform === "function" ? cap.getPlatform() : null
  return p === "android" ? "android" : "ios"
}

// 本番 App Store Connect の JPY 価格。store 側と乖離しないよう、価格改定時はここも更新する。
const JPY_MONTHLY_STRING = "¥500"
const JPY_YEARLY_STRING = "¥4,800"
const JPY_MONTHLY = 500
const JPY_YEARLY = 4800

// JP ストアでは必ず JPY で表示するためのフォールバック用プラン情報。
// Sandbox で RC が USD 等を返してきたときに強制的にこれに差し替えて、
// 円で整合する price / pricePerMonth / pricePerYear を渡す。
const JPY_FALLBACK_MONTHLY: PaywallPlanInfo = {
  priceString: JPY_MONTHLY_STRING,
  price: JPY_MONTHLY,
  currencyCode: "JPY",
  pricePerMonthString: JPY_MONTHLY_STRING,
  pricePerMonth: JPY_MONTHLY,
  pricePerYear: JPY_MONTHLY * 12,
  hasFreeTrial: false,
}
const JPY_FALLBACK_YEARLY: PaywallPlanInfo = {
  priceString: JPY_YEARLY_STRING,
  price: JPY_YEARLY,
  currencyCode: "JPY",
  pricePerMonthString: `¥${Math.round(JPY_YEARLY / 12).toLocaleString()}`,
  pricePerMonth: Math.round(JPY_YEARLY / 12),
  pricePerYear: JPY_YEARLY,
  hasFreeTrial: false,
}

// RootLink はいまのところ日本マーケット単一。App Store Connect / Google Play で
// 実際に販売しているのも JPY (¥500 / ¥4,800) だけ。Sandbox / TestFlight で
// RC が USD 等の base 通貨を返すケースが実機で観測されているので、
// currencyCode が JPY 以外のときは storefrontCountry に関係なく問答無用で
// JPY フォールバックへ差し替える。US 展開等をやる時にここを再検討する。
function shouldForceJpy(currencyCode: string | null): boolean {
  if (!currencyCode) return false
  return currencyCode.toUpperCase() !== "JPY"
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
        // RC の currencyCode が JPY 以外なら、Sandbox / TestFlight のキャッシュ不整合
        // とみなして問答無用で JPY フォールバックに差し替える。実 Apple 購入シートは
        // 常に JPY (実際に販売しているのが JPY のみのため) で表示されるので、UI と
        // ストアの齟齬をここで潰す。storefrontCountry は Sandbox で null を返すことが
        // あるため判定条件から外す (RootLink は JP マーケット単一なので副作用なし)。
        const forceMonthlyJpy = shouldForceJpy(summary.monthly.currencyCode)
        const forceYearlyJpy = shouldForceJpy(summary.yearly.currencyCode)
        setMonthly(forceMonthlyJpy
          ? { ...JPY_FALLBACK_MONTHLY, hasFreeTrial: summary.monthly.hasFreeTrial }
          : summary.monthly)
        setYearly(forceYearlyJpy
          ? { ...JPY_FALLBACK_YEARLY, hasFreeTrial: summary.yearly.hasFreeTrial }
          : summary.yearly)
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

  // 表示価格。RevenueCat 未取得時は default にフォールバック (どちらも JPY)。
  const yearlyPriceString = yearly.priceString ?? JPY_YEARLY_STRING
  const monthlyPriceString = monthly.priceString ?? JPY_MONTHLY_STRING

  // トライアル有無 (RevenueCat の商品情報で判定)。
  // 月額は既存動作を維持するため、variant==='trial' の場合もトライアル扱いにする。
  const monthlyHasTrial = monthly.hasFreeTrial || variant === "trial"
  const yearlyHasTrial = yearly.hasFreeTrial

  // 年額の「月あたり」:
  //   - RC SDK が用意している pricePerMonthString (store 通貨で整形済み) をそのまま使う
  //   - 未提供の store バージョンなら pricePerMonth + currencyCode で自前整形
  //   - どちらも無ければ null (非表示)。通貨記号なしの裸の数字は絶対に出さない
  const yearlyMonthlyEquivalent =
    yearly.pricePerMonthString ??
    (yearly.pricePerMonth !== null ? formatCurrency(yearly.pricePerMonth, yearly.currencyCode) : null) ??
    (yearly.price !== null ? formatCurrency(yearly.price / 12, yearly.currencyCode) : null)

  // 年額の「お得額」: monthly を 12 か月払ったときとの差額。
  //   - float の精度で 2.99 * 12 = 35.879999... のようなズレが出ないよう、
  //     一旦 cents (整数) に上げて計算してから通貨単位に戻す
  //   - Math.round() で総額を整数に丸めない (currency default 桁数で Intl が整形)
  //   - JPY は元から整数なので x100 → /100 でも損失なし
  //   - 通貨コードが取れないケースは非表示 (裸の数字は出さない)
  const monthlyCents = monthly.price !== null ? Math.round(monthly.price * 100) : null
  const yearlyCents = yearly.price !== null ? Math.round(yearly.price * 100) : null
  const yearlySavingsValue =
    monthlyCents !== null && yearlyCents !== null
      ? Math.max(0, (monthlyCents * 12 - yearlyCents) / 100)
      : null
  const yearlySavings =
    yearlySavingsValue !== null && yearlySavingsValue > 0
      ? formatCurrency(yearlySavingsValue, yearly.currencyCode)
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
