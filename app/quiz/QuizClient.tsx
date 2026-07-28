'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { fetchWordlists, fetchSavedPhrases, saveQuizResult } from '@/lib/supabaseApi'
import toast from 'react-hot-toast'
import QuizDashboard from './QuizDashboard'
import QuizSession, { buildQuizCards, shuffleCards } from '@/components/QuizSession'
import type { QuizEntry } from '@/components/QuizSession'
import SignupRequiredModal from '@/components/SignupRequiredModal'

export default function QuizClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [showDashboard, setShowDashboard] = useState(true)
  const [sessionEntries, setSessionEntries] = useState<QuizEntry[] | null>(null)

  useEffect(() => { toast.dismiss() }, [])

  const loadCards = async (quizMode: 'all' | 'unseen' | 'review' | 'hard' = 'all') => {
    setLoading(true)
    const { data } = await supabase.auth.getUser()
    if (!data.user) { setShowSignupModal(true); setLoading(false); return }

    const [wordList, phraseList] = await Promise.all([
      fetchWordlists(data.user.id),
      fetchSavedPhrases(data.user.id),
    ])
    let entries: QuizEntry[] = [
      ...wordList.map(w => ({
        word: w.word,
        dictionary: w.dictionary ?? null,
        pinned_sense_id: w.pinned_sense_id ?? null,
      })),
      ...phraseList.map(p => ({
        word: p.phrase,
        dictionary: null,
        phrase_card_id: p.phrase_card_id,
        phrase_meaning_ja: p.meaning_ja,
        phrase_meaning_en: p.meaning_en,
        phrase_example_en: p.example_en,
        phrase_example_ja: p.example_ja,
        phrase_type: p.type,
      })),
    ]

    if (quizMode !== 'all') {
      const { data: mastery } = await supabase
        .from('word_mastery')
        .select('word, status, wrong_count')
        .eq('user_id', data.user.id)
        .limit(5000)
      const rows = (mastery ?? []) as { word: string; status: string; wrong_count: number | null }[]

      if (quizMode === 'review') {
        const target = new Set(
          rows.filter(r => r.status === 'needs_review' && (r.wrong_count ?? 0) < 2).map(r => r.word),
        )
        entries = entries.filter(e => target.has(e.word))
      } else if (quizMode === 'hard') {
        const target = new Set(rows.filter(r => (r.wrong_count ?? 0) >= 2).map(r => r.word))
        entries = entries.filter(e => target.has(e.word))
      } else {
        // unseen: not in word_mastery OR status is unlearned
        const seen = new Set(
          rows.filter(r => r.status === 'needs_review' || r.status === 'mastered').map(r => r.word),
        )
        entries = entries.filter(e => !seen.has(e.word))
      }
    }

    const cards = shuffleCards(buildQuizCards(entries)).slice(0, 10)
    setSessionEntries(cards.map(c => entries.find(e => e.word === c.word) ?? { word: c.word, dictionary: null }))
    setLoading(false)
    setShowDashboard(false)
  }

  const handleAnswer = useCallback(async (word: string, correct: boolean) => {
    saveQuizResult(word, correct)
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return
    const { data: existing } = await supabase
      .from('word_mastery')
      .select('correct_streak, wrong_count')
      .eq('user_id', auth.user.id)
      .eq('word', word)
      .maybeSingle()
    const streak = correct ? (existing?.correct_streak ?? 0) + 1 : 0
    const wrongCount = correct ? (existing?.wrong_count ?? 0) : (existing?.wrong_count ?? 0) + 1
    await supabase.from('word_mastery').upsert({
      user_id: auth.user.id,
      word,
      status: streak >= 2 ? 'mastered' : correct ? 'mastered' : 'needs_review',
      correct_streak: streak,
      wrong_count: wrongCount,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,word' })
  }, [])

  if (showDashboard) {
    return (
      <>
        <QuizDashboard onStart={loadCards} onBack={() => router.push('/wordlist')} />
        {showSignupModal && <SignupRequiredModal onClose={() => setShowSignupModal(false)} />}
      </>
    )
  }

  if (loading) {
    return <div className="py-20 text-center text-gray-400">読み込み中...</div>
  }

  if (!sessionEntries || sessionEntries.length === 0) {
    return (
      <div className="py-20 text-center text-gray-400">
        <p>保存した単語がありません</p>
        <a href="/wordlist" className="mt-4 inline-block text-primary underline text-sm">単語リストへ</a>
      </div>
    )
  }

  return (
    <QuizSession
      initialCards={shuffleCards(buildQuizCards(sessionEntries)).slice(0, 10)}
      entries={sessionEntries}
      onQuit={() => setShowDashboard(true)}
      onAnswer={handleAnswer}
    />
  )
}
