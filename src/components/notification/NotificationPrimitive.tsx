import { useEffect, type CSSProperties, type ReactNode } from 'react'

export type NotificationType = 'success' | 'error' | 'loading'

export interface NotificationPrimitiveProps {
  type?: NotificationType
  title?: ReactNode
  description?: ReactNode
  duration?: number
  showProgress?: boolean
  closeable?: boolean
  icon?: ReactNode
  onClose?: () => void
  className?: string
  style?: CSSProperties
}

const defaultTitleMap: Record<NotificationType, string> = {
  success: '操作成功',
  error: '操作失败',
  loading: '处理中',
}

function SuccessIcon() {
  return (
    <svg
      aria-hidden="true"
      className="llm-notification__icon-svg"
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m6 12 4 4 8-8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg
      aria-hidden="true"
      className="llm-notification__icon-svg"
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m8 8 8 8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.4"
      />
      <path
        d="m16 8-8 8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.4"
      />
    </svg>
  )
}

function LoadingIcon() {
  return (
    <svg
      aria-hidden="true"
      className="llm-notification__icon-svg llm-notification__icon-svg--loading"
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21 12a9 9 0 1 1-3.2-6.9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.4"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="llm-notification__close-icon"
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m7 7 10 10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="m17 7-10 10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function DefaultIcon({ type }: { type: NotificationType }) {
  if (type === 'success') return <SuccessIcon />
  if (type === 'error') return <ErrorIcon />
  return <LoadingIcon />
}

export function NotificationPrimitive({
  type = 'success',
  title,
  description,
  duration = 4500,
  showProgress = false,
  closeable = true,
  icon,
  onClose,
  className,
  style,
}: NotificationPrimitiveProps) {
  useEffect(() => {
    if (!duration || type === 'loading') return

    const timer = window.setTimeout(() => {
      onClose?.()
    }, duration)

    return () => {
      window.clearTimeout(timer)
    }
  }, [duration, onClose, type])

  return (
    <section
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={className}
      data-type={type}
      role={type === 'error' ? 'alert' : 'status'}
      style={style}
    >
      <div className="llm-notification__icon">
        {icon ?? <DefaultIcon type={type} />}
      </div>
      <div className="llm-notification__body">
        <div className="llm-notification__title">
          {title ?? defaultTitleMap[type]}
        </div>
        {description ? (
          <div className="llm-notification__description">{description}</div>
        ) : null}
      </div>
      {closeable ? (
        <button
          aria-label="关闭通知"
          className="llm-notification__close"
          onClick={onClose}
          type="button"
        >
          <CloseIcon />
        </button>
      ) : null}
      {showProgress && duration > 0 && type !== 'loading' ? (
        <div
          aria-hidden="true"
          className="llm-notification__progress"
          style={{ animationDuration: `${duration}ms` }}
        />
      ) : null}
    </section>
  )
}
