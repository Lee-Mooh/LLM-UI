import { SenderPrimitive, type SenderPrimitiveProps } from './SenderPrimitive'
import cn from '../../utils/cn'

export type SenderProps = SenderPrimitiveProps
export type { SenderModelOption, SenderPrefixAction } from './SenderPrimitive'

export function Sender({ className, ...props }: SenderProps) {
  return <SenderPrimitive className={cn('llm-sender', className)} {...props} />
}
