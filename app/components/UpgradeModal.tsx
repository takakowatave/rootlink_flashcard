"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { isNativePlatform } from "@/lib/isNativePlatform"
import PaywallContent from "@/components/PaywallContent"
import { getStripePaywallDisplay } from "@/lib/stripePricing"

const API_BASE =
  process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ??
  "https://rootlink-server-v2-774622345521.asia-northeast1.run.app"

// reason は呼び出し元 API 互換のため残す。今の Paywall は 3 面共通の見た目に統一しており、
// タイトル/説明文は理由で分岐しないため未使用。将来のバリアント切り替え用に予約。
type Props = {
  onClose: () => void
  reason?: "limit" | "upgrade"
}

export default function UpgradeModal({ onClose }: Props) {
  const [purchasingPlan, setPurchasingPlan] = useState<"monthly" | "yearly" | null>(null)

  // UpgradeModal は Web (Stripe) 専用。native では NativePaywall に振り分ける設計 (2026-09-14 方針)。
  // 呼び出し元 (DeckClient / WordPageClient / EditProfileModal) は既に native 判定して
  // NativePaywall に流しているが、ここの return null は最終防波堤として保持する。
  // 削除すると呼び出し漏れ・将来の refactor で native から Stripe Checkout に到達する
  // cloaking 事故が起きうる (Apple/Google 審査 NG)。コスト 1 行対 リスク大なので残す。
  // 詳細: Notion「課金仕様」§3-2 の鉄則
  if (isNativePlatform()) return null

  const handleUpgrade = async (plan: "monthly" | "yearly") => {
    // 通常は上の isNativePlatform() return null で到達しないが、
    // native から Stripe Checkout に到達する cloaking 事故を防ぐ最終防波堤。
    if (isNativePlatform()) return
    setPurchasingPlan(plan)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`${API_BASE}/stripe/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan, origin: window.location.origin, locale: "ja" }),
      })

      const data = await res.json()
      if (data.ok && data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("CHECKOUT FAILED:", error)
    } finally {
      setPurchasingPlan(null)
    }
  }

  const display = getStripePaywallDisplay()

  return (
    <PaywallContent
      platform="web"
      loading={false}
      offeringError={false}
      monthly={display.monthly}
      yearly={display.yearly}
      purchasingPlan={purchasingPlan}
      onPurchase={handleUpgrade}
      onClose={onClose}
    />
  )
}
