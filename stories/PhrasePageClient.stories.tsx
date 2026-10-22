import type { Meta, StoryObj } from '@storybook/react'
import PhrasePageClient from '../app/components/PhrasePageClient'

// フレーズ詳細画面。Storybook では supabase を未ログインの代替に差し替えている（.storybook/mocks）
const meta: Meta<typeof PhrasePageClient> = {
  title: 'Pages/PhrasePageClient',
  component: PhrasePageClient,
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="max-w-[390px]"><Story /></div>],
}
export default meta

type Story = StoryObj<typeof PhrasePageClient>

const sense = (meaning_ja: string, example_en: string, example_ja: string, explanation_ja: string) => ({
  sense_id: 's1', meaning_ja, meaning_en: null, explanation_ja, explanation_en: null, example_en, example_ja,
})

export const CouldDoWith: Story = {
  args: {
    card: {
      id: 'story-1', phrase: 'could do with something', type: 'idiom', register: 'informal', locale: 'en-GB',
      meaning_ja: null, meaning_en: null, explanation_ja: null, explanation_en: null, example_en: null, example_ja: null,
      us_equivalent: 'I could use ~',
      senses: [sense('〜があるとありがたい', 'I could do with a cup of tea.', '紅茶が一杯欲しいところだ。', 'I want より控えめな言い方。疲れたときやのどが渇いたときなど、いま欲しいものを伝えるときに使う。')],
    },
  },
}

export const OnHoliday: Story = {
  args: {
    card: {
      id: 'story-2', phrase: 'on holiday', type: 'collocation', register: 'neutral', locale: 'en-GB',
      meaning_ja: null, meaning_en: null, explanation_ja: null, explanation_en: null, example_en: null, example_ja: null,
      us_equivalent: 'on vacation',
      senses: [sense('休暇中で', "She's on holiday until next Monday.", '彼女は来週の月曜まで休暇中です。', '仕事や学校を休んで出かける休暇を指す。アメリカ英語の holiday は祝日の意味が多い。')],
    },
  },
}

export const BudgeUp: Story = {
  args: {
    card: {
      id: 'story-3', phrase: 'budge up', type: 'phrasal_verb', register: 'informal', locale: 'en-GB',
      meaning_ja: null, meaning_en: null, explanation_ja: null, explanation_en: null, example_en: null, example_ja: null,
      us_equivalent: 'scoot over',
      senses: [sense('詰めて座る', 'Can you budge up a bit so I can sit down?', 'ちょっと詰めてくれる？私も座りたいから。', '座っている人に「詰めて」と頼むくだけた言い方。ベンチやソファ、電車の座席などで使う。')],
    },
  },
}
