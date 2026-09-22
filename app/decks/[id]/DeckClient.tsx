'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { fetchDeckWords, getUserPlan, saveQuizResult, toggleSaveStatus, type DeckWordEntry } from '@/lib/supabaseApi'
import { fetchQuizSettings, saveQuizSettings, QUIZ_SETTINGS_DEFAULTS } from '@/lib/quizSettings'
import Button from '@/components/Button'
import PageHeader from '@/components/PageHeader'
import EntryCard from '@/components/EntryCard'
import WordDetailModal from '@/components/WordDetailModal'
import { buildPronunciation, buildSenses } from '@/lib/dictionaryRender'
import type { DisplayLocale } from '@/types/DisplayLocale'
import { DISPLAY_LOCALE_STORAGE_KEY, DISPLAY_LOCALE_EVENT_NAME } from '@/types/DisplayLocale'
import QuizSession, { buildQuizCards, shuffleCards } from '@/components/QuizSession'
import type { QuizEntry } from '@/components/QuizSession'
import { type QuizScope } from '@/components/QuizScopeSelector'
import { classifyQuizStatus, classifyForDonut, type WordStatus } from '@/lib/quizScope'
import QuizProgressPanel from '@/components/QuizProgressPanel'
import ChapterListItem from '@/components/ChapterListItem'
import CardShell from '@/components/CardShell'
import SignupRequiredModal from '@/components/SignupRequiredModal'
import UpgradeModal from '@/components/UpgradeModal'
import NativePaywall from '@/components/NativePaywall'
import { isNativePlatform } from '@/lib/isNativePlatform'
import { decidePaywallVariant, type PaywallVariant } from '@/lib/paywall'
import { CHAPTER_SIZE, chapterOfPosition, chapterCount, isChapterLocked } from '@/lib/chapters'
import toast from 'react-hot-toast'

type DeckInfo = {
  id: string
  slug: string | null
  name: string
  label: string
  description: string | null
  is_premium: boolean
}

const INITIAL_VISIBLE = 30
const LOAD_MORE_STEP = 30

const chapterHref = (slugOrId: string, chapterNo: number) => `/decks/${slugOrId}/chapters/${chapterNo}`
const chapterLabel = (n: number) => `Chapter ${String(n).padStart(2, '0')}`

export default function DeckClient({
  deck,
  initialEntries = [],
  chapter = null,
  totalWordsHint,
}: {
  deck: DeckInfo
  initialEntries?: DeckWordEntry[]
  /** null → デッキ画面、number → その章の画面 */
  chapter?: number | null
  /**
   * 章画面のときに親から渡す、デッキ全体の総単語数。
   * 章画面は initialEntries に 50 語しか含まないので、totalChapters をここから算出する。
   * デッキ画面 (chapter=null) では initialEntries.length が deck 全体なので不要。
   */
  totalWordsHint?: number
}) {
  const router = useRouter()
  const [entries, setEntries] = useState<DeckWordEntry[]>(initialEntries)
  const [loading, setLoading] = useState(initialEntries.length === 0)
  const [wordStatus, setWordStatus] = useState<Map<string, WordStatus>>(new Map())
  const [wrongCounts, setWrongCounts] = useState<Map<string, number>>(new Map())
  const [quizEntries, setQuizEntries] = useState<QuizEntry[] | null>(null)
  const [quizScope, setQuizScope] = useState<QuizScope>('all')
  const [quizDefaultMode, setQuizDefaultMode] = useState<'example' | 'word'>(QUIZ_SETTINGS_DEFAULTS.defaultMode)
  const [quizCount, setQuizCount] = useState(QUIZ_SETTINGS_DEFAULTS.questionCount)
  const [quizAutoAudio, setQuizAutoAudio] = useState(QUIZ_SETTINGS_DEFAULTS.autoPlayAudio)
  const [quizAutoHeadword, setQuizAutoHeadword] = useState(QUIZ_SETTINGS_DEFAULTS.autoPlayHeadword)
  const [userId, setUserId] = useState<string | null>(null)
  const [isAuthed, setIsAuthed] = useState<boolean>(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [paywallVariant, setPaywallVariant] = useState<Exclude<PaywallVariant, 'none'> | null>(null)
  const [plan, setPlan] = useState<'premium' | 'free' | null>(null)
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set())
  const [selectedEntry, setSelectedEntry] = useState<DeckWordEntry | null>(null)
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE)
  const [lastPlayedChapter, setLastPlayedChapter] = useState<number | null>(null)
  // Native 判定は client-only。SSR / 初期 client render では false 扱いにして
  // Web 前提の HTML を出す (SEO のために章単語リストは HTML に含めたい)。
  // Capacitor 実行時は mount 直後の useEffect で true に反転し、単語リストを畳む。
  const [isNative, setIsNative] = useState(false)

  const openWord = useCallback((entry: DeckWordEntry) => {
    setSelectedEntry(entry)
  }, [])
  // SSR で initial entries を出せるようになったので、
  // 初期値は server と client で必ず一致させる（hydration mismatch 回避）。
  // localStorage の値は mount 後に反映する。
  const [displayLocale, setDisplayLocale] = useState<DisplayLocale>('ja')

  useEffect(() => {
    setIsNative(isNativePlatform())
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY) as DisplayLocale | null
    if (saved && saved !== displayLocale) setDisplayLocale(saved)
    const handler = () => {
      const s = localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY) as DisplayLocale | null
      if (s) setDisplayLocale(s)
    }
    window.addEventListener(DISPLAY_LOCALE_EVENT_NAME, handler)
    return () => window.removeEventListener(DISPLAY_LOCALE_EVENT_NAME, handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadStatus = useCallback(async (data: DeckWordEntry[], userId: string) => {
    const words = data.map(e => e.word)
    const { data: qr } = await supabase
      .from('quiz_results')
      .select('word, correct, answered_at')
      .eq('user_id', userId)
      .in('word', words)
      .order('answered_at', { ascending: false })
      .limit(10000)
    const { status, wrongCount } = classifyQuizStatus(
      (qr ?? []) as { word: string; correct: boolean }[],
      words,
    )
    setWordStatus(status)
    setWrongCounts(wrongCount)
  }, [])

  const loadSavedWords = useCallback(async (userId: string, deckWords: string[]) => {
    if (deckWords.length === 0) { setSavedWords(new Set()); return }
    const wordRows: Array<{ id: string; word: string }> = []
    const IN_CHUNK = 200
    for (let i = 0; i < deckWords.length; i += IN_CHUNK) {
      const { data } = await supabase
        .from('words')
        .select('id, word')
        .in('word', deckWords.slice(i, i + IN_CHUNK))
      wordRows.push(...((data ?? []) as Array<{ id: string; word: string }>))
    }
    if (wordRows.length === 0) { setSavedWords(new Set()); return }
    const idToWord = new Map(wordRows.map(r => [r.id, r.word]))
    const wordIds = wordRows.map(r => r.id)
    const savedIds: string[] = []
    for (let i = 0; i < wordIds.length; i += IN_CHUNK) {
      const { data } = await supabase
        .from('saved_words')
        .select('word_id')
        .eq('user_id', userId)
        .in('word_id', wordIds.slice(i, i + IN_CHUNK))
      savedIds.push(...((data ?? []).map(r => r.word_id as string)))
    }
    setSavedWords(new Set(savedIds.map(id => idToWord.get(id) ?? '').filter(Boolean)))
  }, [])

  const loadLastPlayedChapter = useCallback(async (userId: string, allEntries: DeckWordEntry[]) => {
    if (allEntries.length === 0) { setLastPlayedChapter(null); return }
    const { data } = await supabase
      .from('quiz_results')
      .select('word, answered_at')
      .eq('user_id', userId)
      .eq('deck_id', deck.id)
      .order('answered_at', { ascending: false })
      .limit(1)
    const lastWord = (data ?? [])[0]?.word as string | undefined
    if (!lastWord) { setLastPlayedChapter(null); return }
    const hit = allEntries.find(e => e.word === lastWord)
    if (!hit) { setLastPlayedChapter(null); return }
    setLastPlayedChapter(chapterOfPosition(hit.position))
  }, [deck.id])

  const reload = useCallback(async () => {
    // entries は SSR で initialEntries が渡ってくる (Data Cache DAY で再検証) ため、
    // client 側では再取得しない。ユーザー固有状態 (auth / quiz_results / saved_words /
    // last chapter / plan / settings) だけを並列で叩く。initialEntries が空のとき
    // (SSR 失敗など) のみ fallback として fetchDeckWords する。
    const [{ data: authData }, refreshedEntries] = await Promise.all([
      supabase.auth.getUser(),
      initialEntries.length === 0 ? fetchDeckWords(deck.id) : Promise.resolve(null),
    ])
    const data = refreshedEntries ?? initialEntries
    if (refreshedEntries) setEntries(refreshedEntries)
    setIsAuthed(!!authData.user)
    if (authData.user) {
      setUserId(authData.user.id)
      const uid = authData.user.id
      // 「前回の続き」CTA はデッキ画面でしか使わないので、章画面では lastPlayedChapter
      // のフェッチをスキップして 1 リクエスト削る。
      const results = await Promise.all([
        data.length > 0 ? loadStatus(data, uid) : Promise.resolve(),
        loadSavedWords(uid, data.map(e => e.word)),
        chapter == null ? loadLastPlayedChapter(uid, data) : Promise.resolve(),
        getUserPlan(),
        fetchQuizSettings(uid),
      ] as const)
      const [, , , userPlan, settings] = results
      setPlan(userPlan)
      setQuizDefaultMode(settings.defaultMode)
      setQuizCount(settings.questionCount)
      setQuizAutoAudio(settings.autoPlayAudio)
      setQuizAutoHeadword(settings.autoPlayHeadword)
    } else {
      setPlan('free')
    }
    setLoading(false)
  }, [deck.id, chapter, initialEntries, loadStatus, loadSavedWords, loadLastPlayedChapter])

  useEffect(() => {
    toast.dismiss()
    reload()
  }, [reload])

  const handleToggleSave = async (entry: DeckWordEntry) => {
    if (!isAuthed) { setShowSignupModal(true); return }
    const result = await toggleSaveStatus({ word: entry.word, dictionary: entry.dictionary ?? undefined })
    if (!result.success) { toast.error('処理に失敗しました'); return }
    setSavedWords(prev => {
      const s = new Set(prev)
      if (s.has(entry.word)) s.delete(entry.word); else s.add(entry.word)
      return s
    })
  }

  // 章スコープの entries (章画面ならその章だけ、デッキ画面なら全件)
  const scopedEntries = useMemo(() => {
    if (chapter == null) return entries
    return entries.filter(e => chapterOfPosition(e.position) === chapter)
  }, [entries, chapter])

  // 章画面はクイズ開始があるので dictionary_cache が入ってる語だけを quiz 対象にする。
  // デッキ画面は「はじめる」ボタンがない (前回の続きで章画面へ遷移する) ため、
  // dictionary を待たずに deck_words だけでスコープ数を出す (SSR 軽量化のため
  // デッキ画面では dictionary_cache を読まなくしている)。
  const availableEntries = chapter == null
    ? scopedEntries
    : scopedEntries.filter(e => !!e.dictionary)
  const availableCount = availableEntries.length

  const hardWords = availableEntries.filter(e => (wrongCounts.get(e.word) ?? 0) >= 2)
  const reviewWords = availableEntries.filter(
    e => wordStatus.get(e.word) === 'review' && (wrongCounts.get(e.word) ?? 0) < 2,
  )
  const unseenWords = availableEntries.filter(e => wordStatus.get(e.word) === 'unseen')

  const { mastered: masteredCount, review: reviewCount, hard: hardCount, unseen: unseenCount } =
    classifyForDonut(wordStatus, wrongCounts, scopedEntries.map(e => e.word))

  const scopeSource: Record<QuizScope, typeof availableEntries> = {
    all: availableEntries,
    unseen: unseenWords,
    review: reviewWords,
    hard: hardWords,
    recent: availableEntries,
  }

  // 章画面は entries が 50 語しかないので、親から渡された totalWordsHint (デッキ全体の
  // 総語数) を使って totalChapters を出す。デッキ画面は entries が全件なのでそちら。
  const totalChapters = useMemo(
    () => chapterCount(totalWordsHint ?? entries.length),
    [totalWordsHint, entries.length],
  )
  const currentChapterLocked = chapter != null
    && isChapterLocked(chapter, deck.is_premium, totalChapters, plan)

  // 章画面: その章がロックされていれば isLocked
  // デッキ画面: 全体は「はじめる」ではなく「前回の続き」なので isLocked は使わない (CTA 側で章単位に判定)
  const isLocked = chapter == null ? false : currentChapterLocked

  // scope 変更で対象数が減ったら count を max に丸める
  useEffect(() => {
    const max = Math.min(100, scopeSource[quizScope].length)
    if (max > 0 && quizCount > max) setQuizCount(max)
  }, [quizScope, scopeSource, quizCount])

  const openPaywall = useCallback(async () => {
    if (isNativePlatform()) {
      if (!userId) return
      const variant = await decidePaywallVariant(userId)
      if (variant !== 'none') setPaywallVariant(variant)
    } else {
      setShowUpgradeModal(true)
    }
  }, [userId])

  const startQuiz = useCallback(async () => {
    if (!isAuthed) { setShowSignupModal(true); return }
    if (isLocked) { await openPaywall(); return }
    const sourceEntries = scopeSource[quizScope]
    const take = Math.min(quizCount, sourceEntries.length)
    const cards = shuffleCards(buildQuizCards(sourceEntries)).slice(0, take)
    const sessionEntries: QuizEntry[] = cards.map(c =>
      sourceEntries.find(e => e.word === c.word) ?? { word: c.word, dictionary: null }
    )
    setQuizEntries(sessionEntries)
  }, [isAuthed, isLocked, openPaywall, quizScope, scopeSource, quizCount])

  const handleQuizAnswer = useCallback(async (word: string, correct: boolean) => {
    await saveQuizResult(word, correct, deck.id)
    setWordStatus(prev => new Map(prev).set(word, correct ? 'mastered' : 'review'))
    if (!correct) setWrongCounts(prev => new Map(prev).set(word, (prev.get(word) ?? 0) + 1))
  }, [deck.id])

  // デッキ画面での「前回の続き」CTA: 前回チャプター or チャプター 1
  const resumeChapter = useMemo(() => {
    if (chapter != null) return null
    if (totalChapters === 0) return null
    const target = lastPlayedChapter ?? 1
    return Math.min(totalChapters, Math.max(1, target))
  }, [chapter, lastPlayedChapter, totalChapters])

  const slugForUrl = deck.slug ?? deck.id

  const handleResumeChapter = useCallback(async () => {
    if (!isAuthed) { setShowSignupModal(true); return }
    if (resumeChapter == null) return
    const locked = isChapterLocked(resumeChapter, deck.is_premium, totalChapters, plan)
    if (locked) { await openPaywall(); return }
    router.push(chapterHref(slugForUrl, resumeChapter))
  }, [isAuthed, resumeChapter, deck.is_premium, totalChapters, plan, openPaywall, router, slugForUrl])

  const handleChapterTap = useCallback(async (n: number) => {
    const locked = isChapterLocked(n, deck.is_premium, totalChapters, plan)
    if (locked) {
      if (!isAuthed) { setShowSignupModal(true); return }
      await openPaywall()
      return
    }
    router.push(chapterHref(slugForUrl, n))
  }, [deck.is_premium, totalChapters, plan, isAuthed, openPaywall, router, slugForUrl])

  // 章一覧はデッキ画面でだけ描く。章画面では entries が 50 語しかないので
  // 章別集計は正しく取れないし、そもそも表示もしないので skip する。
  const chapters = useMemo(() => {
    if (chapter != null) return []
    const progressByChapter = new Map<number, { mastered: number; total: number }>()
    for (const e of entries) {
      const n = chapterOfPosition(e.position)
      const bucket = progressByChapter.get(n) ?? { mastered: 0, total: 0 }
      bucket.total++
      if (wordStatus.get(e.word) === 'mastered') bucket.mastered++
      progressByChapter.set(n, bucket)
    }
    const list: Array<{ no: number; mastered: number; total: number; locked: boolean }> = []
    for (let n = 1; n <= totalChapters; n++) {
      const p = progressByChapter.get(n) ?? { mastered: 0, total: 0 }
      list.push({
        no: n,
        mastered: p.mastered,
        total: p.total || CHAPTER_SIZE,
        locked: isChapterLocked(n, deck.is_premium, totalChapters, plan),
      })
    }
    return list
  }, [chapter, entries, wordStatus, totalChapters, deck.is_premium, plan])

  if (quizEntries !== null) {
    return (
      <QuizSession
        initialCards={buildQuizCards(quizEntries)}
        entries={quizEntries}
        onQuit={() => setQuizEntries(null)}
        onAnswer={handleQuizAnswer}
        initialMode={quizDefaultMode}
        autoPlayExampleAudio={quizAutoAudio}
        autoPlayHeadwordAudio={quizAutoHeadword}
      />
    )
  }

  const breadcrumbItems = chapter != null
    ? [
        { label: 'ホーム', href: '/' },
        { label: '教材一覧', href: '/decks' },
        { label: deck.name, href: `/decks/${slugForUrl}` },
        { label: chapterLabel(chapter) },
      ]
    : [
        { label: 'ホーム', href: '/' },
        { label: '教材一覧', href: '/decks' },
        { label: deck.name },
      ]

  const buttonLabel = loading
    ? '読み込み中...'
    : chapter == null
      ? (resumeChapter != null ? `前回の続き (${chapterLabel(resumeChapter)})` : 'Chapter 01 をはじめる')
      : isLocked
        ? '🔒 プレミアム登録ではじめる'
        : availableCount === 0
          ? '単語データがまだありません'
          : 'はじめる'

  const buttonDisabled = loading || (
    chapter == null
      ? totalChapters === 0
      : !isLocked && scopeSource[quizScope].length === 0
  )

  const onStart = chapter == null ? handleResumeChapter : startQuiz

  // 単語一覧プレビュー表示条件:
  //   - 章画面のみ (デッキ画面では表示しない)
  //   - native では非表示、Web のみ (SEO のため章単位で HTML に含める)
  //   - SSR / 初期 client render は Web 扱い (isNative=false) なので Web と同じ HTML が
  //     出る。Capacitor 上では mount 後の useEffect で isNative=true に切り替わり畳む。
  const showWordPreview = chapter != null && !isNative

  return (
    <>
      {showSignupModal && <SignupRequiredModal onClose={() => setShowSignupModal(false)} />}
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} reason="upgrade" />}
      {paywallVariant && <NativePaywall variant={paywallVariant} onClose={() => setPaywallVariant(null)} />}

      <PageHeader items={breadcrumbItems} />

      <QuizProgressPanel
        header={
          <div>
            <span className="text-xs font-semibold text-primary bg-primary-subtle px-2 py-0.5 rounded-full">{deck.label}</span>
            <h2 className="text-xl font-bold text-gray-900 mt-2">
              {deck.name}{chapter != null ? ` ・ ${chapterLabel(chapter)}` : ''}
            </h2>
            {chapter == null && deck.description && (
              <p className="text-sm text-gray-500 mt-1">{deck.description}</p>
            )}
          </div>
        }
        mastered={masteredCount}
        review={reviewCount}
        hard={hardCount}
        unseen={unseenCount}
        scopeItems={[
          { key: 'all', count: availableCount },
          { key: 'unseen', count: unseenWords.length },
          { key: 'review', count: reviewWords.length },
          { key: 'hard', count: hardWords.length },
        ]}
        selectedScope={quizScope}
        onScopeChange={setQuizScope}
        buttonLabel={buttonLabel}
        buttonDisabled={buttonDisabled}
        onStart={onStart}
        settings={!isLocked && !loading ? {
          defaultMode: quizDefaultMode,
          onDefaultModeChange: (v) => { setQuizDefaultMode(v); if (userId) saveQuizSettings(userId, { defaultMode: v }) },
          questionCount: quizCount,
          onQuestionCountChange: (v) => { setQuizCount(v); if (userId) saveQuizSettings(userId, { questionCount: v }) },
          questionCountMax: Math.max(1, Math.min(100, scopeSource[quizScope].length)),
          questionCountMin: 1,
          autoPlayAudio: quizAutoAudio,
          onAutoPlayAudioChange: (v) => { setQuizAutoAudio(v); if (userId) saveQuizSettings(userId, { autoPlayAudio: v }) },
          autoPlayHeadword: quizAutoHeadword,
          onAutoPlayHeadwordChange: (v) => { setQuizAutoHeadword(v); if (userId) saveQuizSettings(userId, { autoPlayHeadword: v }) },
        } : undefined}
      />

      {/* デッキ画面: 章リスト */}
      {chapter == null && chapters.length > 0 && (
        <CardShell>
          <div className="flex flex-col divide-y divide-line">
            {chapters.map(ch => (
              <ChapterListItem
                key={ch.no}
                chapterNo={ch.no}
                label={chapterLabel(ch.no)}
                mastered={ch.mastered}
                total={ch.total}
                locked={ch.locked}
                onClick={() => handleChapterTap(ch.no)}
              />
            ))}
          </div>
        </CardShell>
      )}

      {/* ── SSR-only internal links for crawlers ── */}
      {chapter == null && entries.length > 0 && (
        <nav aria-hidden="true" className="sr-only">
          <ul>
            {entries.map((entry) => (
              <li key={`ssr-${entry.word}`}>
                <a href={`/word/${encodeURIComponent(entry.word)}`} tabIndex={-1}>
                  {entry.word}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* 章画面: 単語一覧プレビュー (Web のみ、SEO のため) */}
      {showWordPreview && availableEntries.length > 0 && (
        <section>
          <div className="flex flex-col gap-3">
            {availableEntries.slice(0, visibleCount).map((entry) => {
              const d = entry.dictionary
              const pronunciation = buildPronunciation(d)
              const senses = buildSenses(d, displayLocale)
              const inflections: string[] = d?.inflections ?? []
              const allSenses = Object.values(senses).flat()
              const firstSenseId = allSenses[0]?.senseId ?? null
              const pinnedSenseId = entry.pinned_sense_id ?? firstSenseId
              return (
                <a
                  key={entry.word}
                  href={`/word/${encodeURIComponent(entry.word)}`}
                  onClick={(e) => {
                    if (e.defaultPrevented) return
                    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                    e.preventDefault()
                    openWord(entry)
                  }}
                  className="cursor-pointer block no-underline text-inherit"
                >
                  <EntryCard
                    headword={entry.word}
                    pronunciation={pronunciation}
                    etymology=""
                    senses={senses}
                    inflections={inflections}
                    grammarTags={{}}
                    isBookmarked={savedWords.has(entry.word)}
                    onSave={(e) => { e?.preventDefault(); e?.stopPropagation(); handleToggleSave(entry) }}
                    pinnedSenseId={pinnedSenseId}
                    displayLocale={displayLocale}
                    compact
                  />
                </a>
              )
            })}
          </div>
          {availableEntries.length > visibleCount && (
            <div className="mx-auto max-w-[600px] md:px-4 mt-4 mb-6">
              <Button
                onClick={() => setVisibleCount((n) => n + LOAD_MORE_STEP)}
                variant="secondary"
                fullWidth
              >
                もっと見る（+{Math.min(LOAD_MORE_STEP, availableEntries.length - visibleCount)}）
              </Button>
            </div>
          )}
        </section>
      )}

      {selectedEntry && (
        <WordDetailModal
          word={selectedEntry.word}
          dictionary={selectedEntry.dictionary}
          initialPinnedSenseId={selectedEntry.pinned_sense_id}
          displayLocale={displayLocale}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </>
  )
}
