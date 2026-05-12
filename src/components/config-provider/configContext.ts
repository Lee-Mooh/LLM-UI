import { createContext } from 'react'
import { type ConfigContextValue } from '../../types/config'

export const configContext = createContext<ConfigContextValue | undefined>(
  undefined,
)
