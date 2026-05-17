import { useEffect, useRef, useState, type CSSProperties } from 'react'

export interface ConversationRecord {
  id: string
  title: string
  lastMessage?: string
  timestamp?: Date | string
  pinned?: boolean
  favorite?: boolean
}

export interface ConversationItemPrimitiveProps {
  conversation: ConversationRecord
  active?: boolean
  onSelect?: (id: string) => void
  onDelete?: (id: string) => void
  onPin?: (id: string) => void
  onFavorite?: (id: string) => void
  className?: string
  style?: CSSProperties
}

function formatTimestamp(timestamp?: Date | string) {
  if (!timestamp) return undefined

  if (typeof timestamp === 'string') return timestamp

  return timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function PinIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="14"
      viewBox="0 0 24 24"
      width="14"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m14.5 4.5 5 5-3.2 3.2.8 5.4-1.2 1.2-4.4-4.4-4.7 4.7-2.4.8.8-2.4 4.7-4.7-4.4-4.4 1.2-1.2 5.4.8 3.2-3.2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      height="14"
      viewBox="0 0 24 24"
      width="14"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="m12 3 2.7 5.47 6.03.88-4.36 4.25 1.03 6-5.4-2.84-5.4 2.84 1.03-6-4.36-4.25 6.03-.88L12 3Z" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg
      aria-hidden="true"
      className="llm-conversation-item__menu-icon"
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        fill="currentColor"
      />
      <path
        d="M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        fill="currentColor"
      />
      <path
        d="M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function ConversationItemPrimitive({
  conversation,
  active = false,
  onSelect,
  onDelete,
  onPin,
  onFavorite,
  className,
  style,
}: ConversationItemPrimitiveProps) {
  const rootRef = useRef<HTMLElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const timestamp = formatTimestamp(conversation.timestamp)

  useEffect(() => {
    if (!menuOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [menuOpen])

  const handleAction = (action: 'pin' | 'favorite' | 'delete') => {
    if (action === 'pin') {
      onPin?.(conversation.id)
    }

    if (action === 'favorite') {
      onFavorite?.(conversation.id)
    }

    if (action === 'delete') {
      onDelete?.(conversation.id)
    }

    setMenuOpen(false)
  }

  return (
    <article
      ref={rootRef}
      className={className}
      data-active={active ? '' : undefined}
      data-favorite={conversation.favorite ? '' : undefined}
      data-pinned={conversation.pinned ? '' : undefined}
      style={style}
    >
      <button
        aria-current={active ? 'true' : undefined}
        className="llm-conversation-item__main"
        onClick={() => onSelect?.(conversation.id)}
        type="button"
      >
        <span className="llm-conversation-item__content">
          <span className="llm-conversation-item__header">
            <span className="llm-conversation-item__title">
              {conversation.title}
            </span>
            {timestamp ? (
              <span className="llm-conversation-item__time">{timestamp}</span>
            ) : null}
          </span>
        </span>
      </button>

      <div className="llm-conversation-item__actions">
        {conversation.pinned ? (
          <button
            aria-label="取消置顶"
            className="llm-conversation-item__status-button"
            onClick={() => handleAction('pin')}
            type="button"
          >
            <PinIcon />
          </button>
        ) : null}
        {conversation.favorite ? (
          <button
            aria-label="取消收藏"
            className="llm-conversation-item__status-button"
            onClick={() => handleAction('favorite')}
            type="button"
          >
            <StarIcon />
          </button>
        ) : null}
        <button
          aria-expanded={menuOpen}
          aria-label="打开会话操作"
          className="llm-conversation-item__menu-trigger"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          <MoreIcon />
        </button>
        {menuOpen ? (
          <div className="llm-conversation-item__menu" role="menu">
            <button
              className="llm-conversation-item__menu-item"
              onClick={() => handleAction('pin')}
              role="menuitem"
              type="button"
            >
              {conversation.pinned ? '取消置顶' : '置顶'}
            </button>
            <button
              className="llm-conversation-item__menu-item"
              onClick={() => handleAction('favorite')}
              role="menuitem"
              type="button"
            >
              {conversation.favorite ? '取消收藏' : '收藏'}
            </button>
            <button
              className="llm-conversation-item__menu-item"
              data-danger=""
              onClick={() => handleAction('delete')}
              role="menuitem"
              type="button"
            >
              删除
            </button>
          </div>
        ) : null}
      </div>
    </article>
  )
}
