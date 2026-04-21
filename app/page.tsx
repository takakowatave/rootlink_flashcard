'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import LPHero from '@/components/LPHero'
import LPAbout from '@/components/LPAbout'
import LPFeatures from '@/components/LPFeatures'
import LPCta from '@/components/LPCta'
import LPFooter from '@/components/LPFooter'

const API_BASE =
  process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ??
  'https://rootlink-server-v2-774622345521.asia-northeast1.run.app'

export default function HomePage() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!value) return
    const trimmed = value.trim()
    if (!trimmed) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      })

      if (!res.ok) { setError('NOT_EXIST'); setIsLoading(false); return }

      const r = await res.json()
      if (!r || r.ok !== true || typeof r.redirectTo !== 'string') {
        setError('NOT_EXIST'); setIsLoading(false); return
      }

      router.push(r.redirectTo)
    } catch {
      setError('NOT_EXIST')
      setIsLoading(false)
    }
  }

  return (
    <main>
      <LPHero
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
      />
      <LPAbout wordIdx={0} />
      <LPFeatures />
      <LPCta />
      <LPFooter />
    </main>
  )
}
