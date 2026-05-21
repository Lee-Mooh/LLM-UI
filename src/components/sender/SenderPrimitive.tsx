import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

export type SenderPrefixAction = 'upload' | 'image' | 'search' | 'reasoning'

export interface SenderModelOption {
  value: string
  label: string
}

export interface SenderPrimitiveProps {
  value?: string
  defaultValue?: string
  onChange?: (message: string) => void
  onSend?: (message: string) => void
  onCancel?: () => void
  onPrefixAction?: (action: SenderPrefixAction) => void
  onModelChange?: (model: string) => void
  onVoiceClick?: () => void
  loading?: boolean
  disabled?: boolean
  canSend?: boolean
  voiceActive?: boolean
  placeholder?: string
  model?: string
  modelOptions?: SenderModelOption[]
  prefix?: ReactNode
  suffix?: ReactNode
  className?: string
}

const senderPrefixActions: Array<{
  key: SenderPrefixAction
  label: string
}> = [
  { key: 'upload', label: '上传附件' },
  { key: 'image', label: '添加图片' },
  { key: 'search', label: '联网搜索' },
  { key: 'reasoning', label: '深度思考' },
]

const defaultModelOptions: SenderModelOption[] = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'claude-sonnet-4', label: 'Claude Sonnet 4' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'deepseek-r1', label: 'DeepSeek R1' },
]

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      className="llm-sender__prefix-icon"
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 5v14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M5 12h14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function VoiceIcon() {
  return (
    <svg
      aria-hidden="true"
      className="llm-sender__suffix-icon"
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M19 10v2a7 7 0 0 1-14 0v-2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M12 19v3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg
      aria-hidden="true"
      className="llm-sender__send-icon"
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 12h14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="m13 6 6 6-6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg
      aria-hidden="true"
      className="llm-sender__send-icon"
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        height="8"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="2"
        width="8"
        x="8"
        y="8"
      />
    </svg>
  )
}

export function SenderPrimitive({
  value,
  defaultValue = '',
  onChange,
  onSend,
  onCancel,
  onPrefixAction,
  onModelChange,
  onVoiceClick,
  loading = false,
  disabled = false,
  canSend,
  voiceActive = false,
  placeholder = '输入消息...',
  model,
  modelOptions = defaultModelOptions,
  prefix,
  suffix,
  className,
}: SenderPrimitiveProps) {
  const [innerMessage, setInnerMessage] = useState(defaultValue)
  const controlled = value !== undefined
  const message = controlled ? value : innerMessage
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const prefixMenuRef = useRef<HTMLDivElement>(null)
  const modelMenuRef = useRef<HTMLDivElement>(null)
  const [prefixMenuOpen, setPrefixMenuOpen] = useState(false)
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState(
    model ?? modelOptions[0]?.value ?? '',
  )
  const sendable = canSend ?? Boolean(message.trim())

  useEffect(() => {
    const textarea = textareaRef.current

    if (!textarea) return

    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [message])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target

      if (!(target instanceof Node)) return

      if (!prefixMenuRef.current?.contains(target)) {
        setPrefixMenuOpen(false)
      }

      if (!modelMenuRef.current?.contains(target)) {
        setModelMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [])

  const handleMessageChange = (nextMessage: string) => {
    if (!controlled) {
      setInnerMessage(nextMessage)
    }

    onChange?.(nextMessage)
  }

  const handleSend = () => {
    const nextMessage = message.trim()

    if (!sendable || disabled || loading) return

    onSend?.(nextMessage)
    handleMessageChange('')
  }

  const handleAction = () => {
    if (loading) {
      onCancel?.()
      return
    }

    handleSend()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return

    event.preventDefault()
    handleSend()
  }

  const handlePrefixAction = (action: SenderPrefixAction) => {
    onPrefixAction?.(action)
    setPrefixMenuOpen(false)
  }

  const selectedModelLabel =
    modelOptions.find((option) => option.value === selectedModel)?.label ??
    selectedModel

  const handleModelChange = (nextModel: string) => {
    setSelectedModel(nextModel)
    onModelChange?.(nextModel)
    setModelMenuOpen(false)
  }

  const handleVoiceClick = () => {
    if (disabled) return

    onVoiceClick?.()
  }

  return (
    <div
      className={className}
      data-disabled={disabled ? '' : undefined}
      data-loading={loading ? '' : undefined}
    >
      <textarea
        className="llm-sender__textarea"
        disabled={disabled}
        onChange={(event) => handleMessageChange(event.target.value)}
        ref={textareaRef}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        value={message}
      />

      <div className="llm-sender__footer">
        <div className="llm-sender__prefix">
          {prefix ?? (
            <div className="llm-sender__prefix-menu" ref={prefixMenuRef}>
              <button
                aria-expanded={prefixMenuOpen}
                aria-label="打开更多操作"
                className="llm-sender__prefix-trigger"
                disabled={disabled}
                onClick={() => setPrefixMenuOpen((open) => !open)}
                type="button"
              >
                <PlusIcon />
              </button>
              {prefixMenuOpen ? (
                <div className="llm-sender__prefix-list" role="menu">
                  {senderPrefixActions.map((action) => (
                    <button
                      className="llm-sender__prefix-item"
                      key={action.key}
                      onClick={() => handlePrefixAction(action.key)}
                      role="menuitem"
                      type="button"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
        <div className="llm-sender__actions">
          <div className="llm-sender__suffix">
            {suffix ?? (
              <>
                <div className="llm-sender__model-menu" ref={modelMenuRef}>
                  <button
                    aria-expanded={modelMenuOpen}
                    className="llm-sender__suffix-button llm-sender__model"
                    disabled={disabled}
                    onClick={() => setModelMenuOpen((open) => !open)}
                    type="button"
                  >
                    {selectedModelLabel}
                  </button>
                  {modelMenuOpen ? (
                    <div className="llm-sender__model-list" role="menu">
                      {modelOptions.map((option) => (
                        <button
                          aria-current={
                            option.value === selectedModel ? 'true' : undefined
                          }
                          className="llm-sender__model-item"
                          key={option.value}
                          onClick={() => handleModelChange(option.value)}
                          role="menuitem"
                          type="button"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button
                  aria-label={voiceActive ? '停止语音输入' : '语音输入'}
                  aria-pressed={voiceActive}
                  className="llm-sender__suffix-button"
                  data-active={voiceActive ? '' : undefined}
                  disabled={disabled}
                  onClick={handleVoiceClick}
                  title={voiceActive ? '停止语音输入' : '语音输入'}
                  type="button"
                >
                  <VoiceIcon />
                </button>
              </>
            )}
          </div>
          <button
            aria-label={loading ? '停止生成' : '发送消息'}
            className="llm-sender__send"
            data-loading={loading ? '' : undefined}
            disabled={disabled || (!loading && !sendable)}
            onClick={handleAction}
            type="button"
          >
            {loading ? <StopIcon /> : <SendIcon />}
          </button>
        </div>
      </div>
    </div>
  )
}
