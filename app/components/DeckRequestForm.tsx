'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import Button from '@/components/Button'
import CardShell from '@/components/CardShell'
import { supabase } from '@/lib/supabaseClient'

const API_BASE =
  process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ??
  'https://rootlink-server-v2-774622345521.asia-northeast1.run.app'

/**
 * 教材リクエストフォーム。/decks の一番下に置いて、
 * 「こういう教材が欲しい」を Cloud Run /report (kind='deck_request') 経由でメール送信する。
 * サーバ側は kind='deck_request' を受け付ける実装済 (rootlink_server/src/index.ts)。
 * 未ログインは 401 になるため、Save 導線と同じ signup モーダルは出さず toast にとどめる。
 */
export default function DeckRequestForm() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const canSubmit = subject.trim().length > 0 && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('送信にはログインが必要です', { position: 'top-center' })
        return
      }
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      }
      const res = await fetch(`${API_BASE}/report`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          kind: 'deck_request',
          content: subject.trim().slice(0, 200),
          reason: '教材リクエスト',
          message: message.trim() || undefined,
          pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        toast.error('送信に失敗しました。時間をおいて再度お試しください', { position: 'top-center' })
        return
      }
      toast.success('リクエストを受け付けました。ありがとうございます', { position: 'top-center' })
      setSubject('')
      setMessage('')
    } catch {
      toast.error('送信に失敗しました。時間をおいて再度お試しください', { position: 'top-center' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CardShell>
      <div className="flex flex-col gap-3 p-2">
        <div>
          <h2 className="text-base font-bold text-gray-950">教材リクエスト</h2>
          <p className="text-sm text-muted mt-1">
            欲しい教材があれば教えてください。追加を検討します。
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-950" htmlFor="deck-request-subject">
            リクエスト内容
          </label>
          <input
            id="deck-request-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={200}
            placeholder="例: 共通テスト / GRE / IELTS 8.0"
            className="h-12 rounded-lg border border-line bg-white px-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-950" htmlFor="deck-request-message">
            補足 (任意)
          </label>
          <textarea
            id="deck-request-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="用途・使いたい場面など"
            className="rounded-lg border border-line bg-white px-3 py-2 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? '送信中...' : '送信する'}
          </Button>
        </div>
      </div>
    </CardShell>
  )
}
