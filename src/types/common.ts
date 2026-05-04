import { type ReactNode } from 'react'

export type LLMRole = 'user' | 'assistant' | 'system'
export type messageStatus = 'sending' | 'sent' | 'error'

export interface BaseComponentProps {
  children?: ReactNode
  className?: string
}
