import type { Meta, StoryObj } from '@storybook/react'
import ReviewPeriodListItem from '../app/components/ReviewPeriodListItem'

const meta: Meta<typeof ReviewPeriodListItem> = {
  title: 'Dashboard/ReviewPeriodListItem',
  component: ReviewPeriodListItem,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof ReviewPeriodListItem>

export const Default: Story = {
  args: { badge: '昨', label: '昨日', wordCount: 20, href: '/quiz?period=yesterday' },
}

export const Disabled: Story = {
  args: { badge: '週', label: '1週間', wordCount: 0, disabled: true, href: '/quiz?period=week' },
}

export const List: Story = {
  render: () => (
    <div className="rounded-2xl border border-line bg-white overflow-hidden max-w-[600px]">
      <div className="flex flex-col divide-y divide-line">
        <ReviewPeriodListItem badge="昨" label="昨日" wordCount={20} href="/quiz?period=yesterday" />
        <ReviewPeriodListItem badge="週" label="1週間" wordCount={150} href="/quiz?period=week" />
        <ReviewPeriodListItem badge="月" label="1ヶ月" wordCount={500} href="/quiz?period=month" />
        <ReviewPeriodListItem badge="全" label="全期間" wordCount={1200} href="/quiz?period=all" />
      </div>
    </div>
  ),
}
