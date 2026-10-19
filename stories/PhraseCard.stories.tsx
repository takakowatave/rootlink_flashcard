import type { Meta, StoryObj } from '@storybook/react'
import PhraseCard, { type PhraseCardData } from '../app/components/PhraseCard'

const baseCard: PhraseCardData = {
  id: 'sample-1',
  phrase: 'take off',
  meaning_ja: '急速に普及する',
  meaning_en: 'to become popular quickly',
  example_en: 'Electric cars are really starting to take off in the UK.',
  example_ja: '電気自動車がイギリスで本当に普及し始めている。',
  type: 'phrasal_verb',
  register: 'neutral',
  locale: null,
  senses: [
    {
      sense_id: 's1',
      meaning_ja: '急速に普及する',
      meaning_en: 'to become popular quickly',
      example_en: 'Electric cars are really starting to take off in the UK.',
      example_ja: '電気自動車がイギリスで本当に普及し始めている。',
    },
  ],
}

const meta: Meta<typeof PhraseCard> = {
  title: 'Design System/PhraseCard',
  component: PhraseCard,
  parameters: { layout: 'padded' },
  argTypes: {
    displayLocale: { control: 'radio', options: ['ja', 'en'] },
    isSaved: { control: 'boolean' },
    headwordAudioLoading: { control: 'boolean' },
    exampleAudioLoading: { control: 'boolean' },
    onSave: { action: 'save' },
    onClick: { action: 'card-click' },
    onPlayHeadword: { action: 'play-headword' },
    onPlayExample: { action: 'play-example' },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof PhraseCard>

export const Default: Story = {
  args: {
    card: baseCard,
    isSaved: false,
    displayLocale: 'ja',
    onPlayHeadword: () => {},
    onPlayExample: () => {},
  },
}

export const Saved: Story = {
  args: {
    card: baseCard,
    isSaved: true,
    displayLocale: 'ja',
    onPlayHeadword: () => {},
    onPlayExample: () => {},
  },
}

export const EnglishDisplay: Story = {
  args: {
    card: baseCard,
    isSaved: false,
    displayLocale: 'en',
    onPlayHeadword: () => {},
    onPlayExample: () => {},
  },
}

export const WithLocaleAndRegister: Story = {
  args: {
    card: {
      ...baseCard,
      id: 'sample-2',
      phrase: 'have a chinwag',
      meaning_ja: 'おしゃべりする',
      meaning_en: 'to have a friendly chat',
      example_en: 'We had a right chinwag over a cuppa.',
      example_ja: '紅茶を飲みながらしっかりおしゃべりした。',
      register: 'informal',
      locale: 'en-GB',
      senses: [
        {
          sense_id: 's2',
          meaning_ja: 'おしゃべりする',
          meaning_en: 'to have a friendly chat',
          example_en: 'We had a right chinwag over a cuppa.',
          example_ja: '紅茶を飲みながらしっかりおしゃべりした。',
        },
      ],
    },
    isSaved: false,
    displayLocale: 'ja',
    onPlayHeadword: () => {},
    onPlayExample: () => {},
  },
}

export const NoAudio: Story = {
  name: 'No audio callbacks (embed context)',
  args: {
    card: baseCard,
    isSaved: false,
    displayLocale: 'ja',
  },
}

export const LoadingAudio: Story = {
  args: {
    card: baseCard,
    isSaved: false,
    displayLocale: 'ja',
    headwordAudioLoading: true,
    exampleAudioLoading: true,
    onPlayHeadword: () => {},
    onPlayExample: () => {},
  },
}

export const NoExample: Story = {
  args: {
    card: {
      ...baseCard,
      id: 'sample-3',
      example_en: null,
      example_ja: null,
      senses: [
        {
          sense_id: 's3',
          meaning_ja: '急速に普及する',
          meaning_en: 'to become popular quickly',
          example_en: null,
          example_ja: null,
        },
      ],
    },
    isSaved: false,
    displayLocale: 'ja',
    onPlayHeadword: () => {},
  },
}

export const WithNotes: Story = {
  args: {
    card: {
      id: 'sample-notes',
      phrase: 'could do with something',
      meaning_ja: '〜があるとありがたい',
      meaning_en: 'to need or want something',
      example_en: 'I could do with a cup of tea.',
      example_ja: '紅茶が一杯欲しいところだ。',
      type: 'idiom',
      register: 'informal',
      locale: 'en-GB',
      us_equivalent: 'I could use ~',
      senses: [
        {
          sense_id: 's1',
          meaning_ja: '〜があるとありがたい',
          meaning_en: 'to need or want something',
          example_en: 'I could do with a cup of tea.',
          example_ja: '紅茶が一杯欲しいところだ。',
          explanation_ja: 'I want より控えめな言い方。疲れたときやのどが渇いたときなど、いま欲しいものを伝えるときに使う。',
          explanation_en: 'A softer way of saying you want or need something.',
        },
      ],
    },
    isSaved: false,
    displayLocale: 'ja',
    onPlayHeadword: () => {},
    onPlayExample: () => {},
  },
}

export const BritishEnglishPhrasalVerb: Story = {
  args: {
    card: {
      id: 'sample-gb-only',
      phrase: 'budge up',
      meaning_ja: '詰めて座る',
      meaning_en: 'to move along to make room for someone to sit',
      example_en: 'Can you budge up a bit so I can sit down?',
      example_ja: 'ちょっと詰めてくれる？私も座りたいから。',
      type: 'phrasal_verb',
      register: 'informal',
      locale: 'en-GB',
      us_equivalent: 'scoot over',
      senses: [
        {
          sense_id: 's1',
          meaning_ja: '詰めて座る',
          meaning_en: 'to move along to make room for someone to sit',
          example_en: 'Can you budge up a bit so I can sit down?',
          example_ja: 'ちょっと詰めてくれる？私も座りたいから。',
          explanation_ja: '座っている人に「詰めて」と頼むくだけた言い方。ベンチやソファ、電車の座席などで使う。',
          explanation_en: 'Used when asking someone to move to make space on a seat.',
        },
      ],
    },
    isSaved: false,
    displayLocale: 'ja',
    onPlayHeadword: () => {},
    onPlayExample: () => {},
  },
}
