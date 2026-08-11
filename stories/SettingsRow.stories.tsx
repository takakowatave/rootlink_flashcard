import type { Meta, StoryObj } from '@storybook/react'
import SettingsRow from '../app/components/SettingsRow'
import { TextInput } from '../app/components/TextInput'
import Button from '../app/components/Button'

const meta: Meta<typeof SettingsRow> = {
  title: 'Design System/SettingsRow',
  component: SettingsRow,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[560px] max-w-full p-6 bg-white rounded-lg">
        <Story />
      </div>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof SettingsRow>

export const Default: Story = {
  render: () => (
    <SettingsRow label="メールアドレス">
      <span className="text-base text-gray-900 truncate">kikopass427@gmail.com</span>
      <button className="text-sm font-bold text-primary hover:underline whitespace-nowrap">
        変更
      </button>
    </SettingsRow>
  ),
}

export const WithHelperText: Story = {
  render: () => (
    <SettingsRow
      label="辞書の表示言語"
      helperText="英英モードと和英モードの切り替えができます。"
    >
      <div className="inline-flex rounded-full border border-line overflow-hidden">
        <span className="px-3 h-8 flex items-center text-xs bg-primary text-white">EN</span>
        <span className="px-3 h-8 flex items-center text-xs">JA</span>
      </div>
    </SettingsRow>
  ),
}

export const WithBadge: Story = {
  render: () => (
    <SettingsRow
      label={
        <span className="flex items-center gap-2">
          メールアドレス
          <span className="inline-flex items-center h-5 px-2 border border-primary text-primary text-[10px] font-bold rounded">
            Googleアカウント
          </span>
        </span>
      }
      helperText="Googleアカウントで管理されているため変更できません。"
    >
      <span className="text-base text-gray-900 truncate">kikopass427@gmail.com</span>
    </SettingsRow>
  ),
}

export const Stacked: Story = {
  render: () => (
    <SettingsRow label="メールアドレス" stacked>
      <div className="flex flex-col gap-3">
        <TextInput
          type="email"
          defaultValue="kikopass427@gmail.com"
          autoFocus
        />
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <Button type="button" variant="tertiary" size="md" className="w-full md:w-auto">
            キャンセル
          </Button>
          <Button type="button" variant="primary" size="md" className="w-full md:w-auto">
            保存
          </Button>
        </div>
      </div>
    </SettingsRow>
  ),
}

export const MultipleRows: Story = {
  render: () => (
    <div>
      <SettingsRow label="メールアドレス">
        <span className="text-base text-gray-900 truncate">kikopass427@gmail.com</span>
        <button className="text-sm font-bold text-primary hover:underline whitespace-nowrap">
          変更
        </button>
      </SettingsRow>
      <SettingsRow label="パスワード">
        <span className="text-base text-gray-900 tracking-widest">••••••••</span>
        <button className="text-sm font-bold text-primary hover:underline whitespace-nowrap">
          変更
        </button>
      </SettingsRow>
    </div>
  ),
}
