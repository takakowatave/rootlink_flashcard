import type { Meta, StoryObj } from '@storybook/react'
import CardHeader from '../app/components/CardHeader'
import CardShell from '../app/components/CardShell'

const meta: Meta<typeof CardHeader> = {
  title: 'Design System/CardHeader',
  component: CardHeader,
  parameters: { layout: 'padded' },
  argTypes: {
    onPlayAudio: { action: 'play-audio' },
    onSave: { action: 'save-toggled' },
    audioLoading: { control: 'boolean' },
    isSaved: { control: 'boolean' },
    headingLevel: { control: { type: 'inline-radio' }, options: ['h1', 'h2'] },
  },
}
export default meta

type Story = StoryObj<typeof CardHeader>

const wrap = (children: React.ReactNode) => (
  <CardShell>{children}</CardShell>
)

export const WordHeader: Story = {
  args: {
    title: 'ephemeral',
    isSaved: false,
    audioLoading: false,
    headingLevel: 'h1',
  },
  render: (args) => wrap(<CardHeader {...args} />),
}

export const PhraseHeader: Story = {
  args: {
    title: 'brush up on',
    isSaved: false,
    audioLoading: false,
    headingLevel: 'h2',
  },
  render: (args) => wrap(<CardHeader {...args} />),
}

export const Saved: Story = {
  args: {
    title: 'ephemeral',
    isSaved: true,
    audioLoading: false,
    headingLevel: 'h1',
  },
  render: (args) => wrap(<CardHeader {...args} />),
}

export const AudioLoading: Story = {
  args: {
    title: 'ephemeral',
    isSaved: false,
    audioLoading: true,
    headingLevel: 'h1',
  },
  render: (args) => wrap(<CardHeader {...args} />),
}

export const WithSaveTooltip: Story = {
  args: {
    title: 'ephemeral',
    isSaved: false,
    audioLoading: false,
    headingLevel: 'h1',
    saveTooltip: { saved: 'リストから削除', unsaved: 'リストに保存' },
  },
  render: (args) => wrap(<CardHeader {...args} />),
}

export const NoAudioButton: Story = {
  args: {
    title: 'ephemeral',
    isSaved: false,
    headingLevel: 'h1',
  },
  render: (args) => wrap(<CardHeader {...args} />),
}
