// 記事一覧の左に置く小さいサムネイル。
// 画像は thumb_image_url（サムネイル専用）→ hero_image_url → 自動生成のカバー画像 の順で使う。
// カバー画像と同じ 1200:630 のまま置くので、構図は切り取られない。
// サイズを変えるときはこのファイルだけ直せば、Blog一覧とカテゴリー一覧の両方に効く。
// 幅はスマホで 88px、sm 以上で 120px。高さは比率から決まる。
export const BLOG_THUMB_WIDTH = 'w-[88px] sm:w-[120px]'

type Props = {
  slug: string
  heroImageUrl?: string | null
  /** サムネイル専用の画像。あれば最優先 */
  thumbImageUrl?: string | null
  className?: string
  /** 幅を上書きする（カルーセルのカードでは w-full） */
  widthClass?: string
  /** false で角丸と枠線を外す（カードの上辺にぴったり置くとき） */
  framed?: boolean
}

export default function BlogThumb({ slug, heroImageUrl, thumbImageUrl, className, widthClass = BLOG_THUMB_WIDTH, framed = true }: Props) {
  const src = thumbImageUrl ?? heroImageUrl ?? `/blog/${slug}/cover.png`
  const frame = framed ? 'rounded-lg border border-line' : ''
  return (
    <div
      className={`${widthClass} aspect-[1200/630] shrink-0 self-start overflow-hidden ${frame} bg-surface ${className ?? ''}`}
    >
      {/* 記事タイトルがすぐ隣にあるので、画像は装飾扱いにする */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" aria-hidden="true" loading="lazy" className="h-full w-full object-cover" />
    </div>
  )
}
