# LLM-UI 开发日报

## Day 1: 项目初始化

### 完成内容

- 使用 `pnpm create vite llm-ui --template react-ts` 初始化项目
- 安装核心依赖：tailwindcss, @tailwindcss/vite, react, react-dom, typescript
- 配置 tsconfig.json（strict 模式，JSX transform）
- 接入 `@tailwindcss/vite`，在 `src/index.css` 中使用 `@import "tailwindcss"`
- 创建 `src/styles/tokens.css` 设计令牌文件
- 创建 `src/styles/themes/light.css` + `dark.css` 主题文件
- 配置 vite.config.ts 开发服务器

### 设计令牌系统

采用 CSS Custom Properties，所有变量使用 `--llm-` 前缀：

```css
/* src/styles/tokens.css */
:root {
  --llm-radius-sm: 8px;
  --llm-radius-md: 12px;
  --llm-radius-lg: 16px;

  --llm-space-1: 4px;
  --llm-space-2: 8px;
  --llm-space-3: 12px;
  --llm-space-4: 16px;
  --llm-space-6: 24px;

  --llm-font-family:
    'Galaxie Copernicus', 'Source Serif 4', 'Crimson Pro', Georgia,
    'Noto Serif SC', 'PingFang SC', serif;

  --llm-font-mono:
    'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'Cascadia Code',
    Consolas, monospace;

  --llm-shadow-sm: 0 1px 2px rgb(15 23 42 / 0.06);
  --llm-shadow-md: 0 8px 24px rgb(15 23 42 / 0.08);
}
```

### 主题切换架构

基于 `data-theme` 属性（非 class），CSS 变量在 `[data-theme='dark']` 选择器下重新定义：

```css
/* src/styles/themes/light.css */
:root,
[data-theme='light'] {
  --llm-color-bg: oklch(1 0 0);
  --llm-color-surface: oklch(0.98 0 0);
  --llm-color-text: oklch(0.145 0 0);
  --llm-color-text-muted: oklch(0.556 0 0);
  --llm-color-border: oklch(0.922 0 0);
  --llm-color-primary: oklch(0.205 0 0);
  --llm-color-primary-foreground: oklch(0.985 0 0);
}

/* src/styles/themes/dark.css */
[data-theme='dark'] {
  --llm-color-bg: oklch(0.145 0 0);
  --llm-color-surface: oklch(0.2 0 0);
  --llm-color-text: oklch(0.985 0 0);
  --llm-color-text-muted: oklch(0.708 0 0);
  --llm-color-border: oklch(1 0 0 / 10%);
  --llm-color-primary: oklch(0.922 0 0);
  --llm-color-primary-foreground: oklch(0.205 0 0);
}
```

### 遇到的问题

- 初始颜色方案不符合预期，后来参考 assistant-ui 确认使用 shadcn 的 zinc 色系

---

## Day 2: 工具链 + Storybook

### 完成内容

- 初始化 Storybook 10（`pnpm dlx storybook@latest init`）
- 配置 `.storybook/preview.ts` 主题切换 toolbar + withTheme 装饰器
- 配置 ESLint 10（flat config `eslint.config.js`）+ Prettier
- 配置 Husky + lint-staged
- 配置 tsup 打包（ESM, CJS, DTS 输出，`tsconfig.lib.json`）
- 配置 `vite.styles.config.ts` 样式单独打包
- 创建 `src/index.ts` 统一出口骨架
- 创建 `src/types/common.ts` 公共类型
- 创建 `src/utils/cn.ts` 工具函数（clsx + tailwind-merge）
- 测试框架：Vitest + Playwright（browser mode）

### 构建架构

三条独立的构建管线，均输出到 `dist/`：

1. **tsup** — 库代码 → `index.js` (ESM), `index.cjs` (CJS), `index.d.ts`
2. **Vite** — 样式 → `style.css`（入口为 `src/style.ts`）
3. **Vite** — 仅开发服务器 + Vitest 配置

### Storybook 主题切换

```ts
// .storybook/preview.ts
import type { Preview, StoryContext } from '@storybook/react-vite'
import '../src/index.css'

const withTheme = (Story: () => React.JSX.Element, context: StoryContext) => {
  const theme = context.globals.theme ?? 'light'
  document.documentElement.setAttribute('data-theme', theme)
  return Story()
}

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      name: 'Theme',
      description: '切换',
      defaultValue: 'light',
      toolbar: {
        icon: 'sun',
        dynamicTitle: true,
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
      },
    },
  },
  // ...
}
export default preview
```

### cn() 工具函数

```ts
// src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 遇到的问题

- Storybook 10 不支持 `dynamicIcon` 属性 → 移除
- 装饰器返回类型不匹配 → 改为 `React.JSX.Element`
- `@storybook/react` 模块找不到 → Storybook 10 使用 `@storybook/react-vite`
- 测试框架选择：Vitest + Playwright 替代 Jest，更主流且与 Storybook 10 原生集成

---

## Day 3: ConfigProvider

### 完成内容

- 创建 ConfigProvider 组件（React Context 管理全局配置）
- 主题 token 注入（CSS Variables 动态切换）
- 深浅色模式切换 + 系统偏好检测
- 国际化 i18n 基础框架（Locale 对象方案）
- 组件全局默认参数注入（components prop）
- 创建 useConfig, useLocale, useTheme hooks
- 更新 CSS 变量为 oklch 格式（对齐 shadcn zinc 色系）
- 扩充颜色令牌（secondary, accent, destructive, muted, ring, input, code）
- 更新字体为 Galaxie Copernicus 风格（衬线体，参考 Claude）

### ConfigProvider 组件

```tsx
// src/components/config-provider/ConfigProvider.tsx
import {
  type ConfigContextValue,
  type ConfigProviderProps,
} from '../../types/config'
import { createContext, useState } from 'react'
import zhCN from '../../locale/zh-CN'
import enUS from '../../locale/en-US'

export const configContext = createContext<ConfigContextValue | undefined>(
  undefined,
)

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
```

### 类型定义

```ts
// src/types/config.ts
import type { ReactNode } from 'react'
import type { Locale } from '../locale/type'

export interface ConfigProviderProps {
  theme?: { mode?: 'light' | 'dark' | 'system'; primaryColor?: string }
  locale?: 'zh-CN' | 'en-US' | Locale
  components?: Record<string, Record<string, any>>
  ai?: {
    apiKey: string
    model: string
    baseURL?: string
  }
  children: ReactNode
}

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
```

### i18n 方案

采用 Ant Design 风格的 Locale 对象方案，每个组件管理自己的文案：

```ts
// src/locale/type.ts
export interface Locale {
  think: {
    loading: string
    done: string
  }
  sender: {
    placeholder: string
    send: string
  }
}
```

```ts
// src/locale/zh-CN.ts
import type { Locale } from './type'

const zhCN: Locale = {
  think: {
    loading: '思考中...',
    done: '已完成',
  },
  sender: {
    placeholder: '输入消息...',
    send: '发送',
  },
}

export default zhCN
```

### Hooks

```ts
// src/hooks/useConfig.ts
import { useContext } from 'react'
import { configContext } from '../components/config-provider/ConfigProvider'

export function useConfig() {
  const context = useContext(configContext)
  if (!context) {
    throw new Error('useConfig 必须在 ConfigProvider 内部使用')
  }
  return context
}
```

```ts
// src/hooks/useLocale.ts
import { useConfig } from './useConfig'

export function useLocale() {
  const context = useConfig()
  return context.locale
}
```

```ts
// src/hooks/useTheme.ts
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
```

### 颜色令牌扩充

对齐 shadcn v4 的 zinc 色系，新增 8 个语义：

| 变量 | 用途 |
|---|---|
| `--llm-color-secondary` / `secondary-foreground` | 次要操作 |
| `--llm-color-muted` / `muted-foreground` | 浅灰背景、禁用态 |
| `--llm-color-accent` / `accent-foreground` | 悬浮/选中高亮 |
| `--llm-color-destructive` / `destructive-foreground` | 错误/危险操作 |
| `--llm-color-input` | 输入框边框 |
| `--llm-color-ring` | focus 聚焦环 |
| `--llm-color-code` / `code-foreground` | 代码块 |

### 遇到的问题

- `exactOptionalPropertyTypes` 报错 → 使用 `...(ai && { ai })` 条件展开
- `useState(theme)` 类型不匹配 → 给 useState 传默认值对象
- `setTheme` 类型与 `setThemeState` 不兼容 → 包一层函数支持部分更新
- locale 目录缺少 index.ts → 改为直接导入文件路径
- 字体从 Inter 改为 Galaxie Copernicus（参考 Claude/Anthropic 设计风格）

---

## 累计产出

### 目录结构

```
src/
├── components/
│   └── config-provider/
│       ├── ConfigProvider.tsx
│       └── ConfigProvider.stories.tsx
├── hooks/
│   ├── useConfig.ts
│   ├── useLocale.ts
│   └── useTheme.ts
├── locale/
│   ├── type.ts
│   ├── zh-CN.ts
│   └── en-US.ts
├── styles/
│   ├── tokens.css
│   └── themes/
│       ├── light.css
│       └── dark.css
├── types/
│   ├── common.ts
│   └── config.ts
└── utils/
    └── cn.ts
```

### 关键决策

1. **主题切换**：`data-theme` 属性选择器，非 class
2. **颜色空间**：oklch（对齐 shadcn v4）
3. **字体**：Galaxie Copernicus 衬线体（参考 Claude 风格）
4. **i18n**：Ant Design 风格 Locale 对象，组件自管文案
5. **状态管理**：React Context + useState，setTheme 支持部分更新
6. **组件模式**：Headless (Primitive) + Styled 双层
