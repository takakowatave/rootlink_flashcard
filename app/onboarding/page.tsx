'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Button from '@/components/Button'
import { isNativePlatform } from '@/lib/isNativePlatform'

// Figma: xe5UwVx38JWu5doqwXczQu / 2609:6530 (native only splash)
// 通知許可はサインアップ後の OnboardingQuestions 側で聞く。

export default function OnboardingPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isNativePlatform()) {
      router.replace('/login')
      return
    }
    setReady(true)
    ;(async () => {
      try {
        const mod = await import('@capacitor/splash-screen')
        await mod.SplashScreen.hide({ fadeOutDuration: 250 })
      } catch {
        // splash plugin unavailable in web preview; ignore
      }
    })()
  }, [router])

  if (!ready) return null

  return (
    <div className="fixed inset-0 bg-teal-50 flex flex-col items-center justify-center pt-[env(safe-area-inset-top)] pb-[220px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="RootLink" className="h-[45px] w-auto" />

      <div className="mt-10 flex items-baseline gap-2">
        <span className="inline-flex items-center rounded-[10px] bg-white border-t-2 border-l-2 border-r-[5px] border-b-[6px] border-solid border-[#ffb86a] px-2 pt-1.5 pb-2.5 leading-none">
          <span className="text-[42px] font-bold text-[#ff8904] leading-none">語源</span>
        </span>
        <span className="text-[34px] font-bold text-gray-950 leading-none">で覚える</span>
      </div>
      <p className="mt-4 text-[32px] font-bold text-gray-950 leading-none">英単語・辞書アプリ</p>

      <div className="relative mt-10 size-[327px]">
        <Image
          src="/onboarding/splash-mock.png"
          alt=""
          width={327}
          height={327}
          priority
          className="object-contain"
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white flex flex-col items-center gap-6 px-6 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <p className="text-sm leading-5 text-gray-950 text-center">
          サービスを始める前に{' '}
          <Link href="/terms" className="text-primary underline">利用規約</Link>
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
    </div>
  )
}
