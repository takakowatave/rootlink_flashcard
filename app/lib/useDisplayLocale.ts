'use client'

import type { DisplayLocale } from '@/types/DisplayLocale'
import { useLocale } from '@/lib/LocaleProvider'

// 共有の表示言語フック。LocaleProvider (layout.tsx) が initialLocale を入れる。
// SSR と client で同じ値を返すので hydration mismatch と ちらつきが起きない。
export function useDisplayLocale(): DisplayLocale {
  return useLocale()
}
