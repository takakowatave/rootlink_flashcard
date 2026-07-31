import type { Meta, StoryObj } from '@storybook/react'
import WordDetailModal from '../app/components/WordDetailModal'
import type { SavedWordDictionary } from '../app/types/Dictionary'

const dictionary = {
  ipa: 'pəˈsɪst',
  audio: null,
  inflections: ['persisted', 'persisting', 'persists'],
  senseGroups: [
    {
      partOfSpeech: 'verb',
      senses: [
        {
          senseId: 'sense-1',
          definition: 'continue firmly or obstinately in an opinion or course of action in spite of difficulty.',
          example: 'She persisted in her efforts despite many setbacks.',
        },
      ],
    },
  ],
  locales: {
    ja: {
      senses: {
        'sense-1': {
          meaning: '固執する、粘り強く続ける',
          exampleTranslation: '多くの挫折にもかかわらず、彼女は努力を続けた。',
        },
      },
    },
  },
} as unknown as SavedWordDictionary

const meta: Meta<typeof WordDetailModal> = {
  title: 'Components/WordDetailModal',
  component: WordDetailModal,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof WordDetailModal>

export const Default: Story = {
  args: {
    word: 'persist',
    dictionary,
    displayLocale: 'ja',
    onClose: () => {},
  },
}

export const English: Story = {
  args: {
    word: 'persist',
    dictionary,
    displayLocale: 'en',
    onClose: () => {},
  },
}
