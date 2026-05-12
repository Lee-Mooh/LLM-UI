import type { ReactNode } from 'react'
import type { Locale } from '../locale/type'

export type ComponentDefaultProps = Record<string, unknown>

export interface ConfigProviderProps {
  theme?: { mode?: 'light' | 'dark' | 'system'; primaryColor?: string }
  locale?: 'zh-CN' | 'en-US' | Locale
  components?: Record<string, ComponentDefaultProps>
  ai?: {
    apiKey: string
    model: string
    baseURL?: string
  }
  children: ReactNode
}

export interface ConfigContextValue {
  theme: { mode: 'light' | 'dark' | 'system'; primaryColor: string }
  setTheme: (theme: {
    mode?: 'light' | 'dark' | 'system'
    primaryColor?: string
  }) => void
  locale: Locale
  components?: Record<string, ComponentDefaultProps>
  ai?: {
    apiKey: string
    model: string
    baseURL?: string
  }
}
