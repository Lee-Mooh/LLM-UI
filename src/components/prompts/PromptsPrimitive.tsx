import { type CSSProperties, type ReactNode } from 'react'

export interface PromptItem {
  key: string
  title: ReactNode
  prompt?: string
  description?: ReactNode
  category?: ReactNode
  icon?: ReactNode
  disabled?: boolean
}

export interface PromptsPrimitiveProps {
  items: PromptItem[]
  onPrompt?: (key: string, item: PromptItem) => void
  title?: ReactNode
  description?: ReactNode
  emptyText?: ReactNode
  columns?: 1 | 2 | 3
  className?: string
  style?: CSSProperties
}

export function PromptsPrimitive({
  items,
  onPrompt,
  title,
  description,
  emptyText = '暂无提示词',
  columns = 2,
  className,
  style,
}: PromptsPrimitiveProps) {
  const hasHeader = Boolean(title || description)

  const handlePrompt = (item: PromptItem) => {
    if (item.disabled) return

    onPrompt?.(item.key, item)
  }

  return (
    <section className={className} data-columns={columns} style={style}>
      {hasHeader ? (
        <div className="llm-prompts__header">
          {title ? <div className="llm-prompts__title">{title}</div> : null}
          {description ? (
            <div className="llm-prompts__description">{description}</div>
          ) : null}
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="llm-prompts__list">
          {items.map((item) => (
            <button
              aria-label={typeof item.title === 'string' ? item.title : undefined}
              className="llm-prompts__item"
              disabled={item.disabled}
              key={item.key}
              onClick={() => handlePrompt(item)}
              type="button"
            >
              {item.icon ? <span className="llm-prompts__icon">{item.icon}</span> : null}
              <span className="llm-prompts__item-title">{item.title}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="llm-prompts__empty">{emptyText}</div>
      )}
    </section>
  )
}
