import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'

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

type AttachmentKind = 'file' | 'image'

interface DemoAttachment {
  id: string
  name: string
  size: number
  type: string
  kind: AttachmentKind
  url?: string
  textExcerpt?: string
  truncated?: boolean
}

type DemoMessageRecord = MessageRecord & {
  attachments?: DemoAttachment[]
}

type MessageStore = Record<string, DemoMessageRecord[]>

type ReasoningPhase =
  | 'connecting'
  | 'reasoning'
  | 'responding'
  | 'done'
  | 'error'

interface ReasoningState {
  content: string
  steps: string[]
  phase: ReasoningPhase
  responsePreview?: string
  hasReasoningContent?: boolean
}

type ReasoningStore = Record<string, ReasoningState>

interface SpeechRecognitionResultAlternativeLike {
  transcript: string
}

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean
  readonly length: number
  item(index: number): SpeechRecognitionResultAlternativeLike
  [index: number]: SpeechRecognitionResultAlternativeLike | undefined
}

interface SpeechRecognitionResultListLike {
  readonly length: number
  item(index: number): SpeechRecognitionResultLike
  [index: number]: SpeechRecognitionResultLike | undefined
}

interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultListLike
}

interface SpeechRecognitionErrorEventLike extends Event {
  readonly error?: string
}

interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

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

const maxPendingAttachments = 6
const maxAttachmentSize = 10 * 1024 * 1024
const maxTextExcerptSize = 128 * 1024

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

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`

  const units = ['KB', 'MB', 'GB']
  let value = size / 1024
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex] ?? 'GB'}`
}

function isImageFile(file: File) {
  return file.type.startsWith('image/')
}

function isReadableTextFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase()
  const textExtensions = new Set([
    'css',
    'csv',
    'html',
    'js',
    'json',
    'jsx',
    'log',
    'md',
    'mdx',
    'py',
    'sql',
    'ts',
    'tsx',
    'txt',
    'xml',
    'yaml',
    'yml',
  ])

  return (
    file.type.startsWith('text/') ||
    Boolean(extension && textExtensions.has(extension))
  )
}

async function createAttachmentFromFile(
  file: File,
  kind: AttachmentKind,
): Promise<DemoAttachment> {
  const attachment: DemoAttachment = {
    id: createMessageId('attachment'),
    name: file.name,
    size: file.size,
    type: file.type || '未知类型',
    kind,
  }

  if (kind === 'image' || isImageFile(file)) {
    return {
      ...attachment,
      kind: 'image',
      url: URL.createObjectURL(file),
    }
  }

  if (!isReadableTextFile(file)) return attachment

  const excerpt = await file.slice(0, maxTextExcerptSize).text()

  return {
    ...attachment,
    textExcerpt: excerpt,
    truncated: file.size > maxTextExcerptSize,
  }
}

function buildAttachmentPrompt(attachments: DemoAttachment[]) {
  if (!attachments.length) return ''

  return attachments
    .map((attachment, index) => {
      const lines = [
        `${index + 1}. ${attachment.name}`,
        `   - 类型：${attachment.type}`,
        `   - 大小：${formatFileSize(attachment.size)}`,
      ]

      if (attachment.textExcerpt) {
        lines.push(
          `   - 文本摘录${attachment.truncated ? '（已截断）' : ''}：\n${attachment.textExcerpt}`,
        )
      }

      if (attachment.kind === 'image') {
        lines.push('   - 图片仅作为本地预览，当前请求只包含文件元数据。')
      }

      return lines.join('\n')
    })
    .join('\n')
}

function buildMessageContentForAI(message: DemoMessageRecord) {
  const content = message.content?.trim() ?? ''
  const attachmentPrompt = buildAttachmentPrompt(message.attachments ?? [])

  if (!attachmentPrompt) return content

  return [content, `附件信息：\n${attachmentPrompt}`]
    .filter(Boolean)
    .join('\n\n')
}

function AttachmentIcon() {
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
        d="m21.4 11.6-8.5 8.5a6 6 0 0 1-8.5-8.5l8.7-8.7a4 4 0 0 1 5.7 5.7l-8.7 8.7a2 2 0 0 1-2.8-2.8l8.1-8.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function AttachmentList({
  attachments,
  onRemove,
}: {
  attachments: DemoAttachment[]
  onRemove?: (id: string) => void
}) {
  if (!attachments.length) return null

  return (
    <div className="llm-demo-chat__attachments">
      {attachments.map((attachment) => (
        <div className="llm-demo-chat__attachment" key={attachment.id}>
          <div className="llm-demo-chat__attachment-preview">
            {attachment.kind === 'image' && attachment.url ? (
              <img alt="" src={attachment.url} />
            ) : (
              <span className="llm-demo-chat__attachment-icon">
                <AttachmentIcon />
              </span>
            )}
          </div>
          <div className="llm-demo-chat__attachment-meta">
            <span className="llm-demo-chat__attachment-name">
              {attachment.name}
            </span>
            <span className="llm-demo-chat__attachment-size">
              {attachment.kind === 'image' ? '图片' : '文件'} ·{' '}
              {formatFileSize(attachment.size)}
            </span>
          </div>
          {onRemove ? (
            <button
              aria-label={`移除 ${attachment.name}`}
              className="llm-demo-chat__attachment-remove"
              onClick={() => onRemove(attachment.id)}
              type="button"
            >
              ×
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}

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

function createAIHistory(messages: DemoMessageRecord[]): AIStreamMessage[] {
  return messages
    .filter(
      (message) =>
        (message.role === 'user' || message.role === 'assistant') &&
        !message.loading &&
        Boolean(buildMessageContentForAI(message)),
    )
    .map((message) => ({
      role: message.role as AIStreamMessage['role'],
      content: buildMessageContentForAI(message),
    }))
    .slice(-4)
}

function parseReasoningSteps(content: string) {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-5)
}

function stripHiddenReasoning(content: string) {
  return splitInlineThink(content, true).answer.trimStart()
}

function patchReasoningState(
  store: ReasoningStore,
  messageId: string,
  patch: Partial<ReasoningState>,
): ReasoningStore {
  const current = store[messageId] ?? {
    content: '',
    steps: [],
    phase: 'connecting',
  }

  return {
    ...store,
    [messageId]: {
      ...current,
      ...patch,
    },
  }
}

function splitInlineThink(content: string, finalize = false) {
  const thinkOpenTag = '<think>'
  const thinkCloseTag = '</think>'
  const htmlCommentOpenTag = '<!--'
  const htmlCommentCloseTag = '-->'

  const openIndex = content.indexOf(thinkOpenTag)
  const commentIndex = content.indexOf(htmlCommentOpenTag)
  const commentStartIndex =
    commentIndex !== -1 && (openIndex === -1 || commentIndex < openIndex)
      ? commentIndex
      : openIndex

  if (commentStartIndex === -1) {
    return { answer: content, done: true, thought: '' }
  }

  const isHtmlComment = commentStartIndex === commentIndex
  const openTag = isHtmlComment ? htmlCommentOpenTag : thinkOpenTag
  const closeTag = isHtmlComment ? htmlCommentCloseTag : thinkCloseTag
  const beforeThink = content.slice(0, commentStartIndex)
  const afterOpen = content.slice(commentStartIndex + openTag.length)
  const closeIndex = afterOpen.indexOf(closeTag)

  if (closeIndex === -1) {
    return finalize
      ? {
          answer: `${beforeThink}${afterOpen}`,
          done: true,
          thought: '',
        }
      : {
          answer: beforeThink,
          done: false,
          thought: '',
        }
  }

  return {
    answer: `${beforeThink}${afterOpen.slice(closeIndex + closeTag.length)}`,
    done: true,
    thought: afterOpen.slice(0, closeIndex),
  }
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
  const [pendingAttachments, setPendingAttachments] = useState<
    DemoAttachment[]
  >([])
  const [voiceActive, setVoiceActive] = useState(false)
  const [streamingTarget, setStreamingTarget] = useState<{
    conversationId: string
    messageId: string
  } | null>(null)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const messagesViewportRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const voiceBaseTextRef = useRef('')
  const attachmentUrlsRef = useRef<Set<string>>(new Set())
  const requestSeqRef = useRef(0)
  const { state, start, cancel } = useStream()
  const activeMessages = useMemo(
    () => messagesByConversation[activeConversationId] ?? [],
    [activeConversationId, messagesByConversation],
  )
  const activeMessageSignature = activeMessages
    .map(
      (message) =>
        `${message.id}:${message.content?.length ?? 0}:${message.attachments?.length ?? 0}:${message.loading ? '1' : '0'}`,
    )
    .join('|')
  const canSend = Boolean(composerValue.trim()) || pendingAttachments.length > 0

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

  useEffect(() => {
    const attachmentUrls = attachmentUrlsRef.current

    return () => {
      recognitionRef.current?.abort()
      attachmentUrls.forEach((url) => URL.revokeObjectURL(url))
      attachmentUrls.clear()
    }
  }, [])

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
      items[id]?.forEach((message) => {
        message.attachments?.forEach(revokeAttachmentUrl)
      })

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

  function revokeAttachmentUrl(attachment: DemoAttachment) {
    if (!attachment.url) return

    URL.revokeObjectURL(attachment.url)
    attachmentUrlsRef.current.delete(attachment.url)
  }

  const handleRemovePendingAttachment = (id: string) => {
    setPendingAttachments((attachments) => {
      const target = attachments.find((attachment) => attachment.id === id)

      if (target) revokeAttachmentUrl(target)

      return attachments.filter((attachment) => attachment.id !== id)
    })
  }

  const handleFilesSelected = async (
    event: ChangeEvent<HTMLInputElement>,
    kind: AttachmentKind,
  ) => {
    const files = Array.from(event.currentTarget.files ?? [])

    event.currentTarget.value = ''

    if (!files.length) return

    const availableSlots = maxPendingAttachments - pendingAttachments.length

    if (availableSlots <= 0) {
      pushNotification('error', `最多同时添加 ${maxPendingAttachments} 个附件`)
      return
    }

    const selectedFiles = files.slice(0, availableSlots)
    const oversizedFiles = selectedFiles.filter(
      (file) => file.size > maxAttachmentSize,
    )
    const validFiles = selectedFiles.filter(
      (file) => file.size <= maxAttachmentSize,
    )

    if (files.length > availableSlots) {
      pushNotification('error', `最多同时添加 ${maxPendingAttachments} 个附件`)
    }

    if (oversizedFiles.length) {
      pushNotification('error', '部分附件超过 10MB，已跳过')
    }

    if (!validFiles.length) return

    try {
      const nextAttachments = await Promise.all(
        validFiles.map((file) => createAttachmentFromFile(file, kind)),
      )

      nextAttachments.forEach((attachment) => {
        if (attachment.url) attachmentUrlsRef.current.add(attachment.url)
      })
      setPendingAttachments((attachments) => [
        ...attachments,
        ...nextAttachments,
      ])
      pushNotification('success', `已添加 ${nextAttachments.length} 个附件`)
    } catch {
      pushNotification('error', '读取附件失败，请重试')
    }
  }

  const handlePrefixAction = (action: SenderPrefixAction) => {
    if (action === 'upload') {
      fileInputRef.current?.click()
      return
    }

    if (action === 'image') {
      imageInputRef.current?.click()
      return
    }

    const actionText =
      action === 'search'
        ? '可以把需要查找的主题写进输入框。'
        : '下一条回复会更强调推理过程。'

    pushNotification('success', actionText)
  }

  const handleVoiceClick = () => {
    const activeRecognition = recognitionRef.current

    if (activeRecognition) {
      activeRecognition.stop()
      return
    }

    const speechWindow = window as SpeechRecognitionWindow
    const SpeechRecognition =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition

    if (!SpeechRecognition) {
      pushNotification(
        'error',
        '当前浏览器不支持语音识别',
        '请使用 Chrome/Edge 或手动输入。',
      )
      return
    }

    const recognition = new SpeechRecognition()

    voiceBaseTextRef.current = composerValue.trim()
    recognition.lang = 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.onresult = (event) => {
      let transcript = ''

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index]
        const alternative = result?.[0]

        if (alternative?.transcript) {
          transcript += alternative.transcript
        }
      }

      const baseText = voiceBaseTextRef.current
      const nextValue = [baseText, transcript.trim()].filter(Boolean).join(' ')

      setComposerValue(nextValue)
    }
    recognition.onerror = () => {
      setVoiceActive(false)
      recognitionRef.current = null
      pushNotification('error', '语音识别失败，请检查麦克风权限')
    }
    recognition.onend = () => {
      setVoiceActive(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    setVoiceActive(true)

    try {
      recognition.start()
      pushNotification('success', '正在听写语音')
    } catch {
      setVoiceActive(false)
      recognitionRef.current = null
      pushNotification('error', '无法启动语音识别')
    }
  }

  const handleSend = (message: string) => {
    if (
      !activeConversationId ||
      (!message.trim() && !pendingAttachments.length)
    ) {
      return
    }

    const attachments = [...pendingAttachments]
    const displayMessage =
      message.trim() ||
      `已上传 ${attachments.length} 个附件，请结合附件内容回答。`
    const aiPrompt = [displayMessage, buildAttachmentPrompt(attachments)]
      .filter(Boolean)
      .join('\n\n')

    if (streamingTarget) {
      requestSeqRef.current += 1
      cancel()
      setMessagesByConversation((items) =>
        updateConversationMessage(
          items,
          streamingTarget.conversationId,
          streamingTarget.messageId,
          { loading: false },
        ),
      )
      setStreamingTarget(null)
    }

    const userMessage: DemoMessageRecord = {
      id: createMessageId('user'),
      role: 'user',
      content: displayMessage,
      timestamp: getCurrentTime(),
      status: 'sent',
      ...(attachments.length && { attachments }),
    }
    const assistantMessageId = createMessageId('assistant')
    const assistantMessage: DemoMessageRecord = {
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
              lastMessage: displayMessage,
              timestamp: getCurrentTime(),
            }
          : conversation,
      ),
    )
    setPendingAttachments([])
    pushNotification('loading', '正在生成回复', '你可以随时停止生成。')
    const nextStreamingTarget = {
      conversationId: activeConversationId,
      messageId: assistantMessageId,
    }

    setStreamingTarget(nextStreamingTarget)
    setReasoningStore((store) =>
      patchReasoningState(store, assistantMessageId, {
        content: '',
        steps: [],
        phase: 'connecting',
      }),
    )

    const history = createAIHistory(activeMessages)
    const requestId = ++requestSeqRef.current
    let hasReasoningContent = false
    let hasInlineThink = false
    let answerStarted = false
    let completed = false

    const isActiveRequest = () => requestSeqRef.current === requestId

    const completeReply = (content: string, thought?: string) => {
      if (completed || !isActiveRequest()) return

      completed = true
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
      setReasoningStore((store) =>
        patchReasoningState(store, assistantMessageId, {
          content: thought ?? store[assistantMessageId]?.content ?? '',
          steps: thought
            ? parseReasoningSteps(thought)
            : (store[assistantMessageId]?.steps ?? []),
          phase: 'done',
          responsePreview: content,
        }),
      )
      pushNotification('success', '回复已完成')
    }

    createAIResponseStreamWithReasoning(aiPrompt, history, {
      onReasoning: (reasoningText) => {
        if (!isActiveRequest()) return

        hasReasoningContent = true
        setReasoningStore((store) =>
          patchReasoningState(store, assistantMessageId, {
            content: reasoningText,
            steps: parseReasoningSteps(reasoningText),
            phase: 'reasoning',
            hasReasoningContent: true,
          }),
        )
      },
      onContent: (content) => {
        if (!isActiveRequest()) return

        if (hasReasoningContent) {
          answerStarted = true
          setMessagesByConversation((items) =>
            updateConversationMessage(
              items,
              nextStreamingTarget.conversationId,
              nextStreamingTarget.messageId,
              { content, loading: true },
            ),
          )
          setReasoningStore((store) =>
            patchReasoningState(store, assistantMessageId, {
              content: store[assistantMessageId]?.content || '',
              steps: store[assistantMessageId]?.steps || [],
              phase: 'responding',
              responsePreview: content,
            }),
          )
          return
        }

        const inlineThink = splitInlineThink(content)
        hasInlineThink = hasInlineThink || Boolean(inlineThink.thought)

        if (hasReasoningContent) {
          answerStarted = true
          setMessagesByConversation((items) =>
            updateConversationMessage(
              items,
              nextStreamingTarget.conversationId,
              nextStreamingTarget.messageId,
              { content, loading: true },
            ),
          )
          setReasoningStore((store) =>
            patchReasoningState(store, assistantMessageId, {
              content: store[assistantMessageId]?.content || '',
              steps: store[assistantMessageId]?.steps || [],
              phase: 'responding',
              responsePreview: content,
            }),
          )
          return
        }

        if (inlineThink.done) {
          answerStarted = true
          setMessagesByConversation((items) =>
            updateConversationMessage(
              items,
              nextStreamingTarget.conversationId,
              nextStreamingTarget.messageId,
              { content: inlineThink.answer, loading: true },
            ),
          )
        }

        setReasoningStore((store) =>
          patchReasoningState(store, assistantMessageId, {
            content: inlineThink.thought,
            steps: inlineThink.thought ? [inlineThink.thought] : [],
            phase:
              hasInlineThink && inlineThink.done ? 'responding' : 'reasoning',
            responsePreview: inlineThink.answer,
            hasReasoningContent: hasInlineThink,
          }),
        )
      },
      onComplete: (content, reasoning) => {
        if (!isActiveRequest()) return

        const finalInlineThink = splitInlineThink(content, true)
        const finalAnswer = hasReasoningContent
          ? content
          : stripHiddenReasoning(finalInlineThink.answer)
        const finalThought = hasReasoningContent
          ? reasoning
          : finalInlineThink.thought

        if (!answerStarted) {
          setMessagesByConversation((items) =>
            updateConversationMessage(
              items,
              nextStreamingTarget.conversationId,
              nextStreamingTarget.messageId,
              { content: finalAnswer, loading: true },
            ),
          )
        }

        setReasoningStore((store) =>
          patchReasoningState(store, assistantMessageId, {
            content: finalThought,
            steps: finalThought ? parseReasoningSteps(finalThought) : [],
            phase: 'done',
            responsePreview: finalAnswer,
            hasReasoningContent: Boolean(finalThought),
          }),
        )
        completeReply(finalAnswer, finalThought)
      },
      onError: () => {
        // Fallback to regular stream
        void createDemoResponseStream(aiPrompt, history, forceMock)
          .then((generator) =>
            start(generator, {
              onToken: (nextContent) => {
                if (!isActiveRequest()) return

                const inlineThink = splitInlineThink(nextContent)

                if (inlineThink.done) {
                  answerStarted = true
                  setMessagesByConversation((items) =>
                    updateConversationMessage(
                      items,
                      nextStreamingTarget.conversationId,
                      nextStreamingTarget.messageId,
                      { content: inlineThink.answer, loading: true },
                    ),
                  )
                }

                setReasoningStore((store) =>
                  patchReasoningState(store, assistantMessageId, {
                    content: inlineThink.thought,
                    steps: inlineThink.thought ? [inlineThink.thought] : [],
                    phase: inlineThink.done ? 'responding' : 'reasoning',
                    responsePreview: inlineThink.answer,
                    hasReasoningContent: Boolean(inlineThink.thought),
                  }),
                )
              },
              onComplete: (nextContent) => {
                if (!isActiveRequest()) return

                const inlineThink = splitInlineThink(nextContent, true)
                const finalAnswer = stripHiddenReasoning(inlineThink.answer)
                const finalThought = inlineThink.thought

                if (!answerStarted) {
                  setMessagesByConversation((items) =>
                    updateConversationMessage(
                      items,
                      nextStreamingTarget.conversationId,
                      nextStreamingTarget.messageId,
                      { content: finalAnswer, loading: true },
                    ),
                  )
                }
                setReasoningStore((store) =>
                  patchReasoningState(store, assistantMessageId, {
                    content: finalThought,
                    steps: finalThought
                      ? parseReasoningSteps(finalThought)
                      : [],
                    phase: 'done',
                    responsePreview: finalAnswer,
                    hasReasoningContent: Boolean(finalThought),
                  }),
                )
                completeReply(finalAnswer, finalThought)
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
                setReasoningStore((store) =>
                  patchReasoningState(store, assistantMessageId, {
                    phase: 'error',
                  }),
                )
                pushNotification('error', '生成失败，请稍后重试')
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
    requestSeqRef.current += 1
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

  const handleAction = async (key: string, message: DemoMessageRecord) => {
    if (key === 'copy') {
      const content = message.content?.trim()

      if (!content) {
        pushNotification('error', '没有可复制内容')
        return
      }

      try {
        await navigator.clipboard.writeText(content)
        pushNotification('success', '已复制回复')
      } catch {
        pushNotification('error', '复制失败，请检查浏览器剪贴板权限')
      }

      return
    }

    if (key !== 'regenerate') {
      pushNotification('success', '操作已记录')
      return
    }

    const lastUserMessage = [...activeMessages]
      .reverse()
      .find((item) => item.role === 'user')

    if (lastUserMessage?.content) {
      handleSend(lastUserMessage.content)
    }
  }

  const renderAssistantAddons = (message: MessageRecord) => {
    const reasoning = reasoningStore[message.id]

    if (reasoning) {
      const hasReasoningSteps = reasoning.steps.length > 0
      const thinkContent =
        reasoning.content ||
        (reasoning.phase === 'done'
          ? '已完成回复组织。'
          : reasoning.phase === 'connecting'
            ? '正在连接模型，等待模型返回问题分析。'
            : '等待模型返回问题分析。')
      const thoughtItems: ThoughtItem[] = hasReasoningSteps
        ? reasoning.steps.map((step, index) => ({
            key: `step-${index}`,
            title:
              reasoning.phase === 'reasoning'
                ? `推理片段 ${index + 1}`
                : `步骤 ${index + 1}`,
            status:
              message.loading && index === reasoning.steps.length - 1
                ? 'loading'
                : 'success',
            content: step,
            collapsible: true,
            defaultOpen:
              message.loading && index === reasoning.steps.length - 1,
          }))
        : [
            {
              key: 'connect',
              title: '连接模型',
              status:
                reasoning.phase === 'connecting'
                  ? 'loading'
                  : reasoning.phase === 'error'
                    ? 'error'
                    : 'success',
              content: '已向服务端发送请求，等待模型返回流式事件。',
            },
            {
              key: 'reason',
              title: '组织回复',
              status:
                reasoning.phase === 'reasoning'
                  ? 'loading'
                  : reasoning.phase === 'responding' ||
                      reasoning.phase === 'done'
                    ? 'success'
                    : reasoning.phase === 'error'
                      ? 'error'
                      : 'pending',
              content: reasoning.content || '正在等待模型返回问题分析。',
            },
            {
              key: 'respond',
              title: '生成回复',
              status:
                reasoning.phase === 'responding'
                  ? 'loading'
                  : reasoning.phase === 'done'
                    ? 'success'
                    : reasoning.phase === 'error'
                      ? 'error'
                      : 'pending',
              content: '等待问题分析完成后开始输出正文。',
            },
          ]

      return (
        <div className="llm-demo-chat__message-addons">
          <Think
            content={thinkContent}
            label={
              reasoning.phase === 'responding' || reasoning.phase === 'done'
                ? '已完成'
                : '回复中'
            }
            status={
              reasoning.phase === 'responding' || reasoning.phase === 'done'
                ? 'done'
                : 'thinking'
            }
          />
          <Thought
            compact
            defaultExpandedKeys={
              message.loading
                ? [
                    hasReasoningSteps
                      ? `step-${reasoning.steps.length - 1}`
                      : reasoning.phase === 'responding'
                        ? 'respond'
                        : reasoning.phase === 'reasoning'
                          ? 'reason'
                          : 'connect',
                  ]
                : undefined
            }
            items={thoughtItems}
            title={hasReasoningSteps ? '推理链' : '生成链路'}
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
              renderMessage={(message) => {
                const demoMessage = message as DemoMessageRecord

                return (
                  <Bubble
                    role={demoMessage.role}
                    {...(demoMessage.loading !== undefined && {
                      loading: demoMessage.loading,
                    })}
                    {...(demoMessage.status && { status: demoMessage.status })}
                    {...(demoMessage.timestamp && {
                      timestamp: demoMessage.timestamp,
                    })}
                    actions={
                      demoMessage.role === 'assistant' &&
                      demoMessage.content ? (
                        <Actions
                          items={assistantActions}
                          onAction={(key) =>
                            void handleAction(key, demoMessage)
                          }
                          size="sm"
                        />
                      ) : undefined
                    }
                  >
                    {demoMessage.role === 'assistant' ? (
                      <div className="llm-demo-chat__assistant-content">
                        {renderAssistantAddons(demoMessage)}
                        {demoMessage.content ? (
                          <Mark
                            content={demoMessage.content}
                            streaming={demoMessage.loading}
                          />
                        ) : null}
                      </div>
                    ) : (
                      <div className="llm-demo-chat__user-content">
                        {demoMessage.content ? (
                          <div>{demoMessage.content}</div>
                        ) : null}
                        <AttachmentList
                          attachments={demoMessage.attachments ?? []}
                        />
                      </div>
                    )}
                  </Bubble>
                )
              }}
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
              <input
                className="llm-demo-chat__file-input"
                multiple
                onChange={(event) => void handleFilesSelected(event, 'file')}
                ref={fileInputRef}
                type="file"
              />
              <input
                accept="image/*"
                className="llm-demo-chat__file-input"
                multiple
                onChange={(event) => void handleFilesSelected(event, 'image')}
                ref={imageInputRef}
                type="file"
              />
              <AttachmentList
                attachments={pendingAttachments}
                onRemove={handleRemovePendingAttachment}
              />
              <Sender
                canSend={canSend}
                loading={state === 'streaming'}
                onCancel={handleCancel}
                onChange={setComposerValue}
                onModelChange={(model) =>
                  pushNotification('success', '已切换模型', model)
                }
                onPrefixAction={handlePrefixAction}
                onSend={handleSend}
                onVoiceClick={handleVoiceClick}
                placeholder="输入一个问题，按 Enter 发送..."
                value={composerValue}
                voiceActive={voiceActive}
              />
            </div>
          </div>
        </main>

        <NotificationStack items={notifications} onClose={removeNotification} />
      </div>
    </ConfigProvider>
  )
}
