import { PromptsPrimitive, type PromptsPrimitiveProps } from './PromptsPrimitive'
import cn from '../../utils/cn'

export type PromptsProps = PromptsPrimitiveProps
export type { PromptItem } from './PromptsPrimitive'

export function Prompts({ className, ...props }: PromptsProps) {
  return <PromptsPrimitive className={cn('llm-prompts', className)} {...props} />
}
