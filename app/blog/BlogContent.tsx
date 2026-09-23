'use client'

import { Children, Fragment, isValidElement, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import PhraseCardEmbed, { type EmbeddedPhrase } from '@/components/PhraseCardEmbed'
import WordCardEmbed from '@/components/WordCardEmbed'
import WordCheckList from '@/components/blog/WordCheckList'
import ExampleBlock from '@/components/blog/ExampleBlock'
import type { SavedWordDictionary } from '@/types/Dictionary'

type Props = {
  content: string
  phraseMap: Record<string, EmbeddedPhrase>
  wordCardMap?: Record<string, SavedWordDictionary | null>
}

// 本文中の <phrase-card id="..." /> と <word-card word="..." sense="..." /> を
// 統一マーカーに置換 → split で分割 → 順番に埋め込みコンポーネントに差し替える。
const PHRASE_CARD_RE = /<phrase-card\s+id=["']([^"']+)["']\s*(?:\/>|><\/phrase-card>)/gi
const WORD_CARD_RE = /<word-card\s+([^/>]+?)\s*(?:\/>|><\/word-card>)/gi
const WORD_LIST_RE = /<word-list\s+words=["']([^"']+)["']\s*(?:\/>|><\/word-list>)/gi

type Token =
  | { kind: 'md'; text: string }
  | { kind: 'phrase'; id: string }
  | { kind: 'word'; word: string; senseIndex?: number }
  | { kind: 'wordlist'; words: string[] }

function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  type Match =
    | { start: number; end: number; kind: 'phrase'; id: string }
    | { start: number; end: number; kind: 'word'; word: string; senseIndex?: number }
    | { start: number; end: number; kind: 'wordlist'; words: string[] }
  const matches: Match[] = []

  let m: RegExpExecArray | null
  PHRASE_CARD_RE.lastIndex = 0
  while ((m = PHRASE_CARD_RE.exec(source)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, kind: 'phrase', id: m[1] })
  }
  WORD_CARD_RE.lastIndex = 0
  while ((m = WORD_CARD_RE.exec(source)) !== null) {
    const attrs = m[1]
    const wordMatch = /word=["']([^"']+)["']/i.exec(attrs)
    if (!wordMatch) continue
    const word = wordMatch[1].trim().toLowerCase()
    if (!word) continue
    const senseMatch = /sense=["']([^"']+)["']/i.exec(attrs)
    const senseNum = senseMatch ? Number.parseInt(senseMatch[1], 10) : NaN
    const senseIndex = Number.isFinite(senseNum) && senseNum >= 1 ? senseNum : undefined
    matches.push({ start: m.index, end: m.index + m[0].length, kind: 'word', word, senseIndex })
  }

  WORD_LIST_RE.lastIndex = 0
  while ((m = WORD_LIST_RE.exec(source)) !== null) {
    const words = m[1].split(',').map((w) => w.trim()).filter(Boolean)
    matches.push({ start: m.index, end: m.index + m[0].length, kind: 'wordlist', words })
  }

  matches.sort((a, b) => a.start - b.start)

  let cursor = 0
  for (const match of matches) {
    if (match.start > cursor) {
      tokens.push({ kind: 'md', text: source.slice(cursor, match.start) })
    }
    if (match.kind === 'phrase') {
      tokens.push({ kind: 'phrase', id: match.id })
    } else if (match.kind === 'wordlist') {
      tokens.push({ kind: 'wordlist', words: match.words })
    } else {
      tokens.push({ kind: 'word', word: match.word, senseIndex: match.senseIndex })
    }
    cursor = match.end
  }
  if (cursor < source.length) {
    tokens.push({ kind: 'md', text: source.slice(cursor) })
  }
  return tokens
}

// 「英文<改行>和訳」の形の段落は例文とみなして ExampleBlock に載せる。
// 記事側は普通に書くだけでよく、Markdown の書き方を変えずに見た目だけ切り替わる。
function splitByBreaks(children: ReactNode): ReactNode[][] {
  const lines: ReactNode[][] = [[]]
  Children.toArray(children).forEach((child) => {
    if (isValidElement(child) && child.type === 'br') {
      lines.push([])
      return
    }
    lines[lines.length - 1].push(child)
  })
  return lines.filter((line) => line.length > 0)
}

function firstText(nodes: ReactNode[]): string {
  const head = nodes[0]
  return typeof head === 'string' ? head.trim() : ''
}

const markdownComponents: Components = {
  iframe: (props) => (
    <div className="not-prose my-6 aspect-video w-full overflow-hidden rounded-2xl border border-line">
      <iframe {...props} className="h-full w-full" />
    </div>
  ),
  p: ({ children }) => {
    const lines = splitByBreaks(children)
    // 2行以上あり、1行目が英文で始まるものだけを例文として扱う
    const isExample = lines.length >= 2 && /^["'(]?[A-Za-z]/.test(firstText(lines[0]))
    if (isExample) {
      return <ExampleBlock lines={lines.map((line, i) => <Fragment key={i}>{line}</Fragment>)} />
    }
    return <p>{children}</p>
  },
}

function MarkdownChunk({ text }: { text: string }) {
  if (!text.trim()) return null
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSlug]}
      components={markdownComponents}
    >
      {text}
    </ReactMarkdown>
  )
}

export default function BlogContent({ content, phraseMap, wordCardMap = {} }: Props) {
  const tokens = tokenize(content)

  return (
    <>
      {tokens.map((t, i) => {
        if (t.kind === 'md') {
          return <MarkdownChunk key={`md-${i}`} text={t.text} />
        }
        if (t.kind === 'phrase') {
          const phrase = phraseMap[t.id]
          if (!phrase) return null
          return (
            <Fragment key={`pc-${i}-${t.id}`}>
              <PhraseCardEmbed phrase={phrase} />
            </Fragment>
          )
        }
        if (t.kind === 'wordlist') {
          return <WordCheckList key={`wl-${i}`} words={t.words} />
        }
        // t.kind === 'word'
        const dictionary = wordCardMap[t.word] ?? null
        return (
          <Fragment key={`wc-${i}-${t.word}-${t.senseIndex ?? ''}`}>
            <WordCardEmbed
              word={t.word}
              dictionary={dictionary}
              senseIndex={t.senseIndex}
            />
          </Fragment>
        )
      })}
    </>
  )
}
