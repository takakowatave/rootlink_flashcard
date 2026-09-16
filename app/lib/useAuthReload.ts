'use client'

import { useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'

// マウント時 + SIGNED_IN / SIGNED_OUT の度に callback を再実行する共有フック。
//
// 元パターン (e9fcdd7 で修正した signup flow と同じ):
//   useEffect(() => { void load() }, [])
//   → getUser() の結果を1回だけ見て、後でログインしても再取得されず
//     「未ログインです」状態のまま画面が固まっていた。
//
// 使う側は callback を毎レンダー変えられる（内部で ref を差し替える）ので、
// useCallback を強制しない。ただしテキストロード状態などは呼び出し側で
// 制御する。SIGNED_OUT では userId=null で呼ばれるので、必要ならクリアする。

export type AuthReloadEvent = 'mount' | 'SIGNED_IN' | 'SIGNED_OUT'

type Callback = (
  userId: string | null,
  event: AuthReloadEvent,
) => void | Promise<void>

export function useAuthReload(callback: Callback): void {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    let cancelled = false

    const runWithUser = async (event: AuthReloadEvent) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      await callbackRef.current(user?.id ?? null, event)
    }

    void runWithUser('mount')

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (cancelled) return
      if (event === 'SIGNED_IN') {
        void runWithUser('SIGNED_IN')
      } else if (event === 'SIGNED_OUT') {
        // getUser を叩き直しても null なので、そのまま null で通知する
        void callbackRef.current(null, 'SIGNED_OUT')
      }
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])
}
