import {
  type ConfigContextValue,
  type ConfigProviderProps,
} from '../../types/config'
import { useState } from 'react'
import zhCN from '../../locale/zh-CN'
import enUS from '../../locale/en-US'
import { configContext } from './configContext'

export function ConfigProvider({
  theme,
  locale,
  ai,
  children,
  components
}: ConfigProviderProps) {
  const [themeState, setThemeState] = useState({
    mode: theme?.mode ?? 'system',
    primaryColor: theme?.primaryColor ?? 'oklch(0.205 0 0)',
  })

  const setTheme = (newTheme: { mode?: 'light' | 'dark' | 'system'; primaryColor?: string }) => {
    setThemeState(prev => ({ ...prev, ...newTheme }))
  }

const value: ConfigContextValue = {
  theme: themeState,
  setTheme,
    locale:
      typeof locale === 'string'
        ? locale === 'en-US'
          ? enUS
          : zhCN
        : (locale ?? zhCN),
    ...(ai && { ai }),
    ...(components && { components }),
  }
  const resolveMode =
    value.theme.mode === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : value.theme.mode

  document.documentElement.setAttribute('data-theme', resolveMode)

  return (
    <configContext.Provider value={value}>{children}</configContext.Provider>
  )
}
