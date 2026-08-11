import type { Meta, StoryObj } from '@storybook/react'
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport'
import AuthPage from '../app/components/auth/AuthPage'
import AuthCard from '../app/components/auth/AuthCard'
import AuthDivider from '../app/components/auth/AuthDivider'
import AuthBottomLink from '../app/components/auth/AuthBottomLink'
import { TextInput } from '../app/components/TextInput'
import Button from '../app/components/Button'

const meta: Meta<typeof AuthPage> = {
  title: 'Auth/AuthPage',
  component: AuthPage,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof AuthPage>

export const LoginLike: Story = {
  render: () => (
    <AuthPage>
      <AuthCard title="アカウントにログイン">
        <form className="flex flex-col gap-4">
          <TextInput label="メールアドレス" type="email" placeholder="email@example.com" />
          <TextInput label="パスワード" type="password" placeholder="••••••••" />
          <Button variant="primary" size="md" radius="lg" fullWidth>
            ログイン
          </Button>
        </form>
        <AuthDivider />
        <div className="w-full h-12 px-4 bg-white border border-line rounded-md flex items-center justify-center gap-2 text-sm">
          Googleでログイン (Stub)
        </div>
        <AuthBottomLink prefix="アカウントをお持ちでない方は" linkText="新規登録" href="/signup" />
      </AuthCard>
    </AuthPage>
  ),
}

export const SignupLike: Story = {
  render: () => (
    <AuthPage>
      <AuthCard title="アカウント新規作成">
        <form className="flex flex-col gap-4">
          <TextInput label="メールアドレス" type="email" placeholder="email@example.com" />
          <TextInput
            label="パスワード"
            type="password"
            placeholder="••••••••"
            helperText="8文字以上で設定してください"
          />
          <Button variant="primary" size="md" radius="lg" fullWidth>
            新規作成
          </Button>
        </form>
        <AuthDivider />
        <div className="w-full h-12 px-4 bg-white border border-line rounded-md flex items-center justify-center gap-2 text-sm">
          Googleで登録 (Stub)
        </div>
        <AuthBottomLink prefix="すでにアカウントをお持ちの方は" linkText="ログイン" href="/login" />
      </AuthCard>
    </AuthPage>
  ),
}

export const ResetPasswordLike: Story = {
  render: () => (
    <AuthPage>
      <AuthCard title="パスワードの再設定">
        <form className="flex flex-col gap-4">
          <TextInput label="新しいパスワード" type="password" placeholder="••••••••" helperText="8文字以上で設定してください" />
          <TextInput label="パスワード (確認)" type="password" placeholder="••••••••" />
          <Button variant="primary" size="md" radius="lg" fullWidth>
            再設定する
          </Button>
        </form>
      </AuthCard>
    </AuthPage>
  ),
}

export const SP: Story = {
  render: () => (
    <AuthPage>
      <AuthCard title="アカウントにログイン">
        <form className="flex flex-col gap-4">
          <TextInput label="メールアドレス" type="email" />
          <TextInput label="パスワード" type="password" />
          <Button variant="primary" size="md" radius="lg" fullWidth>
            ログイン
          </Button>
        </form>
      </AuthCard>
    </AuthPage>
  ),
  parameters: {
    viewport: {
      viewports: INITIAL_VIEWPORTS,
      defaultViewport: 'iphone6',
    },
  },
}
