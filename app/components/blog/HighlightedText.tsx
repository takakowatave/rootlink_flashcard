import { Children, cloneElement, Fragment, isValidElement, type ReactElement, type ReactNode } from 'react'

// 例文の中の対象語を太字のオレンジにする。英語は単語単位、日本語は部分一致。
export const TERM_CLASS = 'font-semibold text-orange-700'

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildPattern(terms: string[]): RegExp | null {
  if (terms.length === 0) return null
  const parts = terms.map((t) =>
    /^[\x00-\x7F]+$/.test(t) ? `\\b${escapeRegExp(t)}\\b` : escapeRegExp(t)
  )
  return new RegExp(`(${parts.join('|')})`, 'gi')
}

function highlightString(text: string, pattern: RegExp): ReactNode[] {
  const out: ReactNode[] = []
  pattern.lastIndex = 0
  let last = 0
  let m: RegExpExecArray | null
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    out.push(
      <strong key={`${m.index}-${m[0]}`} className={TERM_CLASS}>
        {m[0]}
      </strong>
    )
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export default function HighlightedText({ children, terms }: { children: ReactNode; terms: string[] }) {
  const pattern = buildPattern(terms)
  if (!pattern) return <>{children}</>
  return (
    <>
      {Children.toArray(children).map((child, i) => {
        if (typeof child === 'string') {
          return <Fragment key={i}>{highlightString(child, pattern)}</Fragment>
        }
        if (isValidElement(child)) {
          const el = child as ReactElement<{ children?: ReactNode }>
          if (el.props?.children) {
            return cloneElement(el, {
              key: i,
              children: <HighlightedText terms={terms}>{el.props.children}</HighlightedText>,
            })
          }
        }
        return <Fragment key={i}>{child}</Fragment>
      })}
    </>
  )
}
