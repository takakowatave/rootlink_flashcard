import { Suspense } from 'react'
import QuizClient from './QuizClient'
import { detectServerLocale } from '@/lib/serverLocale'
import { messages } from '@/lib/i18n/messages'

export default function QuizPage() {
  const locale = detectServerLocale()
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-400">{messages[locale].quizSession.loading}</div>}>
      <QuizClient />
    </Suspense>
  )
}
