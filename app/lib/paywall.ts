import { supabase } from './supabaseClient'

export type PaywallVariant = 'trial' | 'paid_only' | 'none'

// 呼び出し元は plan==='free' 判定済み前提。is_tester は getUserPlan が premium を返して
// isLocked=false になるため decidePaywallVariant には到達しない (再チェック不要)。
export async function decidePaywallVariant(userId: string): Promise<PaywallVariant> {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, trial_used')
    .eq('user_id', userId)
    .maybeSingle()

  // 二重ガード
  if (sub?.status === 'active' || sub?.status === 'trialing') return 'none'
  return sub?.trial_used === true ? 'paid_only' : 'trial'
}
