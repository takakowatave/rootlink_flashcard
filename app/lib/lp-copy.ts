import type { DisplayLocale } from '@/types/DisplayLocale'

type LpCopy = {
  hero: {
    headlineBefore: string
    headlineHighlight: string
    headlineAfter: string
    searchAriaLabel: string
  }
  about: {
    title: string
    intro: { lead: string; strong: string; tail: string }
    body: string
    highlight: string
  }
  features: {
    title: string
    items: Array<{ title: string; body: string }>
  }
  decks: {
    title: string
    body: string
    groups: Record<'TOEIC' | 'IELTS' | 'TOEFL' | 'eiken', string>
    pre1Label: string
    g1Label: string
  }
  cta: {
    platform: string
    status: string
  }
  footer: {
    privacy: string
    terms: string
    contact: string
    copyright: string
  }
}

export const lpCopy: Record<DisplayLocale, LpCopy> = {
  ja: {
    hero: {
      headlineBefore: '関連性で単語を',
      headlineHighlight: '芋づる式',
      headlineAfter: 'に覚えよう',
      searchAriaLabel: '検索',
    },
    about: {
      title: 'RootLinkとは？',
      intro: {
        lead: 'RootLinkは',
        strong: '関連性で英単語を理解し、つながりで覚えるための学習ツール',
        tail: 'です。',
      },
      body: '「語源のつながり」から学べる辞書×単語帳です。検索した単語をその場で意味だけでなく語源パーツまで分解して理解できるから、',
      highlight: '単発の暗記で終わらず、関連語まで芋づる式に覚えられます。',
    },
    features: {
      title: 'RootLinkの3つの特徴',
      items: [
        {
          title: '語源パーツで未知語を推測',
          body: '初めて見た単語でも、語根がわかれば意味が推測できます。知らない単語を「なんとなく読む」から「構造で読む」へ。',
        },
        {
          title: '和英⇄英英のモード切り替え',
          body: 'ボタン一つで和英⇄英英を切り替えられます。まずは日本語で意味をつかみ、慣れてきたら英英モードで英語のまま考える力をつけられます。',
        },
        {
          title: 'フラッシュカードで記憶を定着',
          body: 'せっかくストックした単語を眠らせていませんか？保存した単語はそのままフラッシュカードでテストできます。検索するだけで復習の仕組みが自然にできあがります。',
        },
      ],
    },
    decks: {
      title: '試験対策の教材も充実',
      body: 'RootLinkは試験対策にも対応。オリジナルの単語帳も作れますが、幅広い試験対策の教材も用意しています。',
      groups: { TOEIC: 'TOEIC', IELTS: 'IELTS', TOEFL: 'TOEFL', eiken: '英検' },
      pre1Label: '準1級',
      g1Label: '1級',
    },
    cta: {
      platform: 'iOS / Android',
      status: '配信中',
    },
    footer: {
      privacy: 'プライバシーポリシー',
      terms: '利用規約',
      contact: 'お問い合わせ',
      copyright: '© 2026 RootLink. All rights reserved.',
    },
  },
  en: {
    hero: {
      headlineBefore: 'Learn words',
      headlineHighlight: 'by their roots',
      headlineAfter: '',
      searchAriaLabel: 'Search',
    },
    about: {
      title: 'What is RootLink?',
      intro: {
        lead: 'RootLink is ',
        strong: 'a dictionary that teaches words by their roots',
        tail: '.',
      },
      body: 'Every word is broken down into its roots and affixes, so you see how the meaning is built.',
      highlight: 'Learn one root, and a whole family of words comes with it.',
    },
    features: {
      title: 'What makes it different',
      items: [
        {
          title: 'Decode unknown words',
          body: 'Know the roots, guess the meaning. Read English by structure, not by feel.',
        },
        {
          title: 'Japanese or English, your call',
          body: 'Tap to switch between a Japanese gloss and a plain-English definition.',
        },
        {
          title: 'Every saved word is a flashcard',
          body: 'Search, save, review — in one flow. No extra setup.',
        },
      ],
    },
    decks: {
      title: 'Ready-made decks for major exams',
      body: 'RootLink supports test prep too. Build your own wordlist, or use the official decks covering major English exams.',
      groups: { TOEIC: 'TOEIC', IELTS: 'IELTS', TOEFL: 'TOEFL', eiken: 'Eiken' },
      pre1Label: 'Pre-1',
      g1Label: 'Grade 1',
    },
    cta: {
      platform: 'iOS / Android',
      status: 'Available now',
    },
    footer: {
      privacy: 'Privacy',
      terms: 'Terms',
      contact: 'Contact',
      copyright: '© 2026 RootLink. All rights reserved.',
    },
  },
}
