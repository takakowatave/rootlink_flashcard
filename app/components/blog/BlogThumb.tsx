// 記事一覧の左に置く小さいサムネイル。
// 画像は hero_image_url があればそれを、なければ自動生成のカバー画像を使う。
// カバー画像と同じ 1200:630 のまま置くので、構図は切り取られない。
// サイズを変えるときはこのファイルだけ直せば、Blog一覧とカテゴリー一覧の両方に効く。
// 幅はスマホで 88px、sm 以上で 120px。高さは比率から決まる。
export const BLOG_THUMB_WIDTH = 'w-[88px] sm:w-[120px]'

type Props = {
  slug: string
  heroImageUrl?: string | null
  className?: string
}

export default function BlogThumb({ slug, heroImageUrl, className }: Props) {
  const src = heroImageUrl ?? `/blog/${slug}/cover.png`
  return (
    <div
      className={`${BLOG_THUMB_WIDTH} aspect-[1200/630] shrink-0 self-start overflow-hidden rounded-lg border border-line bg-surface ${className ?? ''}`}
    >
      {/* 記事タイトルがすぐ隣にあるので、画像は装飾扱いにする */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" aria-hidden="true" loading="lazy" className="h-full w-full object-cover" />
    </div>
  )
}
