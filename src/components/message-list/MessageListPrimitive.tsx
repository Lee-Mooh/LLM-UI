import { type CSSProperties, type ReactNode } from 'react'

import { Bubble } from '../bubble/Bubble'
import { type LLMRole, type messageStatus } from '../../types/common'
import { useVirtualList } from '../../hooks/useVirtualList'

export interface MessageRecord {
  id: string
  role: LLMRole
  content?: string
  avatar?: ReactNode
  timestamp?: Date | string
  status?: messageStatus
  loading?: boolean
  actions?: ReactNode
}

export interface MessageListPrimitiveProps {
  messages: MessageRecord[]
  virtualized?: boolean
  itemHeight?: number
  overscan?: number
  emptyText?: ReactNode
  renderMessage?: (message: MessageRecord, index: number) => ReactNode
  role?: 'log' | 'list'
  ariaLabel?: string
  className?: string
  style?: CSSProperties
}

function defaultRenderMessage(message: MessageRecord) {
  return (
    <Bubble
      role={message.role}
      {...(message.actions && { actions: message.actions })}
      {...(message.avatar && { avatar: message.avatar })}
      {...(message.content && { content: message.content })}
      {...(message.loading !== undefined && { loading: message.loading })}
      {...(message.status && { status: message.status })}
      {...(message.timestamp && { timestamp: message.timestamp })}
    />
  )
}

export function MessageListPrimitive({
  messages,
  virtualized = false,
  itemHeight = 112,
  overscan = 5,
  emptyText = '暂无消息',
  renderMessage,
  role = 'log',
  ariaLabel = '消息列表',
  className,
  style,
}: MessageListPrimitiveProps) {
  const { containerRef, totalSize, virtualItems } = useVirtualList({
    items: messages,
    itemHeight,
    overscan,
    enabled: virtualized,
    getItemKey: (message) => message.id,
  })
  const isLog = role === 'log'
  const listItems = virtualized
    ? virtualItems
    : messages.map((message, index) => ({
        item: message,
        index,
        key: message.id,
        start: index * itemHeight,
        size: itemHeight,
      }))

  return (
    <section
      aria-label={ariaLabel}
      aria-live={isLog ? 'polite' : undefined}
      className={className}
      data-virtualized={virtualized ? '' : undefined}
      role={role}
      style={style}
    >
      <div className="llm-message-list__body" ref={containerRef}>
        {messages.length > 0 ? (
          <div
            className="llm-message-list__items"
            data-virtualized={virtualized ? '' : undefined}
            role={isLog ? undefined : 'list'}
            style={virtualized ? { height: totalSize } : undefined}
          >
            {listItems.map((virtualItem) => (
              <div
                className="llm-message-list__item"
                data-virtualized={virtualized ? '' : undefined}
                key={virtualItem.key}
                role={isLog ? 'article' : 'listitem'}
                style={
                  virtualized
                    ? {
                        height: virtualItem.size,
                        transform: `translateY(${virtualItem.start}px)`,
                      }
                    : undefined
                }
              >
                {renderMessage
                  ? renderMessage(virtualItem.item, virtualItem.index)
                  : defaultRenderMessage(virtualItem.item)}
              </div>
            ))}
          </div>
        ) : (
          <div className="llm-message-list__empty">{emptyText}</div>
        )}
      </div>
    </section>
  )
}
