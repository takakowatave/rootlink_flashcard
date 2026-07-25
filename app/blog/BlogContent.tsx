'use client'

import { Fragment } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import PhraseCardEmbed, { type EmbeddedPhrase } from '@/components/PhraseCardEmbed'

type Props = {
  content: string
  phraseMap: Record<string, EmbeddedPhrase>
}

const PHRASE_CARD_RE = /<phrase-card\s+id=["']([^"']+)["']\s*(?:\/>|><\/phrase-card>)/gi

const markdownComponents: Components = {
  iframe: (props) => (
    <div className="not-prose my-6 aspect-video w-full overflow-hidden rounded-2xl border border-line">
      <iframe {...props} className="h-full w-full" />
    </div>
  ),
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

export default function BlogContent({ content, phraseMap }: Props) {
  // 本文中の <phrase-card id="..."/> を境界に分割し、
  // 前後の markdown と PhraseCardEmbed を交互にレンダーする。
  // react-markdown のカスタム要素経路に依存すると環境差で表示されないため。
  const segments = content.split(PHRASE_CARD_RE)

  return (
    <>
      {segments.map((seg, i) => {
        if (i % 2 === 0) {
          return <MarkdownChunk key={`md-${i}`} text={seg} />
        }
        const phrase = phraseMap[seg]
        if (!phrase) return null
        return (
          <Fragment key={`pc-${i}-${seg}`}>
            <PhraseCardEmbed phrase={phrase} />
          </Fragment>
        )
      })}
    </>
  )
}
