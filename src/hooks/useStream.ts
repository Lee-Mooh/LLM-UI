import { useState, useRef, useCallback } from 'react'

export function useStream() {
  const [state, setState] = useState<'idle' | 'streaming' | 'error' | 'complete'>('idle')
  const [content, setContent] = useState('')
  const abortRef = useRef(new AbortController())

  const start = useCallback(async (generator: AsyncGenerator<string>) => {
    abortRef.current = new AbortController()
    setState('streaming')
    setContent('')
    try {
      for await (const token of generator) {
        if (abortRef.current.signal.aborted) break
        setContent(prev => prev + token)
      }
      if (!abortRef.current.signal.aborted) {
        setState('complete')
      }
    } catch {
      setState('error')
    }
  }, [])

  const cancel = useCallback(() => {
    abortRef.current.abort()
    setState('idle')
  }, [])

  return { content, state, start, cancel }
}
