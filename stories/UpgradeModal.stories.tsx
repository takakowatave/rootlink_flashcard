import type { Meta, StoryObj } from '@storybook/react'
import UpgradeModal from '../app/components/UpgradeModal'

const meta: Meta<typeof UpgradeModal> = {
  title: 'Dialogs/UpgradeModal',
  component: UpgradeModal,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof UpgradeModal>

export const LimitReached: Story = {
  name: 'Free plan limit reached (保存上限)',
  args: {
    reason: 'limit',
    onClose: () => {},
  },
}

export const UpgradePromo: Story = {
  name: 'Upgrade promo (プレミアム案内)',
  args: {
    reason: 'upgrade',
    onClose: () => {},
  },
}
