import type { Meta, StoryObj } from '@storybook/react-vite'
import { Bubble } from './Bubble'
const meta: Meta<typeof Bubble> = {
  title: 'Components/Bubble',
  component: Bubble,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Bubble>

export const User: Story = {
  args: {
    role: 'user',
    content: '帮我总结一下这段对话。',
  },
}

export const Assistant: Story = {
  args: {
    role: 'assistant',
    content: '有问题，随时问。',
  },
}

export const System: Story = {
  args: {
    role: 'system',
    content: '准备好了，随时开始。',
  },
}

export const Sending: Story = {
  args: {
    role: 'user',

    status: 'sending',
  },
}

export const Sent: Story = {
  args: {
    role: 'user',

    status: 'sent',
  },
}

export const Error: Story = {
  args: {
    role: 'user',

    status: 'error',
  },
}

export const Loading: Story = {
  args: {
    role: 'assistant',

    loading: true,
  },
}

export const CustomAvatar: Story = {
  args: {
    role: 'assistant',
    content: '这是一个带自定义头像的 AI 回复。',
    avatar: (
      <div className="flex size-full items-center justify-center bg-[var(--llm-color-primary)] text-xs font-medium text-[var(--llm-color-primary-foreground)]">
        AI
      </div>
    ),
  },
}
