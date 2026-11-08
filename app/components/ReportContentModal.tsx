'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Button from './Button'
import { supabase } from '@/lib/supabaseClient'
import { useDisplayLocale } from '@/lib/useDisplayLocale'

type Kind = 'word' | 'phrase'

type Props = {
  open: boolean
  onClose: () => void
  kind: Kind
  content: string
}

const API_BASE =
  process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ??
  'https://rootlink-server-v2-774622345521.asia-northeast1.run.app'

const WORD_REASONS_JA = [
  { value: 'meaning_wrong', label: '意味が違う' },
  { value: 'example_wrong', label: '例文がおかしい' },
  { value: 'etymology_wrong', label: '語源が疑わしい' },
  { value: 'audio_wrong', label: '音声が違う' },
  { value: 'other', label: 'その他' },
] as const

const PHRASE_REASONS_JA = [
  { value: 'meaning_wrong', label: '意味が違う' },
  { value: 'example_wrong', label: '例文がおかしい' },
  { value: 'audio_wrong', label: '音声が違う' },
  { value: 'other', label: 'その他' },
] as const

const WORD_REASONS_EN = [
  { value: 'meaning_wrong', label: 'Meaning is wrong' },
  { value: 'example_wrong', label: 'Example sentence is off' },
  { value: 'etymology_wrong', label: 'Etymology seems incorrect' },
  { value: 'audio_wrong', label: 'Audio is wrong' },
  { value: 'other', label: 'Other' },
] as const

const PHRASE_REASONS_EN = [
  { value: 'meaning_wrong', label: 'Meaning is wrong' },
  { value: 'example_wrong', label: 'Example sentence is off' },
  { value: 'audio_wrong', label: 'Audio is wrong' },
  { value: 'other', label: 'Other' },
] as const

export default function ReportContentModal({ open, onClose, kind, content }: Props) {
  const locale = useDisplayLocale()
  const L = locale === 'en'
    ? {
        kindWord: 'word',
        kindPhrase: 'phrase',
        title: (k: string) => `Report this ${k}`,
        intro: 'Meanings and etymologies shown in this app come from Oxford Dictionary. If you notice any errors, please let us know here.',
        kindLabel: 'Category',
        detailLabel: 'Details (optional)',
        detailPlaceholder: 'Tell us what seems off, if anything.',
        cancel: 'Cancel',
        submitting: 'Submitting...',
        submit: 'Submit',
        failed: 'Submission failed. Please try again later.',
        thanks: 'Thank you for your report',
      }
    : {
        kindWord: '単語',
        kindPhrase: 'フレーズ',
        title: (k: string) => `この${k}を報告`,
        intro: '本アプリで表示される語源・意味は Oxford Dictionary の正規版を出典としております。万が一内容に誤りがございましたらこちらよりご報告ください。',
        kindLabel: '種別',
        detailLabel: '詳細 (任意)',
        detailPlaceholder: 'どこがどう間違っているか、気づいた点があれば書いてください',
        cancel: 'キャンセル',
        submitting: '送信中...',
        submit: '送信する',
        failed: '送信に失敗しました。時間をおいて再度お試しください',
        thanks: 'ご報告ありがとうございます',
      }
  const reasons = (kind === 'word'
    ? (locale === 'en' ? WORD_REASONS_EN : WORD_REASONS_JA)
    : (locale === 'en' ? PHRASE_REASONS_EN : PHRASE_REASONS_JA)) as readonly { value: string; label: string }[]
  const [reason, setReason] = useState<string>(reasons[0].value)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      setReason(reasons[0].value)
      setMessage('')
      setSubmitting(false)
    }
  }, [open, onClose, reasons])

  if (!open) return null

  const kindLabel = kind === 'word' ? L.kindWord : L.kindPhrase

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const reasonLabel = reasons.find(r => r.value === reason)?.label ?? reason
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`
      const res = await fetch(`${API_BASE}/report`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          kind,
          content,
          reason: reasonLabel,
          message: message.trim() || undefined,
          pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        toast.error(L.failed, { position: 'top-center' })
        return
      }
      toast.success(L.thanks, { position: 'top-center' })
      onClose()
    } catch {
      toast.error(L.failed, { position: 'top-center' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 bg-white w-full max-w-md rounded-2xl shadow-xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-gray-950">{L.title(kindLabel)}</h3>
          <p className="text-xs text-muted break-all">「{content}」</p>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed">
          {L.intro}
        </p>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-950" htmlFor="report-reason">
            {L.kindLabel}
          </label>
          <select
            id="report-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            // appearance-none + 独自 chevron。native の chevron が右端に張り付いて
            // 見えるのを避け、pr-10 で余白を確保する。
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2390a1b9' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '18px',
            }}
            className="appearance-none h-12 rounded-lg border border-line bg-white pl-3 pr-10 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {reasons.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-950" htmlFor="report-message">
            {L.detailLabel}
          </label>
          <textarea
            id="report-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder={L.detailPlaceholder}
            className="rounded-lg border border-line bg-white px-3 py-2 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <Button
            type="button"
            variant="tertiary"
            size="md"
            onClick={onClose}
            disabled={submitting}
            className="w-full md:w-auto"
          >
            {L.cancel}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full md:w-auto"
          >
            {submitting ? L.submitting : L.submit}
          </Button>
        </div>
      </div>
    </div>
  )
}
