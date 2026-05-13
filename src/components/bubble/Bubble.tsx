import { BubblePrimitive, type BubblePrimitiveProps } from './BubblePrimitive'
import cn from '../../utils/cn'

export type BubbleProps = BubblePrimitiveProps

export function Bubble({ role, className, ...props }: BubbleProps) {
  return (
    <BubblePrimitive
      role={role}
      className={cn(
        'flex w-full gap-3 text-sm leading-6',
        '[&_[data-slot=bubble-avatar]]:flex [&_[data-slot=bubble-avatar]]:size-6 [&_[data-slot=bubble-avatar]]:shrink-0 [&_[data-slot=bubble-avatar]]:items-center [&_[data-slot=bubble-avatar]]:justify-center [&_[data-slot=bubble-avatar]]:overflow-hidden [&_[data-slot=bubble-avatar]]:rounded-full [&_[data-slot=bubble-avatar]]:bg-[var(--llm-color-muted)] [&_[data-slot=bubble-avatar]]:text-xs [&_[data-slot=bubble-avatar]]:font-medium [&_[data-slot=bubble-avatar]]:text-[var(--llm-color-muted-foreground)]',
        '[&_[data-slot=bubble-body]]:flex [&_[data-slot=bubble-body]]:min-w-0 [&_[data-slot=bubble-body]]:flex-col [&_[data-slot=bubble-body]]:gap-1.5',
        '[&_[data-slot=bubble-content]]:min-w-0 [&_[data-slot=bubble-content]]:max-w-full [&_[data-slot=bubble-content]]:whitespace-pre-wrap [&_[data-slot=bubble-content]]:break-words [&_[data-slot=bubble-content]]:rounded-2xl [&_[data-slot=bubble-content]]:px-4 [&_[data-slot=bubble-content]]:py-2.5',
        '[&_[data-slot=bubble-meta]]:flex [&_[data-slot=bubble-meta]]:items-center [&_[data-slot=bubble-meta]]:gap-2 [&_[data-slot=bubble-meta]]:px-1 [&_[data-slot=bubble-meta]]:text-xs [&_[data-slot=bubble-meta]]:text-[var(--llm-color-muted-foreground)]',
        '[&_[data-slot=bubble-status]]:capitalize',
        '[&_[data-slot=bubble-loading]]:animate-pulse',
        role === 'user' &&
          'justify-end [&_[data-slot=bubble-avatar]]:hidden [&_[data-slot=bubble-body]]:max-w-[80%] [&_[data-slot=bubble-body]]:items-end [&_[data-slot=bubble-content]]:bg-[var(--llm-color-accent)] [&_[data-slot=bubble-content]]:text-[var(--llm-color-accent-foreground)] [&_[data-slot=bubble-meta]]:justify-end',
        role === 'assistant' &&
          'justify-start [&_[data-slot=bubble-body]]:max-w-[80%] [&_[data-slot=bubble-body]]:items-start [&_[data-slot=bubble-content]]:px-0 [&_[data-slot=bubble-content]]:py-0 [&_[data-slot=bubble-content]]:text-[var(--llm-color-text)]',
        role === 'system' &&
          'justify-center [&_[data-slot=bubble-avatar]]:hidden [&_[data-slot=bubble-body]]:max-w-full [&_[data-slot=bubble-body]]:items-center [&_[data-slot=bubble-content]]:px-0 [&_[data-slot=bubble-content]]:py-0 [&_[data-slot=bubble-content]]:text-xl [&_[data-slot=bubble-content]]:text-[var(--llm-color-muted-foreground)] [&_[data-slot=bubble-meta]]:justify-center',
        className,
      )}
      {...props}
    />
  )
}
