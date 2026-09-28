// ブログ記事の著者情報。
// posts.author_key で著者を指定できる。null なら BLOG_AUTHOR (Yui) にフォールバック。
// アバターは /public/authors/ 配下に置く。仮画像 (未配置) の場合は Yui のを使う。

export type BlogAuthor = {
  name: string
  bio: string
  avatarSrc: string
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
  'cuppa-english': {
    name: 'Cuppa English編集部',
    bio: 'ハリポタ原作の会話表現を毎週ひとつ、語源とニュアンスで紐解いていくシリーズ「Cuppa English」の編集部です。',
    // 仮画像置き場: public/authors/cuppa-english.webp
    // 差し替え前は Yui のアバターにフォールバックする (public にファイル無しでも 404 で崩れないよう)。
    avatarSrc: '/authors/cuppa-english.webp',
  },
}

export function getAuthorByKey(key: string | null | undefined): BlogAuthor {
  if (!key) return BLOG_AUTHOR
  return BLOG_AUTHORS[key] ?? BLOG_AUTHOR
}
