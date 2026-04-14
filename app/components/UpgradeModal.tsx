"use client"

import { FREE_PLAN_LIMIT } from "@/lib/supabaseApi"

type Props = {
  onClose: () => void
}

export default function UpgradeModal({ onClose }: Props) {
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

        <div className="border border-gray-100 rounded-xl p-4 mb-4 bg-gray-50">
          <div className="flex items-baseline justify-between mb-1">
            <span className="font-semibold text-gray-900">Premium</span>
            <div className="text-right">
              <span className="text-xs line-through text-gray-400 mr-1">¥800</span>
              <span className="text-xl font-bold text-gray-900">¥500</span>
              <span className="text-xs text-gray-500"> / 月</span>
            </div>
          </div>
          <p className="text-xs text-amber-600 font-medium mb-3">
            早期割引 〜 2026年8月末
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✓ 単語保存 無制限</li>
            <li>✓ クイズ 無制限</li>
          </ul>
        </div>

        <div className="text-center text-xs text-gray-400 mb-4">
          年額プラン ¥4,800（¥400/月）もあります
        </div>

        <button
          className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors mb-2"
          onClick={() => {
            // TODO: Stripeアカウント作成後に課金導線を追加
          }}
        >
          アップグレードする
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
