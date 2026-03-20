'use client'

/**
 * LexicalUnitCard.tsx
 *
 * 【責務】
 * - lexicalUnit 1件だけを表示する
 * - phrase / meaning / example を英英表示する
 * - lexical 用の save ボタンを表示する
 * - anchor id を持ち、hash一致時にハイライトする
 *
 * 【やらないこと】
 * - word 全体のレイアウトは持たない
 * - word sense 用の props は持たない
 * - 日本語訳は表示しない
 */

import { useEffect, useState } from 'react'
import { HiBookmark } from 'react-icons/hi2'
import type { LexicalUnit } from '@/types/LexicalUnit'

type Props = {
  lexicalUnit: LexicalUnit
  isSaved?: boolean
  onSave?: () => void | Promise<void>
}

function toLexicalAnchorId(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export default function LexicalUnitCard({
  lexicalUnit,
  isSaved = false,
  onSave,
}: Props) {
  const phrase = lexicalUnit.phrase ?? ''
  const anchorId = toLexicalAnchorId(phrase)

  const meaning = lexicalUnit.meanings?.[0]?.meaning?.en ?? ''
  const example = lexicalUnit.meanings?.[0]?.examples?.[0]?.sentence ?? ''

  const [isHighlighted, setIsHighlighted] = useState(false)

  useEffect(() => {
    const syncHighlight = () => {
      if (typeof window === 'undefined') return
      setIsHighlighted(window.location.hash === `#${anchorId}`)
    }

    syncHighlight()
    window.addEventListener('hashchange', syncHighlight)
    return () => window.removeEventListener('hashchange', syncHighlight)
  }, [anchorId])

  if (!phrase) return null

  return (
    <section
      id={anchorId}
      className={
        'scroll-mt-24 rounded-2xl border p-4 transition-colors ' +
        (isHighlighted
          ? 'border-blue-200 bg-blue-50'
          : 'border-gray-200 bg-white')
      }
    >
      {/* lexical header */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-900">
          {phrase}
        </h3>

        {onSave && (
          <button
            type="button"
            onClick={() => void onSave()}
            className="shrink-0"
            aria-label="Save lexical unit"
          >
            <HiBookmark
              className={
                'h-5 w-5 ' +
                (isSaved ? 'text-blue-500' : 'text-gray-300')
              }
            />
          </button>
        )}
      </div>

      {/* lexical meaning */}
      {meaning && (
        <p className="mt-2 text-gray-700">
          {meaning}
        </p>
      )}

      {/* lexical example */}
      {example && (
        <p className="mt-4 italic text-gray-600">
          {example}
        </p>
      )}
    </section>
  )
}