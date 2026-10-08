'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabaseClient'
import { isNativePlatform } from '@/lib/isNativePlatform'
import { QUOTA_EXCEEDED_EVENT } from '@/lib/quotaExceeded'
import { decidePaywallVariant, type PaywallVariant } from '@/lib/paywall'
import UpgradeModal from '@/components/UpgradeModal'
import NativePaywall from '@/components/NativePaywall'

// /resolve が 429 QUOTA_EXCEEDED を返したときに、既存ペイウォールをモーダル表示する。
// Guideline 5.1.1(v) 対応で、無料枠（1日20語の新規検索）を超えたら premium を促す。
// 新規モーダルは作らず、Web = UpgradeModal / native = NativePaywall を流用する。
export default function QuotaExceededListener() {
  const [showWeb, setShowWeb] = useState(false)
  const [nativeVariant, setNativeVariant] = useState<Exclude<PaywallVariant, 'none'> | null>(null)

  useEffect(() => {
    const open = async () => {
      toast('無料枠の上限に達しました')
      if (isNativePlatform()) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const variant = await decidePaywallVariant(user.id)
        setNativeVariant(variant === 'none' ? null : variant)
      } else {
        setShowWeb(true)
      }
    }
    window.addEventListener(QUOTA_EXCEEDED_EVENT, open)
    return () => window.removeEventListener(QUOTA_EXCEEDED_EVENT, open)
  }, [])

  return (
    <>
      {showWeb && <UpgradeModal onClose={() => setShowWeb(false)} reason="limit" />}
      {nativeVariant && (
        <NativePaywall variant={nativeVariant} onClose={() => setNativeVariant(null)} />
      )}
    </>
  )
}
