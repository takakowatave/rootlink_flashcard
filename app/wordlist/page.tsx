'use client'

import { useState, useEffect } from "react"
import EntryCard from "@/components/EntryCard"
import PhraseCard from "@/components/PhraseCard"
import Button from "@/components/Button"
import QuizSession, { buildQuizCards, shuffleCards } from "@/components/QuizSession"
import type { QuizEntry } from "@/components/QuizSession"
import { type QuizScope } from "@/components/QuizScopeSelector"
import { classifyQuizStatus, type WordStatus } from "@/lib/quizScope"
import QuizProgressPanel from "@/components/QuizProgressPanel"
import { fetchSavedWordsMeta, fetchWordDictionaries, fetchSavedPhrases, toggleSaveStatus, saveQuizResult, type SavedPhraseRow, type SavedWordMetaRow } from "@/lib/supabaseApi"
import { fetchQuizSettings, saveQuizSettings, QUIZ_SETTINGS_DEFAULTS } from "@/lib/quizSettings"
import { useTtsAudio } from "@/lib/useTtsAudio"
import toast, { Toaster } from "react-hot-toast"
import { supabase } from "@/lib/supabaseClient"
import type { SavedWordDictionary } from "@/types/Dictionary"
import type { DisplayLocale } from "@/types/DisplayLocale"
import { DISPLAY_LOCALE_STORAGE_KEY, DISPLAY_LOCALE_EVENT_NAME } from "@/types/DisplayLocale"
import SignupRequiredModal from "@/components/SignupRequiredModal"
import PageHeader from "@/components/PageHeader"
import CardShell from "@/components/CardShell"
import WordDetailModal from "@/components/WordDetailModal"
import { buildPronunciation, buildSenses } from "@/lib/dictionaryRender"
import { useAuthReload } from "@/lib/useAuthReload"

export type SavedWordRow = {
  word_id: string
  word: string
  saved_id?: string
  dictionary?: SavedWordDictionary | null
  pinned_sense_id?: string | null
  created_at?: string
}

function PhraseListCard({
  row, isSaved, onSave, displayLocale,
}: {
  row: SavedPhraseRow
  isSaved: boolean
  onSave: () => void
  displayLocale: DisplayLocale
}) {
  const example = useTtsAudio({
    endpoint: '/audio/phrase',
    body: { phrase_card_id: row.phrase_card_id },
    playbackRate: 1.2,
  })
  const headword = useTtsAudio({
    endpoint: '/audio/phrase/headword',
    body: { phrase_card_id: row.phrase_card_id },
  })
  const card = {
    id: row.phrase_card_id,
    phrase: row.phrase,
    meaning_ja: row.meaning_ja,
    meaning_en: row.meaning_en,
    example_en: row.example_en,
    example_ja: row.example_ja,
    type: row.type,
    register: row.register,
    locale: row.locale,
    senses: (row.senses ?? null) as never,
  }
  return (
    <PhraseCard
      card={card}
      isSaved={isSaved}
      onSave={onSave}
      displayLocale={displayLocale}
      onPlayHeadword={headword.play}
      headwordAudioLoading={headword.loading}
      onPlayExample={example.play}
      exampleAudioLoading={example.loading}
    />
  )
}

const INITIAL_VISIBLE = 30
const LOAD_MORE_STEP = 30

export default function WordListPage() {
  const [wordList, setWordList] = useState<SavedWordMetaRow[]>([])
  const [dictByWord, setDictByWord] = useState<Map<string, SavedWordDictionary | null>>(new Map())
  const [phraseList, setPhraseList] = useState<SavedPhraseRow[]>([])
  const [listLoaded, setListLoaded] = useState(false)
  const [savedWords, setSavedWords] = useState<string[]>([])
  const [savedPhraseIds, setSavedPhraseIds] = useState<Set<string>>(new Set())
  const [selectedItem, setSelectedItem] = useState<SavedWordRow | null>(null)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE)
  const [wordStatus, setWordStatus] = useState<Map<string, WordStatus>>(new Map())
  const [wrongCounts, setWrongCounts] = useState<Map<string, number>>(new Map())
  const [quizEntries, setQuizEntries] = useState<QuizEntry[] | null>(null)
  const [quizScope, setQuizScope] = useState<QuizScope>('all')
  const [quizDefaultMode, setQuizDefaultMode] = useState<'example' | 'word'>(QUIZ_SETTINGS_DEFAULTS.defaultMode)
  const [quizCount, setQuizCount] = useState(QUIZ_SETTINGS_DEFAULTS.questionCount)
  const [quizAutoAudio, setQuizAutoAudio] = useState(QUIZ_SETTINGS_DEFAULTS.autoPlayAudio)
  const [quizAutoHeadword, setQuizAutoHeadword] = useState(QUIZ_SETTINGS_DEFAULTS.autoPlayHeadword)
  const [userId, setUserId] = useState<string | null>(null)
  const [displayLocale, setDisplayLocale] = useState<DisplayLocale>(() => {
    if (typeof window === 'undefined') return 'ja'
    return (localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY) as DisplayLocale) ?? 'ja'
  })

  const loadStatus = async (keys: string[], userId: string) => {
    if (keys.length === 0) { setWordStatus(new Map()); setWrongCounts(new Map()); return }
    const { data: qr } = await supabase
      .from('quiz_results')
      .select('word, correct, answered_at')
      .eq('user_id', userId)
      .in('word', keys)
      .order('answered_at', { ascending: false })
      .limit(10000)
    const { status, wrongCount } = classifyQuizStatus(
      (qr ?? []) as { word: string; correct: boolean }[],
      keys,
    )
    setWordStatus(status)
    setWrongCounts(wrongCount)
  }

  const load = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) { setShowSignupModal(true); return }
    setUserId(data.user.id)
    // 1) 単語のメタ (dictionary_cache は含まない) と、フレーズ / 設定を並列で
    const [words, phrases, settings] = await Promise.all([
      fetchSavedWordsMeta(data.user.id),
      fetchSavedPhrases(data.user.id),
      fetchQuizSettings(data.user.id),
    ])
    setWordList(words)
    setPhraseList(phrases)
    setSavedWords(words.map((w) => w.word))
    setSavedPhraseIds(new Set(phrases.map((p) => p.phrase_card_id)))
    setListLoaded(true)
    setQuizDefaultMode(settings.defaultMode)
    setQuizCount(settings.questionCount)
    setQuizAutoAudio(settings.autoPlayAudio)
    setQuizAutoHeadword(settings.autoPlayHeadword)
    // 2) 初期表示ぶん (INITIAL_VISIBLE=30 語) の dictionary_cache と、
    //    quiz_results ステータスを並列で。全単語ぶんは読まない。
    const initialWords = words.slice(0, INITIAL_VISIBLE).map((w) => w.word)
    const allKeys = [...words.map((w) => w.word), ...phrases.map((p) => p.phrase)]
    const [initialDicts] = await Promise.all([
      fetchWordDictionaries(initialWords),
      allKeys.length > 0 ? loadStatus(allKeys, data.user.id) : Promise.resolve(),
    ])
    setDictByWord((prev) => {
      const m = new Map(prev)
      for (const [k, v] of initialDicts) m.set(k, v)
      return m
    })
  }

  // マウント時と、後からログイン・ログアウトしたときに再実行する。
  // 未ログインなら load() が SignupModal を出し、SIGNED_OUT で state を空に戻す。
  useAuthReload((userId, event) => {
    if (event === 'SIGNED_OUT') {
      setUserId(null)
      setWordList([])
      setPhraseList([])
      setSavedWords([])
      setSavedPhraseIds(new Set())
      setWordStatus(new Map())
      setWrongCounts(new Map())
      setListLoaded(false)
      return
    }
    if (userId) {
      void load()
    } else {
      // mount 時に未ログイン
      setShowSignupModal(true)
    }
  })

  useEffect(() => {
    const handler = () => {
      const saved = localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY) as DisplayLocale | null
      if (saved) setDisplayLocale(saved)
    }
    window.addEventListener(DISPLAY_LOCALE_EVENT_NAME, handler)
    return () => window.removeEventListener(DISPLAY_LOCALE_EVENT_NAME, handler)
  }, [])

  // visibleCount が増えたら、まだ dictionary_cache を読んでいない語ぶんだけを追加取得する。
  // 「もっと見る」タップ時にも、ページ再フェッチや全語ぶんの再取得は起こさない。
  useEffect(() => {
    if (wordList.length === 0) return
    const visible = wordList.slice(0, visibleCount).map((w) => w.word)
    const missing = visible.filter((w) => !dictByWord.has(w))
    if (missing.length === 0) return
    let cancelled = false
    fetchWordDictionaries(missing).then((fetched) => {
      if (cancelled) return
      setDictByWord((prev) => {
        const m = new Map(prev)
        for (const [k, v] of fetched) m.set(k, v)
        return m
      })
    })
    return () => { cancelled = true }
  }, [wordList, visibleCount, dictByWord])

  const handleToggleSave = async (word: SavedWordRow) => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) { toast.error("ログインが必要です"); return }
    const result = await toggleSaveStatus(word)
    if (!result.success) { toast.error("処理に失敗しました"); return }
    await load()
    toast.success("更新しました")
  }

  const handleOpenModal = async (item: SavedWordMetaRow) => {
    // モーダル用に、その 1 語ぶんだけ確実に dict を持っておく (まだ未取得なら 1 リクエスト)
    let dict = dictByWord.get(item.word) ?? null
    if (!dictByWord.has(item.word)) {
      const fetched = await fetchWordDictionaries([item.word])
      dict = fetched.get(item.word) ?? null
      setDictByWord((prev) => new Map(prev).set(item.word, dict))
    }
    setSelectedItem({
      saved_id: item.saved_id,
      word_id: item.word_id,
      word: item.word,
      pinned_sense_id: item.pinned_sense_id,
      dictionary: dict,
      created_at: item.created_at,
    })
  }

  const handleCloseModal = () => {
    setSelectedItem(null)
    load()
  }

  // 保存済み単語は全部クイズ / scope 対象にする (以前は dict 未ロードで !!w.dictionary=false
  // になった語を弾いていたが、今は初期表示ぶんしか dict を持たないため誤って弾いてしまう)。
  // dict 未ロードの語はクイズ開始時に足りないぶんだけ埋める (startQuiz 参照)。
  const availableWords = wordList
  const wordEntries: QuizEntry[] = availableWords.map((w) => ({
    word: w.word,
    dictionary: dictByWord.get(w.word) ?? null,
    pinned_sense_id: w.pinned_sense_id ?? null,
  }))
  const phraseEntries: QuizEntry[] = phraseList.map((p) => ({
    word: p.phrase,
    dictionary: null,
    phrase_card_id: p.phrase_card_id,
    phrase_meaning_ja: p.meaning_ja,
    phrase_meaning_en: p.meaning_en,
    phrase_example_en: p.example_en,
    phrase_example_ja: p.example_ja,
    phrase_type: p.type,
  }))
  const allEntries: QuizEntry[] = [...wordEntries, ...phraseEntries]
  const availableCount = allEntries.length
  const totalItems = wordList.length + phraseList.length

  const hardEntries = allEntries.filter((e) => (wrongCounts.get(e.word) ?? 0) >= 2)
  const reviewEntries = allEntries.filter(
    (e) => wordStatus.get(e.word) === 'review' && (wrongCounts.get(e.word) ?? 0) < 2,
  )
  const unseenEntries = allEntries.filter((e) => wordStatus.get(e.word) === 'unseen')

  // 排他4分類（合計 = totalItems）: 苦手 → 習得済 → 要復習 → 未習得
  const hardCount = hardEntries.length
  const reviewCount = reviewEntries.length
  const unseenCount = unseenEntries.length
  const masteredCount = totalItems - hardCount - reviewCount - unseenCount

  const scopeSource: Record<QuizScope, QuizEntry[]> = {
    all: allEntries,
    unseen: unseenEntries,
    review: reviewEntries,
    hard: hardEntries,
    recent: allEntries,
  }

  // scope 変更で対象数が減ったら count を max に丸める
  useEffect(() => {
    const max = Math.min(100, scopeSource[quizScope].length)
    if (max > 0 && quizCount > max) setQuizCount(max)
  }, [quizScope, scopeSource, quizCount])

  const startQuiz = async () => {
    const sourceEntries = scopeSource[quizScope]
    const take = Math.min(quizCount, sourceEntries.length)
    // 先に shuffle して、実際に出題する候補 (take*2 くらい) の dict を足りない分だけ取る。
    // 「はじめる」を押したときにだけ発生する 1 リクエスト。
    const shuffled = shuffleCards([...sourceEntries]).slice(0, Math.min(sourceEntries.length, take * 2))
    const missing = shuffled
      .filter((e) => !e.phrase_card_id && !e.dictionary)
      .map((e) => e.word)
    if (missing.length > 0) {
      const fetched = await fetchWordDictionaries(missing)
      setDictByWord((prev) => {
        const m = new Map(prev)
        for (const [k, v] of fetched) m.set(k, v)
        return m
      })
      for (const e of shuffled) {
        if (!e.dictionary && fetched.has(e.word)) e.dictionary = fetched.get(e.word) ?? null
      }
    }
    const cards = buildQuizCards(shuffled).slice(0, take)
    const sessionEntries: QuizEntry[] = cards.map(
      (c) => shuffled.find((e) => e.word === c.word) ?? { word: c.word, dictionary: null }
    )
    setQuizEntries(sessionEntries)
  }

  const handleTogglePhraseSave = async (phraseCardId: string) => {
    if (!userId) return
    if (savedPhraseIds.has(phraseCardId)) {
      await supabase.from('saved_phrase_cards').delete().eq('user_id', userId).eq('phrase_card_id', phraseCardId)
      setSavedPhraseIds((prev) => { const s = new Set(prev); s.delete(phraseCardId); return s })
      setPhraseList((prev) => prev.filter((p) => p.phrase_card_id !== phraseCardId))
    }
  }

  const handleQuizAnswer = async (word: string, correct: boolean) => {
    await saveQuizResult(word, correct)
    setWordStatus((prev) => new Map(prev).set(word, correct ? 'mastered' : 'review'))
    if (!correct) setWrongCounts((prev) => new Map(prev).set(word, (prev.get(word) ?? 0) + 1))
  }

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

  return (
    <>
      <Toaster position="top-center" />
      {showSignupModal && <SignupRequiredModal onClose={() => setShowSignupModal(false)} />}

      {/* PageHeader はロゴのヘッダーと合わせて幅 100% の帯にしたいので
          max-w のラッパの外に置く（内部で中身だけ max-w-[600px] で中央寄せ）。 */}
      <PageHeader
        items={[
          { label: 'ホーム', href: '/' },
          { label: 'My単語帳' },
        ]}
      />

      {/* SP は viewport 幅、md+ は 600px（CardShell と一致）。812px 幅のままだと
          クイズ設定 (CardShell max-w-[600px]) と単語一覧の幅が食い違って、
          タブレットで単語カードだけがはみ出て見える。 */}
      <div className="max-w-[600px] mx-auto w-full">
      {/* ── 進捗＋クイズ ── */}
      <QuizProgressPanel
        header={
          <>
            <h2 className="text-lg font-bold text-gray-950">My単語帳</h2>
            <p className="text-sm text-gray-600 mt-1">辞書から単語を検索してオリジナルの単語帳をつくれます。</p>
          </>
        }
        mastered={masteredCount}
        review={reviewCount}
        hard={hardCount}
        unseen={unseenCount}
        scopeItems={[
          { key: 'all', count: availableCount },
          { key: 'unseen', count: unseenEntries.length },
          { key: 'review', count: reviewEntries.length },
          { key: 'hard', count: hardEntries.length },
        ]}
        selectedScope={quizScope}
        onScopeChange={setQuizScope}
        buttonLabel="はじめる"
        buttonDisabled={scopeSource[quizScope].length === 0}
        onStart={startQuiz}
        settings={{
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
        }}
      />

      {/* ── オリジナル単語リスト（単語＋フレーズ） ── */}
      <section className="pt-6">
        {!listLoaded ? (
          // 初回読み込み中は空状態を出さず、レイアウトを潰さないだけの
          // プレースホルダにする。totalItems===0 判定を先出しすると、
          // 保存済みユーザーにも一瞬 EmptyState がチラつく (8f54e4c と同種)。
          <div className="px-4">
            <div className="h-[188px] w-full" aria-hidden />
          </div>
        ) : totalItems === 0 ? (
          <CardShell>
            <div className="flex flex-col items-center gap-4 py-6 px-4">
              <p className="font-bold text-base text-center text-default">
                辞書から単語を検索してオリジナルの単語帳をつくろう
              </p>
              <img
                src="/wordlist/empty-search.png"
                alt=""
                className="w-[134px] h-[134px]"
              />
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event('open-mobile-search'))}
                className="w-full max-w-[420px] h-12 flex items-center gap-2 bg-white border border-line rounded-full pl-5 pr-4 text-left hover:border-muted transition-colors"
                aria-label="検索を開く"
              >
                <span className="flex-1 text-sm text-gray-400">検索</span>
                <svg className="size-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </CardShell>
        ) : (
          <>
            <div className="flex flex-col gap-3 px-4">
              {[
                ...wordList.map((w) => ({ kind: 'word' as const, sortAt: w.created_at ?? '', word: w })),
                ...phraseList.map((p) => ({ kind: 'phrase' as const, sortAt: p.created_at, phrase: p })),
              ]
                .sort((a, b) => b.sortAt.localeCompare(a.sortAt))
                .slice(0, visibleCount)
                .map((entry) => {
                  if (entry.kind === 'phrase') {
                    const p = entry.phrase
                    return (
                      <PhraseListCard
                        key={`phrase-${p.saved_id}`}
                        row={p}
                        isSaved={savedPhraseIds.has(p.phrase_card_id)}
                        onSave={() => handleTogglePhraseSave(p.phrase_card_id)}
                        displayLocale={displayLocale}
                      />
                    )
                  }
                  const item = entry.word
                  const d = dictByWord.get(item.word) ?? null
                  const pronunciation = buildPronunciation(d)
                  const senses = buildSenses(d, displayLocale)
                  const inflections: string[] = d?.inflections ?? []
                  const allSenses = Object.values(senses).flat()
                  const firstSenseId = allSenses[0]?.senseId ?? null
                  const pinnedSenseId = item.pinned_sense_id ?? firstSenseId
                  const toggleTarget: SavedWordRow = {
                    saved_id: item.saved_id,
                    word_id: item.word_id,
                    word: item.word,
                    pinned_sense_id: item.pinned_sense_id,
                    dictionary: d,
                    created_at: item.created_at,
                  }
                  return (
                    <div key={item.saved_id ?? item.word_id} onClick={() => handleOpenModal(item)} className="cursor-pointer">
                      <EntryCard
                        headword={item.word}
                        pronunciation={pronunciation}
                        etymology=""
                        senses={senses}
                        inflections={inflections}
                        grammarTags={{}}
                        isBookmarked={savedWords.includes(item.word)}
                        onSave={(e) => { e?.preventDefault(); e?.stopPropagation(); handleToggleSave(toggleTarget) }}
                        pinnedSenseId={pinnedSenseId}
                        displayLocale={displayLocale}
                        compact
                      />
                    </div>
                  )
                })}
            </div>
            {totalItems > visibleCount && (
              <div className="px-4 mt-4">
                <Button
                  onClick={() => setVisibleCount((n) => n + LOAD_MORE_STEP)}
                  variant="secondary"
                  fullWidth
                >
                  もっと見る（+{Math.min(LOAD_MORE_STEP, totalItems - visibleCount)}）
                </Button>
              </div>
            )}
          </>
        )}
      </section>
      </div>

      {selectedItem && (
        <WordDetailModal
          word={selectedItem.word}
          dictionary={selectedItem.dictionary}
          savedId={selectedItem.saved_id}
          initialPinnedSenseId={selectedItem.pinned_sense_id}
          displayLocale={displayLocale}
          onClose={handleCloseModal}
        />
      )}
    </>
  )
}
