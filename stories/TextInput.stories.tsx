import type { Meta, StoryObj } from '@storybook/react'
import { TextInput } from '../app/components/TextInput'

const meta: Meta<typeof TextInput> = {
  title: 'Design System/TextInput',
  component: TextInput,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div className="w-80"><Story /></div>],
  argTypes: {
    type: { control: 'select', options: ['text', 'email', 'password'] },
    label: { control: 'text' },
    placeholder: { control: 'text' },
  },
}
export default meta

type Story = StoryObj<typeof TextInput>

export const Default: Story = { args: { label: 'メールアドレス', placeholder: 'email@example.com', type: 'text' } }
export const Password: Story = { args: { label: 'パスワード', placeholder: '••••••••', type: 'password' } }
export const WithError: Story = {
  args: {
    label: 'メールアドレス',
    placeholder: 'email@example.com',
    error: { type: 'required', message: 'メールアドレスを入力してください' },
  },
}
