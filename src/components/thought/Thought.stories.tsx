import { type Meta, type StoryObj } from '@storybook/react-vite'

import { Thought, type ThoughtItem } from './Thought'

const meta: Meta<typeof Thought> = {
  title: 'Components/Thought',
  component: Thought,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 760, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Thought>

const thoughtItems: ThoughtItem[] = [
  {
    key: 'intent',
    title: '理解意图',
    status: 'success',
  },
  {
    key: 'research',
    title: '对比方案',
    status: 'success',
  },
  {
    key: 'implement',
    title: '生成组件 API',
    status: 'loading',
    content: '正在收敛状态图标、折叠区域、嵌套步骤和连接线。',
  },
  {
    key: 'verify',
    title: '验证效果',
    status: 'pending',
  },
]

export const Basic: Story = {
  args: {
    title: 'Agent 执行过程',
    description: '轻量展示阶段、状态和可展开详情',
    items: thoughtItems,
  },
}

export const Compact: Story = {
  args: {
    compact: true,
    items: thoughtItems,
  },
}

export const WithoutLine: Story = {
  args: {
    line: false,
    items: thoughtItems,
  },
}

export const Statuses: Story = {
  args: {
    title: '状态展示',
    items: [
      { key: 'pending', title: '等待执行', status: 'pending' },
      { key: 'loading', title: '正在检索', status: 'loading' },
      { key: 'success', title: '已完成', status: 'success' },
      { key: 'error', title: '工具调用失败', status: 'error' },
      { key: 'abort', title: '用户中止', status: 'abort' },
    ],
  },
}

export const Empty: Story = {
  args: {
    items: [],
  },
}
