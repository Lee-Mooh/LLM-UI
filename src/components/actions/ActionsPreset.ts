import { type ActionItem } from './ActionsPrimitive'

export type ActionPresetKey =
  | 'copy'
  | 'regenerate'
  | 'correct'
  | 'summary'
  | 'polish'
  | 'explain-code'

export const actionPresets: Record<ActionPresetKey, ActionItem> = {
  copy: { key: 'copy', label: '复制' },
  regenerate: { key: 'regenerate', label: '重新生成' },
  correct: { key: 'correct', label: '纠错' },
  summary: { key: 'summary', label: '总结' },
  polish: { key: 'polish', label: '润色' },
  'explain-code': { key: 'explain-code', label: '解释代码' },
}

export function createPresetActions(keys: ActionPresetKey[]) {
  return keys.map((key) => actionPresets[key])
}
