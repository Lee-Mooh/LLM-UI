import { type Meta, type StoryObj } from '@storybook/react-vite'

import { Actions, type ActionItem } from './Actions'

const meta: Meta<typeof Actions> = {
  title: 'Components/Actions',
  component: Actions,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: 24 }}>
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Actions>

const assistantActions: ActionItem[] = [
  { key: 'copy', label: '复制' },
  { key: 'regenerate', label: '重新生成' },
  { key: 'correct', label: '纠错' },
]

export const Basic: Story = {
  args: {
    items: assistantActions,
    onAction: (key) => console.log('action:', key),
  },
}

export const Feedback: Story = {
  args: {
    items: [
      { key: 'copy', label: '复制' },
      { key: 'like', label: '有帮助', variant: 'primary' },
      { key: 'dislike', label: '没帮助', variant: 'danger' },
    ],
    onAction: (key) => console.log('feedback:', key),
  },
}

export const Compact: Story = {
  args: {
    items: assistantActions,
    size: 'sm',
    onAction: (key) => console.log('compact action:', key),
  },
}

export const Vertical: Story = {
  args: {
    items: assistantActions,
    orientation: 'vertical',
    onAction: (key) => console.log('vertical action:', key),
  },
}

export const Disabled: Story = {
  args: {
    items: [
      { key: 'copy', label: '复制' },
      { key: 'regenerate', label: '重新生成', disabled: true },
      { key: 'correct', label: '纠错' },
    ],
    onAction: (key) => console.log('disabled action:', key),
  },
}
