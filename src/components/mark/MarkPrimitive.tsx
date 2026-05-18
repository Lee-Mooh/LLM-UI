import { isValidElement, type ReactElement, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { CodeHighlighter } from '../code-highlighter/CodeHighlighter'
import { sanitizeMarkdown } from '../../utils/markdown'

export interface MarkPrimitiveProps {
  content: string
  streaming?: boolean
  onComplete?: () => void
  className?: string
}

type CodeElementProps = {
  className?: string | undefined
  children?: ReactNode
}

function getCodeLanguage(className?: string) {
  return className?.match(/language-([\w-]+)/)?.[1] ?? 'text'
}

function getCodeContent(children: ReactNode) {
  return String(children ?? '').replace(/\n$/, '')
}

function hasOpenCodeFence(content: string) {
  return (content.match(/```/g) ?? []).length % 2 !== 0
}

function isCodeElement(
  node: ReactNode,
): node is ReactElement<CodeElementProps> {
  return isValidElement<CodeElementProps>(node)
}

const markdownComponents: Components = {
  code: ({ children, className }: CodeElementProps) => (
    <code className={className}>{children}</code>
  ),
  img: ({ alt, src, title }) => (
    <img alt={alt} loading="lazy" src={src} title={title} />
  ),
  pre: ({ children }: { children?: ReactNode }) => {
    if (!isCodeElement(children)) return null

    return (
      <CodeHighlighter
        code={getCodeContent(children.props.children)}
        language={getCodeLanguage(children.props.className)}
      />
    )
  },
}

export function MarkPrimitive({
  content,
  streaming = false,
  className,
}: MarkPrimitiveProps) {
  const hasStreamingCodeFence = streaming && hasOpenCodeFence(content)
  const parsedContent = hasStreamingCodeFence
    ? sanitizeMarkdown(content)
    : content

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {parsedContent}
      </ReactMarkdown>
    </div>
  )
}
