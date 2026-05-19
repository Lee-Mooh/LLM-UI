import { expect, userEvent, waitFor, within } from 'storybook/test'
import { type Meta, type StoryObj } from '@storybook/react-vite'
import { useGlobals } from 'storybook/preview-api'

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

const renderWithStorybookTheme: Story['render'] = (args) => {
  const [, updateGlobals] = useGlobals()

  return (
    <AIConversationDemo
      {...args}
      onThemeModeChange={(nextMode) => {
        window.parent.postMessage(
          { type: 'llm-ui-theme-change', theme: nextMode },
          '*',
        )
        updateGlobals({ theme: nextMode })
      }}
    />
  )
}

export const Default: Story = {
  render: renderWithStorybookTheme,
}

export const Mocked: Story = {
  args: {
    forceMock: true,
  },
  render: renderWithStorybookTheme,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await waitFor(() =>
      expect(canvasElement.querySelector('.llm-demo-chat')).toBeInTheDocument(),
    )

    const demo = canvasElement.querySelector('.llm-demo-chat')
    const initialTheme = demo?.getAttribute('data-theme-mode')
    const nextTheme = initialTheme === 'dark' ? 'light' : 'dark'
    const initialThemeButtonName =
      initialTheme === 'dark' ? '切换到浅色主题' : '切换到深色主题'
    const nextThemeButtonName =
      nextTheme === 'dark' ? '切换到浅色主题' : '切换到深色主题'

    const themeButton = await waitFor(() =>
      canvas.getByRole('button', { name: initialThemeButtonName }),
    )
    await userEvent.click(themeButton)
    await waitFor(() =>
      expect(
        canvas.getByRole('button', { name: nextThemeButtonName }),
      ).toBeInTheDocument(),
    )
    await expect(demo).toHaveAttribute('data-theme-mode', nextTheme)

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
