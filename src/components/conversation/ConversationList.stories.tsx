import { useState } from 'react'
import { type Meta, type StoryObj } from '@storybook/react-vite'

import { ConversationList, type ConversationListProps } from './ConversationList'
import { type ConversationRecord } from './ConversationItem'

const meta: Meta<typeof ConversationList> = {
  title: 'Components/ConversationList',
  component: ConversationList,
  tags: ['autodocs'],
  render: (args) => <ConversationListStory {...args} />,
  decorators: [
    (Story) => (
      <div style={{ width: 280, minHeight: 560, padding: 0 }}>
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof ConversationList>

function ConversationListStory({
  activeId,
  conversations,
  onDelete,
  onCollapsedChange,
  onFavorite,
  onNewConversation,
  onPin,
  onSelect,
  ...args
}: ConversationListProps) {
  const [collapsed, setCollapsed] = useState(args.collapsed ?? false)
  const [currentActiveId, setCurrentActiveId] = useState(activeId)
  const [currentConversations, setCurrentConversations] = useState(conversations)

  const handleCollapsedChange = (nextCollapsed: boolean) => {
    setCollapsed(nextCollapsed)
    onCollapsedChange?.(nextCollapsed)
  }

  const handleNewConversation = () => {
    const id = `new-${Date.now()}`

    setCurrentConversations((items) => [
      {
        id,
        title: '新的聊天',
        lastMessage: '开始一个新的对话。',
        timestamp: '刚刚',
      },
      ...items,
    ])
    setCurrentActiveId(id)
    onNewConversation?.()
  }

  const handleSelect = (id: string) => {
    setCurrentActiveId(id)
    onSelect?.(id)
  }

  const handleDelete = (id: string) => {
    setCurrentConversations((items) => items.filter((item) => item.id !== id))
    setCurrentActiveId((currentId) => (currentId === id ? undefined : currentId))
    onDelete?.(id)
  }

  const handlePin = (id: string) => {
    setCurrentConversations((items) =>
      items.map((item) =>
        item.id === id ? { ...item, pinned: !item.pinned } : item,
      ),
    )
    onPin?.(id)
  }

  const handleFavorite = (id: string) => {
    setCurrentConversations((items) =>
      items.map((item) =>
        item.id === id ? { ...item, favorite: !item.favorite } : item,
      ),
    )
    onFavorite?.(id)
  }

  return (
    <ConversationList
      {...args}
      {...(currentActiveId && { activeId: currentActiveId })}
      collapsed={collapsed}
      conversations={currentConversations}
      onCollapsedChange={handleCollapsedChange}
      onDelete={handleDelete}
      onFavorite={handleFavorite}
      onNewConversation={handleNewConversation}
      onPin={handlePin}
      onSelect={handleSelect}
    />
  )
}

const conversations: ConversationRecord[] = [
  {
    id: 'design-system',
    title: 'AI 组件库设计讨论',
    lastMessage: '我们先把 ConversationList 的结构定下来。',
    timestamp: '10:24',
    pinned: true,
    favorite: true,
  },
  {
    id: 'streaming-markdown',
    title: '流式 Markdown 渲染',
    lastMessage: '代码块需要交给 CodeHighlighter 统一处理。',
    timestamp: '昨天',
    favorite: true,
  },
  {
    id: 'model-routing',
    title: '模型路由策略',
    lastMessage: '不同模型可以根据任务类型做默认选择。',
    timestamp: '周一',
  },
  {
    id: 'rag-citation',
    title: 'RAG 引用溯源',
    lastMessage: 'Citation 组件后面再做 hover 预览。',
    timestamp: '05/12',
  },
  {
    id: 'empty-session',
    title: '新的空白会话',
    timestamp: '05/09',
  },
]

export const Basic: Story = {
  args: {
    activeId: 'design-system',
    conversations,
    searchable: true,
    onSelect: (id) => console.log('select:', id),
  },
}

export const Searchable: Story = {
  args: {
    activeId: 'streaming-markdown',
    conversations,
    searchable: true,
    onSelect: (id) => console.log('select:', id),
  },
}

export const WithActions: Story = {
  args: {
    activeId: 'model-routing',
    conversations,
    searchable: true,
    onDelete: (id) => console.log('delete:', id),
    onFavorite: (id) => console.log('favorite:', id),
    onPin: (id) => console.log('pin:', id),
    onSelect: (id) => console.log('select:', id),
  },
}

export const PinnedAndFavorite: Story = {
  args: {
    conversations,
    title: '置顶与收藏',
    onSelect: (id) => console.log('select:', id),
  },
}

export const Empty: Story = {
  args: {
    conversations: [],
    searchable: true,
  },
}
