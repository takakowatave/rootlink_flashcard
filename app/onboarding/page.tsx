'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { HiX } from 'react-icons/hi'
import Button from '@/components/Button'
import ModalShell from '@/components/ModalShell'
import TermsContent from '@/components/TermsContent'
import PrivacyContent from '@/components/PrivacyContent'
import { isNativePlatform } from '@/lib/isNativePlatform'
import { isNativeOrPreview } from '@/lib/isPreviewNative'
import { supabase } from '@/lib/supabaseClient'

// Figma: xe5UwVx38JWu5doqwXczQu / 2609:6530 (native only splash)
// 通知許可はサインアップ後の OnboardingQuestions 側で聞く。

type LegalDoc = 'terms' | 'privacy' | null

export default function OnboardingPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [openDoc, setOpenDoc] = useState<LegalDoc>(null)

  useEffect(() => {
    // Web プレビューで ?preview=native が付いていれば /onboarding を表示する。
    // 本番 Web ではこの条件が false になり従来どおり /login に飛ばす。
    if (!isNativeOrPreview(isNativePlatform())) {
      router.replace('/login')
      return
    }

    // 起動時にログイン済みかを確認する。ログイン済みなら同意画面には残さない。
    //
    // 判定はここでは acquisition_source を見に行かず、ログイン済みなら一律に
    // '/' に飛ばす。'/' に着いたところで AppShell 配下の OnboardingQuestions
    // overlay が、既存の判定 (profiles.acquisition_source が null なら質問を
    // 出す / 既に埋まっていれば何も出さない) をそのまま実行する。
    //
    // つまり:
    //   未ログイン           → 同意画面 (ここ)
    //   ログイン済み・質問未 → '/' に遷移 → OnboardingQuestions が質問モーダル
    //   ログイン済み・質問済 → '/' に遷移 → Dashboard がそのまま表示
    //
    // session 確認が終わるまでは setReady(false) のまま返し、画面のちらつきを
    // 出さない (Capacitor の SplashScreen は最後に hide する)。
    let cancelled = false
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (cancelled) return
        if (session?.user) {
          router.replace('/')
          return
        }
        setReady(true)
      } finally {
        try {
          const mod = await import('@capacitor/splash-screen')
          await mod.SplashScreen.hide({ fadeOutDuration: 250 })
        } catch {
          // splash plugin unavailable in web preview; ignore
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  if (!ready) return null

  return (
    <div
      className="fixed inset-0 bg-primary-subtle flex flex-col"
      style={{ paddingBottom: 0 }}
    >
      {/* 中央領域: ロゴ・テキスト・モック（Figma xe5UwVx38JWu5doqwXczQu / 2862:6037 準拠）。
          縦は justify-center + gap で束ね、モックは w/h いずれも min() で
          ビューポートに合わせて縮尺する。360×640 の小さいスマホでも下の同意ボタンが
          切れないよう、モック側の高さを 40vh に丸めておく。 */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 sm:gap-12 pt-6 pb-3 px-6">
        <div className="flex flex-col items-center gap-4 sm:gap-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="RootLink"
            className="h-[38px] sm:h-[68px] w-auto"
          />
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <div className="flex items-baseline gap-2 sm:gap-3">
              <span className="inline-flex items-center rounded-[10px] sm:rounded-[14px] bg-white border-t-2 border-l-2 border-r-[5px] border-b-[6px] sm:border-t-[3px] sm:border-l-[3px] sm:border-r-[7px] sm:border-b-[8px] border-solid border-[#ffb86a] px-2 sm:px-3 pt-1.5 pb-2.5 sm:pt-2 sm:pb-3 leading-none">
                <span className="text-[36px] sm:text-[54px] font-bold text-[#ff8904] leading-none">
                  語源
                </span>
              </span>
              <span className="text-[28px] sm:text-[42px] font-bold text-gray-950 leading-none">
                で覚える
              </span>
            </div>
            <p className="text-[26px] sm:text-[40px] font-bold text-gray-950 leading-none">
              英単語・辞書アプリ
            </p>
          </div>
        </div>

        <div className="relative w-[min(78vw,320px,40vh)] sm:w-[min(72vw,640px,52vh)] aspect-square">
          <Image
            src="/onboarding/splash-mock.png"
            alt=""
            fill
            priority
            sizes="(min-width: 640px) 520px, 78vw"
            className="object-contain"
          />
        </div>
      </div>

      <div
        className="w-full bg-white flex flex-col items-center gap-6 px-6 pt-8"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <p className="text-sm leading-5 text-gray-950 text-center">
          <button type="button" onClick={() => setOpenDoc('terms')} className="text-primary underline">利用規約</button>
          {' '}と{' '}
          <button type="button" onClick={() => setOpenDoc('privacy')} className="text-primary underline">プライバシーポリシー</button>
          {' '}に同意ください。
        </p>
        <Button
          onClick={() => router.replace('/signup')}
          variant="primary"
          fullWidth
          radius="full"
          className="h-[50px] text-base font-medium"
        >
          同意してはじめる
        </Button>
      </div>

      <ModalShell
        open={openDoc !== null}
        onClose={() => setOpenDoc(null)}
        headerRight={
          <button
            type="button"
            onClick={() => setOpenDoc(null)}
            className="p-2 -mr-1 rounded-full hover:bg-gray-100 text-muted"
            aria-label="閉じる"
          >
            <HiX className="size-5" />
          </button>
        }
      >
        <div className="px-6 py-8">
          {openDoc === 'terms' && <TermsContent />}
          {openDoc === 'privacy' && <PrivacyContent />}
        </div>
      </ModalShell>
    </div>
  )
}
