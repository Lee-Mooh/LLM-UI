import { useState, type CSSProperties, type ReactNode } from 'react'

export interface CitationItem {
  key: string
  title: ReactNode
  description?: ReactNode
  url?: string
  icon?: ReactNode
}

export interface CitationPrimitiveProps {
  items: CitationItem[]
  title?: ReactNode
  defaultExpanded?: boolean
  expanded?: boolean
  onExpand?: (expanded: boolean) => void
  onCitation?: (key: string, item: CitationItem) => void
  emptyText?: ReactNode
  className?: string
  style?: CSSProperties
}

export interface CitationInlinePrimitiveProps {
  item: CitationItem
  index?: number
  active?: boolean
  onCitation?: (key: string, item: CitationItem) => void
  className?: string
  style?: CSSProperties
}

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      className="llm-citation__chevron"
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

function getHost(url?: string) {
  if (!url) return undefined

  try {
    return new URL(url).host
  } catch {
    return url
  }
}

function CitationPreview({ item }: { item: CitationItem }) {
  return (
    <span className="llm-citation__preview" role="tooltip">
      <span className="llm-citation__preview-title">{item.title}</span>
      {item.description ? (
        <span className="llm-citation__preview-description">
          {item.description}
        </span>
      ) : null}
      {item.url ? (
        <span className="llm-citation__preview-url">{getHost(item.url)}</span>
      ) : null}
    </span>
  )
}

export function CitationInlinePrimitive({
  item,
  index = 1,
  active = false,
  onCitation,
  className,
  style,
}: CitationInlinePrimitiveProps) {
  const label = `引用来源 ${index}`

  const handleClick = () => {
    onCitation?.(item.key, item)
  }

  return (
    <span
      className={className}
      data-active={active ? '' : undefined}
      style={style}
    >
      <button
        aria-label={label}
        className="llm-citation__inline-trigger"
        onClick={handleClick}
        type="button"
      >
        [{index}]
      </button>
      <CitationPreview item={item} />
    </span>
  )
}

export function CitationPrimitive({
  items,
  title,
  defaultExpanded = true,
  expanded,
  onExpand,
  onCitation,
  emptyText = '暂无引用来源',
  className,
  style,
}: CitationPrimitiveProps) {
  const [innerExpanded, setInnerExpanded] = useState(defaultExpanded)
  const mergedExpanded = expanded ?? innerExpanded
  const heading = title ?? `Used ${items.length} sources`

  const handleExpand = () => {
    const nextExpanded = !mergedExpanded

    if (expanded === undefined) setInnerExpanded(nextExpanded)
    onExpand?.(nextExpanded)
  }

  const handleCitation = (item: CitationItem) => {
    onCitation?.(item.key, item)
  }

  return (
    <section
      className={className}
      data-expanded={mergedExpanded ? '' : undefined}
      style={style}
    >
      <button
        aria-expanded={mergedExpanded}
        className="llm-citation__header"
        onClick={handleExpand}
        type="button"
      >
        <span className="llm-citation__title">{heading}</span>
        <ChevronIcon />
      </button>

      <div className="llm-citation__content" hidden={!mergedExpanded}>
        {items.length > 0 ? (
          <ul className="llm-citation__list">
            {items.map((item) => (
              <li className="llm-citation__item" key={item.key}>
                <button
                  className="llm-citation__item-button"
                  onClick={() => handleCitation(item)}
                  type="button"
                >
                  {item.icon ? <span className="llm-citation__item-icon">{item.icon}</span> : null}
                  <span className="llm-citation__item-title">{item.title}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="llm-citation__empty">{emptyText}</div>
        )}
      </div>
    </section>
  )
}
