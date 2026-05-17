import {
  CodeHighlighterPrimitive,
  type CodeHighlighterPrimitiveProps,
} from './CodeHighlighterPrimitive'
import cn from '../../utils/cn'

export type CodeHighlighterProps = CodeHighlighterPrimitiveProps

export function CodeHighlighter({
  className,
  ...props
}: CodeHighlighterProps) {
  return (
    <CodeHighlighterPrimitive
      className={cn('llm-code-highlighter', className)}
      {...props}
    />
  )
}
