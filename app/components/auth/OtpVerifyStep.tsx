'use client'

import { useEffect, useRef, useState } from 'react'
import Button from '../Button'
import { TextInput } from '../TextInput'
import { useDisplayLocale } from '@/lib/useDisplayLocale'
import { messages } from '@/lib/i18n/messages'

// メール認証をリンク方式から 6 桁 OTP コード方式に切り替えたときに全フロー
// (signup / email_change / recovery) で共通で使う入力ステップ。
// 認証は Supabase の verifyOtp に投げる想定で、本コンポーネント自体は
// presentational に徹する (onVerify / onResend は呼び出し側が差し込む)。

const RESEND_COOLDOWN_SECONDS = 60

type Props = {
  email: string
  title?: string
  description?: React.ReactNode
  onVerify: (code: string) => void | Promise<void>
  onResend: () => void | Promise<void>
  onEditEmail?: () => void
  submitting?: boolean
  error?: string | null
  autoFocus?: boolean
  initialResendCooldownSeconds?: number
}

export default function OtpVerifyStep({
  email,
  title,
  description,
  onVerify,
  onResend,
  onEditEmail,
  submitting = false,
  error,
  autoFocus = true,
  initialResendCooldownSeconds = RESEND_COOLDOWN_SECONDS,
}: Props) {
  const locale = useDisplayLocale()
  const authCopy = messages[locale].auth
  const resolvedTitle = title ?? authCopy.otpTitle
  const [code, setCode] = useState('')
  const [resendSecondsLeft, setResendSecondsLeft] = useState(initialResendCooldownSeconds)
  const [resending, setResending] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setResendSecondsLeft((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const resendDisabled = resendSecondsLeft > 0 || resending || submitting

  const handleResend = async () => {
    if (resendDisabled) return
    setResending(true)
    try {
      await onResend()
      setResendSecondsLeft(RESEND_COOLDOWN_SECONDS)
    } finally {
      setResending(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting || code.length !== 6) return
    await onVerify(code)
  }

  const sanitize = (value: string) => value.replace(/\D/g, '').slice(0, 6)

  const resendLabel = resending
    ? authCopy.otpResendSending
    : resendSecondsLeft > 0
      ? authCopy.otpResendWait(resendSecondsLeft)
      : authCopy.otpResend

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-gray-950">{resolvedTitle}</h2>
        <p className="text-sm text-gray-700 leading-relaxed break-all">
          {description ?? (
            locale === 'ja' ? (
              <>
                <span className="text-primary font-semibold">{email}</span>
                <br />
                {authCopy.otpSentPrefix}
              </>
            ) : (
              <>
                {authCopy.otpSentPrefix}
                <br />
                <span className="text-primary font-semibold">{email}</span>
              </>
            )
          )}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <TextInput
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(sanitize(e.target.value))}
          autoFocus={autoFocus}
          disabled={submitting}
          className="tracking-[0.5em] text-center text-lg font-medium"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        radius="lg"
        fullWidth
        disabled={submitting || code.length !== 6}
      >
        {submitting ? authCopy.otpSubmitting : authCopy.otpSubmit}
      </Button>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={handleResend}
          disabled={resendDisabled}
          className="text-sm text-primary underline disabled:text-gray-400 disabled:no-underline"
        >
          {resendLabel}
        </button>
        {onEditEmail && (
          <button
            type="button"
            onClick={onEditEmail}
            disabled={submitting}
            className="text-sm text-primary underline disabled:text-gray-400"
          >
            {authCopy.otpEditEmail}
          </button>
        )}
      </div>
    </form>
  )
}
