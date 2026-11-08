'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { MdClose } from 'react-icons/md'
import Button from '@/components/Button'
import CardShell from '@/components/CardShell'
import ModalShell from '@/components/ModalShell'
import { supabase } from '@/lib/supabaseClient'
import { useDisplayLocale } from '@/lib/useDisplayLocale'

const API_BASE =
  process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ??
  'https://rootlink-server-v2-774622345521.asia-northeast1.run.app'

/**
 * 教材リクエスト。/decks の一番下に置く。
 * 通常時はイラスト + 見出し + ボタンのコンパクトカードで、
 * ボタンタップで ModalShell (halfsheet) が開いてフォームが出る。
 * 送信は POST /report kind='deck_request' (Cloud Run 側で受付済み)。
 */
export default function DeckRequestForm() {
  const locale = useDisplayLocale()
  const L = locale === 'en'
    ? {
        cardTitle: 'Request a deck',
        cardBody: "Can't find the deck you need? Request it here.",
        openBtn: 'Send a request',
        modalTitle: 'Deck request',
        close: 'Close',
        intro: 'Tell us which deck you want.',
        subjectLabel: 'Request',
        subjectPlaceholder: 'e.g. SAT / GRE / IELTS 8.0',
        messageLabel: 'Notes (optional)',
        messagePlaceholder: 'Scenes you want to use it for, kinds of words you hope to see...',
        cancel: 'Cancel',
        submitting: 'Submitting...',
        submit: 'Submit',
        needLogin: 'Please log in to submit',
        failed: 'Could not send. Please try again later.',
        thanks: 'Request received',
        reason: 'Deck request',
      }
    : {
        cardTitle: '勉強したい教材をリクエストしよう',
        cardBody: '欲しい教材がなかったら、リクエストお願いします。',
        openBtn: 'リクエストを送る',
        modalTitle: '教材リクエスト',
        close: '閉じる',
        intro: '欲しい教材があれば教えてください。',
        subjectLabel: 'リクエスト内容',
        subjectPlaceholder: '例: 共通テスト / GRE / IELTS 8.0',
        messageLabel: '補足 (任意)',
        messagePlaceholder: '使いたい場面や、どんな単語が入っていると嬉しいかなど',
        cancel: 'キャンセル',
        submitting: '送信中...',
        submit: '送信する',
        needLogin: '送信にはログインが必要です',
        failed: '送信できませんでした。少し時間をおいてもう一度お試しください',
        thanks: 'リクエストを受け付けました',
        reason: '教材リクエスト',
      }
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const canSubmit = subject.trim().length > 0 && !submitting

  const closeModal = () => {
    if (submitting) return
    setOpen(false)
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error(L.needLogin, { position: 'top-center' })
        return
      }
      const res = await fetch(`${API_BASE}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          kind: 'deck_request',
          content: subject.trim().slice(0, 200),
          reason: L.reason,
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
      setSubject('')
      setMessage('')
      setOpen(false)
    } catch {
      toast.error(L.failed, { position: 'top-center' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <CardShell>
        <div className="flex flex-col items-center gap-4 py-6 px-4">
          <img
            src="/deck-request.png"
            alt=""
            className="w-[220px] max-w-full h-auto"
          />
          <div className="text-center">
            <h2 className="text-base font-bold text-gray-950">
              {L.cardTitle}
            </h2>
            <p className="text-sm text-muted mt-1">
              {L.cardBody}
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setOpen(true)}
          >
            {L.openBtn}
          </Button>
        </div>
      </CardShell>

      <ModalShell
        open={open}
        onClose={closeModal}
        variant="halfsheet"
        headerLeft={
          <h2 className="text-base font-bold text-gray-950 pl-2">{L.modalTitle}</h2>
        }
        headerRight={
          <button
            onClick={closeModal}
            className="p-2 rounded-full hover:bg-primary-subtle text-muted"
            aria-label={L.close}
          >
            <MdClose className="size-6" />
          </button>
        }
      >
        <div className="flex flex-col gap-4 p-4 lg:p-6">
          <p className="text-sm text-gray-700 leading-relaxed">
            {L.intro}
          </p>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-950" htmlFor="deck-request-subject">
              {L.subjectLabel}
            </label>
            <input
              id="deck-request-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              placeholder={L.subjectPlaceholder}
              className="h-12 rounded-lg border border-line bg-white px-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-950" htmlFor="deck-request-message">
              {L.messageLabel}
            </label>
            <textarea
              id="deck-request-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder={L.messagePlaceholder}
              className="rounded-lg border border-line bg-white px-3 py-2 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
          <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end pt-1">
            <Button
              type="button"
              variant="tertiary"
              size="md"
              onClick={closeModal}
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
              disabled={!canSubmit}
              className="w-full md:w-auto"
            >
              {submitting ? L.submitting : L.submit}
            </Button>
          </div>
        </div>
      </ModalShell>
    </>
  )
}
