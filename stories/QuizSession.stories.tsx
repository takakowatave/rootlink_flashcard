import type { Meta, StoryObj } from '@storybook/react'
import QuizSession, { type QuizCard, type QuizEntry } from '../app/components/QuizSession'

// クイズ本体（`fixed inset-0` の全画面レイヤー）。Storybook では全画面プレビュー扱いにする。
// 音声は本番 API を叩くため Storybook 上では再生されなくてよい。ここでは見た目・遷移を確認する。

const meta: Meta<typeof QuizSession> = {
  title: 'Quiz/QuizSession',
  component: QuizSession,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof QuizSession>

const wordCard: QuizCard = {
  word: 'shove',
  ipa: 'ʃʌv',
  meaning: '（乱暴に）押しやる、突き飛ばす',
  meaningEn: 'to push (someone or something) with a rough, quick movement',
  example: 'She shoved him aside and marched into the room.',
  exampleJa: '彼女は彼を押しのけて部屋に入っていった。',
  senseId: 'sense-1',
  pos: 'verb',
}

const phraseCard: QuizCard = {
  word: 'shove off',
  meaning: '立ち去る、出発する',
  meaningEn: 'to leave, especially in a boat',
  example: 'Shove off — I want to be alone.',
  exampleJa: 'あっちへ行って。一人にしてほしいの。',
  phrase_card_id: 'phrase-1',
}

const wordOnlyCard: QuizCard = {
  word: 'ephemeral',
  ipa: 'ɪˈfɛm(ə)rəl',
  meaning: 'つかの間の、短命の',
  meaningEn: 'lasting for a very short time',
  senseId: 'sense-eph',
  pos: 'adjective',
}

const entries: QuizEntry[] = [
  { word: 'shove', dictionary: null },
  { word: 'shove off', dictionary: null, phrase_card_id: 'phrase-1' },
  { word: 'ephemeral', dictionary: null },
]

export const SingleCard: Story = {
  name: '1問だけ (回答して結果画面まで確認)',
  args: {
    initialCards: [wordCard],
    entries,
    onQuit: () => {},
  },
}

export const WithExample: Story = {
  name: '例文モード（デフォルト）',
  args: {
    initialCards: [wordCard, phraseCard, wordOnlyCard],
    entries,
    onQuit: () => {},
  },
}

export const WordOnlyStart: Story = {
  name: '例文なしカード（word モード強制）',
  args: {
    initialCards: [wordOnlyCard, wordCard],
    entries,
    onQuit: () => {},
  },
}

export const PhraseCard: Story = {
  name: 'フレーズカード',
  args: {
    initialCards: [phraseCard],
    entries,
    onQuit: () => {},
  },
}
