import type { Meta, StoryObj } from '@storybook/react'
import PhraseNotes from '../app/components/PhraseNotes'

const meta: Meta<typeof PhraseNotes> = {
  title: 'Design System/PhraseNotes',
  component: PhraseNotes,
  parameters: { layout: 'padded' },
  argTypes: { displayLocale: { control: 'radio', options: ['ja', 'en'] } },
  decorators: [(Story) => <div className="max-w-[374px]"><Story /></div>],
}
export default meta

type Story = StoryObj<typeof PhraseNotes>

export const WithUsEquivalent: Story = {
  args: {
    explanation: 'I want より控えめな言い方。疲れたときやのどが渇いたときなど、いま欲しいものを伝えるときに使う。',
    usEquivalent: 'I could use ~',
    displayLocale: 'ja',
  },
}

export const ExplanationOnly: Story = {
  args: {
    explanation: 'who や what などの疑問詞のあとに置いて、驚きやいら立ちを強める。',
    displayLocale: 'ja',
  },
}
