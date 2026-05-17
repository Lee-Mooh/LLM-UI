import {
  NotificationPrimitive,
  type NotificationPrimitiveProps,
} from './NotificationPrimitive'
import cn from '../../utils/cn'

export type NotificationProps = NotificationPrimitiveProps

export interface NotificationItem extends NotificationProps {
  id: string
}

export interface NotificationStackProps {
  items: NotificationItem[]
  onClose?: (id: string) => void
  className?: string
}

export function Notification({ className, ...props }: NotificationProps) {
  return <NotificationPrimitive className={cn('llm-notification', className)} {...props} />
}

export function NotificationStack({
  items,
  onClose,
  className,
}: NotificationStackProps) {
  return (
    <div className={cn('llm-notification-stack', className)}>
      {items.map(({ id, onClose: itemOnClose, ...item }) => (
        <Notification
          key={id}
          {...item}
          onClose={() => {
            itemOnClose?.()
            onClose?.(id)
          }}
        />
      ))}
    </div>
  )
}
