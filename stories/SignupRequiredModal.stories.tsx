import type { Meta, StoryObj } from '@storybook/react'
import SignupRequiredModal from '../app/components/SignupRequiredModal'

const meta: Meta<typeof SignupRequiredModal> = {
  title: 'Dialogs/SignupRequiredModal',
  component: SignupRequiredModal,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof SignupRequiredModal>

export const Default: Story = {
  args: {
    onClose: () => {},
  },
}
