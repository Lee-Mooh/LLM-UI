import { useEffect } from 'react'
import { expect, within } from 'storybook/test'
import { type Meta, type StoryObj } from '@storybook/react-vite'

import { useStream } from '../../hooks/useStream'
import { mockStream } from '../../utils/stream'
import { Mark } from './Mark'

const meta: Meta<typeof Mark> = {
  title: 'Components/Mark',
  component: Mark,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Mark 用于渲染模型输出中的 Markdown 内容，支持 GFM、表格、任务列表、链接、图片懒加载，并将 fenced code block 交给 CodeHighlighter 渲染。',
      },
    },
  },
}

export default meta

type Story = StoryObj<typeof Mark>

export const Basic: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '基础示例覆盖标题、段落、引用、列表、任务列表、表格、代码块和图片等常见 Markdown 内容。',
      },
    },
  },
  args: {
    content: `# Hello Mark

这是一个基础 Markdown 渲染示例，覆盖常见的 GFM 语法。

## 基础文本

支持 **加粗**、*斜体*、~~删除线~~、\`inline code\`，以及 [链接](https://example.com)。

> 这是一段引用内容，适合展示模型输出中的补充说明。

## 列表

- 支持无序列表
- 支持 **强调内容**
- 支持嵌套内容

1. 第一步
2. 第二步
3. 第三步

## 任务列表

- [x] 支持任务完成状态
- [ ] 支持任务未完成状态

## 表格

| 组件 | 能力 | 状态 |
| --- | --- | --- |
| Mark | Markdown 渲染 | 进行中 |
| Bubble | 对话气泡 | 已完成 |
| CodeHighlighter | 代码高亮 | 待开始 |

## 代码块

\`\`\`tsx
function Greeting({ name }: { name: string }) {
  return <div>Hello, {name}</div>
}
\`\`\`

## 图片

![示例图片](https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=960&auto=format&fit=crop&q=80)
`,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      canvas.getByRole('heading', { name: 'Hello Mark' }),
    ).toBeInTheDocument()
    await expect(canvas.getByText('支持无序列表')).toBeInTheDocument()
    await expect(canvas.getByText('Mark')).toBeInTheDocument()
    await expect(canvas.getByText(/function Greeting/)).toBeInTheDocument()
  },
}
const streamingContent = `# 流式 Markdown

这段内容会像模型回复一样逐字出现。

## Where we should start?

- 支持 **Markdown**
- 支持 \`inline code\`
- 支持列表和标题

\`\`\`tsx
function streamMessage(message: string) {
  return message
}
\`\`\`
`

function StreamingMark() {
  const { content, state, start } = useStream()

  useEffect(() => {
    void start(mockStream(streamingContent, 30))
  }, [start])

  return <Mark content={content} streaming={state === 'streaming'} />
}

export const Streaming: Story = {
  render: () => <StreamingMark />,
}
