import { expect, within } from 'storybook/test'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Actions } from '../actions/Actions'
import { createPresetActions } from '../actions/ActionsPreset'
import { Bubble } from './Bubble'
const meta: Meta<typeof Bubble> = {
  title: 'Components/Bubble',
  component: Bubble,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Bubble 用于展示单条对话消息，支持 user、assistant、system 三种角色，以及状态、头像、时间戳和消息操作插槽。',
      },
    },
  },
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
  parameters: {
    docs: {
      description: {
        story: 'assistant 消息默认靠左展示，适合承载模型回复正文。',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('有问题，随时问。')).toBeInTheDocument()
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('发送失败')).toBeInTheDocument()
  },
}

export const Loading: Story = {
  args: {
    role: 'assistant',
    loading: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('思考中')).toBeInTheDocument()
  },
}

export const CustomAvatar: Story = {
  args: {
    role: 'assistant',
    content: '自定义头像',
    avatar: (
      <div className="flex size-full items-center justify-center bg-[var(--llm-color-primary)] text-xs font-medium text-[var(--llm-color-primary-foreground)]">
        AI
      </div>
    ),
  },
}

export const WithAIQuickActions: Story = {
  args: {
    role: 'assistant',
    content:
      '我建议先确认用户最常点的三个操作，再把它们放到消息下方，避免打断阅读。',
    actions: (
      <Actions
        items={createPresetActions(['summary', 'polish', 'explain-code'])}
        onAction={(key) => console.log('bubble action:', key)}
        size="sm"
      />
    ),
  },
}
