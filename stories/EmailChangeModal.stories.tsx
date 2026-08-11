import type { Meta, StoryObj } from '@storybook/react'
import EmailChangeModal from '../app/components/EmailChangeModal'

const meta: Meta<typeof EmailChangeModal> = {
  title: 'Dialogs/EmailChangeModal',
  component: EmailChangeModal,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof EmailChangeModal>

export const Default: Story = {
  args: {
    open: true,
    currentEmail: 'kikotkk@gmail.com',
    onClose: () => {},
    onSent: () => {},
  },
}
