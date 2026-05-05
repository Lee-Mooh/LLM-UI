import { useConfig } from './useConfig'

export function useLocale() {
  const context = useConfig()
  return context.locale
  
}
