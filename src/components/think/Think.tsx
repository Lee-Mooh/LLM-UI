import { ThinkPrimitive, type ThinkPrimitiveProps } from './ThinkPrimitive'
import cn from '../../utils/cn'

export type ThinkProps = ThinkPrimitiveProps

export function Think({ className, ...props }: ThinkProps) {
  return <ThinkPrimitive className={cn('llm-think', className)} {...props} />
}
