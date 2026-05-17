import { MarkPrimitive, type MarkPrimitiveProps } from './MarkPrimitive'
import cn from '../../utils/cn'

export type MarkProps = MarkPrimitiveProps

export function Mark({ className, ...props }: MarkProps) {
  return <MarkPrimitive className={cn('llm-mark', className)} {...props} />
}
