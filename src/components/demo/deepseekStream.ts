import { streamToGenerator } from '../../utils/stream'

export type AIStreamRole = 'user' | 'assistant'

export type AIStreamMessage = {
  role: AIStreamRole
  content: string
}

export class AIStreamFallbackError extends Error {
  constructor(message = 'AI stream fallback required.') {
    super(message)
    this.name = 'AIStreamFallbackError'
  }
}

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com'
const DEFAULT_MODEL = 'deepseek-chat'
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
          '你是一个通用 AI 助手，运行在 LLM-UI 组件库演示页面中。请直接回答用户问题；如果问题需要实时信息而你无法确认，请说明限制，并给出用户可以继续操作的建议。',
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
