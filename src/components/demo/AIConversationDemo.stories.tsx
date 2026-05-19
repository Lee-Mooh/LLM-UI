import { expect, userEvent, waitFor, within } from 'storybook/test'
import { type Meta, type StoryObj } from '@storybook/react-vite'

import { AIConversationDemo } from './AIConversationDemo'

const meta: Meta<typeof AIConversationDemo> = {
  title: 'Examples/AI Conversation Demo',
  component: AIConversationDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta

type Story = StoryObj<typeof AIConversationDemo>

export const Default: Story = {}

export const Mocked: Story = {
  args: {
    forceMock: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await waitFor(() =>
      expect(canvasElement.querySelector('.llm-demo-chat')).toBeInTheDocument(),
    )

    const themeButton = await waitFor(() =>
      canvas.getByRole('button', { name: '切换到深色主题' }),
    )
    await userEvent.click(themeButton)
    await waitFor(() =>
      expect(
        canvas.getByRole('button', { name: '切换到浅色主题' }),
      ).toBeInTheDocument(),
    )
    await expect(canvasElement.querySelector('.llm-demo-chat')).toHaveAttribute(
      'data-theme-mode',
      'dark',
    )

    await userEvent.click(canvas.getByRole('button', { name: '关闭边栏' }))
    await expect(
      canvas.getByRole('button', { name: '打开边栏' }),
    ).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: '打开边栏' }))

    await userEvent.click(canvas.getByRole('button', { name: '整理发布清单' }))
    const sender = canvas.getByPlaceholderText('输入一个问题，按 Enter 发送...')

    await expect(sender).toHaveValue(
      '帮我把今天的发布检查项整理成一份可执行清单。',
    )
    await expect(sender).toHaveFocus()

    await userEvent.click(canvas.getByRole('button', { name: '发送消息' }))
    await expect(
      canvas.getByText('帮我把今天的发布检查项整理成一份可执行清单。'),
    ).toBeInTheDocument()

    await waitFor(
      () => expect(canvas.getByText(/可执行清单/)).toBeInTheDocument(),
      { timeout: 3000 },
    )
  },
}
