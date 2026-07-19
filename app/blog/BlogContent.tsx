'use client'

import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import PhraseCardEmbed, { type EmbeddedPhrase } from '@/components/PhraseCardEmbed'

type Props = {
  content: string
  phraseMap: Record<string, EmbeddedPhrase>
}

export default function BlogContent({ content, phraseMap }: Props) {
  // react-markdown の Components 型はカスタム要素名（phrase-card）を型で許可しないが
  // ランタイムでは対応しているので拡張型でキャストする
  const components: Components & {
    'phrase-card': (props: { id?: string }) => JSX.Element | null
  } = {
    'phrase-card': ({ id }) => {
      if (!id) return null
      const phrase = phraseMap[id]
      if (!phrase) return null
      return <PhraseCardEmbed phrase={phrase} />
    },
    iframe: (props) => (
      <div className="not-prose my-6 aspect-video w-full overflow-hidden rounded-2xl border border-line">
        <iframe {...props} className="h-full w-full" />
      </div>
    ),
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSlug]}
      components={components as Components}
    >
      {content}
    </ReactMarkdown>
  )
}
