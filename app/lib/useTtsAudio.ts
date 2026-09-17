'use client'

import { useEffect, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_CLOUDRUN_API_URL

export function playAudioAtRate(url: string, playbackRate = 1) {
  const a = new Audio(url)
  a.playbackRate = playbackRate
  a.play().catch(() => {})
}

// /audio エンドポイントの結果。NO_AUDIO は「その語には音声が存在しない」
// ことを表す server 判定。呼び出し側 (useTtsAudio) はこれを受けて
// unavailable=true にし、UI ボタンを薄く disable にする。
export type TtsAudioFetchResult =
  | { url: string; unavailable: false }
  | { url: null; unavailable: true }
  | { url: null; unavailable: false }

export async function fetchTtsAudioUrl(
  endpoint: string,
  body: unknown,
): Promise<TtsAudioFetchResult> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data?.ok && typeof data.audioUrl === 'string') {
      return { url: data.audioUrl, unavailable: false }
    }
    // 音声非存在は server 側で { ok:false, reason:"NO_AUDIO" } を 404 で返す。
    // 一時的な失敗 (INTERNAL_ERROR / TTS_FAILED / RATE_LIMITED 等) は
    // unavailable=false のまま。呼び出し側は次回の click で retry できる。
    if (data?.ok === false && data.reason === 'NO_AUDIO') {
      return { url: null, unavailable: true }
    }
    return { url: null, unavailable: false }
  } catch {
    return { url: null, unavailable: false }
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
}: Options<TBody>): {
  play: () => Promise<void>
  loading: boolean
  url: string | null
  // /audio が NO_AUDIO を返した後は true になる。呼び出し側は音声ボタンを
  // disabled + opacity で薄くし、click を no-op にする。
  unavailable: boolean
} {
  const [url, setUrl] = useState<string | null>(initialUrl)
  const [loading, setLoading] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    if (initialUrl) setUrl(initialUrl)
  }, [initialUrl])

  const play = async () => {
    if (unavailable) return
    if (url) {
      playAudioAtRate(url, playbackRate)
      return
    }
    setLoading(true)
    const result = await fetchTtsAudioUrl(endpoint, body)
    if (result.unavailable) {
      setUnavailable(true)
    } else if (result.url) {
      setUrl(result.url)
      playAudioAtRate(result.url, playbackRate)
    }
    setLoading(false)
  }

  return { play, loading, url, unavailable }
}
