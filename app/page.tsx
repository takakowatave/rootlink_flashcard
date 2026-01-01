'use client'

import { useState, useRef, useEffect } from "react"

// UI
import WordCard from "@/components/WordCard"
import Fab from "@/components/Fab"
import SearchModal from "@/components/SearchModal"

import toast, { Toaster } from "react-hot-toast"
import type { WordInfo } from "@/types/WordInfo"
import { checkIfWordExists, toggleSaveStatus } from "@/lib/supabaseApi"

// ---------- 型 ----------
type AiParsedResult = {
    main: WordInfo
    related?: {
        synonyms?: string[]
        antonyms?: string[]
    }
    }

    type LabeledWord = WordInfo & {
    label?: "main" | "synonym" | "antonym"
    }

    // ---------- Component ----------
    export default function SearchPage() {
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [inputError, setInputError] = useState("")
    const [wordList, setWordList] = useState<LabeledWord[]>([])
    const [savedWords, setSavedWords] = useState<string[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [showFab, setShowFab] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)

    const searchFormRef = useRef<HTMLFormElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const [editingWordId, setEditingWordId] = useState<string | null>(null)

    // ---------- AI ----------
    const parseOpenAIResponse = async (
        word: string
    ): Promise<AiParsedResult | undefined> => {
        try {
        const API_URL = process.env.NEXT_PUBLIC_CLOUDRUN_API_URL
        if (!API_URL) throw new Error("API URL not defined")

        const res = await fetch(`${API_URL}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: word }),
        })

        if (!res.ok) throw new Error(`HTTP error ${res.status}`)
        return await res.json()
        } catch (err) {
        console.error(err)
        toast.error("AIの応答取得に失敗しました")
        }
    }

    const hydrateWord = async (word: LabeledWord): Promise<LabeledWord> => {
        if (word.meaning) return word
        const detail = await parseOpenAIResponse(word.word)
        if (detail?.main) return { ...detail.main, label: word.label }
        return word
    }

    // ---------- Search ----------
    const handleSearch = async (
        inputRef?: React.RefObject<HTMLInputElement | null>,
        closeModal = false
    ) => {
        if (!/^[a-zA-Z]+$/.test(input)) {
        setInputError("アルファベットのみ入力してください")
        return
        }

        setInputError("")
        setIsLoading(true)

        try {
        const parsed = await parseOpenAIResponse(input)
        if (!parsed) return

        const existing = await checkIfWordExists(parsed.main)

        if (existing) {
            setWordList([existing])
            setSavedWords([existing.word])
        } else {
            const base: LabeledWord[] = [
            { ...parsed.main, label: "main" },
            ...(parsed.related?.synonyms?.slice(0, 1).map((s) => ({
                word: s,
                meaning: "",
                partOfSpeech: [],
                pronunciation: "",
                example: "",
                translation: "",
                label: "synonym",
            })) ?? []),
            ...(parsed.related?.antonyms?.slice(0, 1).map((a) => ({
                word: a,
                meaning: "",
                partOfSpeech: [],
                pronunciation: "",
                example: "",
                translation: "",
                label: "antonym",
            })) ?? []),
            ]

            const hydrated = await Promise.all(base.map(hydrateWord))
            setWordList(hydrated)
        }
        } finally {
        setIsLoading(false)
        setHasSearched(true)
        inputRef?.current?.blur()
        if (closeModal) setIsModalOpen(false)
        }
    }

    // ---------- FAB ----------
    useEffect(() => {
        const observer = new IntersectionObserver(
        ([entry]) => setShowFab(!entry.isIntersecting),
        { threshold: 0 }
        )
        if (searchFormRef.current) observer.observe(searchFormRef.current)
        return () => observer.disconnect()
    }, [])

    // ---------- Render ----------
    return (
        <>
        <Toaster position="top-center" />

        <div className="rounded-2xl w-full">
            <SearchForm
            inputRef={inputRef}
            formRef={searchFormRef}
            input={input}
            onInputChange={(e) => setInput(e.target.value)}
            onSearch={() => handleSearch(inputRef)}
            error={inputError}
            placeholder="検索ワードを入力"
            isLoading={isLoading}
            />

            {!hasSearched && (
            <img
                src="/empty.png"
                alt="empty"
                className="w-full mx-auto rounded-2xl bg-white border"
            />
            )}

            {wordList.map((word) => (
            <WordCard
                key={word.word}
                label={word.label}
                word={word}
                savedWords={savedWords}
                onSave={async (w) => {
                const result = await toggleSaveStatus(
                    w,
                    savedWords.includes(w.word)
                )
                if (result.success) {
                    setSavedWords((prev) =>
                    prev.includes(w.word)
                        ? prev.filter((x) => x !== w.word)
                        : [...prev, w.word]
                    )
                    toast.success("更新しました")
                } else {
                    toast.error("失敗しました")
                }
                }}
                isEditing={editingWordId === word.word}
                onEdit={() => setEditingWordId(word.word)}
                onFinishEdit={() => setEditingWordId(null)}
            />
            ))}
        </div>

        {!isModalOpen && (
            <Fab isVisible={showFab} onClick={() => setIsModalOpen(true)} />
        )}

        {isModalOpen && (
            <SearchModal
            input={input}
            onInputChange={(e) => setInput(e.target.value)}
            error={inputError}
            isLoading={isLoading}
            formRef={searchFormRef}
            onClose={() => setIsModalOpen(false)}
            isOpen={isModalOpen}
            onSearch={() => handleSearch(inputRef, true)}
            inputRef={inputRef}
            />
        )}
        </>
    )
}
