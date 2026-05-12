import { useContext } from 'react'
import { configContext } from '../components/config-provider/configContext'

export function useConfig() {
  const context = useContext(configContext)
  if (!context) {
    throw new Error('useConfig 必须在 ConfigProvider 内部使用')
  }
  return context
}
