'use client'

// ==============================
// WordList.tsx（Next.js 最終版）
// ==============================

import { useState, useEffect } from "react"
import WordCard from "@/components/WordCard"
import { fetchWordlists, toggleSaveStatus } from "@/lib/supabaseApi"
import toast, { Toaster } from "react-hot-toast"
import type { WordInfo } from "@/types/WordInfo"
import { supabase } from "@/lib/supabaseClient"

type LabeledWord = WordInfo & {
  label?: "main" | "synonym" | "antonym"
}

export default function WordListPage() {
  const [wordList, setWordList] = useState<LabeledWord[]>([])
  const [savedWords, setSavedWords] = useState<string[]>([])
  const [editingWordId, setEditingWordId] = useState<string | null>(null)
  const [allTags, setAllTags] = useState<string[]>([])

  // ------------------------------
  // 全タグ取得
  // ------------------------------
  useEffect(() => {
    const loadAllTags = async () => {
      const { data } = await supabase.from("tag").select("name")
      setAllTags(data?.map((t) => t.name) ?? [])
    }
    loadAllTags()
  }, [])

  // ------------------------------
  // タグ更新
  // ------------------------------
  const updateTags = async (savedWordId: string, tags: string[]) => {
    type ExistingLink = {
      tag_id: string
      tag: { name: string } | null
    }

    const { data } = await supabase
      .from("saved_word_tags")
      .select(`
        tag_id,
        tag:tag_id ( name )
      `)
      .eq("saved_word_id", savedWordId)

    const existingLinks = data as ExistingLink[] | null
    const existingTagNames =
      existingLinks?.map((row) => row.tag?.name ?? "") ?? []

    const toAdd = tags.filter((t) => !existingTagNames.includes(t))
    const toRemove = existingTagNames.filter((t) => !tags.includes(t))

    for (const name of toAdd) {
      let { data: tag } = await supabase
        .from("tag")
        .select("*")
        .eq("name", name)
        .maybeSingle()

      if (!tag) {
        const { data: newTag } = await supabase
          .from("tag")
          .insert({ name })
          .select()
          .maybeSingle()
        tag = newTag
      }

      await supabase.from("saved_word_tags").insert({
        saved_word_id: savedWordId,
        tag_id: tag.id,
      })
    }

    for (const name of toRemove) {
      const { data: tag } = await supabase
        .from("tag")
        .select("*")
        .eq("name", name)
        .maybeSingle()

      if (!tag) continue

      await supabase
        .from("saved_word_tags")
        .delete()
        .eq("saved_word_id", savedWordId)
        .eq("tag_id", tag.id)
    }

    toast.success("タグを更新しました！")
  }

  // ------------------------------
  // 保存 / 削除
  // ------------------------------
  const handleToggleSave = async (word: WordInfo) => {
    const { data } = await supabase.auth.getUser()
    const currentUser = data.user

    if (!currentUser) {
      toast.error("ログインが必要です")
      return
    }

    const currentWords = await fetchWordlists(currentUser.id)
    const isSaved = currentWords.some((w) => w.word === word.word)

    if (!isSaved && currentWords.length >= 500) {
      toast.error("保存できる単語は500個までです")
      return
    }

    if (isSaved) {
      setWordList((prev) => prev.filter((w) => w.word !== word.word))
    }

    const result = await toggleSaveStatus(word, isSaved)

    if (result.success) {
      if (isSaved) {
        toast.success("保存を取り消しました")
        setSavedWords((prev) => prev.filter((w) => w !== word.word))
      } else {
        toast.success("保存しました")
        setSavedWords((prev) => [...prev, result.word.word])
      }
    }
  }

  // ------------------------------
  // 初回ロード
  // ------------------------------
  useEffect(() => {
    const loadSavedWords = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!user) return

      const words = await fetchWordlists(user.id)
      setWordList(words)
      setSavedWords(words.map((w) => w.word))
    }

    loadSavedWords()
  }, [])

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <>
      <Toaster position="top-center" />

      <div className="w-full">
        {[...wordList].reverse().map((item) => {
          const uid = item.saved_id
            ? `saved-${item.saved_id}`
            : `word-${item.word_id}`

          return (
            <WordCard
              key={uid}
              word={item}
              savedWords={savedWords}
              onSave={handleToggleSave}
              isEditing={editingWordId === uid}
              onEdit={() => setEditingWordId(uid)}
              onFinishEdit={(tags) => {
                if (!item.saved_id) return

                if (tags.length > 10) {
                  toast.error("タグは最大10個までです")
                  return
                }

                if (new Set(tags).size !== tags.length) {
                  toast.error("同じタグは複数追加できません")
                  return
                }

                const tooLong = tags.find((t) => t.length > 30)
                if (tooLong) {
                  toast.error(`タグは30文字以内です：${tooLong}`)
                  return
                }

                updateTags(item.saved_id, tags)
                setEditingWordId(null)
              }}
              allTags={allTags}
            />
          )
        })}
      </div>
    </>
  )
}
