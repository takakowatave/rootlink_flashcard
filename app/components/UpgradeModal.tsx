"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { FREE_PLAN_LIMIT } from "@/lib/supabaseApi"
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
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly")

  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`${API_BASE}/stripe/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan: selectedPlan, origin: window.location.origin, locale: navigator.language.startsWith("ja") ? "ja" : "auto" }),
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
            : "プレミアムプランで単語保存・クイズを無制限にご利用いただけます。"}
        </p>

        {/* プラン選択 */}
        <div className="space-y-2 mb-4">
          <button
            className={`w-full border rounded-xl p-4 text-left transition-colors ${
              selectedPlan === "monthly"
                ? "border-primary bg-primary-subtle"
                : "border-line hover:border-muted"
            }`}
            onClick={() => setSelectedPlan("monthly")}
          >
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-semibold text-gray-900 text-sm">月額プラン</span>
              <div>
                <span className="text-xs line-through text-gray-400 mr-1">¥800</span>
                <span className="text-xl font-bold text-gray-900">¥500</span>
                <span className="text-xs text-gray-500"> / 月</span>
              </div>
            </div>
            <p className="text-xs text-amber-600 font-medium">早期割引 〜 2026年8月末</p>
          </button>

          <button
            className={`w-full border rounded-xl p-4 text-left transition-colors ${
              selectedPlan === "yearly"
                ? "border-primary bg-primary-subtle"
                : "border-line hover:border-muted"
            }`}
            onClick={() => setSelectedPlan("yearly")}
          >
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-semibold text-gray-900 text-sm">年額プラン</span>
              <div>
                <span className="text-xl font-bold text-gray-900">¥4,800</span>
                <span className="text-xs text-gray-500"> / 年</span>
              </div>
            </div>
            <p className="text-xs text-green-600 font-medium">¥400/月 — 2ヶ月分お得</p>
          </button>
        </div>

        <ul className="text-sm text-gray-600 space-y-1 mb-4 px-1">
          <li>✓ 単語保存 無制限</li>
          <li>✓ クイズ 無制限</li>
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
