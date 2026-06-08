import type { Meta, StoryObj } from '@storybook/react'
import Button from '../app/components/Button'

const meta: Meta<typeof Button> = {
  title: 'Design System/Button',
  component: Button,
  parameters: { layout: 'centered' },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'tertiary'] },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    radius: { control: 'select', options: ['full', '2xl', 'lg'] },
    fullWidth: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    children: 'ボタン',
    variant: 'primary',
    size: 'md',
  },
}
export default meta

type Story = StoryObj<typeof Button>

export const Primary: Story = { args: { variant: 'primary' } }
export const Secondary: Story = { args: { variant: 'secondary' } }
export const Tertiary: Story = { args: { variant: 'tertiary' } }
export const Disabled: Story = { args: { variant: 'primary', disabled: true } }

// 全variant × 全sizeの一覧
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(['primary', 'secondary', 'tertiary'] as const).map((variant) => (
        <div key={variant} className="flex items-center gap-3">
          {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
            <Button key={size} variant={variant} size={size}>
              {variant}/{size}
            </Button>
          ))}
        </div>
      ))}
    </div>
  ),
}
