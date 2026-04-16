"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { FREE_PLAN_LIMIT } from "@/lib/supabaseApi"

const API_BASE =
  process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ??
  "https://rootlink-server-v2-774622345521.asia-northeast1.run.app"

type Props = {
  onClose: () => void
}

export default function UpgradeModal({ onClose }: Props) {
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
        body: JSON.stringify({ plan: selectedPlan, origin: window.location.origin }),
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
          保存上限に達しました
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          無料プランでは {FREE_PLAN_LIMIT} 件まで保存できます。
          プレミアムにアップグレードすると無制限に保存できます。
        </p>

        {/* プラン選択 */}
        <div className="space-y-2 mb-4">
          <button
            className={`w-full border rounded-xl p-4 text-left transition-colors ${
              selectedPlan === "monthly"
                ? "border-gray-900 bg-gray-50"
                : "border-gray-200 hover:border-gray-300"
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
                ? "border-gray-900 bg-gray-50"
                : "border-gray-200 hover:border-gray-300"
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

        <button
          className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors mb-2 disabled:opacity-50"
          onClick={handleUpgrade}
          disabled={isLoading}
        >
          {isLoading ? "処理中..." : "アップグレードする"}
        </button>
        <button
          className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          onClick={onClose}
        >
          あとで
        </button>
      </div>
    </div>
  )
}
