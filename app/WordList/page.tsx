'use client'

// ==============================
// WordList.tsx（Next.js 最終版）
// ==============================

import { useState, useEffect } from "react"
import EntryCard from "@/components/EntryCard"
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
  
    // 保存 / 削除 実行
    const result = await toggleSaveStatus(word)
    if (!result.success) {
      toast.error("処理に失敗しました")
      return
    }
  
    // 🔴 DBを再取得（これが重要）
    const updated = await fetchWordlists(currentUser.id)
  
    setWordList(updated)
    setSavedWords(updated.map((w) => w.word))
  
    toast.success("更新しました")
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
            <EntryCard
              key={item.saved_id ?? item.word_id}
              headword={item.word}
              pronunciation={item.pronunciation}
              etymology={item.etymology}
              senses={item.senses}
              patterns={item.patterns}
              isBookmarked={savedWords.includes(item.word)}
              onSave={() => handleToggleSave(item)}
            />
          )
        })}
      </div>
    </>
  )
}
