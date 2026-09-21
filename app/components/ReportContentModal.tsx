'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Button from './Button'

type Kind = 'word' | 'phrase'

type Props = {
  open: boolean
  onClose: () => void
  kind: Kind
  content: string
}

// TODO(report-backend): 現時点では送信は stub。
// レビュー後に Supabase テーブル (word_reports) への insert に置き換える。

const WORD_REASONS = [
  { value: 'meaning_wrong', label: '意味が違う' },
  { value: 'example_wrong', label: '例文がおかしい' },
  { value: 'etymology_wrong', label: '語源が疑わしい' },
  { value: 'audio_wrong', label: '音声が違う' },
  { value: 'other', label: 'その他' },
] as const

const PHRASE_REASONS = [
  { value: 'meaning_wrong', label: '意味が違う' },
  { value: 'example_wrong', label: '例文がおかしい' },
  { value: 'audio_wrong', label: '音声が違う' },
  { value: 'other', label: 'その他' },
] as const

export default function ReportContentModal({ open, onClose, kind, content }: Props) {
  const reasons = kind === 'word' ? WORD_REASONS : PHRASE_REASONS
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

  const kindLabel = kind === 'word' ? '単語' : 'フレーズ'

  const handleSubmit = async () => {
    setSubmitting(true)
    // TODO(report-backend): Supabase の word_reports へ insert する処理を追加する。
    // 現状は動作確認用のため成功トーストだけ出して閉じる。
    await new Promise((r) => setTimeout(r, 250))
    toast.success('ご報告ありがとうございます', { position: 'top-center' })
    setSubmitting(false)
    onClose()
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
          <h3 className="text-lg font-semibold text-gray-950">この{kindLabel}を報告</h3>
          <p className="text-xs text-muted break-all">「{content}」</p>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed">
          語源や意味のソースは Oxford Dictionary の正規版を利用しています。
          内容に誤りが含まれている場合はご報告ください。
        </p>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-950" htmlFor="report-reason">
            種別
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
            詳細 (任意)
          </label>
          <textarea
            id="report-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="どこがどう間違っているか、気づいた点があれば書いてください"
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
            キャンセル
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full md:w-auto"
          >
            {submitting ? '送信中...' : '送信する'}
          </Button>
        </div>
      </div>
    </div>
  )
}
