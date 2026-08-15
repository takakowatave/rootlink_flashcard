import type { Meta, StoryObj } from '@storybook/react'
import EditProfileModal from '../app/components/EditProfileModal'
import type { Profile } from '../app/types/Profile'

// EditProfileModal はマウント時に supabase.auth.getUser / subscriptions を取得しに行く。
// Storybook では未ログインなので email が空・プラン取得は失敗するが、
// レイアウトと各 SettingsRow の見た目は確認できる。

const meta: Meta<typeof EditProfileModal> = {
  title: 'Dialogs/EditProfileModal',
  component: EditProfileModal,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof EditProfileModal>

const baseProfile: Profile = {
  id: 'story-user',
  created_at: '2026-01-01T00:00:00Z',
  username: 'kiko',
  avatar_url: null,
  bio: null,
  twitter: null,
  email: 'kiko@example.com',
}

export const NamedUser: Story = {
  args: {
    isOpen: true,
    profile: baseProfile,
    onClose: () => {},
    onUpdated: () => {},
  },
}

export const NoDisplayName: Story = {
  args: {
    isOpen: true,
    profile: { ...baseProfile, username: null },
    onClose: () => {},
    onUpdated: () => {},
  },
}

export const WithAvatar: Story = {
  args: {
    isOpen: true,
    profile: {
      ...baseProfile,
      avatar_url: '/dev-badge.png',
    },
    onClose: () => {},
    onUpdated: () => {},
  },
}
