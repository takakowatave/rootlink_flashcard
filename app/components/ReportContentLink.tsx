'use client'

import { useState } from 'react'
import { HiOutlineFlag } from 'react-icons/hi2'
import { supabase } from '@/lib/supabaseClient'
import { ensureNativeGuestSession } from '@/lib/ensureNativeGuestSession'
import ReportContentModal from './ReportContentModal'
import SignupRequiredModal from './SignupRequiredModal'
import { useDisplayLocale } from '@/lib/useDisplayLocale'
import { messages } from '@/lib/i18n/messages'

type Props = {
  kind: 'word' | 'phrase'
  content: string
}

// 単語/フレーズ詳細ページの末尾に置く「この内容を報告」導線。
// 未ログインは SignupRequiredModal に流す (server 側で /report が 401 を返す
// ので、UI 上でもクリック直後に「アカウント登録が必要」の誘導に振り替える)。
export default function ReportContentLink({ kind, content }: Props) {
  const locale = useDisplayLocale()
  const t = messages[locale].report
  const [reportOpen, setReportOpen] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)
  const kindLabel = kind === 'word' ? t.wordLabel : t.phraseLabel

  const handleClick = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      const ok = await ensureNativeGuestSession()
      if (!ok) {
        setSignupOpen(true)
        return
      }
    }
    setReportOpen(true)
  }

  return (
    <>
      <div className="w-full mx-auto max-w-[600px] px-4 mt-3 mb-6 flex justify-center">
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-primary-dark transition-colors"
        >
          <HiOutlineFlag className="size-4" />
          {t.link(kindLabel)}
        </button>
      </div>
      <ReportContentModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        kind={kind}
        content={content}
      />
      {signupOpen && (
        <SignupRequiredModal
          onClose={() => setSignupOpen(false)}
          trigger="report_content"
        />
      )}
    </>
  )
}
