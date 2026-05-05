import type { ReactNode } from 'react'
import type { Locale } from '../locale/type';
// 用户传入的 props（可选）
export interface ConfigProviderProps {
  theme?: { mode?: 'light' | 'dark' | 'system'; primaryColor?: string }
  locale?: 'zh-CN' | 'en-US' | Locale,
  components?:Record<string,Record<string,any>>
  ai?: {
    apiKey: string
    model: string
    baseURL?: string
  }
  children: ReactNode
}

// Context 里存的值（完整，有默认值）
export interface ConfigContextValue {
  theme: { mode: 'light' | 'dark' | 'system'; primaryColor: string }
  setTheme: (theme: { mode?: 'light' | 'dark' | 'system'; primaryColor?: string }) => void
  locale: Locale
  components?: Record<string, Record<string, any>>
  ai?: {
    apiKey: string
    model: string
    baseURL?: string
  }
}
