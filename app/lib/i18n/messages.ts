import type { DisplayLocale } from '@/types/DisplayLocale'

// アプリ全体の i18n ディクショナリ。
// 画面単位 (header / signup / search / wordlist ...) で namespace を分ける。
// 「ユーザーが通る順」に拡張していく: Header → LP → signup/login → search/word →
// wordlist → quiz → dashboard → premium。

export type Messages = {
  header: {
    signup: string
    login: string
  }
}

const ja: Messages = {
  header: {
    signup: '新規登録',
    login: 'ログイン',
  },
}

const en: Messages = {
  header: {
    signup: 'Sign up',
    login: 'Log in',
  },
}

export const messages: Record<DisplayLocale, Messages> = { ja, en }
