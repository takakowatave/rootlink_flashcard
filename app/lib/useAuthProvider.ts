'use client'

import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export type AuthProvider = 'google' | 'email' | 'unknown'

function resolveProvider(user: {
  app_metadata?: { provider?: string; providers?: string[] } | null
  identities?: { provider: string }[] | null
} | null): AuthProvider {
  if (!user) return 'unknown'
  const providers = new Set<string>()
  const primary = user.app_metadata?.provider
  if (primary) providers.add(primary)
  for (const p of user.app_metadata?.providers ?? []) providers.add(p)
  for (const id of user.identities ?? []) providers.add(id.provider)

  if (providers.has('google')) return 'google'
  if (providers.has('email')) return 'email'
  return 'unknown'
}

export function useAuthProvider(): AuthProvider {
  const [provider, setProvider] = useState<AuthProvider>('unknown')

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setProvider(resolveProvider(data.user))
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (mounted) setProvider(resolveProvider(session?.user ?? null))
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return provider
}
