import { useState, type CSSProperties } from 'react'

export interface ThinkPrimitiveProps {
  content?: string
  status?: 'thinking' | 'done'
  label?: string
  defaultOpen?: boolean
  className?: string
  style?: CSSProperties
}

function SparkIcon() {
  return (
    <svg
      aria-hidden="true"
      className="llm-think__icon"
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 3 9.9 8.2 5 10.1l4.9 1.9L12 17l2.1-5 4.9-1.9-4.9-1.9L12 3Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="m18 15-.9 2.1L15 18l2.1.9L18 21l.9-2.1L21 18l-2.1-.9L18 15Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      className="llm-think__chevron"
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function ThinkingDots() {
  return (
    <span aria-hidden="true" className="llm-think__dots">
      <span />
      <span />
      <span />
    </span>
  )
}

export function ThinkPrimitive({
  content,
  status = 'thinking',
  label,
  defaultOpen = true,
  className,
  style,
}: ThinkPrimitiveProps) {
  const [open, setOpen] = useState(defaultOpen)
  const title = label ?? (status === 'thinking' ? '思考中' : '已完成思考')

  return (
    <section
      className={className}
      data-open={open ? '' : undefined}
      data-status={status}
      style={style}
    >
      <button
        aria-expanded={open}
        className="llm-think__header"
        onClick={() => setOpen((nextOpen) => !nextOpen)}
        type="button"
      >
        <span className="llm-think__title">
          <SparkIcon />
          <span>{title}</span>
          {status === 'thinking' ? <ThinkingDots /> : null}
        </span>
        <ChevronIcon />
      </button>

      <div className="llm-think__content" hidden={!open}>
        {content ? (
          <div className="llm-think__text">{content}</div>
        ) : (
          <div className="llm-think__placeholder">正在分析上下文与用户意图</div>
        )}
      </div>
    </section>
  )
}
