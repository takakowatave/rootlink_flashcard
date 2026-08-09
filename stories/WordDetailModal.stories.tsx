import type { Meta, StoryObj } from '@storybook/react'
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport'
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

/** PC: 中央 max-w-[720px] のダイアログ。chrome は 拡大↗ / 共有 / 閉じる */
export const PC: Story = {
  args: {
    word: 'persist',
    dictionary,
    displayLocale: 'ja',
    onClose: () => {},
  },
  parameters: {
    viewport: { defaultViewport: 'responsive' },
  },
}

/** SP: 全面モーダル。chrome は 戻る< / 共有 のみ */
export const SP: Story = {
  args: {
    word: 'persist',
    dictionary,
    displayLocale: 'ja',
    onClose: () => {},
  },
  parameters: {
    viewport: {
      viewports: INITIAL_VIEWPORTS,
      defaultViewport: 'iphone6',
    },
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
