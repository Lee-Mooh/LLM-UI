import { useCallback, useRef, useState } from 'react'

export type StreamState = 'idle' | 'streaming' | 'error' | 'complete'

export interface StreamStartOptions {
  onComplete?: (content: string) => void
  onError?: () => void
  onToken?: (content: string, token: string) => void
}

export function useStream() {
  const [state, setState] = useState<StreamState>('idle')
  const [content, setContent] = useState('')
  const abortRef = useRef(new AbortController())

  const start = useCallback(
    async (generator: AsyncGenerator<string>, options?: StreamStartOptions) => {
      abortRef.current = new AbortController()
      setState('streaming')
      setContent('')

      let nextContent = ''

      try {
        for await (const token of generator) {
          if (abortRef.current.signal.aborted) break

          nextContent += token
          setContent(nextContent)
          options?.onToken?.(nextContent, token)
        }

        if (!abortRef.current.signal.aborted) {
          setState('complete')
          options?.onComplete?.(nextContent)
        }
      } catch {
        setState('error')
        options?.onError?.()
      }
    },
    [],
  )

  const cancel = useCallback(() => {
    abortRef.current.abort()
    setState('idle')
  }, [])

  return { content, state, start, cancel }
}
