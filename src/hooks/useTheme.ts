import { useConfig } from './useConfig'

export function useTheme() {
  const context = useConfig()

  const setMode = (mode: 'light' | 'dark' | 'system') => {
    context.setTheme({ mode })
  }

  const isDark =
    context.theme.mode === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : context.theme.mode === 'dark'

  return {
    mode: context.theme.mode,
    isDark,
    setMode,
    primaryColor: context.theme.primaryColor,
  }
}
