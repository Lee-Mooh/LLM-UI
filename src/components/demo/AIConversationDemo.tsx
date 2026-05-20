import { useEffect, useMemo, useRef, useState } from 'react'

import { Actions } from '../actions/Actions'
import { createPresetActions } from '../actions/ActionsPreset'
import { Bubble } from '../bubble/Bubble'
import { Citation, type CitationItem } from '../citation/Citation'
import { CodeHighlighter } from '../code-highlighter/CodeHighlighter'
import { ConfigProvider } from '../config-provider/ConfigProvider'
import { ConversationList } from '../conversation/ConversationList'
import { type ConversationRecord } from '../conversation/ConversationItem'
import { Mark } from '../mark/Mark'
import { MessageList, type MessageRecord } from '../message-list/MessageList'
import {
  NotificationStack,
  type NotificationItem,
} from '../notification/Notification'
import { Prompts, type PromptItem } from '../prompts/Prompts'
import { Sender, type SenderPrefixAction } from '../sender/Sender'
import { Think } from '../think/Think'
import { Thought, type ThoughtItem } from '../thought/Thought'
import { useStream } from '../../hooks/useStream'
import { useTheme } from '../../hooks/useTheme'
import { mockStream } from '../../utils/stream'
import {
  AIStreamFallbackError,
  createAIResponseStream,
  createAIResponseStreamWithReasoning,
  type AIStreamMessage,
} from './deepseekStream'

type ThemeMode = 'light' | 'dark'

type MessageStore = Record<string, MessageRecord[]>

interface ReasoningState {
  content: string
  steps: string[]
}

type ReasoningStore = Record<string, ReasoningState>

export interface AIConversationDemoProps {
  forceMock?: boolean
  onThemeModeChange?: (mode: ThemeMode) => void
}

const initialConversations: ConversationRecord[] = [
  {
    id: 'release-review',
    title: '发布风险复盘',
    lastMessage: '我会把风险拆成优先级和处理建议。',
    timestamp: '10:24',
    pinned: true,
    favorite: true,
  },
  {
    id: 'docs-polish',
    title: '文档口径优化',
    lastMessage: '先把使用场景写清楚，再补 API 细节。',
    timestamp: '昨天',
    favorite: true,
  },
  {
    id: 'streaming-plan',
    title: '流式响应方案',
    lastMessage: '取消生成时保留已经输出的内容。',
    timestamp: '周一',
  },
]

const initialMessages: MessageStore = {
  'release-review': [
    {
      id: 'release-user-1',
      role: 'user',
      content: '帮我把今天的发布风险整理成三条。',
      timestamp: '10:20',
      status: 'sent',
    },
    {
      id: 'release-assistant-1',
      role: 'assistant',
      content:
        '可以先从 **接口稳定性**、**文档一致性** 和 **回归覆盖** 三个方向拆分。建议把高风险项放到发布前检查清单里，并明确负责人。',
      timestamp: '10:21',
    },
  ],
  'docs-polish': [
    {
      id: 'docs-user-1',
      role: 'user',
      content: '这段组件说明读起来有点散，帮我改得更像文档首页。',
      timestamp: '09:42',
      status: 'sent',
    },
    {
      id: 'docs-assistant-1',
      role: 'assistant',
      content:
        '可以把第一段改成“它解决什么问题”，第二段说明“适合哪些场景”，最后再给出最小用法。这样读者能先建立判断，再进入 API 细节。',
      timestamp: '09:43',
    },
  ],
  'streaming-plan': [
    {
      id: 'stream-user-1',
      role: 'user',
      content: '流式回复被取消后，界面应该怎么处理？',
      timestamp: '08:30',
      status: 'sent',
    },
    {
      id: 'stream-assistant-1',
      role: 'assistant',
      content:
        '建议保留已经生成的内容，同时把输入框恢复可用。用户能继续追问，也能重新生成，不会因为取消丢失上下文。',
      timestamp: '08:31',
    },
  ],
}

const promptItems: PromptItem[] = [
  {
    key: 'release-checklist',
    title: '整理发布清单',
    prompt: '帮我把今天的发布检查项整理成一份可执行清单。',
  },
  {
    key: 'risk-summary',
    title: '总结风险',
    prompt: '请把这次上线风险按高、中、低三个优先级总结。',
  },
  {
    key: 'docs-outline',
    title: '生成文档大纲',
    prompt: '为这个组件生成一份中文 Storybook 文档大纲。',
  },
]

const assistantActions = createPresetActions([
  'copy',
  'regenerate',
  'summary',
  'polish',
])

const releaseCitations: CitationItem[] = [
  {
    key: 'release-note',
    title: '发布检查记录',
    description: '包含接口、文案、回归范围和负责人信息。',
  },
  {
    key: 'qa-feedback',
    title: '验收反馈摘要',
    description: '整理阻断项、体验项和可延后处理项。',
  },
]

const docsSnippet = `import { MessageList, Sender } from '@oakkles/llm-ui-react'

function ChatSurface() {
  return (
    <>
      <MessageList messages={messages} />
      <Sender onSend={sendMessage} />
    </>
  )
}`

function createReasoningItems(loading = false): ThoughtItem[] {
  return [
    {
      key: 'intent',
      title: '确认用户目标',
      status: 'success',
    },
    {
      key: 'context',
      title: '整理上下文',
      status: 'success',
    },
    {
      key: 'answer',
      title: loading ? '生成回复' : '输出建议',
      status: loading ? 'loading' : 'success',
      content: '保留当前对话上下文，边生成边更新消息内容。',
      collapsible: loading,
      defaultOpen: loading,
    },
  ]
}

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.8v2.4M12 18.8v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20.2 14.6A7.8 7.8 0 0 1 9.4 3.8 8.7 8.7 0 1 0 20.2 14.6Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function getDocumentTheme(): ThemeMode {
  return document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light'
}

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getCurrentTime() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function resolveMockAnswer(message: string) {
  if (message.includes('风险')) {
    return `建议先按影响面拆成三类：\n\n1. **阻断风险**：接口、鉴权、构建产物这类会直接影响主流程的问题，需要发布前完成确认。\n2. **体验风险**：文案、加载态、空状态会影响用户理解，可以放入回归清单逐项检查。\n3. **协作风险**：负责人、回滚方案和验收标准要写清楚，避免发布窗口内临时对齐。\n\n如果时间有限，先处理阻断风险，再补体验细节。`
  }

  if (message.includes('文档') || message.includes('大纲')) {
    return `可以按这个顺序写：\n\n- **组件定位**：说明它解决的使用场景。\n- **基础用法**：给出最小可运行示例。\n- **组合方式**：展示它如何与消息列表、输入框或操作栏配合。\n- **状态说明**：列出 loading、disabled、empty 等关键状态。\n- **API 入口**：保留核心 props，避免把内部实现写进文案。`
  }

  if (message.includes('清单')) {
    return `可以这样拆成可执行清单：\n\n- 确认核心路径是否完成浏览器验收。\n- 确认 Storybook 示例覆盖默认、空态、加载和错误状态。\n- 确认构建产物包含 JS、类型声明和 CSS。\n- 确认回滚方式和负责人已经写清楚。\n\n每一项最好都能对应一个明确的验证动作。`
  }

  return `我建议先明确目标读者，再把内容拆成“结论、原因、下一步”。这样回复会更容易执行，也更适合沉淀到项目文档里。`
}

function updateConversationMessage(
  messages: MessageStore,
  conversationId: string,
  messageId: string,
  patch: Partial<MessageRecord>,
) {
  return {
    ...messages,
    [conversationId]:
      messages[conversationId]?.map((message) =>
        message.id === messageId ? { ...message, ...patch } : message,
      ) ?? [],
  }
}

function createAIHistory(messages: MessageRecord[]): AIStreamMessage[] {
  return messages
    .filter(
      (message) =>
        (message.role === 'user' || message.role === 'assistant') &&
        !message.loading &&
        Boolean(message.content?.trim()),
    )
    .map((message) => ({
      role: message.role as AIStreamMessage['role'],
      content: message.content?.trim() ?? '',
    }))
    .slice(-10)
}

async function createDemoResponseStream(
  message: string,
  history: AIStreamMessage[],
  forceMock: boolean,
) {
  if (forceMock) {
    return mockStream(resolveMockAnswer(message), 18)
  }

  try {
    return await createAIResponseStream(message, history)
  } catch (error) {
    if (error instanceof AIStreamFallbackError) {
      return mockStream(resolveMockAnswer(message), 18)
    }

    throw error
  }
}

function ThemeToggle({
  mode,
  onModeChange,
}: {
  mode: ThemeMode
  onModeChange: (mode: ThemeMode) => void
}) {
  const { setMode } = useTheme()
  const nextMode: ThemeMode = mode === 'light' ? 'dark' : 'light'

  const handleClick = () => {
    setMode(nextMode)
    onModeChange(nextMode)
  }

  return (
    <button
      aria-label={mode === 'light' ? '切换到深色主题' : '切换到浅色主题'}
      className="llm-demo-chat__theme-button"
      onClick={handleClick}
      type="button"
    >
      {mode === 'light' ? <MoonIcon /> : <SunIcon />}
    </button>
  )
}

export function AIConversationDemo({
  forceMock = false,
  onThemeModeChange,
}: AIConversationDemoProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    getDocumentTheme(),
  )
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeConversationId, setActiveConversationId] = useState(
    initialConversations[0]?.id ?? '',
  )
  const [conversations, setConversations] = useState(initialConversations)
  const [messagesByConversation, setMessagesByConversation] =
    useState<MessageStore>(initialMessages)
  const [reasoningStore, setReasoningStore] = useState<ReasoningStore>({})
  const [composerValue, setComposerValue] = useState('')
  const [streamingTarget, setStreamingTarget] = useState<{
    conversationId: string
    messageId: string
  } | null>(null)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const messagesViewportRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLDivElement>(null)
  const { state, start, cancel } = useStream()
  const activeMessages = useMemo(
    () => messagesByConversation[activeConversationId] ?? [],
    [activeConversationId, messagesByConversation],
  )
  const activeMessageSignature = activeMessages
    .map(
      (message) =>
        `${message.id}:${message.content?.length ?? 0}:${message.loading ? '1' : '0'}`,
    )
    .join('|')

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setThemeMode(getDocumentTheme())
    })

    observer.observe(document.documentElement, {
      attributeFilter: ['data-theme'],
      attributes: true,
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const viewport = messagesViewportRef.current?.querySelector(
      '.llm-message-list__body',
    )

    if (!viewport) return

    viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' })
  }, [activeMessageSignature])

  const pushNotification = (
    type: NotificationItem['type'],
    title: string,
    description?: string,
  ) => {
    const id = createMessageId('notice')

    setNotifications((items) =>
      [
        {
          id,
          type,
          title,
          duration: 2400,
          showProgress: true,
          ...(description && { description }),
        },
        ...(type === 'loading'
          ? items
          : items.filter((item) => item.type !== 'loading')),
      ].slice(0, 3),
    )
  }

  const removeNotification = (id: string) => {
    setNotifications((items) => items.filter((item) => item.id !== id))
  }

  const handleNewConversation = () => {
    const id = createMessageId('conversation')

    setConversations((items) => [
      {
        id,
        title: '新的对话',
        lastMessage: '从一个新的问题开始。',
        timestamp: getCurrentTime(),
      },
      ...items,
    ])
    setMessagesByConversation((items) => ({ ...items, [id]: [] }))
    setActiveConversationId(id)
    setComposerValue('')
    pushNotification('success', '已创建新对话')
  }

  const handleDeleteConversation = (id: string) => {
    setConversations((items) => items.filter((item) => item.id !== id))
    setMessagesByConversation((items) => {
      const nextMessages = { ...items }

      delete nextMessages[id]

      return nextMessages
    })
    setActiveConversationId((currentId) => {
      if (currentId !== id) return currentId

      return (
        conversations.find((conversation) => conversation.id !== id)?.id ?? ''
      )
    })
    pushNotification('success', '对话已删除')
  }

  const handleTogglePin = (id: string) => {
    setConversations((items) =>
      items.map((item) =>
        item.id === id ? { ...item, pinned: !item.pinned } : item,
      ),
    )
  }

  const handleToggleFavorite = (id: string) => {
    setConversations((items) =>
      items.map((item) =>
        item.id === id ? { ...item, favorite: !item.favorite } : item,
      ),
    )
  }

  const handlePrompt = (_key: string, item: PromptItem) => {
    setComposerValue(item.prompt ?? '')
    window.requestAnimationFrame(() => {
      composerRef.current?.querySelector('textarea')?.focus()
    })
    pushNotification('success', '已填入提示词', item.title)
  }

  const handlePrefixAction = (action: SenderPrefixAction) => {
    const actionText: Record<SenderPrefixAction, string> = {
      upload: '可以继续补充附件内容。',
      image: '可以描述图片里的关键细节。',
      search: '可以把需要查找的主题写进输入框。',
      reasoning: '下一条回复会更强调推理过程。',
    }

    pushNotification('success', actionText[action])
  }

  const handleSend = (message: string) => {
    if (!activeConversationId) return

    const userMessage: MessageRecord = {
      id: createMessageId('user'),
      role: 'user',
      content: message,
      timestamp: getCurrentTime(),
      status: 'sent',
    }
    const assistantMessageId = createMessageId('assistant')
    const assistantMessage: MessageRecord = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: getCurrentTime(),
      loading: true,
    }

    setMessagesByConversation((items) => ({
      ...items,
      [activeConversationId]: [
        ...(items[activeConversationId] ?? []),
        userMessage,
        assistantMessage,
      ],
    }))
    setConversations((items) =>
      items.map((conversation) =>
        conversation.id === activeConversationId
          ? {
              ...conversation,
              lastMessage: message,
              timestamp: getCurrentTime(),
            }
          : conversation,
      ),
    )
    pushNotification('loading', '正在生成回复', '你可以随时停止生成。')
    const nextStreamingTarget = {
      conversationId: activeConversationId,
      messageId: assistantMessageId,
    }

    setStreamingTarget(nextStreamingTarget)

    // Try reasoning stream first (for DeepSeek R1)
    const history = createAIHistory(activeMessages)

    createAIResponseStreamWithReasoning(message, history, {
      onReasoning: (reasoningText) => {
        // Parse reasoning into steps
        const steps = reasoningText
          .split('\n')
          .filter((line) => line.trim().length > 0)
          .slice(-5) // Keep last 5 steps

        setReasoningStore((store) => ({
          ...store,
          [assistantMessageId]: {
            content: reasoningText,
            steps,
          },
        }))
      },
      onContent: (content) => {
        setMessagesByConversation((items) =>
          updateConversationMessage(
            items,
            nextStreamingTarget.conversationId,
            nextStreamingTarget.messageId,
            { content, loading: true },
          ),
        )
      },
      onComplete: (content, reasoning) => {
        setMessagesByConversation((items) =>
          updateConversationMessage(
            items,
            nextStreamingTarget.conversationId,
            nextStreamingTarget.messageId,
            { content, loading: false },
          ),
        )
        setConversations((items) =>
          items.map((conversation) =>
            conversation.id === nextStreamingTarget.conversationId
              ? {
                  ...conversation,
                  lastMessage: content.slice(0, 42),
                  timestamp: getCurrentTime(),
                }
              : conversation,
          ),
        )
        setStreamingTarget(null)

        if (reasoning) {
          const steps = reasoning
            .split('\n')
            .filter((line) => line.trim().length > 0)

          setReasoningStore((store) => ({
            ...store,
            [assistantMessageId]: {
              content: reasoning,
              steps,
            },
          }))
        }

        pushNotification('success', '回复已完成')
      },
      onError: () => {
        // Fallback to regular stream
        void createDemoResponseStream(message, history, forceMock)
          .then((generator) =>
            start(generator, {
              onComplete: (nextContent) => {
                setMessagesByConversation((items) =>
                  updateConversationMessage(
                    items,
                    nextStreamingTarget.conversationId,
                    nextStreamingTarget.messageId,
                    { content: nextContent, loading: false },
                  ),
                )
                setConversations((items) =>
                  items.map((conversation) =>
                    conversation.id === nextStreamingTarget.conversationId
                      ? {
                          ...conversation,
                          lastMessage: nextContent.slice(0, 42),
                          timestamp: getCurrentTime(),
                        }
                      : conversation,
                  ),
                )
                setStreamingTarget(null)
                pushNotification('success', '回复已完成')
              },
              onError: () => {
                setMessagesByConversation((items) =>
                  updateConversationMessage(
                    items,
                    nextStreamingTarget.conversationId,
                    nextStreamingTarget.messageId,
                    {
                      content: '抱歉，在线 AI 服务暂时不可用，请稍后再试。',
                      loading: false,
                    },
                  ),
                )
                setStreamingTarget(null)
                pushNotification('error', '生成失败，请稍后重试')
              },
              onToken: (nextContent) => {
                setMessagesByConversation((items) =>
                  updateConversationMessage(
                    items,
                    nextStreamingTarget.conversationId,
                    nextStreamingTarget.messageId,
                    { content: nextContent, loading: true },
                  ),
                )
              },
            }),
          )
          .catch(() => {
            setMessagesByConversation((items) =>
              updateConversationMessage(
                items,
                nextStreamingTarget.conversationId,
                nextStreamingTarget.messageId,
                {
                  content: '抱歉，在线 AI 服务暂时不可用，请稍后再试。',
                  loading: false,
                },
              ),
            )
            setStreamingTarget(null)
            pushNotification('error', '生成失败，请稍后重试')
          })
      },
    }).catch(() => {
      setMessagesByConversation((items) =>
        updateConversationMessage(
          items,
          nextStreamingTarget.conversationId,
          nextStreamingTarget.messageId,
          {
            content: '抱歉，在线 AI 服务暂时不可用，请稍后再试。',
            loading: false,
          },
        ),
      )
      setStreamingTarget(null)
      pushNotification('error', '生成失败，请稍后重试')
    })
  }

  const handleThemeModeChange = (nextMode: ThemeMode) => {
    setThemeMode(nextMode)
    document.documentElement.setAttribute('data-theme', nextMode)
    onThemeModeChange?.(nextMode)
  }

  const handleCancel = () => {
    cancel()

    if (!streamingTarget) return

    setMessagesByConversation((items) =>
      updateConversationMessage(
        items,
        streamingTarget.conversationId,
        streamingTarget.messageId,
        { loading: false },
      ),
    )
    setStreamingTarget(null)
    pushNotification('success', '已停止生成')
  }

  const handleAction = (key: string) => {
    if (key !== 'regenerate') {
      pushNotification('success', '操作已记录')
      return
    }

    const lastUserMessage = [...activeMessages]
      .reverse()
      .find((message) => message.role === 'user')

    if (lastUserMessage?.content) {
      handleSend(lastUserMessage.content)
    }
  }

  const renderAssistantAddons = (message: MessageRecord) => {
    const reasoning = reasoningStore[message.id]

    if (reasoning && reasoning.steps.length > 0) {
      const thoughtItems: ThoughtItem[] = reasoning.steps.map(
        (step, index) => ({
          key: `step-${index}`,
          title: message.loading ? '回复中' : `步骤 ${index + 1}`,
          status: message.loading ? 'loading' : 'success',
          content: step,
          collapsible: true,
          defaultOpen: message.loading && index === reasoning.steps.length - 1,
        }),
      )

      return (
        <div className="llm-demo-chat__message-addons">
          {message.loading ? (
            <Think
              content={
                reasoning.content.slice(0, 200) +
                (reasoning.content.length > 200 ? '...' : '')
              }
              label="回复中"
            />
          ) : null}
          <Thought
            compact
            defaultExpandedKeys={
              message.loading
                ? [`step-${reasoning.steps.length - 1}`]
                : undefined
            }
            items={thoughtItems}
            title={message.loading ? '回复进度' : '推理过程'}
          />
        </div>
      )
    }

    if (message.loading) {
      const replyDraft = message.content?.trim()
      const liveContent = replyDraft || '正在连接模型并生成回复...'

      return (
        <div className="llm-demo-chat__message-addons">
          <Think content={liveContent} label="回复中" />
          <Thought
            compact
            defaultExpandedKeys={['replying']}
            items={[
              {
                key: 'replying',
                title: '回复中',
                status: 'loading',
                content: liveContent,
              },
            ]}
          />
        </div>
      )
    }

    // Historical messages with static addons
    if (message.id === 'release-assistant-1') {
      return (
        <div className="llm-demo-chat__message-addons">
          <Think
            content="先把发布问题分成阻断、体验和协作三类，再决定哪些必须在发布前完成。"
            status="done"
          />
          <Thought compact items={createReasoningItems()} title="处理路径" />
          <Citation items={releaseCitations} title="参考来源" />
          <CodeHighlighter
            code="pnpm lint && pnpm build && pnpm test:storybook"
            language="bash"
          />
        </div>
      )
    }

    if (message.id === 'docs-assistant-1') {
      return (
        <div className="llm-demo-chat__message-addons">
          <CodeHighlighter code={docsSnippet} language="tsx" showLineNumbers />
        </div>
      )
    }

    if (message.id === 'stream-assistant-1') {
      return (
        <div className="llm-demo-chat__message-addons">
          <Think
            content="取消不会清空已生成内容，下一次发送仍然沿用当前会话。"
            status="done"
          />
        </div>
      )
    }

    return null
  }

  return (
    <ConfigProvider theme={{ mode: themeMode }} locale="zh-CN">
      <div
        className="llm-demo-chat"
        data-sidebar-collapsed={sidebarCollapsed ? 'true' : undefined}
        data-theme={themeMode}
        data-theme-mode={themeMode}
      >
        <div className="llm-demo-chat__sidebar">
          <ConversationList
            activeId={activeConversationId}
            collapsed={sidebarCollapsed}
            conversations={conversations}
            onCollapsedChange={setSidebarCollapsed}
            onDelete={handleDeleteConversation}
            onFavorite={handleToggleFavorite}
            onNewConversation={handleNewConversation}
            onPin={handleTogglePin}
            onSelect={setActiveConversationId}
            searchable
            title="AI 工作台"
          />
        </div>

        <main className="llm-demo-chat__main">
          <header className="llm-demo-chat__toolbar">
            <ThemeToggle
              mode={themeMode}
              onModeChange={handleThemeModeChange}
            />
          </header>

          <div className="llm-demo-chat__messages" ref={messagesViewportRef}>
            <MessageList
              ariaLabel="AI 对话消息"
              emptyText="选择一个提示词，或直接输入你想讨论的问题。"
              messages={activeMessages}
              renderMessage={(message) => (
                <Bubble
                  role={message.role}
                  {...(message.loading !== undefined && {
                    loading: message.loading,
                  })}
                  {...(message.status && { status: message.status })}
                  {...(message.timestamp && { timestamp: message.timestamp })}
                  actions={
                    message.role === 'assistant' && message.content ? (
                      <Actions
                        items={assistantActions}
                        onAction={handleAction}
                        size="sm"
                      />
                    ) : undefined
                  }
                >
                  {message.role === 'assistant' ? (
                    <div className="llm-demo-chat__assistant-content">
                      <Mark
                        content={message.content ?? ''}
                        streaming={message.loading}
                      />
                      {renderAssistantAddons(message)}
                    </div>
                  ) : (
                    message.content
                  )}
                </Bubble>
              )}
            />
          </div>

          <div className="llm-demo-chat__composer-panel">
            <div className="llm-demo-chat__prompts">
              <Prompts
                columns={3}
                items={promptItems}
                onPrompt={handlePrompt}
              />
            </div>

            <div className="llm-demo-chat__composer" ref={composerRef}>
              <Sender
                loading={state === 'streaming'}
                onCancel={handleCancel}
                onChange={setComposerValue}
                onModelChange={(model) =>
                  pushNotification('success', '已切换模型', model)
                }
                onPrefixAction={handlePrefixAction}
                onSend={handleSend}
                onVoiceClick={() =>
                  pushNotification('success', '可以开始语音输入')
                }
                placeholder="输入一个问题，按 Enter 发送..."
                value={composerValue}
              />
            </div>
          </div>
        </main>

        <NotificationStack items={notifications} onClose={removeNotification} />
      </div>
    </ConfigProvider>
  )
}
