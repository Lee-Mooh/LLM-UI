import { type Meta, type StoryObj } from '@storybook/react-vite'

import { Think } from './Think'

const meta: Meta<typeof Think> = {
  title: 'Components/Think',
  component: Think,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 720, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Think>

const thoughtContent = `我会先识别用户真正想完成的目标，再检查当前上下文里是否已经有计划或约束。

这里不展示模型的隐藏推理，只展示可给用户看的分析摘要。`

export const Thinking: Story = {
  args: {
    status: 'thinking',
    content: '正在分析用户问题、项目计划和已有组件边界。',
  },
}

export const Done: Story = {
  args: {
    status: 'done',
    content: thoughtContent,
  },
}

export const Collapsed: Story = {
  args: {
    status: 'done',
    defaultOpen: false,
    content: thoughtContent,
  },
}

export const CustomLabel: Story = {
  args: {
    status: 'thinking',
    label: '分析中...',
    content: '正在梳理需求范围，准备生成可执行方案。',
  },
}

export const EmptyContent: Story = {
  args: {
    status: 'thinking',
  },
}
