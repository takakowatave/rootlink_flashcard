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
    openWordPage: string
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
  common: {
    home: string
    close: string
    search: string
    loginRequired: string
    actionFailed: string
    updated: string
    loadMore: (n: number) => string
    change: string
    save: string
    cancel: string
    saveFailed: string
    sessionExpired: string
    unexpectedError: string
    back: string
    done: string
    showPassword: string
    hidePassword: string
    quotaExceeded: string
    audioPlay: string
    audioUnavailable: string
    shareLabel: string
    savedLabel: string
    saveLabel: string
    plantAlt: (levelLabel: string) => string
    plantNext: (pt: number, lv: string) => string
    myWordlistTitle: string
    myWordlistBody: string
    myWordlistCta: string
    accountDeleted: string
  }
  decksIndex: {
    breadcrumbTitle: string
    title: string
  }
  deckDetail: {
    breadcrumbList: string
    noQuizWords: string
    continueLast: string
    startChapter1: string
    premiumStart: string
    noWordData: string
    start: string
    allChapters: string
  }
  wordlist: {
    breadcrumb: string
    title: string
    subtitle: string
    emptyCta: string
  }
  quiz: {
    start: string
    scopeAll: string
    scopeUnseen: string
    scopeReview: string
    scopeHard: string
    scopeRecent: string
    scopeItemsSuffix: string
    scopeHeader: string
    donutMastered: string
    donutUnseen: string
    donutReview: string
    donutHard: string
    settingsTitle: string
    settingsOpen: string
    defaultModeLabel: string
    defaultModeExample: string
    defaultModeWord: string
    questionCountLabel: string
    autoPlayExampleLabel: string
    autoPlayHeadwordLabel: string
    stepDecrease: string
    stepIncrease: string
  }
  quizSession: {
    back: string
    quit: string
    reveal: string
    hide: string
    notYet: string
    gotIt: string
    correctCountLabel: string
    next: string
    wrong: (n: number) => string
    correct: (n: number) => string
    retry: (n: number) => string
    howToTitle: string
    howToBody: string
    howToStart: string
    loading: string
    noSavedWords: string
    goToWordlist: string
  }
  dashboard: {
    dayLabels: [string, string, string, string, string, string, string]
    streakLabel: string
    streakUnit: string
    shareSNS: string
    sharePreparing: string
    shareFailed: string
    levelUp: string
    streakLearning: (n: number) => string
    growWithLogin: string
    nextEvolution: (pt: number) => string
    usageTitle: string
    studyingCount: string
    masteredCount: string
    createWordlistTitle: string
    reviewTitle: string
    historyTitle: string
    examPrepTitle: string
    myWordlistTitle: string
    moreSuffix: string
    searchAria: string
    periodYesterday: string
    periodWeek: string
    periodMonth: string
    periodAll: string
    shareStreakText: (streak: number) => string
    shareLevelUpText: (level: number, streak: number) => string
  }
  quizDashboard: {
    emptySaved: string
    description: string
    tutorialSkip: string
    tutorialTitle: string
    tutorialBody: string
    tutorialNext: string
    startLabel: string
    masteredCenter: string
  }
  paywall: {
    title: string
    subtitle: string
    offeringError: string
    recommended: string
    yearlyPlan: string
    monthlyPlan: string
    perYear: string
    perMonth: string
    monthlyEquivalent: (v: string) => string
    yearlyDiscount: (v: string) => string
    trialCta: string
    monthlyCta: string
    yearlyCta: string
    processing: string
    featureDecks: (count: number, totalWords: string) => string
    featureDecksLoading: string
    featureUnlimited: string
    freePlanLimit: (n: number) => string
    restore: string
    restoring: string
    autoRenewTitle: string
    autoRenewStart: string
    autoRenewContinue: string
    autoRenewMonthly: (price: string) => string
    autoRenewYearly: (price: string) => string
    autoRenewAfterTrial: string
    terms: string
    privacy: string
    close: string
    billingIos: [string, string, string]
    billingAndroid: [string, string, string]
    billingWeb: [string, string, string]
    nativePurchaseFailed: string
    nativePurchaseSucceeded: string
    nativeRestoreFailed: string
    nativeNothingToRestore: string
    nativeRestoreSucceeded: string
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
    openWordPage: '単語ページを開く',
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
  common: {
    home: 'ホーム',
    close: '閉じる',
    search: '検索',
    loginRequired: 'ログインが必要です',
    actionFailed: '処理に失敗しました',
    updated: '更新しました',
    loadMore: (n: number) => `もっと見る（+${n}）`,
    change: '変更',
    save: '保存',
    cancel: 'キャンセル',
    saveFailed: '保存に失敗しました',
    sessionExpired: 'セッションが切れました。もう一度お試しください',
    unexpectedError: 'エラーが発生しました',
    back: '戻る',
    done: '完了',
    showPassword: 'パスワードを表示',
    hidePassword: 'パスワードを隠す',
    quotaExceeded: '無料枠の上限に達しました',
    audioPlay: '音声を再生',
    audioUnavailable: '音声はありません',
    shareLabel: '共有',
    savedLabel: '保存済み',
    saveLabel: '保存',
    plantAlt: (levelLabel: string) => `鉢植え ${levelLabel}`,
    plantNext: (pt: number, lv: string) => `あと${pt}ptでLv.${lv}`,
    myWordlistTitle: 'My単語帳',
    myWordlistBody: '気になる単語を保存して、あなた専用の単語帳を作りましょう',
    myWordlistCta: '検索して追加する',
    accountDeleted: '退会が完了しました',
  },
  decksIndex: {
    breadcrumbTitle: '教材一覧',
    title: '教材一覧',
  },
  deckDetail: {
    breadcrumbList: '教材一覧',
    noQuizWords: 'クイズできる単語がありませんでした',
    continueLast: '前回の続き',
    startChapter1: 'Chapter 01からはじめる',
    premiumStart: '🔒 プレミアム登録ではじめる',
    noWordData: '単語データがまだありません',
    start: 'はじめる',
    allChapters: '全章を解く',
  },
  wordlist: {
    breadcrumb: 'My単語帳',
    title: 'My単語帳',
    subtitle: '辞書から単語を検索してオリジナルの単語帳をつくれます。',
    emptyCta: '辞書から単語を検索してオリジナルの単語帳をつくろう',
  },
  quiz: {
    start: 'はじめる',
    scopeAll: 'ランダム',
    scopeUnseen: '未習得',
    scopeReview: '要復習',
    scopeHard: '苦手',
    scopeRecent: 'まとめて',
    scopeItemsSuffix: '問',
    scopeHeader: '出題範囲',
    donutMastered: '習得済',
    donutUnseen: '未習得',
    donutReview: '要復習',
    donutHard: '苦手',
    settingsTitle: '出題形式の設定',
    settingsOpen: '出題形式の設定',
    defaultModeLabel: 'デフォルト表示設定',
    defaultModeExample: '例文',
    defaultModeWord: '単語',
    questionCountLabel: '一回の問題数',
    autoPlayExampleLabel: '例文音声の自動再生',
    autoPlayHeadwordLabel: '見出し語音声の自動再生',
    stepDecrease: '減らす',
    stepIncrease: '増やす',
  },
  quizSession: {
    back: '戻る',
    quit: '終了',
    reveal: '解説を見る',
    hide: '解説を閉じる',
    notYet: 'まだ',
    gotIt: '覚えた',
    correctCountLabel: 'わかった数',
    next: '次へ',
    wrong: (n: number) => `わからなかった（${n}語）`,
    correct: (n: number) => `わかった（${n}語）`,
    retry: (n: number) => `${n}問を復習`,
    howToTitle: '使い方',
    howToBody: '単語や例文を見て意味を思い出したら「覚えた」、思い出せなかったら「まだ」を押しましょう。間違えた単語だけ再挑戦することもできます。',
    howToStart: 'はじめる',
    loading: '読み込み中...',
    noSavedWords: '保存した単語がありません',
    goToWordlist: '単語リストへ',
  },
  dashboard: {
    dayLabels: ['月', '火', '水', '木', '金', '土', '日'],
    streakLabel: '連続ログイン',
    streakUnit: '日',
    shareSNS: 'SNSでシェア',
    sharePreparing: '準備中...',
    shareFailed: 'シェアに失敗しました',
    levelUp: 'レベルアップ！',
    streakLearning: (n: number) => `連続${n}日学習中`,
    growWithLogin: '毎日ログインして育てよう',
    nextEvolution: (pt: number) => `あと${pt}ptで次の進化`,
    usageTitle: '利用状況',
    studyingCount: '学習中の単語数',
    masteredCount: '覚えた単語数',
    createWordlistTitle: '辞書から単語帳を作成',
    reviewTitle: '復習',
    historyTitle: '履歴',
    examPrepTitle: '試験対策',
    myWordlistTitle: 'My単語帳',
    moreSuffix: 'もっと見る',
    searchAria: '検索',
    periodYesterday: '昨日',
    periodWeek: '1週間',
    periodMonth: '1ヶ月',
    periodAll: '全期間',
    shareStreakText: (streak: number) => `${streak}日連続で英単語学習🔥\n\n#RootLink #英単語 #語源学習`,
    shareLevelUpText: (level: number, streak: number) => `単語学習でLv.${level}に成長🌱 ${streak}日連続学習中\n\n#RootLink #英単語 #語源学習`,
  },
  quizDashboard: {
    emptySaved: '単語リストに単語を保存するとはじめられます',
    description: '辞書から作った単語帳とデッキの単語をまとめて復習できます',
    tutorialSkip: 'スキップ',
    tutorialTitle: '定着させよう',
    tutorialBody: 'あなたが学んだ単語のストックを効率的にフラッシュカードにして学習できます。単語が溜まってきたら復習しましょう。',
    tutorialNext: '次へ',
    startLabel: 'スタート',
    masteredCenter: '習得済',
  },
  paywall: {
    title: 'プランのアップグレード',
    subtitle: '有料デッキ・クイズ・辞書が使い放題。いつでも解約できます。',
    offeringError: 'プラン情報の取得に失敗しました。しばらくしてからもう一度お試しください。',
    recommended: 'おすすめ',
    yearlyPlan: '年額プラン',
    monthlyPlan: '月額プラン',
    perYear: ' / 年',
    perMonth: ' / 月',
    monthlyEquivalent: (v: string) => `月あたり${v}`,
    yearlyDiscount: (v: string) => `年${v}お得`,
    trialCta: '14日間無料ではじめる',
    monthlyCta: '月額プランで始める',
    yearlyCta: '年額プランで始める',
    processing: '処理中...',
    featureDecks: (count: number, totalWords: string) => `✓ 有料デッキ${count}本(${totalWords}語)が使い放題`,
    featureDecksLoading: '✓ 有料デッキが使い放題',
    featureUnlimited: '✓ 辞書で調べた単語を無制限に保存',
    freePlanLimit: (n: number) => `無料プランは${n}件まで`,
    restore: '購入を復元',
    restoring: '復元中...',
    autoRenewTitle: '自動更新について',
    autoRenewStart: '選択したプランで自動的に課金が開始されます。',
    autoRenewContinue: '選択したプランで自動的に課金が継続されます。',
    autoRenewMonthly: (price: string) => `■ 月額プラン ${price} / 月`,
    autoRenewYearly: (price: string) => `■ 年額プラン ${price} / 年`,
    autoRenewAfterTrial: '（14日間無料後）',
    terms: '利用規約',
    privacy: 'プライバシーポリシー',
    close: '閉じる',
    billingIos: [
      '支払いは購入確定時に Apple ID に請求されます',
      '自動更新は現在の期間終了の24時間前までにキャンセルしない限り継続されます',
      'App Store の [設定] → [Apple ID] → [サブスクリプション] からいつでも解約できます',
    ],
    billingAndroid: [
      '支払いは購入確定時に Google アカウントに請求されます',
      '自動更新は現在の期間終了の24時間前までにキャンセルしない限り継続されます',
      'Google Play の [アカウント] → [お支払いと定期購入] → [定期購入] からいつでも解約できます',
    ],
    billingWeb: [
      '支払いは Stripe を通じて決済されます',
      '自動更新は現在の期間終了までにキャンセルしない限り継続されます',
      'マイページの [プランを管理] からいつでも解約できます',
    ],
    nativePurchaseFailed: '購入に失敗しました',
    nativePurchaseSucceeded: 'プレミアム開始しました',
    nativeRestoreFailed: '復元に失敗しました',
    nativeNothingToRestore: '復元できる購入はありません',
    nativeRestoreSucceeded: '購入を復元しました',
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
    openWordPage: 'Open word page',
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
  common: {
    home: 'Home',
    close: 'Close',
    search: 'Search',
    loginRequired: 'Please log in',
    actionFailed: 'Something went wrong',
    updated: 'Updated',
    loadMore: (n: number) => `Show more (+${n})`,
    change: 'Change',
    save: 'Save',
    cancel: 'Cancel',
    saveFailed: 'Failed to save',
    sessionExpired: 'Your session expired. Please try again.',
    unexpectedError: 'An error occurred',
    back: 'Back',
    done: 'Done',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    quotaExceeded: 'You have reached the free daily limit',
    audioPlay: 'Play audio',
    audioUnavailable: 'Audio unavailable',
    shareLabel: 'Share',
    savedLabel: 'Saved',
    saveLabel: 'Save',
    plantAlt: (levelLabel: string) => `Plant ${levelLabel}`,
    plantNext: (pt: number, lv: string) => `${pt} pt to Lv.${lv}`,
    myWordlistTitle: 'My wordlist',
    myWordlistBody: 'Save words that catch your eye and build your own wordlist',
    myWordlistCta: 'Search and add',
    accountDeleted: 'Your account has been deleted',
  },
  decksIndex: {
    breadcrumbTitle: 'Decks',
    title: 'Decks',
  },
  deckDetail: {
    breadcrumbList: 'Decks',
    noQuizWords: 'No words available to quiz',
    continueLast: 'Continue where you left off',
    startChapter1: 'Start with Chapter 01',
    premiumStart: '🔒 Start with Premium',
    noWordData: 'No word data yet',
    start: 'Start',
    allChapters: 'All chapters',
  },
  wordlist: {
    breadcrumb: 'My Wordlist',
    title: 'My Wordlist',
    subtitle: 'Search the dictionary to build your own wordlist.',
    emptyCta: 'Search the dictionary to start building your wordlist',
  },
  quiz: {
    start: 'Start',
    scopeAll: 'Random',
    scopeUnseen: 'New',
    scopeReview: 'Review',
    scopeHard: 'Tough',
    scopeRecent: 'Recent',
    scopeItemsSuffix: '',
    scopeHeader: 'Question set',
    donutMastered: 'Mastered',
    donutUnseen: 'New',
    donutReview: 'Review',
    donutHard: 'Tough',
    settingsTitle: 'Quiz settings',
    settingsOpen: 'Quiz settings',
    defaultModeLabel: 'Default side',
    defaultModeExample: 'Example',
    defaultModeWord: 'Word',
    questionCountLabel: 'Questions per round',
    autoPlayExampleLabel: 'Auto-play example audio',
    autoPlayHeadwordLabel: 'Auto-play headword audio',
    stepDecrease: 'Decrease',
    stepIncrease: 'Increase',
  },
  quizSession: {
    back: 'Back',
    quit: 'Quit',
    reveal: 'Show details',
    hide: 'Hide details',
    notYet: 'Not yet',
    gotIt: 'Got it',
    correctCountLabel: 'Correct',
    next: 'Next',
    wrong: (n: number) => `Missed (${n})`,
    correct: (n: number) => `Correct (${n})`,
    retry: (n: number) => `Review ${n}`,
    howToTitle: 'How it works',
    howToBody: 'Look at the word or example and tap "Got it" if you remember the meaning, or "Not yet" if not. You can retry only the words you missed.',
    howToStart: 'Start',
    loading: 'Loading...',
    noSavedWords: 'No saved words yet',
    goToWordlist: 'Go to wordlist',
  },
  dashboard: {
    dayLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    streakLabel: 'Streak',
    streakUnit: 'days',
    shareSNS: 'Share on social',
    sharePreparing: 'Preparing...',
    shareFailed: 'Sharing failed',
    levelUp: 'Level up!',
    streakLearning: (n: number) => `${n}-day learning streak`,
    growWithLogin: 'Log in every day to grow',
    nextEvolution: (pt: number) => `${pt} pt to next stage`,
    usageTitle: 'Your activity',
    studyingCount: 'Words you are learning',
    masteredCount: 'Words mastered',
    createWordlistTitle: 'Build your wordlist from the dictionary',
    reviewTitle: 'Review',
    historyTitle: 'Recently viewed',
    examPrepTitle: 'Exam prep',
    myWordlistTitle: 'My Wordlist',
    moreSuffix: 'See more',
    searchAria: 'Search',
    periodYesterday: 'Yesterday',
    periodWeek: 'Past 7 days',
    periodMonth: 'Past 30 days',
    periodAll: 'All time',
    shareStreakText: (streak: number) => `${streak}-day English vocabulary streak 🔥\n\n#RootLink #Vocabulary #Etymology`,
    shareLevelUpText: (level: number, streak: number) => `Leveled up to Lv.${level} on RootLink 🌱 ${streak}-day streak\n\n#RootLink #Vocabulary #Etymology`,
  },
  quizDashboard: {
    emptySaved: 'Save a few words to start quizzing',
    description: 'Review the words from your wordlist and decks all in one place',
    tutorialSkip: 'Skip',
    tutorialTitle: 'Lock it in',
    tutorialBody: 'Turn your saved words into flashcards and review them whenever you like.',
    tutorialNext: 'Next',
    startLabel: 'Start',
    masteredCenter: 'Mastered',
  },
  paywall: {
    title: 'Upgrade your plan',
    subtitle: 'Unlimited access to paid decks, quizzes, and the dictionary. Cancel anytime.',
    offeringError: 'Could not load plan information. Please try again shortly.',
    recommended: 'Recommended',
    yearlyPlan: 'Yearly plan',
    monthlyPlan: 'Monthly plan',
    perYear: ' / year',
    perMonth: ' / month',
    monthlyEquivalent: (v: string) => `${v} / month`,
    yearlyDiscount: (v: string) => `Save ${v} per year`,
    trialCta: 'Start 14-day free trial',
    monthlyCta: 'Start monthly plan',
    yearlyCta: 'Start yearly plan',
    processing: 'Processing...',
    featureDecks: (count: number, totalWords: string) => `✓ Unlimited access to ${count} paid decks (${totalWords} words)`,
    featureDecksLoading: '✓ Unlimited access to paid decks',
    featureUnlimited: '✓ Save unlimited words from the dictionary',
    freePlanLimit: (n: number) => `Free plan is limited to ${n} words`,
    restore: 'Restore purchase',
    restoring: 'Restoring...',
    autoRenewTitle: 'About auto-renewal',
    autoRenewStart: 'Your selected plan will begin billing automatically.',
    autoRenewContinue: 'Your selected plan will continue billing automatically.',
    autoRenewMonthly: (price: string) => `■ Monthly plan ${price} / month`,
    autoRenewYearly: (price: string) => `■ Yearly plan ${price} / year`,
    autoRenewAfterTrial: ' (after 14-day free trial)',
    terms: 'Terms',
    privacy: 'Privacy',
    close: 'Close',
    billingIos: [
      'Payment will be charged to your Apple ID at confirmation of purchase',
      'Auto-renewal continues unless cancelled at least 24 hours before the end of the current period',
      'You can cancel anytime from App Store → Settings → Apple ID → Subscriptions',
    ],
    billingAndroid: [
      'Payment will be charged to your Google account at confirmation of purchase',
      'Auto-renewal continues unless cancelled at least 24 hours before the end of the current period',
      'You can cancel anytime from Google Play → Account → Payments and subscriptions → Subscriptions',
    ],
    billingWeb: [
      'Payment is processed via Stripe',
      'Auto-renewal continues unless cancelled before the end of the current period',
      'You can cancel anytime from "Manage plan" on your profile',
    ],
    nativePurchaseFailed: 'Purchase failed',
    nativePurchaseSucceeded: 'Premium activated',
    nativeRestoreFailed: 'Restore failed',
    nativeNothingToRestore: 'No purchases to restore',
    nativeRestoreSucceeded: 'Purchase restored',
  },
}

export const messages: Record<DisplayLocale, Messages> = { ja, en }
