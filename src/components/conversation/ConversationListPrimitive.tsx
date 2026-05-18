import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'

import { ConversationItem } from './ConversationItem'
import { type ConversationRecord } from './ConversationItemPrimitive'
import { useVirtualList } from '../../hooks/useVirtualList'

export interface ConversationListPrimitiveProps {
  conversations: ConversationRecord[]
  activeId?: string
  onSelect?: (id: string) => void
  onDelete?: (id: string) => void
  onPin?: (id: string) => void
  onFavorite?: (id: string) => void
  onCollapsedChange?: (collapsed: boolean) => void
  onNewConversation?: () => void
  collapsed?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  title?: ReactNode
  emptyText?: ReactNode
  virtualized?: boolean
  itemHeight?: number
  overscan?: number
  className?: string
  style?: CSSProperties
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase()
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m20 20-4.3-4.3m1.8-5.2a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export function ConversationListPrimitive({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onPin,
  onFavorite,
  onCollapsedChange,
  onNewConversation,
  collapsed = false,
  searchable = false,
  searchPlaceholder = '搜索会话...',
  title,
  emptyText,
  virtualized = false,
  itemHeight = 56,
  overscan = 6,
  className,
  style,
}: ConversationListPrimitiveProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const keyword = normalizeSearchText(searchValue)

  const visibleConversations = useMemo(() => {
    const filteredConversations = keyword
      ? conversations.filter((conversation) => {
          const titleMatched = conversation.title
            .toLowerCase()
            .includes(keyword)
          const messageMatched =
            conversation.lastMessage?.toLowerCase().includes(keyword) ?? false

          return titleMatched || messageMatched
        })
      : conversations

    return filteredConversations
      .map((conversation, index) => ({ conversation, index }))
      .sort((a, b) => {
        if (a.conversation.pinned === b.conversation.pinned) {
          return a.index - b.index
        }

        return a.conversation.pinned ? -1 : 1
      })
      .map(({ conversation }) => conversation)
  }, [conversations, keyword])

  const resolvedEmptyText =
    emptyText ?? (keyword ? '未找到相关会话' : '暂无会话')
  const { containerRef, totalSize, virtualItems } = useVirtualList({
    items: visibleConversations,
    itemHeight,
    overscan,
    enabled: virtualized,
    getItemKey: (conversation) => conversation.id,
  })

  return (
    <aside
      className={className}
      data-collapsed={collapsed ? '' : undefined}
      data-virtualized={virtualized ? '' : undefined}
      style={style}
    >
      <div className="llm-conversation-list__header">
        <div className="llm-conversation-list__toolbar">
          <button
            aria-label={collapsed ? '打开边栏' : '关闭边栏'}
            className="llm-conversation-list__icon-button"
            onClick={() => onCollapsedChange?.(!collapsed)}
            type="button"
          >
            {collapsed ? '›' : '‹'}
          </button>
          <div className="llm-conversation-list__toolbar-actions">
            {searchable && !collapsed ? (
              <button
                aria-expanded={searchOpen}
                aria-label="搜索会话"
                className="llm-conversation-list__icon-button"
                onClick={() => setSearchOpen((open) => !open)}
                type="button"
              >
                <SearchIcon />
              </button>
            ) : null}
            <button
              aria-label="打开新聊天"
              className="llm-conversation-list__icon-button"
              onClick={onNewConversation}
              type="button"
            >
              +
            </button>
          </div>
        </div>
        {title ? (
          <div className="llm-conversation-list__title">{title}</div>
        ) : null}
        {searchable && searchOpen && !collapsed ? (
          <label className="llm-conversation-list__search">
            <span className="llm-conversation-list__search-label">
              搜索会话
            </span>
            <input
              aria-label="搜索会话"
              className="llm-conversation-list__search-input"
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={searchPlaceholder}
              type="search"
              value={searchValue}
            />
          </label>
        ) : null}
      </div>

      {!collapsed ? (
        <div className="llm-conversation-list__body" ref={containerRef}>
          {visibleConversations.length > 0 ? (
            <div
              className="llm-conversation-list__items"
              data-virtualized={virtualized ? '' : undefined}
              role="list"
              style={virtualized ? { height: totalSize } : undefined}
            >
              {(virtualized
                ? virtualItems
                : visibleConversations.map((conversation, index) => ({
                    item: conversation,
                    index,
                    key: conversation.id,
                    start: index * itemHeight,
                    size: itemHeight,
                  }))
              ).map((virtualItem) => (
                <div
                  className="llm-conversation-list__item"
                  data-virtualized={virtualized ? '' : undefined}
                  key={virtualItem.key}
                  role="listitem"
                  style={
                    virtualized
                      ? {
                          height: virtualItem.size,
                          transform: `translateY(${virtualItem.start}px)`,
                        }
                      : undefined
                  }
                >
                  <ConversationItem
                    active={virtualItem.item.id === activeId}
                    conversation={virtualItem.item}
                    {...(onSelect && { onSelect })}
                    {...(onDelete && { onDelete })}
                    {...(onFavorite && { onFavorite })}
                    {...(onPin && { onPin })}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="llm-conversation-list__empty">
              {resolvedEmptyText}
            </div>
          )}
        </div>
      ) : null}
    </aside>
  )
}
