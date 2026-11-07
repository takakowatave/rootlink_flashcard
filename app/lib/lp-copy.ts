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
      headlineBefore: 'Learn English words',
      headlineHighlight: 'by their roots',
      headlineAfter: '',
      searchAriaLabel: 'Search',
    },
    about: {
      title: 'What is RootLink?',
      intro: {
        lead: 'RootLink is ',
        strong: 'a vocabulary tool for learning words by the links between them',
        tail: '.',
      },
      body: 'A dictionary and wordlist built around etymology. Every search breaks a word down into its roots and affixes right on the spot, so you understand its parts — not just the word itself.',
      highlight: 'One root unlocks a whole family of related words at once, instead of memorising one word at a time.',
    },
    features: {
      title: 'Three things that make RootLink different',
      items: [
        {
          title: 'Guess unknown words from their roots',
          body: 'Even a word you have never seen before becomes readable once you know its roots. Move from reading English by feel to reading it by structure.',
        },
        {
          title: 'Switch between Japanese and English definitions',
          body: 'One tap toggles between a Japanese gloss and an English-English definition. Start in your native language, then shift to English-only to think in English.',
        },
        {
          title: 'Every saved word becomes a flashcard',
          body: 'The words you save do not just sit there. Every saved word is instantly reviewable as a flashcard, so searching the dictionary builds your review deck for you.',
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
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      contact: 'Contact',
      copyright: '© 2026 RootLink. All rights reserved.',
    },
  },
}
