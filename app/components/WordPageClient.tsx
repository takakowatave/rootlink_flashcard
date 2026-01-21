// app/components/WordPageClient.tsx
'use client'

/*
 * WordPageClient
 *
 * /word/[word] ページ用の Client Component。
 *
 * 役割：
 * - Server から渡された words（取得済み）を表示する
 * - 未取得（not_generated）の場合は「裏で自動生成」して表示に移行する
 * - ログインユーザーの「保存済み単語」を取得する
 * - 単語の保存 / 解除（トグル）を行う
 *
 * 重要：
 * - 生成の有無を UI に表示しない
 * - status は内部制御にだけ使う（表に出さない）
 */

import { useEffect, useRef, useState } from 'react'
import WordCard from '@/components/WordCard'
import { toggleSaveStatus, fetchWordlists } from '@/lib/supabaseApi'
import type { WordInfo } from '@/types/WordInfo'
import { supabase } from '@/lib/supabaseClient'
import { apiRequest } from '@/lib/apiClient'
import { wordPrompt } from '@/prompts/word'

type LabeledWord = WordInfo & {
    label?: 'main' | 'synonym' | 'antonym'
    }

    type AiResponse = {
    main: WordInfo
    related?: {
        synonyms?: string[]
        antonyms?: string[]
    }
    }

    async function fetchFromAI(prompt: string): Promise<AiResponse> {
    // Cloud Run 側が /chat を受けている前提（あなたの既存実装に合わせる）
    return apiRequest('/chat', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
    })
    }

    export default function WordPageClient({
    word,
    status,
    words,
    }: {
    word: string
    status: 'ready' | 'not_generated'
    words: LabeledWord[]
    }) {
    // 表示用 words（Server からの初期値を引き継いで、必要なら生成で上書き）
    const [viewWords, setViewWords] = useState<LabeledWord[]>(words)
    const [error, setError] = useState<string | null>(null)

    // 保存済み単語（UI判定用）
    const [savedWords, setSavedWords] = useState<string[]>([])

    // 生成の二重実行防止
    const generatingRef = useRef(false)

    // 保存済み一覧ロード（既存仕様維持）
    useEffect(() => {
        const loadSavedWords = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        const list = await fetchWordlists(user.id)
        setSavedWords(list.map((w) => w.word))
        }

        loadSavedWords()
    }, [])

    // 未生成なら「裏で自動生成」（UXとしては従来通り：検索→待つ→出る）
    useEffect(() => {
        if (status !== 'not_generated') return
        if (!word) return
        if (viewWords.length > 0) return
        if (generatingRef.current) return

        generatingRef.current = true

        const run = async () => {
        try {
            const base = await fetchFromAI(wordPrompt(word))

            const result: LabeledWord[] = [
            {
                ...base.main,
                label: 'main',
            },
            ]

            const tasks: Promise<LabeledWord>[] = []

            base.related?.synonyms?.forEach((w) => {
            tasks.push(
                fetchFromAI(wordPrompt(w)).then((r) => ({
                ...r.main,
                label: 'synonym',
                }))
            )
            })

            base.related?.antonyms?.forEach((w) => {
            tasks.push(
                fetchFromAI(wordPrompt(w)).then((r) => ({
                ...r.main,
                label: 'antonym',
                }))
            )
            })

            const related = await Promise.all(tasks)
            setViewWords([...result, ...related])
        } catch (e) {
            console.error(e)
            setError('AIの結果を取得できませんでした')
        } finally {
            generatingRef.current = false
        }
        }

        run()
    }, [status, word, viewWords.length])

    const handleSave = async (w: WordInfo) => {
        const isSaved = savedWords.includes(w.word)
        const result = await toggleSaveStatus(w, isSaved)

        if (result.success) {
        setSavedWords((prev) =>
            isSaved ? prev.filter((x) => x !== w.word) : [...prev, w.word]
        )
        }
    }

    if (error) {
        return <p className="text-red-500">{error}</p>
    }

    return (
        <main className="w-full">
        {viewWords.map((w) => (
            <WordCard
            key={`${w.word}-${w.label}`}
            word={w}
            label={w.label}
            savedWords={savedWords}
            onSave={handleSave}
            />
        ))}
        </main>
    )
}
