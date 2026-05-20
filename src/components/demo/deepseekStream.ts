import { streamToGenerator } from '../../utils/stream'

export type AIStreamRole = 'user' | 'assistant'

export type AIStreamMessage = {
  role: AIStreamRole
  content: string
}

export interface AIStreamChunk {
  type: 'reasoning' | 'content' | 'done'
  text?: string
}

export interface AIStreamCallbacks {
  onReasoning?: (text: string) => void
  onContent?: (text: string) => void
  onComplete?: (content: string, reasoning: string) => void
  onError?: (error: Error) => void
}

export class AIStreamFallbackError extends Error {
  constructor(message = 'AI stream fallback required.') {
    super(message)
    this.name = 'AIStreamFallbackError'
  }
}

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com'
const DEFAULT_MODEL = 'deepseek-reasoner'
const publicApiKey = import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined
const publicModel = import.meta.env.VITE_DEEPSEEK_MODEL || DEFAULT_MODEL

function shouldFallback(status: number) {
  return status === 404 || status === 503
}

function createChatPayload(message: string, history: AIStreamMessage[]) {
  return {
    model: publicModel,
    messages: [
      {
        role: 'system',
        content:
          '你是一个通用 AI 助手，运行在 LLM-UI 组件库演示页面中。回答前先输出一段简短的问题分析，格式为 <think>...</think>，内容必须结合用户当前问题且不要复述最终答案；不要使用 HTML 注释 <!-- --> 来隐藏思考过程。随后再输出正式回答。如果问题需要实时信息而你无法确认，请说明限制，并给出用户可以继续操作的建议。',
      },
      ...history,
      {
        role: 'user',
        content: message,
      },
    ],
    stream: true,
  }
}

function extractSSEChunk(line: string): AIStreamChunk | null {
  if (!line.startsWith('data:')) return null

  const data = line.slice(5).trim()

  if (!data) return null

  try {
    return JSON.parse(data) as AIStreamChunk
  } catch {
    return null
  }
}

function extractDelta(line: string) {
  if (!line.startsWith('data:')) return ''

  const data = line.slice(5).trim()

  if (!data || data === '[DONE]') return ''

  try {
    const payload = JSON.parse(data) as {
      choices?: Array<{
        delta?: {
          content?: string
        }
      }>
    }

    return payload.choices?.[0]?.delta?.content ?? ''
  } catch {
    return ''
  }
}

async function* streamOpenAIResponse(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const delta = extractDelta(line.trim())

        if (delta) {
          yield delta
        }
      }
    }

    if (buffer) {
      const delta = extractDelta(buffer.trim())

      if (delta) {
        yield delta
      }
    }
  } finally {
    reader.releaseLock()
  }
}

async function* processSSEStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<AIStreamChunk> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const chunk = extractSSEChunk(line.trim())

        if (chunk) {
          yield chunk
        }
      }
    }

    if (buffer) {
      const chunk = extractSSEChunk(buffer.trim())

      if (chunk) {
        yield chunk
      }
    }
  } finally {
    reader.releaseLock()
  }
}

async function createBrowserAIResponseStream(
  message: string,
  history: AIStreamMessage[],
) {
  if (!publicApiKey) {
    throw new AIStreamFallbackError()
  }

  let response: Response

  try {
    response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${publicApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createChatPayload(message, history)),
    })
  } catch {
    throw new AIStreamFallbackError()
  }

  if (!response.ok) {
    throw new Error('AI service is temporarily unavailable.')
  }

  if (!response.body) {
    throw new Error('AI service returned an empty response.')
  }

  return streamOpenAIResponse(response.body)
}

async function createServerAIResponseStream(
  message: string,
  history: AIStreamMessage[],
) {
  let response: Response

  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, history }),
    })
  } catch {
    throw new AIStreamFallbackError()
  }

  if (shouldFallback(response.status)) {
    throw new AIStreamFallbackError()
  }

  if (!response.ok) {
    throw new Error('AI service is temporarily unavailable.')
  }

  if (!response.body) {
    throw new Error('AI service returned an empty response.')
  }

  return streamToGenerator(response.body)
}

async function createServerAIStreamWithReasoning(
  message: string,
  history: AIStreamMessage[],
) {
  let response: Response

  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, history }),
    })
  } catch {
    throw new AIStreamFallbackError()
  }

  if (shouldFallback(response.status)) {
    throw new AIStreamFallbackError()
  }

  if (!response.ok) {
    throw new Error('AI service is temporarily unavailable.')
  }

  if (!response.body) {
    throw new Error('AI service returned an empty response.')
  }

  return processSSEStream(response.body)
}

export async function createAIResponseStream(
  message: string,
  history: AIStreamMessage[] = [],
) {
  try {
    return await createServerAIResponseStream(message, history)
  } catch (error) {
    if (error instanceof AIStreamFallbackError) {
      return createBrowserAIResponseStream(message, history)
    }

    throw error
  }
}

export async function createAIResponseStreamWithReasoning(
  message: string,
  history: AIStreamMessage[] = [],
  callbacks: AIStreamCallbacks,
) {
  let reasoningContent = ''
  let responseContent = ''
  let completed = false

  try {
    const stream = await createServerAIStreamWithReasoning(message, history)

    for await (const chunk of stream) {
      if (chunk.type === 'reasoning' && chunk.text) {
        reasoningContent += chunk.text
        callbacks.onReasoning?.(reasoningContent)
      } else if (chunk.type === 'content' && chunk.text) {
        responseContent += chunk.text
        callbacks.onContent?.(responseContent)
      } else if (chunk.type === 'done') {
        completed = true
        callbacks.onComplete?.(responseContent, reasoningContent)
      }
    }

    if (!completed && (responseContent || reasoningContent)) {
      callbacks.onComplete?.(responseContent, reasoningContent)
    }
  } catch (error) {
    callbacks.onError?.(error as Error)
  }
}
