// ブログ記事の著者情報。
// posts.author_key で著者を指定できる。null なら BLOG_AUTHOR (Yui) にフォールバック。
// アバターは /public/authors/ 配下に置く。仮画像 (未配置) の場合は Yui のを使う。

export type BlogAuthorLink = {
  label: string
  href: string
}

export type BlogAuthor = {
  name: string
  bio: string
  avatarSrc: string
  // 筆者欄の紹介文の下に並べる SNS などのリンク (任意)
  links?: BlogAuthorLink[]
  // シリーズのランディング (/cuppa 等) がある場合に設定。
  // AuthorBox・BlogLatestBanner・ブログ一覧の著者チップから遷移する。
  seriesHref?: string
}

// 従来からの既定著者 (author_key=null または未定義キー)。全記事共通の状態を保つ。
export const BLOG_AUTHOR: BlogAuthor = {
  name: 'Yui',
  bio: 'カナダ・オーストラリア一人旅をきっかけに英語に興味を持つ。英語学習歴は7年目に突入。エドシーランが好きです。',
  avatarSrc: '/authors/yui.webp',
}

// 著者レジストリ。ここに追加すれば posts.author_key で参照できる。
// アバターは public/authors/<key>.webp を規定パスとする。仮画像でよい (kiko が後で差し替え)。
export const BLOG_AUTHORS: Record<string, BlogAuthor> = {
  yui: BLOG_AUTHOR,
  // Cuppa English シリーズの記事。著者名とアイコンは Cuppa English、SNS リンク付き (2026-10-19 kiko 指定)
  'cuppa-english': {
    name: 'Cuppa English',
    bio: 'ハリポタ原作の会話表現を、毎日のショート動画と毎週のブログで紐解いていくシリーズです。',
    avatarSrc: '/authors/cuppa-english.webp',
    seriesHref: '/cuppa',
    links: [
      { label: 'YouTube', href: 'https://www.youtube.com/@Cuppa_English' },
      { label: 'TikTok', href: 'https://www.tiktok.com/@cuppa_english___' },
      { label: 'Instagram', href: 'https://www.instagram.com/cuppa__english/' },
    ],
  },
}

export function getAuthorByKey(key: string | null | undefined): BlogAuthor {
  if (!key) return BLOG_AUTHOR
  return BLOG_AUTHORS[key] ?? BLOG_AUTHOR
}
