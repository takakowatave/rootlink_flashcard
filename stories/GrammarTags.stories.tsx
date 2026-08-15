import type { Meta, StoryObj } from '@storybook/react'
import GrammarTags from '../app/components/GrammarTags'

const meta: Meta<typeof GrammarTags> = {
  title: 'Design System/GrammarTags',
  component: GrammarTags,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="flex flex-wrap gap-2 max-w-[420px]">
        <Story />
      </div>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof GrammarTags>

const SAMPLE = ['with object', 'mass noun', 'usually as adjective', 'in singular']

export const Ja: Story = {
  name: '日本語ラベル',
  args: { tags: SAMPLE, displayLocale: 'ja' },
}

export const En: Story = {
  name: '英語（Oxford原文）',
  args: { tags: SAMPLE, displayLocale: 'en' },
}

export const Empty: Story = {
  args: { tags: [], displayLocale: 'ja' },
}

export const UnknownTag: Story = {
  name: '未登録タグ（フォールバック）',
  args: { tags: ['with object', 'mysterious phrase'], displayLocale: 'ja' },
}
