import type { Meta, StoryObj } from '@storybook/react'
import SenseRow from '../app/components/SenseRow'

const meta: Meta<typeof SenseRow> = {
  title: 'Design System/SenseRow',
  component: SenseRow,
  parameters: { layout: 'padded' },
  argTypes: {
    displayLocale: { control: 'radio', options: ['ja', 'en'] },
    exampleLoading: { control: 'boolean' },
    isPinned: { control: 'boolean' },
    showPinButton: { control: 'boolean' },
    onPlayExample: { action: 'play' },
    onTogglePin: { action: 'togglePin' },
  },
}
export default meta

type Story = StoryObj<typeof SenseRow>

const InCardContext = ({ children }: { children: React.ReactNode }) => (
  <div className="max-w-md rounded-xl border border-line bg-white p-4">
    {children}
  </div>
)

export const Word_Single: Story = {
  name: 'Word — single sense (no ordinal, with pin)',
  render: (args) => (
    <InCardContext>
      <SenseRow {...args} />
    </InCardContext>
  ),
  args: {
    meaning: '急速に普及する',
    example: 'Electric cars are really starting to take off in the UK.',
    translation: '電気自動車がイギリスで本当に普及し始めている。',
    displayLocale: 'ja',
    showPinButton: true,
    isPinned: false,
  },
}

export const Phrase_MultiSense_1: Story = {
  name: 'Phrase — multi-sense (ordinal 1., pinned)',
  render: (args) => (
    <InCardContext>
      <SenseRow {...args} />
    </InCardContext>
  ),
  args: {
    meaning: '急速に普及する',
    ordinal: 1,
    example: 'Electric cars are really starting to take off in the UK.',
    translation: '電気自動車がイギリスで本当に普及し始めている。',
    displayLocale: 'ja',
    showPinButton: true,
    isPinned: true,
  },
}

export const Phrase_MultiSense_2: Story = {
  name: 'Phrase — multi-sense (ordinal 2., unpinned)',
  render: (args) => (
    <InCardContext>
      <SenseRow {...args} />
    </InCardContext>
  ),
  args: {
    meaning: '離陸する',
    ordinal: 2,
    example: 'The plane took off on time.',
    translation: '飛行機は定刻に離陸した。',
    displayLocale: 'ja',
    showPinButton: true,
    isPinned: false,
  },
}

export const WithGrammarTags: Story = {
  name: 'With grammar tags (word style)',
  render: (args) => (
    <InCardContext>
      <SenseRow {...args} />
    </InCardContext>
  ),
  args: {
    meaning: '〜を成し遂げる',
    example: 'She accomplished the task ahead of schedule.',
    translation: '彼女は予定より早くその仕事を成し遂げた。',
    displayLocale: 'ja',
    grammarTags: ['with object'],
    showPinButton: true,
    isPinned: false,
  },
}

export const NoPinButton: Story = {
  name: 'No pin button',
  render: (args) => (
    <InCardContext>
      <SenseRow {...args} />
    </InCardContext>
  ),
  args: {
    meaning: '急速に普及する',
    example: 'Electric cars are really starting to take off in the UK.',
    translation: '電気自動車がイギリスで本当に普及し始めている。',
    displayLocale: 'ja',
    showPinButton: false,
  },
}
