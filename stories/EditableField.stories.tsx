import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import EditableField from '../app/components/EditableField'

const meta: Meta<typeof EditableField> = {
  title: 'Design System/EditableField',
  component: EditableField,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div className="w-80"><Story /></div>],
}
export default meta

type Story = StoryObj<typeof EditableField>

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('kiko')
    return (
      <EditableField
        label="表示名"
        value={value}
        onSave={async (draft) => setValue(draft)}
      />
    )
  },
}

export const Empty: Story = {
  render: () => {
    const [value, setValue] = useState('')
    return (
      <EditableField
        label="表示名"
        value={value}
        placeholder="表示名を入力"
        emptyLabel="未設定"
        onSave={async (draft) => setValue(draft)}
      />
    )
  },
}

export const WithValidation: Story = {
  render: () => {
    const [value, setValue] = useState('kikotkk@gmail.com')
    return (
      <EditableField
        label="メールアドレス"
        type="email"
        value={value}
        helperText="有効なメールアドレスを入力してください"
        validate={(draft) => {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft)) {
            return 'メールアドレスの形式が正しくありません'
          }
          return undefined
        }}
        onSave={async (draft) => setValue(draft)}
      />
    )
  },
}

export const SaveFails: Story = {
  render: () => {
    return (
      <EditableField
        label="表示名"
        value="kiko"
        onSave={async () => {
          throw new Error('サーバーエラーです。時間をおいて再試行してください')
        }}
      />
    )
  },
}

export const Disabled: Story = {
  render: () => (
    <EditableField
      label="メールアドレス"
      value="kikotkk@gmail.com"
      disabled
      onSave={async () => {}}
    />
  ),
}
