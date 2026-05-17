import { useState } from 'react'
import { type Meta, type StoryObj } from '@storybook/react-vite'

import {
  Notification,
  NotificationStack,
  type NotificationItem,
} from './Notification'

const meta: Meta<typeof Notification> = {
  title: 'Components/Notification',
  component: Notification,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 420, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Notification>

export const Success: Story = {
  args: {
    type: 'success',
    title: '发送成功',
    description: '消息已经成功发送给模型。',
    showProgress: true,
    duration: 4500,
  },
}

export const Error: Story = {
  args: {
    type: 'error',
    title: '请求失败',
    description: '网络连接异常，请稍后重试。',
    showProgress: true,
    duration: 4500,
  },
}

export const Loading: Story = {
  args: {
    type: 'loading',
    title: '正在生成回复',
    description: '模型正在处理你的输入。',
    closeable: false,
  },
}

export const WithoutProgress: Story = {
  args: {
    type: 'success',
    title: '保存完成',
    description: '当前配置已经保存。',
    showProgress: false,
  },
}

export function Stack() {
  const [items, setItems] = useState<NotificationItem[]>([
    {
      id: 'loading',
      type: 'loading',
      title: '正在生成回复',
      description: 'DeepSeek R1 正在进行深度思考。',
      closeable: false,
    },
    {
      id: 'success',
      type: 'success',
      title: '上下文已保存',
      description: '本轮对话状态已经同步完成。',
      showProgress: true,
      duration: 6000,
    },
    {
      id: 'error',
      type: 'error',
      title: '工具调用失败',
      description: '无法读取远程资源，请检查权限。',
      showProgress: true,
      duration: 8000,
    },
  ])

  return (
    <>
      <button
        onClick={() =>
          setItems((currentItems) => [
            {
              id: crypto.randomUUID(),
              type: 'success',
              title: '新增通知',
              description: '这是一条从按钮创建的通知。',
              showProgress: true,
              duration: 4500,
            },
            ...currentItems,
          ])
        }
        type="button"
      >
        添加通知
      </button>
      <NotificationStack
        items={items}
        onClose={(id) =>
          setItems((currentItems) =>
            currentItems.filter((item) => item.id !== id),
          )
        }
      />
    </>
  )
}
