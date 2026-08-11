import type { Meta, StoryObj } from '@storybook/react'
import DeleteAccountModal from '../app/components/DeleteAccountModal'

const meta: Meta<typeof DeleteAccountModal> = {
  title: 'Dialogs/DeleteAccountModal',
  component: DeleteAccountModal,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof DeleteAccountModal>

export const FreeUser: Story = {
  args: {
    open: true,
    hasActiveSubscription: false,
    onClose: () => {},
    onDeleted: () => {},
  },
}

export const PremiumUser: Story = {
  args: {
    open: true,
    hasActiveSubscription: true,
    onClose: () => {},
    onDeleted: () => {},
  },
}
