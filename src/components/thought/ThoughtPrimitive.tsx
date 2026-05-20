import { useState, type CSSProperties, type ReactNode } from 'react'

export type ThoughtStatus =
  | 'pending'
  | 'loading'
  | 'success'
  | 'error'
  | 'abort'

export interface ThoughtItem {
  key: string
  title: ReactNode
  description?: ReactNode
  content?: ReactNode
  footer?: ReactNode
  status?: ThoughtStatus
  icon?: ReactNode | false
  collapsible?: boolean
  defaultOpen?: boolean
  children?: ThoughtItem[]
}

export interface ThoughtPrimitiveProps {
  items: ThoughtItem[]
  title?: ReactNode
  description?: ReactNode
  defaultExpandedKeys?: string[]
  expandedKeys?: string[]
  onExpand?: (expandedKeys: string[], item: ThoughtItem) => void
  line?: boolean
  compact?: boolean
  emptyText?: ReactNode
  className?: string
  style?: CSSProperties
}

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      className="llm-thought__chevron"
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function StatusIcon({ status }: { status: ThoughtStatus }) {
  if (status === 'loading') {
    return (
      <span aria-hidden="true" className="llm-thought__spinner">
        <span />
      </span>
    )
  }

  if (status === 'success') {
    return (
      <svg
        aria-hidden="true"
        fill="none"
        height="14"
        viewBox="0 0 24 24"
        width="14"
      >
        <path
          d="m5 12.5 4.2 4.2L19 6.8"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.4"
        />
      </svg>
    )
  }

  if (status === 'error') {
    return (
      <svg
        aria-hidden="true"
        fill="none"
        height="14"
        viewBox="0 0 24 24"
        width="14"
      >
        <path
          d="m7 7 10 10M17 7 7 17"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.4"
        />
      </svg>
    )
  }

  if (status === 'abort') {
    return (
      <svg
        aria-hidden="true"
        fill="none"
        height="14"
        viewBox="0 0 24 24"
        width="14"
      >
        <path
          d="M7 12h10"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.4"
        />
      </svg>
    )
  }

  return <span aria-hidden="true" className="llm-thought__pending-dot" />
}

function hasExpandableContent(item: ThoughtItem) {
  return Boolean(item.content)
}

interface ThoughtNodeProps {
  item: ThoughtItem
  depth: number
  line: boolean
  isExpanded: (key: string) => boolean
  onToggle: (item: ThoughtItem) => void
}

function ThoughtNode({
  item,
  depth,
  line,
  isExpanded,
  onToggle,
}: ThoughtNodeProps) {
  const status = item.status ?? 'pending'
  const expandable = item.collapsible ?? hasExpandableContent(item)
  const expanded = expandable && isExpanded(item.key)
  const nodeId = `llm-thought-node-${item.key}`
  const contentId = `llm-thought-content-${item.key}`

  return (
    <li className="llm-thought__item" data-depth={depth} data-status={status}>
      <div className="llm-thought__rail" data-line={line ? '' : undefined}>
        {item.icon === false ? null : (
          <span className="llm-thought__icon">
            {item.icon ?? <StatusIcon status={status} />}
          </span>
        )}
      </div>

      <div className="llm-thought__node">
        <div className="llm-thought__header">
          <div className="llm-thought__heading" id={nodeId}>
            <span className="llm-thought__item-title">{item.title}</span>
          </div>

          {expandable ? (
            <button
              aria-controls={contentId}
              aria-expanded={expanded}
              aria-labelledby={nodeId}
              className="llm-thought__toggle"
              onClick={() => onToggle(item)}
              type="button"
            >
              <ChevronIcon />
            </button>
          ) : null}
        </div>

        {hasExpandableContent(item) ? (
          <div
            className="llm-thought__content"
            hidden={!expanded}
            id={contentId}
          >
            <div className="llm-thought__body">{item.content}</div>
          </div>
        ) : null}
      </div>
    </li>
  )
}

interface ThoughtListProps {
  items: ThoughtItem[]
  depth: number
  line: boolean
  isExpanded: (key: string) => boolean
  onToggle: (item: ThoughtItem) => void
}

function ThoughtList({
  items,
  depth,
  line,
  isExpanded,
  onToggle,
}: ThoughtListProps) {
  return (
    <ol className="llm-thought__list">
      {items.map((item) => (
        <ThoughtNode
          depth={depth}
          isExpanded={isExpanded}
          item={item}
          key={item.key}
          line={line}
          onToggle={onToggle}
        />
      ))}
    </ol>
  )
}

export function ThoughtPrimitive({
  items,
  title,
  description,
  defaultExpandedKeys,
  expandedKeys,
  onExpand,
  line = true,
  compact = false,
  emptyText = '暂无思考步骤',
  className,
  style,
}: ThoughtPrimitiveProps) {
  const [innerExpandedKeys, setInnerExpandedKeys] = useState(
    () => defaultExpandedKeys ?? [],
  )
  const mergedExpandedKeys = expandedKeys ?? innerExpandedKeys
  const hasHeader = Boolean(title || description)

  const isExpanded = (key: string) => mergedExpandedKeys.includes(key)

  const handleToggle = (item: ThoughtItem) => {
    const nextExpandedKeys = isExpanded(item.key)
      ? mergedExpandedKeys.filter((key) => key !== item.key)
      : [...mergedExpandedKeys, item.key]

    if (!expandedKeys) setInnerExpandedKeys(nextExpandedKeys)
    onExpand?.(nextExpandedKeys, item)
  }

  return (
    <section
      className={className}
      data-compact={compact ? '' : undefined}
      style={style}
    >
      {hasHeader ? (
        <div className="llm-thought__section-header">
          {title ? <div className="llm-thought__title">{title}</div> : null}
          {description ? (
            <div className="llm-thought__summary">{description}</div>
          ) : null}
        </div>
      ) : null}

      {items.length > 0 ? (
        <ThoughtList
          depth={0}
          isExpanded={isExpanded}
          items={items}
          line={line}
          onToggle={handleToggle}
        />
      ) : (
        <div className="llm-thought__empty">{emptyText}</div>
      )}
    </section>
  )
}
