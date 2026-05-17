import { ActionsPrimitive, type ActionsPrimitiveProps } from './ActionsPrimitive'
import cn from '../../utils/cn'

export type ActionsProps = ActionsPrimitiveProps
export type { ActionItem, ActionVariant } from './ActionsPrimitive'

export function Actions({ className, ...props }: ActionsProps) {
  return <ActionsPrimitive className={cn('llm-actions', className)} {...props} />
}
