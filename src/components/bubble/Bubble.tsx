import { BubblePrimitive, type BubblePrimitiveProps } from './BubblePrimitive'
import cn from '../../utils/cn'

export type BubbleProps = BubblePrimitiveProps

export function Bubble({ className, ...props }: BubbleProps) {
  return <BubblePrimitive className={cn('llm-bubble', className)} {...props} />
}
