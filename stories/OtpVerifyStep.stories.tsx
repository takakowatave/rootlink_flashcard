import type { Meta, StoryObj } from '@storybook/react'
import OtpVerifyStep from '../app/components/auth/OtpVerifyStep'
import AuthPage from '../app/components/auth/AuthPage'
import AuthCard from '../app/components/auth/AuthCard'

const meta: Meta<typeof OtpVerifyStep> = {
  title: 'Auth/OtpVerifyStep',
  component: OtpVerifyStep,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <AuthPage>
        <AuthCard title="アカウント新規作成">
          <Story />
        </AuthCard>
      </AuthPage>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof OtpVerifyStep>

export const Default: Story = {
  args: {
    email: 'kikotkk@gmail.com',
    onVerify: async () => {},
    onResend: async () => {},
    onEditEmail: () => {},
  },
}

export const Error: Story = {
  args: {
    email: 'kikotkk@gmail.com',
    error: 'コードが違います。もう一度ご確認ください',
    onVerify: async () => {},
    onResend: async () => {},
    onEditEmail: () => {},
  },
}

export const ResendCooldown: Story = {
  name: '再送待ち',
  args: {
    email: 'kikotkk@gmail.com',
    initialResendCooldownSeconds: 42,
    onVerify: async () => {},
    onResend: async () => {},
    onEditEmail: () => {},
  },
}
