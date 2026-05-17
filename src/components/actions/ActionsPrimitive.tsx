import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

export type ActionVariant = 'default' | 'primary' | 'danger'

export interface ActionItem {
  key: string
  label: string
  icon?: ReactNode
  disabled?: boolean
  variant?: ActionVariant
}

export interface ActionsPrimitiveProps {
  items: ActionItem[]
  onAction?: (key: string, item: ActionItem) => void
  copiedKey?: string
  copiedDuration?: number
  orientation?: 'horizontal' | 'vertical'
  size?: 'sm' | 'md'
  className?: string
  style?: CSSProperties
}

function CopyIcon() {
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
        d="M8 8.5V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M4 10a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function CheckIcon() {
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
        d="m5 12.5 4.2 4.2L19 6.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function ReloadIcon() {
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
        d="M20 12a8 8 0 1 1-2.34-5.66L20 8.68M20 4v4.68h-4.68"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function EditIcon() {
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

function ThumbsUpIcon() {
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
        d="M7 21H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3m0 10V10l4-7 1.4 1.4a3 3 0 0 1 .8 2.7L12.8 10H19a2 2 0 0 1 2 2.3l-1 6A3 3 0 0 1 17 21z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function ThumbsDownIcon() {
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
        d="M17 3h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-3m0-10v11l-4 7-1.4-1.4a3 3 0 0 1-.8-2.7l.4-2.9H5a2 2 0 0 1-2-2.3l1-6A3 3 0 0 1 7 3z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

const defaultIcons: Record<string, ReactNode> = {
  copy: <CopyIcon />,
  regenerate: <ReloadIcon />,
  reload: <ReloadIcon />,
  edit: <EditIcon />,
  correct: <EditIcon />,
  like: <ThumbsUpIcon />,
  dislike: <ThumbsDownIcon />,
}

function getActionIcon(item: ActionItem, copied: boolean) {
  if (copied) return <CheckIcon />

  return item.icon ?? defaultIcons[item.key]
}

export function ActionsPrimitive({
  items,
  onAction,
  copiedKey = 'copy',
  copiedDuration = 1800,
  orientation = 'horizontal',
  size = 'md',
  className,
  style,
}: ActionsPrimitiveProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return

    const timer = window.setTimeout(() => setCopied(false), copiedDuration)

    return () => window.clearTimeout(timer)
  }, [copied, copiedDuration])

  const handleAction = (item: ActionItem) => {
    if (item.disabled) return

    if (item.key === copiedKey) {
      setCopied(true)
    }

    onAction?.(item.key, item)
  }

  return (
    <div
      className={className}
      data-orientation={orientation}
      data-size={size}
      role="toolbar"
      style={style}
    >
      {items.map((item) => {
        const itemCopied = item.key === copiedKey && copied
        const icon = getActionIcon(item, itemCopied)

        return (
          <button
            aria-label={item.label}
            className="llm-actions__item"
            data-copied={itemCopied ? '' : undefined}
            data-variant={item.variant}
            disabled={item.disabled}
            key={item.key}
            onClick={() => handleAction(item)}
            title={item.label}
            type="button"
          >
            {icon ? <span className="llm-actions__icon">{icon}</span> : null}
            <span className="llm-actions__label">{itemCopied ? '已复制' : item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
