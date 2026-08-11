import type { Meta, StoryObj } from '@storybook/react'
import EmailSentDialog from '../app/components/EmailSentDialog'

const meta: Meta<typeof EmailSentDialog> = {
  title: 'Dialogs/EmailSentDialog',
  component: EmailSentDialog,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof EmailSentDialog>

export const SignupConfirm: Story = {
  args: {
    open: true,
    sentTo: 'kikotkk@gmail.com',
    variant: 'signup-confirm',
    onClose: () => {},
  },
}

export const EmailChange: Story = {
  args: {
    open: true,
    sentTo: 'new-address@example.com',
    variant: 'email-change',
    onClose: () => {},
  },
}

export const PasswordReset: Story = {
  args: {
    open: true,
    sentTo: 'kikotkk@gmail.com',
    variant: 'password-reset',
    onClose: () => {},
  },
}

export const LongEmail: Story = {
  args: {
    open: true,
    sentTo: 'very-long-email-address-for-testing-wrap@subdomain.example.com',
    variant: 'password-reset',
    onClose: () => {},
  },
}
