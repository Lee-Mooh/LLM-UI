import {
  CitationInlinePrimitive,
  CitationPrimitive,
  type CitationInlinePrimitiveProps,
  type CitationPrimitiveProps,
} from './CitationPrimitive'
import cn from '../../utils/cn'

export type CitationProps = CitationPrimitiveProps
export type CitationInlineProps = CitationInlinePrimitiveProps
export type { CitationItem } from './CitationPrimitive'

export function Citation({ className, ...props }: CitationProps) {
  return (
    <CitationPrimitive className={cn('llm-citation', className)} {...props} />
  )
}

function CitationInline({ className, ...props }: CitationInlineProps) {
  return (
    <CitationInlinePrimitive
      className={cn('llm-citation-inline', className)}
      {...props}
    />
  )
}

Citation.Inline = CitationInline
