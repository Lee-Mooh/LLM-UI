import { isValidElement, type ReactElement, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { CodeHighlighter } from '../code-highlighter/CodeHighlighter'

export interface MarkPrimitiveProps {
  content: string
  streaming?: boolean
  onComplete?: () => void
  className?: string
}

type CodeElementProps = {
  className?: string
  children?: ReactNode
}

function getCodeLanguage(className?: string) {
  return className?.match(/language-([\w-]+)/)?.[1] ?? 'text'
}

function getCodeContent(children: ReactNode) {
  return String(children ?? '').replace(/\n$/, '')
}

function isCodeElement(
  node: ReactNode,
): node is ReactElement<CodeElementProps> {
  return isValidElement<CodeElementProps>(node)
}

export function MarkPrimitive({ content, className }: MarkPrimitiveProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: ({ children, className }) => (
            <code className={className}>{children}</code>
          ),
          img: ({ alt, src, title }) => (
            <img alt={alt} loading="lazy" src={src} title={title} />
          ),
          pre: ({ children }) => {
            if (!isCodeElement(children)) return null

            return (
              <CodeHighlighter
                code={getCodeContent(children.props.children)}
                language={getCodeLanguage(children.props.className)}
              />
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
