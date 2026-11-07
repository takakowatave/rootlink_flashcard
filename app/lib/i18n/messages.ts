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
  auth: {
    email: string
    password: string
    emailRequired: string
    passwordRequired: string
    passwordMinLength: string
    passwordHelper: string
    close: string
    googleSignup: string
    googleLogin: string
    googleSignupError: string
    googleLoginError: string
    appleSignup: string
    appleLogin: string
    appleSignupError: string
    appleLoginError: string
    appleTesting: (label: string) => string
    privacyRequired: string
    privacyLink: string
    privacyAgreePrefix: string
    privacyAgreeSuffix: string
    otpTitle: string
    otpSentPrefix: string
    otpSubmit: string
    otpSubmitting: string
    otpResend: string
    otpResendWait: (sec: number) => string
    otpResendSending: string
    otpEditEmail: string
    otpInvalid: string
    otpResendFailed: string
  }
  signup: {
    title: string
    submit: string
    submitting: string
    existingAccountLink: string
    emailExists: string
    haveAccount: string
    loginLink: string
  }
  login: {
    title: string
    submit: string
    submitting: string
    wrongCredentials: string
    noAccount: string
    signupLink: string
  }
  search: {
    title: string
    close: string
    notFound: string
  }
  word: {
    back: string
    openSearch: string
    share: string
    closeBanner: string
    correctionPrefix: string
    correctionSuffix: string
    savedToast: string
    containingDecks: string
    rootMore: (root: string) => string
    rootMoreMulti: string
    rootLabel: string
    relatedPosts: string
  }
  report: {
    link: (kindLabel: string) => string
    wordLabel: string
    phraseLabel: string
  }
}

const ja: Messages = {
  header: {
    signup: '新規登録',
    login: 'ログイン',
  },
  auth: {
    email: 'メールアドレス',
    password: 'パスワード',
    emailRequired: 'メールアドレスは必須です',
    passwordRequired: 'パスワードは必須です',
    passwordMinLength: '8文字以上で設定してください',
    passwordHelper: '8文字以上で設定してください',
    close: '閉じる',
    googleSignup: 'Googleで登録',
    googleLogin: 'Googleでログイン',
    googleSignupError: 'Google登録に失敗しました。時間をおいて再試行してください',
    googleLoginError: 'Googleログインに失敗しました。時間をおいて再試行してください',
    appleSignup: 'Appleで登録',
    appleLogin: 'Appleでログイン',
    appleSignupError: 'Apple登録に失敗しました。時間をおいて再試行してください',
    appleLoginError: 'Appleログインに失敗しました。時間をおいて再試行してください',
    appleTesting: (label: string) => `${label}（テスト中につき不可）`,
    privacyRequired: 'プライバシーポリシーへの同意が必要です',
    privacyLink: 'プライバシーポリシー',
    privacyAgreePrefix: '',
    privacyAgreeSuffix: 'に同意する',
    otpTitle: '確認コードを入力',
    otpSentPrefix: 'に6桁のコードを送りました',
    otpSubmit: '確認する',
    otpSubmitting: '確認中...',
    otpResend: 'コードを再送する',
    otpResendWait: (sec: number) => `コードを再送する (${sec}秒)`,
    otpResendSending: '送信中...',
    otpEditEmail: 'メールアドレスを修正する',
    otpInvalid: 'コードが違うか期限切れです。もう一度ご確認ください',
    otpResendFailed: '再送に失敗しました。時間をおいて再試行してください',
  },
  signup: {
    title: 'アカウント新規作成',
    submit: '新規作成',
    submitting: '登録中...',
    existingAccountLink: 'ログインはこちら',
    emailExists: 'このメールアドレスはすでに登録されています',
    haveAccount: 'すでにアカウントをお持ちの方は',
    loginLink: 'ログイン',
  },
  login: {
    title: 'アカウントにログイン',
    submit: 'ログイン',
    submitting: 'ログイン中...',
    wrongCredentials: 'メールアドレスまたはパスワードが正しくありません',
    noAccount: 'アカウントをお持ちでない方は',
    signupLink: '新規登録',
  },
  search: {
    title: '単語を検索',
    close: '閉じる',
    notFound: '見つかりませんでした',
  },
  word: {
    back: '戻る',
    openSearch: '検索を開く',
    share: '共有',
    closeBanner: '閉じる',
    correctionPrefix: 'を',
    correctionSuffix: 'に補正して検索しました',
    savedToast: '単語を保存しました！',
    containingDecks: 'この単語が収録されている単語帳',
    rootMore: (root: string) => `語根「${root}」をもっと知る`,
    rootMoreMulti: '語根をもっと知る',
    rootLabel: '語根',
    relatedPosts: 'この単語を扱った記事',
  },
  report: {
    link: (kindLabel: string) => `この${kindLabel}の内容を報告`,
    wordLabel: '単語',
    phraseLabel: 'フレーズ',
  },
}

const en: Messages = {
  header: {
    signup: 'Sign up',
    login: 'Log in',
  },
  auth: {
    email: 'Email',
    password: 'Password',
    emailRequired: 'Email is required',
    passwordRequired: 'Password is required',
    passwordMinLength: 'Must be at least 8 characters',
    passwordHelper: 'At least 8 characters',
    close: 'Close',
    googleSignup: 'Sign up with Google',
    googleLogin: 'Log in with Google',
    googleSignupError: 'Google sign-up failed. Please try again later.',
    googleLoginError: 'Google login failed. Please try again later.',
    appleSignup: 'Sign up with Apple',
    appleLogin: 'Log in with Apple',
    appleSignupError: 'Apple sign-up failed. Please try again later.',
    appleLoginError: 'Apple login failed. Please try again later.',
    appleTesting: (label: string) => `${label} (unavailable — testing)`,
    privacyRequired: 'You must agree to the Privacy Policy',
    privacyLink: 'Privacy Policy',
    privacyAgreePrefix: 'I agree to the ',
    privacyAgreeSuffix: '',
    otpTitle: 'Enter the code',
    otpSentPrefix: 'A 6-digit code was sent to',
    otpSubmit: 'Verify',
    otpSubmitting: 'Verifying...',
    otpResend: 'Resend code',
    otpResendWait: (sec: number) => `Resend code (${sec}s)`,
    otpResendSending: 'Sending...',
    otpEditEmail: 'Change email address',
    otpInvalid: 'The code is incorrect or expired. Please try again.',
    otpResendFailed: 'Resend failed. Please try again later.',
  },
  signup: {
    title: 'Create account',
    submit: 'Sign up',
    submitting: 'Signing up...',
    existingAccountLink: 'Log in here',
    emailExists: 'This email is already registered',
    haveAccount: 'Already have an account? ',
    loginLink: 'Log in',
  },
  login: {
    title: 'Log in to your account',
    submit: 'Log in',
    submitting: 'Logging in...',
    wrongCredentials: 'Incorrect email or password',
    noAccount: "Don't have an account? ",
    signupLink: 'Sign up',
  },
  search: {
    title: 'Search a word',
    close: 'Close',
    notFound: 'Not found',
  },
  word: {
    back: 'Back',
    openSearch: 'Open search',
    share: 'Share',
    closeBanner: 'Close',
    correctionPrefix: 'Searched',
    correctionSuffix: 'instead',
    savedToast: 'Word saved!',
    containingDecks: 'Decks that include this word',
    rootMore: (root: string) => `More about the root "${root}"`,
    rootMoreMulti: 'More about these roots',
    rootLabel: 'Root',
    relatedPosts: 'Related articles',
  },
  report: {
    link: (kindLabel: string) => `Report an issue with this ${kindLabel}`,
    wordLabel: 'word',
    phraseLabel: 'phrase',
  },
}

export const messages: Record<DisplayLocale, Messages> = { ja, en }
