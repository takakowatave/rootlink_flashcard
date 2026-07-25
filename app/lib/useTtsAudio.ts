'use client'

import { useEffect, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_CLOUDRUN_API_URL

export function playAudioAtRate(url: string, playbackRate = 1) {
  const a = new Audio(url)
  a.playbackRate = playbackRate
  a.play().catch(() => {})
}

export async function fetchTtsAudioUrl(endpoint: string, body: unknown): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return data.ok && data.audioUrl ? data.audioUrl : null
  } catch {
    return null
  }
}

type Options<TBody> = {
  endpoint: string
  body: TBody
  playbackRate?: number
  initialUrl?: string | null
}

export function useTtsAudio<TBody>({
  endpoint,
  body,
  playbackRate = 1,
  initialUrl = null,
}: Options<TBody>): { play: () => Promise<void>; loading: boolean; url: string | null } {
  const [url, setUrl] = useState<string | null>(initialUrl)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialUrl) setUrl(initialUrl)
  }, [initialUrl])

  const play = async () => {
    if (url) { playAudioAtRate(url, playbackRate); return }
    setLoading(true)
    const fetched = await fetchTtsAudioUrl(endpoint, body)
    if (fetched) {
      setUrl(fetched)
      playAudioAtRate(fetched, playbackRate)
    }
    setLoading(false)
  }

  return { play, loading, url }
}
