import {
  ConversationListPrimitive,
  type ConversationListPrimitiveProps,
} from './ConversationListPrimitive'
import cn from '../../utils/cn'

export type ConversationListProps = ConversationListPrimitiveProps

export function ConversationList({
  className,
  ...props
}: ConversationListProps) {
  return (
    <ConversationListPrimitive
      className={cn('llm-conversation-list', className)}
      {...props}
    />
  )
}
