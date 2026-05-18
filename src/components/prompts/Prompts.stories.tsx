import { useState } from 'react'
import { type Meta, type StoryObj } from '@storybook/react-vite'

import { Sender } from '../sender/Sender'
import { Prompts, type PromptItem } from './Prompts'

const meta: Meta<typeof Prompts> = {
  title: 'Components/Prompts',
  component: Prompts,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ paddingTop: 120 }}>
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Prompts>

function ImageIcon() {
  return (
    <svg
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="m4 16 4.2-4.2a1.5 1.5 0 0 1 2.1 0L17 18.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M15.5 9.5h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m4 20 4.8-1.2L19 8.6 15.4 5 5.2 15.2z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="m13.8 6.6 3.6 3.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M3.6 9h16.8M3.6 15h16.8M12 3c2.2 2.5 3.3 5.5 3.3 9S14.2 18.5 12 21M12 3C9.8 5.5 8.7 8.5 8.7 12s1.1 6.5 3.3 9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

const promptItems: PromptItem[] = [
  {
    key: 'image',
    title: '生成图片',
    prompt: '请根据下面的描述生成一张图片：',
    icon: <ImageIcon />,
  },
  {
    key: 'write',
    title: '撰写或编辑',
    prompt: '请帮我撰写或润色下面这段内容：',
    icon: <EditIcon />,
  },
  {
    key: 'search',
    title: '查找资料',
    prompt: '请帮我查找并整理关于这个主题的资料：',
    icon: <GlobeIcon />,
  },
]

function PromptSenderDemo({ items }: { items: PromptItem[] }) {
  const [message, setMessage] = useState('')

  const handlePrompt = (_: string, item: PromptItem) => {
    setMessage(item.prompt ?? '')
  }

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 560 }}>
      <Prompts items={items} onPrompt={handlePrompt} />
      <Sender
        onChange={setMessage}
        onSend={(value) => console.log('send:', value)}
        placeholder="点击上方胶囊后，prompt 会填入 Sender"
        value={message}
      />
    </div>
  )
}

export const Basic: Story = {
  render: () => <PromptSenderDemo items={promptItems} />,
}

export const WithoutIcon: Story = {
  render: () => (
    <PromptSenderDemo
      items={[
        { key: 'summary', title: '总结内容', prompt: '请总结下面的内容：' },
        {
          key: 'translate',
          title: '翻译文本',
          prompt: '请把下面的内容翻译成英文：',
        },
        {
          key: 'code-review',
          title: '检查代码',
          prompt: '请检查下面这段代码：',
        },
      ]}
    />
  ),
}

export const Disabled: Story = {
  render: () => (
    <PromptSenderDemo
      items={[
        ...promptItems.slice(0, 2),
        {
          key: 'disabled',
          title: '生成周报',
          prompt: '请生成项目周报：',
          icon: <EditIcon />,
          disabled: true,
        },
      ]}
    />
  ),
}

export const WithHeader: Story = {
  args: {
    items: promptItems,
    title: '推荐提示词',
    description: '选择一个快捷入口，将对应 prompt 填入输入框。',
    onPrompt: (_, item) => console.log('prompt:', item.prompt),
  },
}

export const Empty: Story = {
  args: {
    items: [],
    emptyText: '暂无可用提示词',
  },
}
