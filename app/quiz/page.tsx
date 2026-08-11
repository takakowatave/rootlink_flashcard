import { Suspense } from 'react'
import QuizClient from './QuizClient'

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-400">読み込み中...</div>}>
      <QuizClient />
    </Suspense>
  )
}
