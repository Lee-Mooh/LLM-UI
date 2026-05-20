declare const process: {
  env: {
    DEEPSEEK_API_KEY?: string
    DEEPSEEK_MODEL?: string
  }
}

type VercelRequest = {
  method?: string
  body?: unknown
}

type VercelResponse = {
  statusCode: number
  setHeader: (name: string, value: string) => void
  status: (statusCode: number) => VercelResponse
  json: (body: unknown) => void
  write: (chunk: string) => void
  end: () => void
}

type ChatRole = 'user' | 'assistant'

type ChatMessage = {
  role: ChatRole
  content: string
}

type RequestBody = {
  message?: unknown
  history?: unknown
  model?: unknown
}

type StreamChunk = {
  type: 'reasoning' | 'content' | 'done'
  text?: string
}

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com'
const DEFAULT_MODEL = 'deepseek-reasoner'
const MAX_MESSAGE_LENGTH = 4000
const MAX_HISTORY_ITEMS = 4

function sendJson(response: VercelResponse, statusCode: number, error: string) {
  response.status(statusCode).json({ error })
}

function isChatRole(role: unknown): role is ChatRole {
  return role === 'user' || role === 'assistant'
}

function normalizeHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) return []

  return history
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === 'object' && item !== null,
    )
    .map((item) => {
      const role = item.role
      const content = item.content

      if (!isChatRole(role) || typeof content !== 'string') return null

      const normalizedContent = content.trim()

      if (!normalizedContent) return null

      return {
        role,
        content: normalizedContent.slice(0, MAX_MESSAGE_LENGTH),
      }
    })
    .filter((item): item is ChatMessage => item !== null)
    .slice(-MAX_HISTORY_ITEMS)
}

function createChatPayload(body: RequestBody) {
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!message) {
    return { error: 'Message is required.' }
  }

  const normalizedMessage = message.slice(0, MAX_MESSAGE_LENGTH)
  const history = normalizeHistory(body.history)
  const model =
    typeof body.model === 'string'
      ? body.model
      : process.env.DEEPSEEK_MODEL || DEFAULT_MODEL

  return {
    payload: {
      model,
      messages: [
        {
          role: 'system',
          content:
            '你是一个通用 AI 助手，运行在 LLM-UI 组件库演示页面中。只围绕当前这条最新用户问题作答，历史消息仅作为上下文参考，不要把前几轮的问题混进本轮回答。回答前先输出一段简短的问题分析，格式为 <think>...</think>，内容必须结合当前用户问题且不要复述最终答案；不要使用 HTML 注释 <!-- --> 来隐藏思考过程。随后再输出正式回答。如果模型支持 reasoning_content，也可以通过 reasoning_content 返回分析。若问题需要实时信息而你无法确认，请说明限制，并给出用户可以继续操作的建议。',
        },
        ...history,
        {
          role: 'user',
          content: normalizedMessage,
        },
      ],
      stream: true,
    },
  }
}

function extractDelta(line: string): StreamChunk[] {
  if (!line.startsWith('data:')) return []

  const data = line.slice(5).trim()

  if (!data) return []

  if (data === '[DONE]') return [{ type: 'done' }]

  try {
    const payload = JSON.parse(data) as {
      choices?: Array<{
        delta?: {
          reasoning_content?: string
          content?: string
        }
      }>
    }

    const delta = payload.choices?.[0]?.delta

    if (!delta) return []

    const chunks: StreamChunk[] = []

    if (delta.reasoning_content) {
      chunks.push({ type: 'reasoning', text: delta.reasoning_content })
    }

    if (delta.content) {
      chunks.push({ type: 'content', text: delta.content })
    }

    return chunks
  } catch {
    return []
  }
}

async function streamOpenAIResponse(
  upstream: Response,
  response: VercelResponse,
) {
  if (!upstream.body) {
    sendJson(response, 502, 'AI service returned an empty response.')
    return
  }

  response.statusCode = 200
  response.setHeader('Content-Type', 'text/event-stream')
  response.setHeader('Cache-Control', 'no-cache, no-transform')
  response.setHeader('X-Content-Type-Options', 'nosniff')

  const reader = upstream.body.getReader()
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
        const chunks = extractDelta(line.trim())

        for (const chunk of chunks) {
          response.write(`data: ${JSON.stringify(chunk)}\n\n`)
        }
      }
    }

    if (buffer) {
      const chunks = extractDelta(buffer.trim())

      for (const chunk of chunks) {
        response.write(`data: ${JSON.stringify(chunk)}\n\n`)
      }
    }

    // Send done event
    response.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
  } finally {
    reader.releaseLock()
    response.end()
  }
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendJson(response, 405, 'Method not allowed.')
    return
  }

  const apiKey = process.env.DEEPSEEK_API_KEY

  if (!apiKey) {
    sendJson(response, 503, 'AI service is not configured.')
    return
  }

  const { payload, error } = createChatPayload(request.body as RequestBody)

  if (error || !payload) {
    sendJson(response, 400, error ?? 'Invalid request.')
    return
  }

  try {
    const upstream = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!upstream.ok) {
      sendJson(response, 502, 'AI service is temporarily unavailable.')
      return
    }

    await streamOpenAIResponse(upstream, response)
  } catch {
    sendJson(response, 502, 'AI service is temporarily unavailable.')
  }
}
