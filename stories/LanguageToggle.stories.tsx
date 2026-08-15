import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import LanguageToggle from '../app/components/LanguageToggle'

const meta: Meta<typeof LanguageToggle> = {
  title: 'Design System/LanguageToggle',
  component: LanguageToggle,
  parameters: { layout: 'centered' },
}
export default meta

type Story = StoryObj<typeof LanguageToggle>

function Interactive({ initial = 'ja' as 'ja' | 'en' }) {
  const [locale, setLocale] = useState<'ja' | 'en'>(initial)
  return <LanguageToggle value={locale} onChange={setLocale} />
}

export const Ja: Story = { render: () => <Interactive initial="ja" /> }
export const En: Story = { render: () => <Interactive initial="en" /> }
