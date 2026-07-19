import type { Meta, StoryObj } from '@storybook/react'
import SenseExample from '../app/components/SenseExample'

const meta: Meta<typeof SenseExample> = {
  title: 'Design System/SenseExample',
  component: SenseExample,
  parameters: { layout: 'padded' },
  argTypes: {
    displayLocale: { control: 'radio', options: ['ja', 'en'] },
    isLoading: { control: 'boolean' },
    onPlay: { action: 'play' },
  },
}
export default meta

type Story = StoryObj<typeof SenseExample>

const InCardContext = ({ children }: { children: React.ReactNode }) => (
  <div className="max-w-md rounded-xl border border-line bg-white p-4">
    <p className="text-base font-medium text-black">急速に普及する</p>
    {children}
  </div>
)

export const WithSpeakerAndTranslation_JA: Story = {
  name: 'With speaker + JA translation',
  render: (args) => (
    <InCardContext>
      <SenseExample {...args} />
    </InCardContext>
  ),
  args: {
    example: 'Electric cars are really starting to take off in the UK.',
    translation: '電気自動車がイギリスで本当に普及し始めている。',
    displayLocale: 'ja',
    isLoading: false,
    onPlay: () => {},
  },
}

export const WithSpeaker_EN: Story = {
  name: 'With speaker (en — translation hidden)',
  render: (args) => (
    <InCardContext>
      <SenseExample {...args} />
    </InCardContext>
  ),
  args: {
    example: 'Electric cars are really starting to take off in the UK.',
    translation: '電気自動車がイギリスで本当に普及し始めている。',
    displayLocale: 'en',
    isLoading: false,
    onPlay: () => {},
  },
}

export const NoSpeaker: Story = {
  name: 'No speaker (onPlay omitted)',
  render: (args) => (
    <InCardContext>
      <SenseExample {...args} />
    </InCardContext>
  ),
  args: {
    example: 'Electric cars are really starting to take off in the UK.',
    translation: '電気自動車がイギリスで本当に普及し始めている。',
    displayLocale: 'ja',
  },
}

export const Loading: Story = {
  name: 'Loading state',
  render: (args) => (
    <InCardContext>
      <SenseExample {...args} />
    </InCardContext>
  ),
  args: {
    example: 'Electric cars are really starting to take off in the UK.',
    translation: '電気自動車がイギリスで本当に普及し始めている。',
    displayLocale: 'ja',
    isLoading: true,
    onPlay: () => {},
  },
}
