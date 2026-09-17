import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import TermsAgreementCheckbox from '../app/components/TermsAgreementCheckbox'

const meta: Meta<typeof TermsAgreementCheckbox> = {
  title: 'Design System/TermsAgreementCheckbox',
  component: TermsAgreementCheckbox,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px] p-6 bg-white rounded-lg border border-line">
        <Story />
      </div>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof TermsAgreementCheckbox>

export const Unchecked: Story = {
  render: () => {
    const [checked, setChecked] = useState(false)
    return (
      <TermsAgreementCheckbox
        checked={checked}
        onChange={(e) => setChecked(e.currentTarget.checked)}
      >
        <button type="button" className="text-primary underline">
          プライバシーポリシー
        </button>
        {' '}に同意する
      </TermsAgreementCheckbox>
    )
  },
}

export const Checked: Story = {
  render: () => (
    <TermsAgreementCheckbox checked readOnly>
      <button type="button" className="text-primary underline">
        プライバシーポリシー
      </button>
      {' '}に同意する
    </TermsAgreementCheckbox>
  ),
}

export const WithError: Story = {
  render: () => (
    <TermsAgreementCheckbox
      error={{ type: 'required', message: 'プライバシーポリシーへの同意が必要です' }}
    >
      <button type="button" className="text-primary underline">
        プライバシーポリシー
      </button>
      {' '}に同意する
    </TermsAgreementCheckbox>
  ),
}
