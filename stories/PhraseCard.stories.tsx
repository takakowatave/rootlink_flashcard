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
