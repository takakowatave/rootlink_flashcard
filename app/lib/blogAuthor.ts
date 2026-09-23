// ブログ記事の著者情報。全記事共通で AuthorBox に渡す。
export type BlogAuthor = {
  name: string
  bio: string
  avatarSrc: string
}

export const BLOG_AUTHOR: BlogAuthor = {
  name: 'Yui',
  bio: 'カナダ・オーストラリア一人旅をきっかけに英語に興味を持つ。英語学習歴は7年目に突入。エドシーランが好きです。',
  avatarSrc: '/authors/yui.webp',
}
