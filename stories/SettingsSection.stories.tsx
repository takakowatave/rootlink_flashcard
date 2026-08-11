import type { Meta, StoryObj } from '@storybook/react'
import SettingsSection from '../app/components/SettingsSection'
import SettingsRow from '../app/components/SettingsRow'
import Button from '../app/components/Button'

const meta: Meta<typeof SettingsSection> = {
  title: 'Design System/SettingsSection',
  component: SettingsSection,
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

type Story = StoryObj<typeof SettingsSection>

export const Default: Story = {
  render: () => (
    <SettingsSection title="プロフィール">
      <SettingsRow label="表示名">
        <span className="text-base text-gray-900 truncate">kikopass427</span>
        <button className="text-sm font-bold text-primary hover:underline whitespace-nowrap">
          変更
        </button>
      </SettingsRow>
      <SettingsRow label="アイコン">
        <div className="w-10 h-10 rounded-full bg-gray-300" />
        <button className="text-sm font-bold text-primary hover:underline whitespace-nowrap">
          変更
        </button>
      </SettingsRow>
    </SettingsSection>
  ),
}

export const MultipleSections: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <SettingsSection title="プロフィール">
        <SettingsRow label="表示名">
          <span className="text-base text-gray-900 truncate">kikopass427</span>
          <button className="text-sm font-bold text-primary hover:underline whitespace-nowrap">
            変更
          </button>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="アカウント">
        <SettingsRow label="メールアドレス">
          <span className="text-base text-gray-900 truncate">kikopass427@gmail.com</span>
          <button className="text-sm font-bold text-primary hover:underline whitespace-nowrap">
            変更
          </button>
        </SettingsRow>
        <SettingsRow label="パスワード">
          <span className="text-base text-gray-900 tracking-widest">••••••••</span>
          <button className="text-sm font-bold text-primary hover:underline whitespace-nowrap">
            再設定用メールを送信
          </button>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="設定">
        <SettingsRow label="現在のプラン">
          <span className="text-sm text-gray-700">Free</span>
          <button className="text-sm font-bold text-primary hover:underline whitespace-nowrap">
            アップグレード
          </button>
        </SettingsRow>
        <SettingsRow
          label="辞書の表示言語"
          helperText="英英モードと和英モードの切り替えができます。"
        >
          <div className="inline-flex rounded-full border border-line overflow-hidden">
            <span className="px-3 h-8 flex items-center text-xs bg-primary text-white">EN</span>
            <span className="px-3 h-8 flex items-center text-xs">JA</span>
          </div>
        </SettingsRow>
      </SettingsSection>
    </div>
  ),
}

export const StackedRow: Story = {
  render: () => (
    <SettingsSection title="アカウント">
      <SettingsRow label="メールアドレス" stacked>
        <div className="flex flex-col gap-3">
          <input
            type="email"
            defaultValue="kikopass427@gmail.com"
            className="w-full rounded-lg border border-line bg-white px-3 h-12"
          />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="tertiary" size="sm">
              キャンセル
            </Button>
            <Button type="button" variant="primary" size="sm">
              保存
            </Button>
          </div>
        </div>
      </SettingsRow>
    </SettingsSection>
  ),
}
