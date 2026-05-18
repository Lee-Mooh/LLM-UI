import {
  ThoughtPrimitive,
  type ThoughtPrimitiveProps,
} from './ThoughtPrimitive'
import cn from '../../utils/cn'

export type ThoughtProps = ThoughtPrimitiveProps
export type { ThoughtItem, ThoughtStatus } from './ThoughtPrimitive'

export function Thought({ className, ...props }: ThoughtProps) {
  return (
    <ThoughtPrimitive className={cn('llm-thought', className)} {...props} />
  )
}
