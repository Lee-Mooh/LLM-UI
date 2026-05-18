import { type Meta, type StoryObj } from '@storybook/react-vite'

import { Actions } from '../actions/Actions'
import { createPresetActions } from '../actions/ActionsPreset'
import { Bubble } from '../bubble/Bubble'
import { Mark } from '../mark/Mark'
import { MessageList, type MessageRecord } from './MessageList'

const meta: Meta<typeof MessageList> = {
  title: 'Components/MessageList',
  component: MessageList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'MessageList 用于承载对话消息流，默认复用 Bubble 渲染，也可以通过 renderMessage 组合 Mark、Actions 等组件实现富消息。',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: 520, maxWidth: 820, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof MessageList>

const messages: MessageRecord[] = [
  {
    id: 'user-1',
    role: 'user',
    content: '帮我总结一下刚才讨论的交付范围。',
    timestamp: '10:20',
  },
  {
    id: 'assistant-1',
    role: 'assistant',
    content:
      '这次讨论主要确定了目标、优先级和验收方式，下一步可以按模块拆分推进。',
    timestamp: '10:21',
    actions: (
      <Actions items={createPresetActions(['summary', 'polish'])} size="sm" />
    ),
  },
]

const longMessages: MessageRecord[] = Array.from(
  { length: 1200 },
  (_, index) => {
    const sequence = index + 1
    const assistant = sequence % 2 === 0

    return {
      id: `message-${sequence}`,
      role: assistant ? 'assistant' : 'user',
      content: assistant
        ? `第 ${sequence} 条 assistant 消息：我会把这部分内容整理成更清晰的回答。`
        : `第 ${sequence} 条 user 消息：继续说说这个方案的取舍。`,
      timestamp: `${String(Math.floor(index / 60)).padStart(2, '0')}:${String(index % 60).padStart(2, '0')}`,
      actions: assistant ? (
        <Actions
          items={createPresetActions(['summary', 'explain-code'])}
          size="sm"
        />
      ) : undefined,
    }
  },
)

export const Basic: Story = {
  args: {
    messages,
  },
}

export const WithBubbleActions: Story = {
  args: {
    messages,
  },
  parameters: {
    docs: {
      description: {
        story:
          '通过 MessageRecord.actions 在 assistant 消息下方挂载快捷操作栏。',
      },
    },
  },
}

export const WithMarkdownBubble: Story = {
  args: {
    messages: [
      {
        id: 'user-markdown',
        role: 'user',
        content: '帮我把回复写成 Markdown。',
        timestamp: '11:02',
      },
      {
        id: 'assistant-markdown',
        role: 'assistant',
        content:
          '## 验收重点\n\n- 确认核心路径可交互\n- 补齐 Storybook 文档说明\n- 保持组件 API 简洁\n\n```tsx\n<MessageList renderMessage={renderMessage} />\n```',
        timestamp: '11:03',
        actions: (
          <Actions items={createPresetActions(['copy', 'summary'])} size="sm" />
        ),
      },
    ],
    renderMessage: (message) => (
      <Bubble
        role={message.role}
        {...(message.actions && { actions: message.actions })}
        {...(message.timestamp && { timestamp: message.timestamp })}
      >
        {message.role === 'assistant' ? (
          <Mark content={message.content ?? ''} />
        ) : (
          message.content
        )}
      </Bubble>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          '使用 renderMessage 组合 Bubble 和 Mark，适合渲染包含 Markdown 的 assistant 消息。',
      },
    },
  },
}

export const VirtualizedLargeDataset: Story = {
  args: {
    messages: longMessages,
    virtualized: true,
    itemHeight: 118,
    overscan: 8,
    ariaLabel: '1200 条消息',
  },
}

export const CustomRenderMessage: Story = {
  args: {
    messages,
    role: 'list',
    renderMessage: (message, index) => (
      <div
        style={{
          border: '1px solid var(--llm-color-border)',
          borderRadius: 18,
          padding: 14,
          color: 'var(--llm-color-text)',
          background: 'var(--llm-color-surface)',
        }}
      >
        <strong>
          {index + 1}. {message.role}
        </strong>
        <div style={{ marginTop: 6 }}>{message.content}</div>
      </div>
    ),
  },
}
