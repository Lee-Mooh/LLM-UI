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

function shouldFallback(status: number) {
  return status === 404 || status === 503
}

export async function createAIResponseStream(
  message: string,
  history: AIStreamMessage[] = [],
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
