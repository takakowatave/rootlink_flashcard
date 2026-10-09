'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { MdArrowBackIosNew } from 'react-icons/md'
import { supabase } from '@/lib/supabaseClient'
import { isNativePlatform } from '@/lib/isNativePlatform'
import Button from '@/components/Button'
import { TextInput } from '@/components/TextInput'
import GoogleAuthButton from '@/components/auth/GoogleAuthButton'
import AppleAuthButton from '@/components/auth/AppleAuthButton'
import TurnstileWidget from '@/components/auth/TurnstileWidget'
import GuestLinkConfirmDialog from '@/components/auth/GuestLinkConfirmDialog'
import { hasAnyGuestLearningData } from '@/lib/guestData'

type Mode = 'login' | 'signup'

type FormData = {
  email: string
  password: string
}

type Props = {
  mode: Mode
}

/**
 * ネイティブ (iOS / Android) 向けのログイン / 新規登録フォーム。Figma 2613-6938 準拠。
 * レイアウト: 戻る矢印 → RootLink ロゴ → ラベル → Google / Apple → or → メール/パスワード → ボタン → 下部リンク。
 *
 * 挙動の方針 (kiko 承認, 2026-10-09):
 *  - mode='login' のメール「ログイン」ボタン: signInWithPassword のみ (紐付けは試さない)。
 *    打ち間違いで気づかず新規登録されるのを防ぐため。
 *  - mode='signup' の「新規登録」ボタン: 匿名ユーザーは updateUser でゲストに紐付け、
 *    既存アドレスなら「ログインしてください」エラーを出す。非匿名は従来の signUp。
 *  - Google / Apple ボタン: 匿名時は linkIdentity を試し、失敗 (identity_already_exists) は
 *    AppShell の確認モーダル経路に流す (GoogleAuthButton / AppleAuthButton 側で処理)。
 *  - 既存アカウント切替時に「ゲストで保存した単語と学習記録は引き継がれません」モーダルは、
 *    ゲストに学習データが1件でもあるときだけ出す。
 */
export default function NativeAuthForm({ mode }: Props) {
  const router = useRouter()
  const [captchaToken, setCaptchaToken] = useState('')
  const handleCaptcha = useCallback((token: string) => setCaptchaToken(token), [])
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [existingAccount, setExistingAccount] = useState(false)
  // 既存アカウントに切り替えるかどうかの確認モーダル (ゲストに学習データがあるときだけ出す)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [pendingLogin, setPendingLogin] = useState<FormData | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAnonymous(user?.is_anonymous === true)
    })
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>()

  async function performLogin(data: FormData) {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
      options: { captchaToken: captchaToken || undefined },
    })
    if (error) {
      setError('email', { message: 'メールアドレスまたはパスワードが正しくありません' })
      setError('password', { type: 'manual' })
      return false
    }
    router.push('/')
    router.refresh()
    return true
  }

  async function onLogin(data: FormData) {
    // ゲスト (匿名) の状態で既存アカウントに signInWithPassword すると匿名セッションが
    // 破棄されてデータが見えなくなる。学習データが残っているときは先に確認モーダルを
    // 出す。なければそのままログインしてよい (kiko 承認, 2026-10-09)。
    if (isAnonymous) {
      const { data: { user: anonUser } } = await supabase.auth.getUser()
      if (anonUser && (await hasAnyGuestLearningData(anonUser.id))) {
        setPendingLogin(data)
        setConfirmOpen(true)
        return
      }
    }
    await performLogin(data)
  }

  async function onSignup(data: FormData) {
    setExistingAccount(false)

    // 匿名ユーザー: updateUser でメール/パスワードを現ゲスト user に紐付ける。
    // 既存アドレスなら Supabase は 422 等でエラー → 「ログインしてください」案内に切り替える。
    if (isAnonymous) {
      const { error } = await supabase.auth.updateUser({
        email: data.email,
        password: data.password,
      })
      if (error) {
        const msg = error.message?.toLowerCase() ?? ''
        if (/already|exists|registered|taken/.test(msg)) {
          setExistingAccount(true)
          setError('email', { message: 'このメールアドレスはすでに登録されています' })
          return
        }
        setError('email', { message: error.message || '登録に失敗しました' })
        return
      }
      toast.success('アカウントを作成しました')
      router.push('/')
      router.refresh()
      return
    }

    // 非匿名 (ログアウト後に /signup を直接開いたケース等): 従来どおり signUp。
    const emailRedirectTo = isNativePlatform()
      ? 'https://www.rootlink.app/auth/app-return'
      : `${window.location.origin}/callback`
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo,
        captchaToken: captchaToken || undefined,
      },
    })
    if (error) {
      setError('email', { message: error.message })
      return
    }
    // 既に確認済みのメールで signUp された場合は identities が空になる
    if (signUpData.user && signUpData.user.identities?.length === 0) {
      setExistingAccount(true)
      setError('email', { message: 'このメールアドレスはすでに登録されています' })
      return
    }
    toast.success('確認メールを送信しました')
    router.push('/callback?state=sent')
  }

  const onSubmit = mode === 'login' ? onLogin : onSignup

  const primaryLabel = mode === 'login' ? 'ログイン' : '新規登録'
  const submittingLabel = mode === 'login' ? 'ログイン中...' : '登録中...'

  return (
    <div className="flex flex-col min-h-screen bg-white pt-[env(safe-area-inset-top)]">
      {/* ヘッダー: 戻る矢印 */}
      <div className="h-14 flex items-center border-b border-line pl-4 pr-2">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="戻る"
          className="p-2 rounded-full text-gray-700 hover:bg-gray-100"
        >
          <MdArrowBackIosNew className="size-5" />
        </button>
      </div>

      {/* ロゴ */}
      <div className="flex justify-center py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="RootLink" className="h-[30px] w-auto" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col px-4 py-4 gap-0">
        <p className="text-sm font-medium text-gray-950 pb-4">
          {mode === 'login' ? 'SNSアカウントでログイン' : 'SNSアカウントで新規登録'}
        </p>

        <div className="flex flex-col gap-2">
          <GoogleAuthButton
            variant={mode}
            onError={(message) => setError('email', { message })}
          />
          <AppleAuthButton
            variant={mode}
            onError={(message) => setError('email', { message })}
          />
        </div>

        <div className="flex items-center gap-3 h-[70px]">
          <div className="flex-1 h-px bg-line" />
          <span className="text-sm text-muted">or</span>
          <div className="flex-1 h-px bg-line" />
        </div>

        <div className="flex flex-col gap-4">
          <TextInput
            type="email"
            label="メールアドレス"
            error={errors.email}
            {...register('email', { required: 'メールアドレスは必須です' })}
          />
          {existingAccount && (
            <p className="-mt-3 text-sm">
              <Link href="/login" className="text-primary underline">
                ログインはこちら
              </Link>
            </p>
          )}
          <TextInput
            type="password"
            label="パスワード"
            error={errors.password}
            helperText={mode === 'signup' ? '8文字以上で設定してください' : undefined}
            {...register('password', {
              required: 'パスワードは必須です',
              ...(mode === 'signup' && {
                minLength: { value: 8, message: '8文字以上で設定してください' },
              }),
            })}
          />
          <TurnstileWidget onVerify={handleCaptcha} />
          <Button type="submit" disabled={isSubmitting} variant="primary" size="md" radius="lg" fullWidth>
            {isSubmitting ? submittingLabel : primaryLabel}
          </Button>
          {mode === 'login' && (
            <div className="flex justify-center py-2">
              <Link href="/reset-password" className="text-sm text-primary underline">
                パスワードを忘れた方
              </Link>
            </div>
          )}
        </div>

        <div className="flex justify-center pt-6">
          <Link
            href={mode === 'login' ? '/signup' : '/login'}
            className="text-sm text-primary underline"
          >
            {mode === 'login' ? '新規登録はこちら' : 'ログインはこちら'}
          </Link>
        </div>
      </form>

      <GuestLinkConfirmDialog
        open={confirmOpen}
        loading={confirmLoading}
        onCancel={() => {
          setConfirmOpen(false)
          setPendingLogin(null)
        }}
        onConfirm={async () => {
          if (!pendingLogin) return
          setConfirmLoading(true)
          const ok = await performLogin(pendingLogin)
          setConfirmLoading(false)
          if (ok) {
            setConfirmOpen(false)
            setPendingLogin(null)
          }
        }}
      />
    </div>
  )
}
