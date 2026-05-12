import { type CSSProperties, type ReactNode } from 'react'
import { type LLMRole, type messageStatus } from '../../types/common'
import cn from '../../utils/cn'

export interface BubblePrimitiveProps {
  /** 消息角色，决定气泡的语义与布局方向 */
  role: LLMRole
  /** 文本内容；如果传入 children，则通常由 children 接管渲染 */
  content?: string
  /** 头像插槽，可传入图片、图标或自定义节点 */
  avatar?: ReactNode
  /** 时间戳，可传入格式化后的字符串或 Date 对象 */
  timestamp?: Date | string
  /** 消息发送状态，用于渲染发送中、已发送、错误等语义状态 */
  status?: messageStatus
  /** 是否处于加载中，常用于 assistant 消息的等待动画 */
  loading?: boolean
  /** 自定义内容插槽，优先级高于 content */
  children?: ReactNode
  /** 最外层元素类名，供 Styled 层或使用者覆盖 */
  className?: string
  /** 最外层元素内联样式 */
  style?: CSSProperties
}

const statusTextMap: Record<messageStatus, string> = {
  sending: '发送中',
  sent: '已发送',
  error: '发送失败',
}

function formatTimestamp(timestamp: Date | string) {
  if (typeof timestamp === 'string') {
    return timestamp
  }

  return timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function BubblePrimitive({
  role,
  content,
  avatar,
  timestamp,
  status,
  loading,
  children,
  className,
  style,
}: BubblePrimitiveProps) {
  const rootClassName = cn('llm-bubble', className)

  return (
    <div
      className={rootClassName}
      style={style}
      data-role={role}
      data-status={status}
      data-loading={loading}
    >
      {avatar && (
        <div className="llm-bubble__avatar" data-slot="bubble-avatar">
          {avatar}
        </div>
      )}
      <div className="llm-bubble__body" data-slot="bubble-body">
        {(children ?? content) && (
          <div className="llm-bubble__content" data-slot="bubble-content">
            {children ?? content}
          </div>
        )}
        {(timestamp || status || loading) && (
          <div className="llm-bubble__meta" data-slot="bubble-meta">
            {timestamp && (
              <span className="llm-bubble__time" data-slot="bubble-time">
                {formatTimestamp(timestamp)}
              </span>
            )}
            {status && (
              <span className="llm-bubble__status" data-slot="bubble-status">
                {statusTextMap[status]}
              </span>
            )}
            {loading && (
              <span className="llm-bubble__loading" data-slot="bubble-loading">
                思考中
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
