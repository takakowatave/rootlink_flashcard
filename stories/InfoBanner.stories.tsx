import type { Meta, StoryObj } from '@storybook/react'
import InfoBanner from '../app/components/InfoBanner'
import Button from '../app/components/Button'

const meta: Meta<typeof InfoBanner> = {
  title: 'Design System/InfoBanner',
  component: InfoBanner,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[420px] max-w-full p-6 bg-white rounded-lg">
        <Story />
      </div>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof InfoBanner>

export const TitleOnly: Story = {
  render: () => <InfoBanner title="通知がオフになっています" />,
}

export const TitleAndBody: Story = {
  render: () => (
    <InfoBanner
      title="通知がオフになっています"
      body="リマインダーを受け取るには、端末の設定で通知を許可してください。"
    />
  ),
}

export const WithAction: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <InfoBanner
        title="通知がオフになっています"
        body="リマインダーを受け取るには、端末の設定で通知を許可してください。"
      />
      <Button variant="primary" fullWidth radius="full">
        通知を許可する
      </Button>
    </div>
  ),
}
