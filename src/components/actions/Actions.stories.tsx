import { useState } from 'react'
import { type Meta, type StoryObj } from '@storybook/react-vite'

import { Actions, type ActionItem } from './Actions'
import { createPresetActions } from './ActionsPreset'
import { useStream } from '../../hooks/useStream'
import { mockStream } from '../../utils/stream'

const meta: Meta<typeof Actions> = {
  title: 'Components/Actions',
  component: Actions,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: 24 }}>
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Actions>

const assistantActions: ActionItem[] = [
  { key: 'copy', label: '复制' },
  { key: 'regenerate', label: '重新生成' },
  { key: 'correct', label: '纠错' },
]

function StreamingSummaryDemo() {
  const [selectedAction, setSelectedAction] = useState('等待操作')
  const { content, state, start } = useStream()
  const aiActions = createPresetActions(['summary', 'polish', 'explain-code'])

  const handleAction = (key: string) => {
    setSelectedAction(key)

    if (key === 'summary') {
      void start(
        mockStream(
          '这段讨论主要围绕交付范围、优先级和后续跟进事项展开，建议先确认需求边界，再拆分执行步骤。',
          24,
        ),
      )
    }
  }

  return (
    <div style={{ display: 'grid', maxWidth: 520, gap: 16 }}>
      <Actions items={aiActions} onAction={handleAction} />
      <div
        style={{
          minHeight: 88,
          border: '1px solid var(--llm-color-border)',
          borderRadius: 16,
          padding: 16,
          color: 'var(--llm-color-text)',
          background: 'var(--llm-color-surface)',
        }}
      >
        <div style={{ color: 'var(--llm-color-text-muted)', fontSize: 12 }}>
          当前动作：{selectedAction} · {state}
        </div>
        <div style={{ marginTop: 8, lineHeight: 1.7 }}>
          {content || '点击“总结”后，这里会通过 useStream 逐字输出摘要。'}
        </div>
      </div>
    </div>
  )
}

export const Basic: Story = {
  args: {
    items: assistantActions,
    onAction: (key) => console.log('action:', key),
  },
}

export const Feedback: Story = {
  args: {
    items: [
      { key: 'copy', label: '复制' },
      { key: 'like', label: '有帮助', variant: 'primary' },
      { key: 'dislike', label: '没帮助', variant: 'danger' },
    ],
    onAction: (key) => console.log('feedback:', key),
  },
}

export const Compact: Story = {
  args: {
    items: assistantActions,
    size: 'sm',
    onAction: (key) => console.log('compact action:', key),
  },
}

export const Vertical: Story = {
  args: {
    items: assistantActions,
    orientation: 'vertical',
    onAction: (key) => console.log('vertical action:', key),
  },
}

export const Disabled: Story = {
  args: {
    items: [
      { key: 'copy', label: '复制' },
      { key: 'regenerate', label: '重新生成', disabled: true },
      { key: 'correct', label: '纠错' },
    ],
    onAction: (key) => console.log('disabled action:', key),
  },
}

export const AIQuickActions: Story = {
  args: {
    items: createPresetActions(['summary', 'polish', 'explain-code']),
    onAction: (key) => console.log('ai action:', key),
  },
}

export const StreamingSummary: Story = {
  render: () => <StreamingSummaryDemo />,
}
