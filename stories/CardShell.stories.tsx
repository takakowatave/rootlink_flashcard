import type { Meta, StoryObj } from '@storybook/react'
import CardShell from '../app/components/CardShell'

const meta: Meta<typeof CardShell> = {
  title: 'Design System/CardShell',
  component: CardShell,
  parameters: { layout: 'padded' },
  argTypes: {
    onClick: { action: 'clicked' },
    noCard: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof CardShell>

const SampleContent = () => (
  <>
    <div className="flex items-center justify-between py-1 px-1">
      <h2 className="text-2xl font-semibold leading-8 text-black">succeed in doing</h2>
    </div>
    <div className="px-1">
      <p className="text-base text-gray-800">〜することに成功する</p>
    </div>
  </>
)

export const Default: Story = {
  args: { children: <SampleContent /> },
}

export const Clickable: Story = {
  args: { children: <SampleContent />, onClick: () => {} },
}

export const NoCard: Story = {
  args: { children: <SampleContent />, noCard: true },
}
