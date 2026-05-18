import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { type Meta, type StoryObj } from '@storybook/react-vite'

import { Sender } from './Sender'

const meta: Meta<typeof Sender> = {
  title: 'Components/Sender',
  component: Sender,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Sender 是 AI 对话输入框，支持受控输入、Enter 发送、加载中取消、模型切换和快捷操作插槽。',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: 360, paddingTop: 120 }}>
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Sender>

const modelOptions = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'claude-sonnet-4', label: 'Claude Sonnet 4' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'deepseek-r1', label: 'DeepSeek R1' },
]

function InteractiveSenderDemo() {
  const [message, setMessage] = useState('')
  const [sentMessage, setSentMessage] = useState('')

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Sender
        onChange={setMessage}
        onSend={setSentMessage}
        placeholder="输入要发送的消息..."
        value={message}
      />
      {sentMessage ? <p>已发送：{sentMessage}</p> : null}
    </div>
  )
}

export const Basic: Story = {
  args: {
    placeholder: '请输入消息...',
    onSend: (message) => console.log('send:', message),
  },
  parameters: {
    docs: {
      description: {
        story: '基础输入框示例，输入内容后可通过发送按钮或 Enter 触发 onSend。',
      },
    },
  },
}

export const InteractiveSend: Story = {
  render: () => <InteractiveSenderDemo />,
  parameters: {
    docs: {
      description: {
        story: '受控输入示例，发送后由外部状态回显已发送内容。',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const textarea = canvas.getByPlaceholderText('输入要发送的消息...')

    await userEvent.type(textarea, '帮我整理今天的验收重点')
    await userEvent.click(canvas.getByRole('button', { name: '发送消息' }))
    await expect(
      canvas.getByText('已发送：帮我整理今天的验收重点'),
    ).toBeInTheDocument()
  },
}

export const WithModelSwitcher: Story = {
  args: {
    model: 'claude-sonnet-4',
    modelOptions,
    placeholder: '点击右下角模型名切换模型...',
    onModelChange: (model) => console.log('model:', model),
    onSend: (message) => console.log('send:', message),
  },
}

export const WithActions: Story = {
  args: {
    placeholder: '点击左下角加号或右下角语音按钮...',
    onPrefixAction: (action) => console.log('prefix action:', action),
    onVoiceClick: () => console.log('voice'),
    onSend: (message) => console.log('send:', message),
  },
}

export const Loading: Story = {
  args: {
    loading: true,
    placeholder: '正在生成回复...',
    onCancel: () => console.log('cancel'),
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: '当前不可输入',
  },
}

export const CustomSlots: Story = {
  args: {
    prefix: <button type="button">自定义工具</button>,
    suffix: <button type="button">自定义动作</button>,
    placeholder: 'prefix / suffix 可完全自定义...',
    onSend: (message) => console.log('send:', message),
  },
}
