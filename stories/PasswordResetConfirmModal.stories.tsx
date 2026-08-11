import type { Meta, StoryObj } from '@storybook/react'
import PasswordResetConfirmModal from '../app/components/PasswordResetConfirmModal'

const meta: Meta<typeof PasswordResetConfirmModal> = {
  title: 'Dialogs/PasswordResetConfirmModal',
  component: PasswordResetConfirmModal,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof PasswordResetConfirmModal>

export const Default: Story = {
  args: {
    open: true,
    email: 'kikotkk@gmail.com',
    onClose: () => {},
    onSent: () => {},
  },
}

export const LongEmail: Story = {
  args: {
    open: true,
    email: 'very-long-email-address-for-testing@example.co.jp',
    onClose: () => {},
    onSent: () => {},
  },
}
