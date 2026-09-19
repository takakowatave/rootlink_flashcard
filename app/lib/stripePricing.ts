// Web (Stripe) の価格情報。Stripe Checkout は backend (rootlink_server) の product に紐付いている。
// フロントには実 API がないので、ここを唯一の source of truth にする。
// backend の Stripe product / price を変更したら必ずここも同期すること。
// Notion「課金仕様」§3 参照: 月額 ¥500 / 年額 ¥4,800、Web はトライアルなし。

export type StripePlanKey = "monthly" | "yearly"

export type StripePlanPricing = {
  amount: number
  currencyCode: "JPY"
  hasFreeTrial: boolean
}

export const STRIPE_PRICING: Record<StripePlanKey, StripePlanPricing> = {
  monthly: {
    amount: 500,
    currencyCode: "JPY",
    hasFreeTrial: false,
  },
  yearly: {
    amount: 4800,
    currencyCode: "JPY",
    hasFreeTrial: false,
  },
}

function formatJpy(n: number): string {
  return `¥${n.toLocaleString("ja-JP")}`
}

// PaywallContent に渡す表示情報。native の RevenueCat 経由と同じ shape に整える。
export function getStripePaywallDisplay() {
  const monthly = STRIPE_PRICING.monthly
  const yearly = STRIPE_PRICING.yearly

  const yearlyMonthlyEquivalent = formatJpy(Math.round(yearly.amount / 12))
  const savingsValue = Math.max(0, monthly.amount * 12 - yearly.amount)

  return {
    monthly: {
      priceString: formatJpy(monthly.amount),
      hasFreeTrial: monthly.hasFreeTrial,
    },
    yearly: {
      priceString: formatJpy(yearly.amount),
      hasFreeTrial: yearly.hasFreeTrial,
      monthlyEquivalent: yearlyMonthlyEquivalent,
      savings: savingsValue > 0 ? formatJpy(savingsValue) : null,
    },
  }
}
