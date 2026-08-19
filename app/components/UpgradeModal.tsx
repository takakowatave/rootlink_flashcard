"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { FREE_PLAN_LIMIT } from "@/lib/supabaseApi"
import { isNativePlatform } from "@/lib/isNativePlatform"
import { ensureRevenueCatConfigured, purchaseNativePlan } from "@/lib/revenuecat"
import Button from "@/components/Button"

const API_BASE =
  process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ??
  "https://rootlink-server-v2-774622345521.asia-northeast1.run.app"

type Props = {
  onClose: () => void
  reason?: "limit" | "upgrade"
}

export default function UpgradeModal({ onClose, reason = "limit" }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly")

  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      if (isNativePlatform()) {
        await ensureRevenueCatConfigured(session.user.id).catch(() => {})
        const result = await purchaseNativePlan(selectedPlan === "monthly" ? "monthly" : "yearly")
        if (result.ok) {
          onClose()
        } else if (!result.cancelled) {
          console.error("NATIVE PURCHASE FAILED:", result.error)
        }
        return
      }

      const res = await fetch(`${API_BASE}/stripe/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan: selectedPlan, origin: window.location.origin, locale: "ja" }),
      })

      const data = await res.json()
      if (data.ok && data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("CHECKOUT FAILED:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {reason === "limit" ? "保存上限に達しました" : "プレミアムプラン"}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {reason === "limit"
            ? `無料プランでは ${FREE_PLAN_LIMIT} 件まで保存できます。プレミアムにアップグレードすると無制限に保存できます。`
            : "プレミアムプランで単語保存・復習を無制限にご利用いただけます。"}
        </p>

        {/* プラン選択 */}
        <div className="space-y-2 mb-4">
          <button
            className={`relative w-full border rounded-xl p-4 text-left transition-colors ${
              selectedPlan === "yearly"
                ? "border-primary bg-primary-subtle"
                : "border-line hover:border-muted"
            }`}
            onClick={() => setSelectedPlan("yearly")}
          >
            <span className="absolute -top-2 right-3 inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold text-white bg-gradient-to-r from-amber-400 via-pink-500 to-fuchsia-500 shadow-sm">
              おすすめ
            </span>
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-semibold text-gray-900 text-sm">年額プラン</span>
              <div>
                <span className="text-xl font-bold text-gray-900">¥4,800</span>
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
            className={`w-full border rounded-xl p-4 text-left transition-colors ${
              selectedPlan === "monthly"
                ? "border-primary bg-primary-subtle"
                : "border-line hover:border-muted"
            }`}
            onClick={() => setSelectedPlan("monthly")}
          >
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-gray-900 text-sm">月額プラン</span>
              <div>
                <span className="text-xl font-bold text-gray-900">¥500</span>
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
          onClick={handleUpgrade}
          disabled={isLoading}
          variant="primary"
          size="md"
          radius="lg"
          fullWidth
          className="mb-2"
        >
          {isLoading ? "処理中..." : "アップグレードする"}
        </Button>
        <Button onClick={onClose} variant="tertiary" size="md" fullWidth className="text-gray-400 hover:bg-transparent hover:text-gray-600">
          あとで
        </Button>
      </div>
    </div>
  )
}
