'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import Button from '@/components/Button'
import { BsX } from 'react-icons/bs'
import { sendEvent } from '@/lib/ga'
import { useDisplayLocale } from '@/lib/useDisplayLocale'

type Props = {
  onClose: () => void
  /** どこから開いたかの識別子。GA4 と /signup 完了時の相関に使う */
  trigger?: string
}

const SIGNUP_TRIGGER_KEY = 'signup_trigger'

export default function SignupRequiredModal({ onClose, trigger }: Props) {
  const locale = useDisplayLocale()
  const t = locale === 'en'
    ? { title: 'Sign up required', body: 'An account is required to save words. Sign up is free.', signup: 'Sign up (free)', login: 'Log in' }
    : { title: 'アカウント登録が必要です', body: '単語を保存するにはアカウントが必要です。無料で登録できます。', signup: '新規登録（無料）', login: 'ログイン' }
  useEffect(() => {
    sendEvent('signup_modal_shown', { trigger: trigger ?? 'unknown' })
    if (trigger && typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem(SIGNUP_TRIGGER_KEY, trigger)
      } catch {
        // ignore
      }
    }
  }, [trigger])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-primary-subtle text-gray-400"
        >
          <BsX size={24} />
        </button>

        <h2 className="text-lg font-bold text-gray-900 mb-2">{t.title}</h2>
        <p className="text-sm text-gray-500 mb-6">
          {t.body}
        </p>

        <div className="flex flex-col gap-2">
          <Link href="/signup" className="w-full">
            <Button variant="primary" size="md" fullWidth>{t.signup}</Button>
          </Link>
          <Link href="/login" className="w-full">
            <Button variant="secondary" size="md" fullWidth>{t.login}</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
