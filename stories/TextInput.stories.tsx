import type { Meta, StoryObj } from '@storybook/react'
import { TextInput } from '../app/components/TextInput'

const meta: Meta<typeof TextInput> = {
  title: 'Design System/TextInput',
  component: TextInput,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div className="w-80"><Story /></div>],
  argTypes: {
    type: { control: 'select', options: ['text', 'email', 'password'] },
    size: { control: 'select', options: ['sm', 'md'] },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    helperText: { control: 'text' },
    disabled: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof TextInput>

export const Default: Story = {
  args: { label: 'メールアドレス', placeholder: 'email@example.com', type: 'email' },
}

export const Password: Story = {
  args: { label: 'パスワード', placeholder: '••••••••', type: 'password' },
}

export const WithError: Story = {
  args: {
    label: 'メールアドレス',
    placeholder: 'email@example.com',
    error: { type: 'required', message: 'メールアドレスを入力してください' },
  },
}

export const WithHelperText: Story = {
  args: {
    label: 'パスワード',
    type: 'password',
    placeholder: '••••••••',
    helperText: '8文字以上で設定してください',
  },
}

export const Disabled: Story = {
  args: { label: 'メールアドレス', placeholder: 'email@example.com', value: 'kiko@example.com', disabled: true },
}

export const SizeSm: Story = {
  args: { label: 'メールアドレス', placeholder: 'email@example.com', size: 'sm' },
}

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-80">
      <TextInput label="通常" placeholder="通常状態" />
      <TextInput label="ヘルパー付き" placeholder="通常状態" helperText="任意の補足テキストです" />
      <TextInput
        label="エラー"
        placeholder="エラー状態"
        error={{ type: 'required', message: '入力してください' }}
      />
      <TextInput label="無効" placeholder="無効状態" disabled value="編集不可" />
      <TextInput label="パスワード" placeholder="••••••••" type="password" />
      <TextInput label="sm サイズ" placeholder="小さいサイズ" size="sm" />
    </div>
  ),
}
