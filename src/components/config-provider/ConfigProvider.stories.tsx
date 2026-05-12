import type { Meta, StoryObj } from '@storybook/react-vite'
import { ConfigProvider } from './ConfigProvider'
import { useConfig } from '../../hooks/useConfig'
import { useStream } from '../../hooks/useStream'
import { mockStream } from '../../utils/stream'
import zhCN from '../../locale/zh-CN'

function StreamDemo() {
  const { content, state, start, cancel } = useStream()

  const handleClick = () => {
    if (state === 'streaming') {
      cancel()
    } else {
      start(
        mockStream(
          '你好，我是 AI 助手，很高兴为你服务！有什么我可以帮你的吗？',
          80,
        ),
      )
    }
  }

  return (
    <div className="rounded-lg border border-[var(--llm-color-border)] bg-[var(--llm-color-surface)] p-6">
      <p className="mb-4 text-lg font-semibold text-[var(--llm-color-text)]">
        流式输出演示
      </p>
      <button
        onClick={handleClick}
        className="rounded-md bg-[var(--llm-color-primary)] px-4 py-2 text-[var(--llm-color-primary-foreground)]"
      >
        {state === 'streaming' ? 'Cancel' : 'Start'}
      </button>
      {content && (
        <p className="mt-4 text-[var(--llm-color-text)]">
          {content}
          {state === 'streaming' && <span className="animate-pulse">|</span>}
        </p>
      )}
      <p className="mt-2 text-xs text-[var(--llm-color-text-muted)]">
        {state === 'idle' ? '' : state === 'streaming' ? '输出中...' : '已完成'}
      </p>
    </div>
  )
}

function ThemeDisplay() {
  const config = useConfig()
  return (
    <div className="space-y-6">
      {/* 当前配置信息 */}
      <div className="rounded-lg border border-[var(--llm-color-border)] bg-[var(--llm-color-surface)] p-6 text-[var(--llm-color-text)]">
        <p className="text-lg font-semibold">当前配置</p>
        <p className="mt-2 text-[var(--llm-color-text-muted)]">
          主题模式：{config.theme.mode}
        </p>
        <p className="text-[var(--llm-color-text-muted)]">
          主题色：{config.theme.primaryColor}
        </p>
        <p className="text-[var(--llm-color-text-muted)]">
          语言：{config.locale === zhCN ? '简体中文' : 'English'}
        </p>
      </div>

      {/* 颜色令牌一览 */}
      <div className="rounded-lg border border-[var(--llm-color-border)] bg-[var(--llm-color-bg)] p-6">
        <p className="mb-4 text-lg font-semibold text-[var(--llm-color-text)]">
          颜色令牌
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {/* primary */}
          <div className="flex flex-col items-center gap-1">
            <div className="h-12 w-full rounded-md bg-[var(--llm-color-primary)]" />
            <span className="text-xs text-[var(--llm-color-text-muted)]">
              primary
            </span>
          </div>

          {/* primary-foreground */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-12 w-full items-center justify-center rounded-md bg-[var(--llm-color-primary)] text-[var(--llm-color-primary-foreground)]">
              <span className="text-xs font-medium">Aa</span>
            </div>
            <span className="text-xs text-[var(--llm-color-text-muted)]">
              primary-foreground
            </span>
          </div>

          {/* secondary */}
          <div className="flex flex-col items-center gap-1">
            <div className="h-12 w-full rounded-md bg-[var(--llm-color-secondary)]" />
            <span className="text-xs text-[var(--llm-color-text-muted)]">
              secondary
            </span>
          </div>

          {/* accent */}
          <div className="flex flex-col items-center gap-1">
            <div className="h-12 w-full rounded-md bg-[var(--llm-color-accent)]" />
            <span className="text-xs text-[var(--llm-color-text-muted)]">
              accent
            </span>
          </div>

          {/* muted */}
          <div className="flex flex-col items-center gap-1">
            <div className="h-12 w-full rounded-md bg-[var(--llm-color-muted)]" />
            <span className="text-xs text-[var(--llm-color-text-muted)]">
              muted
            </span>
          </div>

          {/* destructive */}
          <div className="flex flex-col items-center gap-1">
            <div className="h-12 w-full rounded-md bg-[var(--llm-color-destructive)]" />
            <span className="text-xs text-[var(--llm-color-text-muted)]">
              destructive
            </span>
          </div>

          {/* surface */}
          <div className="flex flex-col items-center gap-1">
            <div className="h-12 w-full rounded-md border border-[var(--llm-color-border)] bg-[var(--llm-color-surface)]" />
            <span className="text-xs text-[var(--llm-color-text-muted)]">
              surface
            </span>
          </div>

          {/* code */}
          <div className="flex flex-col items-center gap-1">
            <div className="h-12 w-full rounded-md bg-[var(--llm-color-code)] font-mono text-[var(--llm-color-code-foreground)]">
              <span className="flex h-full items-center justify-center text-xs">
                code
              </span>
            </div>
            <span className="text-xs text-[var(--llm-color-text-muted)]">
              code
            </span>
          </div>
        </div>

        {/* 文字与边框 */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 rounded-md border border-[var(--llm-color-border)] bg-[var(--llm-color-surface)] p-4">
            <div className="h-6 w-6 rounded bg-[var(--llm-color-ring)]" />
            <span className="text-sm text-[var(--llm-color-text)]">
              ring — focus 聚焦环
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-[var(--llm-color-input)] bg-[var(--llm-color-surface)] p-4">
            <div className="h-6 w-6 rounded bg-[var(--llm-color-input)]" />
            <span className="text-sm text-[var(--llm-color-text)]">
              input — 输入框边框
            </span>
          </div>
        </div>
      </div>

      {/* 按钮示例 */}
      <div className="flex flex-wrap gap-3">
        <button className="rounded-md bg-[var(--llm-color-primary)] px-4 py-2 text-[var(--llm-color-primary-foreground)]">
          Primary
        </button>
        <button className="rounded-md bg-[var(--llm-color-secondary)] px-4 py-2 text-[var(--llm-color-secondary-foreground)]">
          Secondary
        </button>
        <button className="rounded-md bg-[var(--llm-color-destructive)] px-4 py-2 text-[var(--llm-color-destructive-foreground)]">
          Destructive
        </button>
        <button className="rounded-md bg-[var(--llm-color-accent)] px-4 py-2 text-[var(--llm-color-accent-foreground)]">
          Accent
        </button>
      </div>

      {/* 流式输出演示 */}
      <StreamDemo />
    </div>
  )
}

function ThemeDemo() {
  const theme = document.documentElement.getAttribute('data-theme') as
    | 'light'
    | 'dark'
  return (
    <ConfigProvider theme={{ mode: theme ?? 'system' }} locale="zh-CN">
      <ThemeDisplay />
    </ConfigProvider>
  )
}

const meta: Meta<typeof ThemeDemo> = {
  title: 'Components/ConfigProvider',
  component: ThemeDemo,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ThemeDemo>

export const Default: Story = {
  render: () => <ThemeDemo />,
}
