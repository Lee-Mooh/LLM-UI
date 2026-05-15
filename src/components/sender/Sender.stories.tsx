import { type Meta, type StoryObj } from '@storybook/react-vite'

import { Sender } from './Sender'

const meta: Meta<typeof Sender> = {
  title: 'Components/Sender',
  component: Sender,
  tags: ['autodocs'],
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

export const Basic: Story = {
  args: {
    placeholder: '请输入消息...',
    onSend: (message) => console.log('send:', message),
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
