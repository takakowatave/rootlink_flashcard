"use client"

import Button from "@/components/Button"
import type { PaywallVariant } from "@/lib/paywall"

type Props = {
  variant: Exclude<PaywallVariant, 'none'>
  onClose: () => void
}

// T3: シェルのみ。T4 で以下を差し込む:
// - 購入ボタン (purchaseNativePlan の呼び出し)
// - 「購入を復元」ボタン (Purchases.restorePurchases)
// - 利用規約・プライバシーポリシーリンク
// - 自動更新の説明文 (Apple/Google 審査要件)
// - 価格表示 (RevenueCat offerings から取得)
export default function NativePaywall({ variant, onClose }: Props) {
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
          {variant === 'trial' ? '14日間無料で試す' : 'プレミアムプラン'}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {variant === 'trial'
            ? '有料デッキとクイズが14日間無料。いつでも解約できます。'
            : '有料デッキとクイズをご利用いただけます。'}
        </p>

        <Button
          onClick={onClose}
          variant="tertiary"
          size="md"
          fullWidth
          className="text-gray-400 hover:bg-transparent hover:text-gray-600"
        >
          閉じる
        </Button>
      </div>
    </div>
  )
}
