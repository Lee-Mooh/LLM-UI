import {
  ConversationItemPrimitive,
  type ConversationItemPrimitiveProps,
} from './ConversationItemPrimitive'
import cn from '../../utils/cn'

export type ConversationItemProps = ConversationItemPrimitiveProps
export type { ConversationRecord } from './ConversationItemPrimitive'

export function ConversationItem({
  className,
  ...props
}: ConversationItemProps) {
  return (
    <ConversationItemPrimitive
      className={cn('llm-conversation-item', className)}
      {...props}
    />
  )
}
