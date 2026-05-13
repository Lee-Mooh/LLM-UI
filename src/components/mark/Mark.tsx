import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import cn from '../../utils/cn'

export interface MarkProps {
  content: string
  streaming?: boolean
  onComplete?: () => void
  codeHighlight?: boolean
  className?: string
}

export function Mark({
  content,
  codeHighlight = true,
  className,
}: MarkProps) {
  return (
    <div className={cn('llm-mark', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={codeHighlight ? [rehypeHighlight] : []}
        components={{
          img: ({ ...props }) => <img loading="lazy" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
