import {
  MessageListPrimitive,
  type MessageListPrimitiveProps,
} from './MessageListPrimitive'
import cn from '../../utils/cn'

export type MessageListProps = MessageListPrimitiveProps
export type { MessageRecord } from './MessageListPrimitive'

export function MessageList({ className, ...props }: MessageListProps) {
  return (
    <MessageListPrimitive
      className={cn('llm-message-list', className)}
      {...props}
    />
  )
}
