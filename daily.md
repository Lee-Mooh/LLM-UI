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
    'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'Cascadia Code', Consolas,
    monospace;

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
  components,
}: ConfigProviderProps) {
  const [themeState, setThemeState] = useState({
    mode: theme?.mode ?? 'system',
    primaryColor: theme?.primaryColor ?? 'oklch(0.205 0 0)',
  })

  const setTheme = (newTheme: {
    mode?: 'light' | 'dark' | 'system'
    primaryColor?: string
  }) => {
    setThemeState((prev) => ({ ...prev, ...newTheme }))
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
  setTheme: (theme: {
    mode?: 'light' | 'dark' | 'system'
    primaryColor?: string
  }) => void
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

| 变量                                                 | 用途             |
| ---------------------------------------------------- | ---------------- |
| `--llm-color-secondary` / `secondary-foreground`     | 次要操作         |
| `--llm-color-muted` / `muted-foreground`             | 浅灰背景、禁用态 |
| `--llm-color-accent` / `accent-foreground`           | 悬浮/选中高亮    |
| `--llm-color-destructive` / `destructive-foreground` | 错误/危险操作    |
| `--llm-color-input`                                  | 输入框边框       |
| `--llm-color-ring`                                   | focus 聚焦环     |
| `--llm-color-code` / `code-foreground`               | 代码块           |

### 遇到的问题

- `exactOptionalPropertyTypes` 报错 → 使用 `...(ai && { ai })` 条件展开
- `useState(theme)` 类型不匹配 → 给 useState 传默认值对象
- `setTheme` 类型与 `setThemeState` 不兼容 → 包一层函数支持部分更新
- locale 目录缺少 index.ts → 改为直接导入文件路径
- 字体从 Inter 改为 Galaxie Copernicus（参考 Claude/Anthropic 设计风格）

---

## Day 4: 流式输出核心

### 完成内容

- 创建 `src/hooks/useStream.ts` — 流式输出核心 hook
- 创建 `src/utils/stream.ts` — 流处理工具函数
- 创建 `src/utils/markdown.ts` — Markdown 流式安全解析

### useStream hook

管理流式输出的完整生命周期：idle → streaming → complete/error

```ts
// src/hooks/useStream.ts
import { useState, useRef, useCallback } from 'react'

export function useStream() {
  const [state, setState] = useState<
    'idle' | 'streaming' | 'error' | 'complete'
  >('idle')
  const [content, setContent] = useState('')
  const abortRef = useRef(new AbortController())

  const start = useCallback(async (generator: AsyncGenerator<string>) => {
    abortRef.current = new AbortController()
    setState('streaming')
    setContent('')
    try {
      for await (const token of generator) {
        if (abortRef.current.signal.aborted) break
        setContent((prev) => prev + token)
      }
      if (!abortRef.current.signal.aborted) {
        setState('complete')
      }
    } catch {
      setState('error')
    }
  }, [])

  const cancel = useCallback(() => {
    abortRef.current.abort()
    setState('idle')
  }, [])

  return { content, state, start, cancel }
}
```

关键设计：

- **AbortController** 存在 useRef 里（变化不需要触发重渲染）
- **for await...of** 自动等待 async generator 的下一个 token
- **signal.aborted 检查** — 取消时中断循环，不触发 complete
- **start 前清空 content** — 重新开始不会追加旧内容

### 流处理工具

```ts
// src/utils/stream.ts

// ReadableStream 转 async generator（fetch 返回的流转为可遍历的 generator）
export async function* streamToGenerator(
  stream: ReadableStream<Uint8Array>,
  encoding: string = 'utf-8',
): AsyncGenerator<string> {
  const reader = stream.getReader()
  const decoder = new TextDecoder(encoding)
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      yield decoder.decode(value, { stream: true })
    }
  } finally {
    reader.releaseLock()
  }
}

// async generator 转 ReadableStream（反向转换）
export function generatorToStream(
  gen: AsyncGenerator<string>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await gen.next()
      if (done) {
        controller.close()
      } else {
        controller.enqueue(encoder.encode(value))
      }
    },
  })
}

// 模拟流式输出，用于测试和 Storybook
export async function* mockStream(
  text: string,
  delay: number = 50,
): AsyncGenerator<string> {
  for (const char of text) {
    yield char
    await new Promise((resolve) => setTimeout(resolve, delay))
  }
}
```

### Markdown 流式安全解析

流式输出时 Markdown 经常不完整（代码块未闭合），需要在渲染前临时补全：

````ts
// src/utils/markdown.ts
export function sanitizeMarkdown(content: string): string {
  // 处理未闭合的代码块 ```
  const codeBlockCount = (content.match(/```/g) || []).length
  if (codeBlockCount % 2 !== 0) {
    content += '```'
  }

  // 处理未闭合的行内代码 `
  const stripped = content.replace(/```/g, '')
  const inlineCount = (stripped.match(/`/g) || []).length
  if (inlineCount % 2 !== 0) {
    content += '`'
  }

  return content
}
````

### 遇到的问题

- `for await (const token of content)` 误写 → 应遍历 generator 而非 content
- `prev += token` 修改了参数 → 改为 `prev + token`
- useCallback 使用场景理解（防止函数引用变化触发 useEffect）
- useRef vs useState 存储 AbortController（不需要触发重渲染的值用 useRef）
- ReadableStream 的 `pull` 回调机制理解

---

## Day 5: Bubble 对话气泡

### 完成内容

- 创建 `src/components/bubble/BubblePrimitive.tsx` — Headless 层
- 创建 `src/components/bubble/Bubble.tsx` — Styled 层
- 创建 `src/components/bubble/Bubble.stories.tsx` — Storybook 文档示例
- 在 `src/index.ts` 导出 Bubble、BubblePrimitive 及其类型
- 支持 `user / assistant / system` 三种角色
- 支持头像插槽、时间戳、消息状态、加载状态、自定义 children
- 使用 `data-slot` 作为 Styled 层稳定选择器，同时保留 BEM 类名供外部覆盖
- 参考 assistant-ui / shadcn 风格调整视觉：user 为右侧柔和气泡，assistant/system 为无气泡文本

### BubblePrimitive 结构

```tsx
<div className="llm-bubble" data-role={role} data-status={status}>
  <div className="llm-bubble__avatar" data-slot="bubble-avatar" />
  <div className="llm-bubble__body" data-slot="bubble-body">
    <div className="llm-bubble__content" data-slot="bubble-content" />
    <div className="llm-bubble__meta" data-slot="bubble-meta" />
  </div>
</div>
```

关键设计：

- `className="llm-bubble__content"`：对外结构类名，符合项目 BEM 规范
- `data-slot="bubble-content"`：内部样式定位点，参考 shadcn 的 slot 写法
- `children ?? content`：支持纯文本和自定义内容插槽
- `content?: string`：允许只通过 children 渲染内容

### Bubble 样式策略

Styled 层通过 Tailwind 子选择器集中控制 Primitive 内部结构：

```tsx
'[&_[data-slot=bubble-content]]:rounded-2xl'
'[&_[data-slot=bubble-content]]:px-4'
'[&_[data-slot=bubble-content]]:py-2.5'
```

角色差异：

| role      | 样式策略                                                      |
| --------- | ------------------------------------------------------------- |
| user      | 靠右，柔和 `accent` 气泡，避免 primary 在深浅色主题中过于刺眼 |
| assistant | 靠左，无气泡背景，作为正文回复展示                            |
| system    | 居中，小号 muted 文本，无气泡背景                             |

### Storybook 覆盖

`Bubble.stories.tsx` 已覆盖：

- `User`
- `Assistant`
- `System`
- `Sending`
- `Sent`
- `Error`
- `Loading`
- `CustomAvatar`

### 验证结果

- `pnpm exec tsc --noEmit -p tsconfig.app.json` ✅
- `pnpm lint` ✅
- `pnpm build` ✅

### 顺手修复

- `ConfigProvider` 的 `configContext` 移到 `configContext.ts`，解决 `react-refresh/only-export-components`
- `ConfigProvider` 类型中的 `any` 改为 `unknown`
- `streamToGenerator` 改用 `finally` 释放 reader lock，解决未使用 `error` 变量问题
- `BubbleProps` 从空接口改为类型别名，解决 `no-empty-object-type`

### 遇到的问题

- Tailwind arbitrary variant 选择 `.llm-bubble__content` 时样式未稳定生效 → 改用 `data-slot` 选择器
- 初始 user 气泡使用 `primary`，在浅色/深色主题下对比过强 → 改用 `accent`
- assistant-ui 官网实际效果中 assistant/system 不一定使用气泡 → 调整为 user 有气泡，assistant/system 无气泡

---

## Day 6: Mark 流式 Markdown 渲染

### 完成内容

- 创建 `src/components/mark/Mark.tsx` — Markdown 渲染组件
- 创建 `src/components/mark/Mark.stories.tsx` — Storybook 示例
- 在 `src/index.ts` 导出 `Mark` 和 `MarkProps`
- 安装 Markdown 渲染依赖：`react-markdown`, `remark-gfm`, `rehype-highlight`, `highlight.js`
- 支持 GFM 语法：表格、任务列表、删除线、链接、列表
- 支持图片懒加载：Markdown 图片统一添加 `loading="lazy"`
- 支持基础代码块渲染与语法高亮
- 通过 `useStream + mockStream` 增加流式 Markdown Story
- 补充 `.llm-mark` 基础排版样式：标题、段落、列表、引用、表格、行内代码、代码块、图片
- 明确不做 `maxLength` 正文折叠，避免破坏主流 AI Chat 的连续阅读体验

### Mark 组件

```tsx
export interface MarkProps {
  content: string
  streaming?: boolean
  onComplete?: () => void
  codeHighlight?: boolean
  className?: string
}
```

核心渲染链路：

```txt
Markdown 字符串
  → react-markdown
  → remark-gfm 扩展 GFM 语法
  → rehype-highlight 处理代码高亮 class
  → React DOM
```

关键设计：

- `Mark` 只接收 `content` 并负责渲染，不在组件内部管理流式状态
- 流式累积由 `useStream` 负责，`Mark` 只响应 `content` 的变化重新渲染
- `codeHighlight` 先作为基础开关保留，Day 7 的 `CodeHighlighter` 会接管更完整的代码块体验
- 图片使用自定义 `img` renderer 添加 `loading="lazy"`

### Storybook 覆盖

`Mark.stories.tsx` 已覆盖：

- `Basic`：标题、段落、加粗、斜体、删除线、链接、引用、列表、任务列表、表格、代码块、图片
- `Streaming`：使用 `mockStream` 模拟模型逐字输出，并通过 `useStream` 累积后传给 `Mark`

### 样式策略

`.llm-mark` 样式集中写在 `src/index.css`，只影响 Mark 内部 Markdown，不污染全局标签：

- 标题使用更紧凑的层级字号和上下间距
- 段落、列表、引用、表格、代码块统一块级间距
- 表格使用 `border-collapse` 和主题 border token
- 行内代码使用 `:not(pre) > code` 区分代码块与 inline code
- 代码块先保留基础圆角、边框、横向滚动和 monospace 字体
- 图片限制 `max-width: 100%`，避免撑破消息容器

### 技术决策

- 不直接引入 assistant-ui 的 Markdown/Streamdown 实现，保持组件库独立
- 学习 assistant-ui 的分层思路：`Mark` 负责 Markdown，Day 7 的 `CodeHighlighter` 负责代码块增强
- 暂时使用 `rehype-highlight + highlight.js` 做基础高亮，Day 7 计划切换到 `react-shiki / Shiki`

### 验证结果

- `pnpm lint` ✅
- `pnpm build` ✅

### 遇到的问题

- `maxLength` 与主流 ChatGPT/Gemini 阅读体验不一致 → 移除该能力规划
- `rehype-highlight` 只添加高亮 class，不自带完整视觉体验 → 后续由 `CodeHighlighter` 统一处理
- 流式 Markdown 示例中模板字符串缩进会影响 Markdown 解析 → 去掉多余缩进
- Story 中组件名与 Story 导出同名会冲突 → 使用 `Basic` / `Streaming` 命名

---

## Day 7: CodeHighlighter 代码高亮

### 完成内容

- 创建 `src/components/code-highlighter/CodeHighlighter.tsx` — Shiki 代码高亮组件
- 创建 `src/components/code-highlighter/CodeHighlighter.stories.tsx` — Storybook 示例
- 在 `src/index.ts` 导出 `CodeHighlighter` 和 `CodeHighlighterProps`
- 安装 `react-shiki`，移除 Day 6 临时方案 `rehype-highlight` / `highlight.js`
- 将 `Mark` 的 fenced code block 接入 `CodeHighlighter`，Markdown 代码块统一走高亮组件
- 支持语言 label 显示、代码图标、复制图标、复制成功 check 状态
- 支持 light / dark 双主题，跟随 `data-theme` 与 `color-scheme` 切换
- 支持长代码横向滚动
- 支持可选行号显示：`showLineNumbers` / `startingLineNumber`
- 补充代码块专用主题 token：`code-muted`、`code-border`、`code-hover`

### CodeHighlighter 组件

```tsx
export interface CodeHighlighterProps {
  code: string
  copyable?: boolean
  language?: string
  showLineNumbers?: boolean
  startingLineNumber?: number
  className?: string
}
```

核心结构分成 header 和 body 两层：

```tsx
<div className="llm-code-highlighter">
  <div className="llm-code-highlighter__header">
    <div className="llm-code-highlighter__title">
      <CodeIcon />
      <span className="llm-code-highlighter__language">{languageLabel}</span>
    </div>
    <button className="llm-code-highlighter__copy" />
  </div>

  <div className="llm-code-highlighter__body">
    <ShikiHighlighter />
  </div>
</div>
```

关键设计：

- `getLanguageLabel()` 将 `tsx`、`py`、`bash` 等代码 fence 语言名转为更适合展示的 label
- `copyable` 默认为 `true`，复制按钮使用 icon-only button，并通过 `aria-label` 表达状态
- `copied` 状态复制成功后切换为 check icon，`useEffect` 在 1.5s 后恢复
- `addDefaultStyles={false}` 禁用 `react-shiki` 默认 padding，避免和组件库自己的代码块间距叠加
- `showLanguage={false}` 关闭 Shiki 内置语言标识，统一使用自定义 header
- `theme={{ light: 'github-light', dark: 'github-dark' }}` 配合根节点 `color-scheme` 做深浅色切换

### Mark 集成方式

Day 6 的 `rehype-highlight` 被移除，`Mark` 现在拦截 `react-markdown` 生成的 `pre` 节点：

```tsx
function getCodeLanguage(className?: string) {
  return className?.match(/language-([\w-]+)/)?.[1] ?? 'text'
}

function getCodeContent(children: ReactNode) {
  return String(children ?? '').replace(/\n$/, '')
}

function isCodeElement(
  node: ReactNode,
): node is ReactElement<CodeElementProps> {
  return isValidElement<CodeElementProps>(node)
}
```

Markdown 代码块大致会被解析成：

```html
<pre>
  <code class="language-python">...</code>
</pre>
```

因此 `pre` renderer 中读取 `children.props.className` 得到语言，读取 `children.props.children` 得到代码内容，再交给 `CodeHighlighter`：

```tsx
<CodeHighlighter
  code={getCodeContent(children.props.children)}
  language={getCodeLanguage(children.props.className)}
/>
```

这样 `Mark` 仍然负责 Markdown 解析，代码块的视觉和交互统一由 `CodeHighlighter` 负责。

### 样式策略

代码块样式集中写在 `src/index.css`，沿用项目的 BEM 命名和 `--llm-` token：

```css
.llm-code-highlighter {
  overflow: hidden;
  border: 1px solid var(--llm-color-code-border);
  border-radius: 28px;
  color: var(--llm-color-code-foreground);
  background: var(--llm-color-code);
}
```

长代码横向滚动由外层 body 负责：

```css
.llm-code-highlighter__body {
  overflow-x: auto;
}

.llm-code-highlighter__body pre {
  min-width: max-content;
  overflow: visible;
}
```

含义是：外层 `.llm-code-highlighter__body` 是唯一滚动容器，内层 `pre` 按代码真实宽度撑开，超出后横向滚动，避免 `body` 和 `pre` 双层滚动。

行号使用 `react-shiki` 生成的 `.rs-has-line-numbers` / `.rs-line-number` 结构，再由项目 CSS 自己定义 counter 样式：

```css
.llm-code-highlighter__body .rs-has-line-numbers {
  counter-reset: line-number calc(var(--line-start, 1) - 1);
}

.llm-code-highlighter__body .rs-line-number::before {
  counter-increment: line-number;
  content: counter(line-number);
  min-width: var(--rs-line-numbers-width);
  justify-content: flex-end;
  color: var(--rs-line-numbers-foreground);
}
```

这样不需要手动 `code.split('\n')`，也不会破坏 Shiki 生成的语法高亮结构。

### Storybook 覆盖

`CodeHighlighter.stories.tsx` 已覆盖：

- `Example`：Python 基础函数示例
- `LongCode`：长 Python 代码，验证横向滚动
- `WithLineNumbers`：长 Python 代码 + 行号显示

### 技术决策

- 使用 `react-shiki` 替换 `rehype-highlight`：Shiki 基于 TextMate grammar，视觉效果更接近主流编辑器和 AI Chat 代码块
- 不做展开/收起：当前组件优先覆盖主流 ChatGPT/Gemini 代码块的核心体验，长代码先通过横向滚动解决
- 不保留 `codeHighlight` 开关：代码块作为 AI Chat 基础能力，统一高亮，不暴露关闭分支
- 不引入图片资源做 copy/check：直接使用内联 SVG，避免新增静态资源管理和打包路径问题

### 验证结果

- `pnpm build` ✅

### 遇到的问题

- `react-shiki` 默认样式会给 `pre` 添加 padding → 使用 `addDefaultStyles={false}`，由组件库 CSS 统一控制间距
- Shiki 默认可显示语言标识 → 使用 `showLanguage={false}`，避免 body 内出现第二个语言 badge
- 浅色主题下固定暗色 Shiki 主题可读性差 → 改为 light/dark 双主题，并给根节点补 `color-scheme`
- 行号依赖 `react-shiki` 的 CSS class，但默认 CSS 被禁用 → 自己补 `.rs-line-number` counter 样式

---

## Day 8: Sender 输入框

### 完成内容

- 创建 `src/components/sender/Sender.tsx` — Chat 输入框组件
- 创建 `src/components/sender/Sender.stories.tsx` — Storybook 示例
- 在 `src/index.ts` 导出 `Sender` 和 `SenderProps`
- 支持多行 textarea 输入，内容变化时自动调整高度
- 移除最大字数限制，避免限制长上下文输入
- 支持 Enter 发送、Shift+Enter 换行
- 支持 loading 状态下切换为停止按钮，并通过 `onCancel` 回调取消
- 支持左侧快捷操作菜单：上传附件、添加图片、联网搜索、深度思考
- 支持右侧模型切换菜单，并在点击菜单外区域时自动收起
- 支持 `prefix` / `suffix` 插槽自定义底部工具区
- 将模型切换按钮与下拉项字体切换为 `PingFang SC`

### Sender 组件

```tsx
export interface SenderProps {
  onSend?: (message: string) => void
  onCancel?: () => void
  onPrefixAction?: (action: SenderPrefixAction) => void
  onModelChange?: (model: string) => void
  onVoiceClick?: () => void
  loading?: boolean
  disabled?: boolean
  placeholder?: string
  model?: string
  modelOptions?: SenderModelOption[]
  prefix?: ReactNode
  suffix?: ReactNode
  className?: string
}
```

核心交互：

- `message.trim()` 为空时禁用发送按钮
- `loading` 为 true 时发送按钮切换为停止按钮
- `onSend` 只在消息非空且非禁用、非加载状态下触发
- 发送后清空输入内容
- `modelOptions` 默认提供 GPT-4o、Claude Sonnet 4、Gemini 2.5 Pro、DeepSeek R1

### 自动高度

textarea 使用 `useRef` 获取 DOM，在 `message` 变化后重算高度：

```tsx
useEffect(() => {
  const textarea = textareaRef.current

  if (!textarea) return

  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}, [message])
```

先重置为 `auto`，再设置为 `scrollHeight`，这样新增内容时会增高，删除内容时也能回缩。

### 菜单外点击收起

上传菜单和模型菜单分别使用 ref 指向菜单容器，文档级 `pointerdown` 事件判断点击目标是否在菜单内部：

```tsx
if (!prefixMenuRef.current?.contains(target)) {
  setPrefixMenuOpen(false)
}

if (!modelMenuRef.current?.contains(target)) {
  setModelMenuOpen(false)
}
```

这样点击按钮或菜单项时保持当前菜单交互，点击 textarea、发送按钮或页面空白区域时自动关闭菜单。

### Storybook 覆盖

`Sender.stories.tsx` 已覆盖：

- `Basic`：基础输入与发送
- `WithModelSwitcher`：模型切换菜单
- `WithActions`：快捷操作与语音按钮
- `Loading`：加载中停止按钮
- `Disabled`：禁用状态
- `CustomSlots`：自定义 prefix / suffix 插槽

### 验证结果

- `pnpm lint` ✅
- `pnpm build:lib` ✅

### 遇到的问题

- 初始实现暴露了 `maxLength`，与长上下文输入场景冲突 → 移除字数限制
- 自动高度不能只依赖 `rows` → 通过 `scrollHeight` 主动同步高度
- 菜单初始只能再次点击按钮关闭 → 增加菜单外点击收起
- 模型切换最初误调整了字号/字重 → 改为真正切换 `font-family`

---

## Day 9: Think 思考过程 + Notification 通知

### 完成内容

- 创建 `src/components/think/ThinkPrimitive.tsx` — 思考过程 Headless 层
- 创建 `src/components/think/Think.tsx` — Think Styled 层
- 创建 `src/components/think/Think.stories.tsx` — Storybook 示例
- 创建 `src/components/notification/NotificationPrimitive.tsx` — 单条通知 Primitive
- 创建 `src/components/notification/Notification.tsx` — Notification / NotificationStack Styled 层
- 创建 `src/components/notification/Notification.stories.tsx` — Storybook 示例
- 支持 Think 的折叠 / 展开、`thinking / done` 状态、自定义文案、默认占位内容
- 支持 Notification 的 `success / error / loading` 状态、自动关闭、手动关闭、进度条、堆叠展示
- 将 Bubble 样式从 TSX Tailwind utility 迁移到 `src/index.css` 的 BEM 样式
- 统一组件架构，将 Mark、CodeHighlighter、Sender、Think 拆分为 `Primitive + Styled` 双层
- 更新 `CLAUDE.md`，明确后续组件必须遵循 Primitive + Styled + BEM CSS 的组织方式

### Think 组件

```tsx
export interface ThinkPrimitiveProps {
  content?: string
  status?: 'thinking' | 'done'
  label?: string
  defaultOpen?: boolean
  className?: string
  style?: CSSProperties
}
```

核心结构：

```tsx
<section
  className={className}
  data-open={open ? '' : undefined}
  data-status={status}
>
  <button className="llm-think__header" aria-expanded={open}>
    <span className="llm-think__title">
      <SparkIcon />
      <span>{title}</span>
      {status === 'thinking' ? <ThinkingDots /> : null}
    </span>
    <ChevronIcon />
  </button>

  <div className="llm-think__content" hidden={!open}>
    <div className="llm-think__text">{content}</div>
  </div>
</section>
```

关键设计：

- `ThinkPrimitive` 管理展开状态、状态文案、图标和结构
- `Think` 只负责 `cn('llm-think', className)`，默认视觉在 `src/index.css`
- 使用 `data-open` 控制箭头旋转，使用 `data-status='thinking'` 控制图标 pulse 动画
- thinking dots 使用 CSS keyframes 做三个点的节奏动画

### Notification 组件

```tsx
export type NotificationType = 'success' | 'error' | 'loading'

export interface NotificationPrimitiveProps {
  type?: NotificationType
  title?: ReactNode
  description?: ReactNode
  duration?: number
  showProgress?: boolean
  closeable?: boolean
  icon?: ReactNode
  onClose?: () => void
  className?: string
  style?: CSSProperties
}
```

核心结构：

```tsx
<section
  className={className}
  data-type={type}
  role={type === 'error' ? 'alert' : 'status'}
>
  <div className="llm-notification__icon" />
  <div className="llm-notification__body">
    <div className="llm-notification__title" />
    <div className="llm-notification__description" />
  </div>
  <button className="llm-notification__close" />
  <div className="llm-notification__progress" />
</section>
```

关键设计：

- `NotificationPrimitive` 管理自动关闭、ARIA、默认图标、关闭按钮和进度条
- `Notification` 只负责 `cn('llm-notification', className)`
- `NotificationStack` 接收通知数组，统一右上角 fixed 堆叠
- 状态色通过局部变量 `--llm-notification-color` 控制，success 使用明确绿色，error 使用 destructive token，loading 使用 primary token
- 外层 stack 使用 `pointer-events: none`，单条通知使用 `pointer-events: auto`，避免空白区域挡住页面交互

### 组件架构统一

Day 9 后，视觉组件统一为：

```txt
ComponentPrimitive.tsx  // 结构、状态、行为、ARIA、data-*、子元素 BEM class
Component.tsx           // Styled 包装层，只合并 llm-* 根类和 className
src/index.css           // 默认视觉样式，使用 BEM + CSS Variables
```

已完成拆分：

- `BubblePrimitive` / `Bubble`
- `MarkPrimitive` / `Mark`
- `CodeHighlighterPrimitive` / `CodeHighlighter`
- `SenderPrimitive` / `Sender`
- `ThinkPrimitive` / `Think`
- `NotificationPrimitive` / `Notification`

### Storybook 覆盖

`Think.stories.tsx` 已覆盖：

- `Thinking`
- `Done`
- `Collapsed`
- `CustomLabel`
- `EmptyContent`

`Notification.stories.tsx` 已覆盖：

- `Success`
- `Error`
- `Loading`
- `WithoutProgress`
- `Stack`

### 验证结果

- `pnpm lint` ✅
- `pnpm build` ✅

### 遇到的问题

- Day 9 初始方向误以为是 Chat/Conversation，读取 `plan.md` 后确认 Day 9 实际为 Think + Notification
- Notification success 边框初版在暗色主题下偏棕/橙 → 改为主要使用 success 状态色自身，不再混入默认 border
- Bubble 早期样式写在 `Bubble.tsx` 大段 Tailwind className 中，与组件库式 BEM CSS 组织不一致 → 迁移到 `src/index.css`
- 为统一后续开发规范，将 Primitive + Styled 的职责写入 `CLAUDE.md`

---

## Day 10: Conversation 会话组件

### 完成内容

- 创建 `src/components/conversation/ConversationItemPrimitive.tsx` — 单条会话 Primitive 层
- 创建 `src/components/conversation/ConversationItem.tsx` — 单条会话 Styled 层
- 创建 `src/components/conversation/ConversationListPrimitive.tsx` — 会话侧边栏 Primitive 层
- 创建 `src/components/conversation/ConversationList.tsx` — 会话侧边栏 Styled 层
- 创建 `src/components/conversation/ConversationList.stories.tsx` — Storybook 交互示例
- 在 `src/index.ts` 导出 Conversation 组件、Primitive 和类型
- 支持 active 会话高亮、置顶排序、收藏 / 置顶 / 删除操作、搜索、新会话、侧边栏折叠
- 会话项默认只展示标题和时间，不展示头像和消息预览，保持紧凑胶囊形态
- 置顶 / 收藏状态使用 SVG 图标展示，点击图标可直接取消对应状态
- 三点菜单使用浮层覆盖在卡片右侧，点击页面空白区域自动关闭
- 右上角搜索按钮默认只显示图标，点击后展开搜索框
- Storybook 示例支持真实交互：切换 active、新建会话、置顶、收藏、删除、搜索、折叠

### ConversationItem 组件

```tsx
export interface ConversationRecord {
  id: string
  title: string
  lastMessage?: string
  timestamp?: Date | string
  pinned?: boolean
  favorite?: boolean
}

export interface ConversationItemPrimitiveProps {
  conversation: ConversationRecord
  active?: boolean
  onSelect?: (id: string) => void
  onDelete?: (id: string) => void
  onPin?: (id: string) => void
  onFavorite?: (id: string) => void
  className?: string
  style?: CSSProperties
}
```

核心结构：

```tsx
<article className={className} data-active={active ? '' : undefined}>
  <button
    className="llm-conversation-item__main"
    aria-current={active ? 'true' : undefined}
  >
    <span className="llm-conversation-item__content">
      <span className="llm-conversation-item__header">
        <span className="llm-conversation-item__title">
          {conversation.title}
        </span>
        <span className="llm-conversation-item__time">{timestamp}</span>
      </span>
    </span>
  </button>

  <div className="llm-conversation-item__actions">
    <button
      className="llm-conversation-item__status-button"
      aria-label="取消置顶"
    />
    <button
      className="llm-conversation-item__status-button"
      aria-label="取消收藏"
    />
    <button
      className="llm-conversation-item__menu-trigger"
      aria-expanded={menuOpen}
    />
    <div className="llm-conversation-item__menu" role="menu" />
  </div>
</article>
```

关键设计：

- `ConversationItemPrimitive` 管理三点菜单展开状态、外部点击关闭、菜单操作和 ARIA
- `ConversationItem` 只负责 `cn('llm-conversation-item', className)`，默认视觉在 `src/index.css`
- 使用 `data-active`、`data-pinned`、`data-favorite` 暴露状态，便于 CSS 和外部覆盖
- 会话项本体是 button，点击后通过 `onSelect(id)` 抛出选择事件
- 已置顶 / 已收藏图标放在右侧操作区，点击图标直接触发 `onPin(id)` / `onFavorite(id)` 取消状态
- `lastMessage` 不默认渲染，但保留在数据结构中用于搜索匹配

### ConversationList 组件

```tsx
export interface ConversationListPrimitiveProps {
  conversations: ConversationRecord[]
  activeId?: string
  onSelect?: (id: string) => void
  onDelete?: (id: string) => void
  onPin?: (id: string) => void
  onFavorite?: (id: string) => void
  onCollapsedChange?: (collapsed: boolean) => void
  onNewConversation?: () => void
  collapsed?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  title?: ReactNode
  emptyText?: ReactNode
  className?: string
  style?: CSSProperties
}
```

核心结构：

```tsx
<aside className={className} data-collapsed={collapsed ? '' : undefined}>
  <div className="llm-conversation-list__header">
    <div className="llm-conversation-list__toolbar">
      <button
        className="llm-conversation-list__icon-button"
        aria-label="关闭边栏"
      />
      <div className="llm-conversation-list__toolbar-actions">
        <button
          className="llm-conversation-list__icon-button"
          aria-label="搜索会话"
        />
        <button
          className="llm-conversation-list__icon-button"
          aria-label="打开新聊天"
        />
      </div>
    </div>
    <label className="llm-conversation-list__search" />
  </div>

  <div className="llm-conversation-list__body">
    <div className="llm-conversation-list__items" role="list">
      <ConversationItem />
    </div>
  </div>
</aside>
```

关键设计：

- `ConversationListPrimitive` 管理搜索框展开状态和搜索关键词
- `collapsed` 由外部控制，组件通过 `onCollapsedChange(nextCollapsed)` 抛出折叠变化
- 新会话按钮只触发 `onNewConversation`，不在组件内部创建业务数据
- 搜索匹配 `title` 和 `lastMessage`，即使消息预览不展示，仍可参与检索
- 置顶排序规则：pinned 会话在前，同组内保持原始顺序
- 默认不展示“历史会话”标题，只有外部显式传入 `title` 时才渲染
- 取消拖拽缩放能力，侧边栏使用固定细长宽度，避免增加复杂布局状态

### 样式策略

Conversation 样式集中写在 `src/index.css`，使用 BEM 和 `--llm-*` token：

```css
.llm-conversation-list {
}
.llm-conversation-list__header {
}
.llm-conversation-list__toolbar {
}
.llm-conversation-list__toolbar-actions {
}
.llm-conversation-list__icon-button {
}
.llm-conversation-list__search {
}
.llm-conversation-list__body {
}
.llm-conversation-list__items {
}
.llm-conversation-list__empty {
}

.llm-conversation-item {
}
.llm-conversation-item__main {
}
.llm-conversation-item__content {
}
.llm-conversation-item__header {
}
.llm-conversation-item__title {
}
.llm-conversation-item__time {
}
.llm-conversation-item__actions {
}
.llm-conversation-item__status-button {
}
.llm-conversation-item__menu-trigger {
}
.llm-conversation-item__menu {
}
.llm-conversation-item__menu-item {
}
```

视觉方向：

- 侧边栏默认 `280px × 560px`，整体更细长
- Storybook 装饰器去掉外层 padding，让组件与四周贴边展示
- header 和 body 之间没有分割线
- 会话项使用单行紧凑胶囊，只展示标题和时间
- hover 背景加在整条 item 上，左侧内容和右侧按钮区连续高亮
- active 状态使用 primary tint 和内描边
- 三点菜单绝对定位在卡片右侧浮层，不撑开列表项高度

### Storybook 覆盖

`ConversationList.stories.tsx` 已覆盖：

- `Basic`：基础列表、active 高亮、搜索按钮
- `Searchable`：搜索框展开和过滤
- `WithActions`：删除、置顶、收藏、选择
- `PinnedAndFavorite`：置顶和收藏状态展示
- `Empty`：空列表状态

Story 使用本地 state 模拟真实业务交互：

- 点击会话更新 `activeId`
- 点击 `+` 新增一条会话并设为 active
- 点击置顶 / 收藏菜单项更新会话状态
- 点击置顶 / 收藏图标可取消状态
- 点击删除从列表移除会话
- 点击折叠按钮切换 `collapsed`

### 验证结果

- `pnpm lint` ✅
- `pnpm build` ✅

### 遇到的问题

- `exactOptionalPropertyTypes` 下不能显式传递可能为 `undefined` 的可选 callback → 改用条件展开 `...(onSelect && { onSelect })`
- Story 初始只 `console.log` 回调，点击不会更新 UI → 增加 `ConversationListStory` 包装组件维护 active 和列表状态
- Storybook dev server 曾因 HMR 缓存继续引用已删除的头像 fallback → 重启 Storybook 后解决
- 生成的 `storybook-static` 被 ESLint 扫描导致 lint 报外部产物错误 → 将 `storybook-static` 加入 `eslint.config.js` ignore
- 边栏拖拽缩放增加了不必要的交互复杂度 → 根据设计反馈移除，保留固定细长布局

---

## Day 11: Prompts 提示集 + Actions 快捷操作

### 完成内容

- 创建 `src/components/actions/ActionsPrimitive.tsx` — 消息快捷操作 Primitive 层
- 创建 `src/components/actions/Actions.tsx` — Actions Styled 层
- 创建 `src/components/actions/Actions.stories.tsx` — Storybook 示例
- 创建 `src/components/prompts/PromptsPrimitive.tsx` — 提示词胶囊 Primitive 层
- 创建 `src/components/prompts/Prompts.tsx` — Prompts Styled 层
- 创建 `src/components/prompts/Prompts.stories.tsx` — Storybook 联动示例
- 在 `src/index.ts` 导出 Actions、Prompts 组件、Primitive 和类型
- Actions 支持复制、重新生成、纠错、反馈、自定义项、禁用状态、横向 / 纵向布局和尺寸配置
- Prompts 使用轻量小胶囊形态，只展示标题和可选图标，不直接展示完整 prompt 内容
- `PromptItem` 支持隐藏的 `prompt` 数据，点击胶囊后通过 `onPrompt(key, item)` 抛给外部
- Sender 增加 `value`、`defaultValue`、`onChange`，支持外部受控和 Prompts 联动填充
- Storybook 中 Prompts 示例已与 Sender 联动，点击提示词胶囊后将 prompt 填入 Sender

### Actions 组件

```tsx
export type ActionVariant = 'default' | 'primary' | 'danger'

export interface ActionItem {
  key: string
  label: string
  icon?: ReactNode
  disabled?: boolean
  variant?: ActionVariant
}

export interface ActionsPrimitiveProps {
  items: ActionItem[]
  onAction?: (key: string, item: ActionItem) => void
  copiedKey?: string
  copiedDuration?: number
  orientation?: 'horizontal' | 'vertical'
  size?: 'sm' | 'md'
  className?: string
  style?: CSSProperties
}
```

关键设计：

- `ActionsPrimitive` 管理复制状态，点击 `copiedKey` 对应操作后临时切换为完成图标和“已复制”文案
- 内置常见 action 图标：copy、regenerate / reload、edit / correct、like、dislike
- `ActionItem.icon` 可覆盖默认图标，适合业务侧扩展自定义操作
- `variant` 只表达语义色，不改变事件逻辑；具体业务由 `onAction` 接管
- `Actions` 只负责 `cn('llm-actions', className)`，默认视觉在 `src/index.css`

### Prompts 组件

```tsx
export interface PromptItem {
  key: string
  title: ReactNode
  prompt?: string
  description?: ReactNode
  category?: ReactNode
  icon?: ReactNode
  disabled?: boolean
}

export interface PromptsPrimitiveProps {
  items: PromptItem[]
  onPrompt?: (key: string, item: PromptItem) => void
  title?: ReactNode
  description?: ReactNode
  emptyText?: ReactNode
  columns?: 1 | 2 | 3
  className?: string
  style?: CSSProperties
}
```

关键设计：

- Prompts 默认只渲染可点击胶囊，不在 UI 上展示完整 prompt 文本
- 完整 prompt 作为 `PromptItem.prompt` 数据保存，点击后通过 `onPrompt` 抛给外部
- 组件自身不绑定 Sender，不直接写输入框，保持通用性；联动由业务层或 Story 组合完成
- 胶囊结构为 `icon + title`，图标可选，适合“生成图片 / 撰写或编辑 / 查找资料”等快捷入口
- 空状态使用 `emptyText` 渲染，禁用项使用原生 `disabled` 防止触发回调

### Sender 受控能力

Day 11 为了支持 Prompts 联动，Sender 补充受控输入能力：

```tsx
export interface SenderPrimitiveProps {
  value?: string
  defaultValue?: string
  onChange?: (message: string) => void
  onSend?: (message: string) => void
  // ...
}
```

关键设计：

- 未传 `value` 时继续使用内部 state，保持原有非受控用法
- 传入 `value` 时由外部控制输入内容，`onChange` 抛出输入变化
- `defaultValue` 用于初始化非受控内容，Storybook 中可配合重新挂载演示 prompt 填充
- 发送成功后统一通过 `handleMessageChange('')` 清空输入，兼容受控和非受控模式

### 样式策略

Day 11 样式继续集中写在 `src/index.css`：

```css
.llm-actions {
}
.llm-actions__item {
}
.llm-actions__icon {
}
.llm-actions__label {
}

.llm-prompts {
}
.llm-prompts__list {
}
.llm-prompts__item {
}
.llm-prompts__icon {
}
.llm-prompts__item-title {
}
.llm-prompts__empty {
}
```

视觉方向：

- Actions 使用轻量 ghost button 形态，贴合消息气泡下方操作栏
- copy 成功态使用 `data-copied` 改变图标和背景
- Prompts 使用小胶囊按钮，不使用大卡片，避免占用输入区空间
- 胶囊默认高度约 40px，图标 18px，标题 14px，更接近快捷入口而非内容卡片

### Storybook 覆盖

`Actions.stories.tsx` 已覆盖：

- `Basic`：复制、重新生成、纠错
- `Feedback`：复制、有帮助、没帮助
- `Compact`：小尺寸
- `Vertical`：纵向排列
- `Disabled`：禁用操作

`Prompts.stories.tsx` 已覆盖：

- `Basic`：Prompts + Sender 联动示例
- `WithoutIcon`：无图标胶囊
- `Disabled`：禁用提示词
- `Empty`：空状态

### 验证结果

- Storybook 手动验证 Prompts 点击后可填入 Sender ✅
- `pnpm lint` ✅
- `pnpm build` ✅

### 遇到的问题

- 初版 Prompts 做成大卡片并展示描述，与目标的小胶囊快捷入口不符 → 改为只展示标题和图标
- Prompts 初版只 `console.log`，没有真实效果 → 增加 `PromptItem.prompt` 并在 Story 中联动 Sender
- Sender 原本只有内部输入 state，外部无法写入内容 → 增加受控 / 非受控双模式
- Storybook 中受控刷新表现不明显 → 在联动示例中使用 `key + defaultValue` 确保点击 prompt 后 Sender 重新初始化并显示内容

---

## Day 12: Thought 思维链 + Citation 引用溯源

### 完成内容

- 创建 `src/components/thought/ThoughtPrimitive.tsx` — 思维链 Headless 层
- 创建 `src/components/thought/Thought.tsx` — Thought Styled 层
- 创建 `src/components/thought/Thought.stories.tsx` — Storybook 示例
- 创建 `src/components/citation/CitationPrimitive.tsx` — 引用溯源 Headless 层
- 创建 `src/components/citation/Citation.tsx` — Citation Styled 层
- 创建 `src/components/citation/Citation.stories.tsx` — Storybook 示例
- 在 `src/index.ts` 导出 Thought、Citation 组件、Primitive 和类型
- Thought 支持 `pending / loading / success / error / abort` 状态、折叠内容、可控展开和紧凑模式
- Citation 支持 `Used N sources` 折叠标题、来源列表、内联引用 hover 预览和点击回调
- 将 Thought 与 Citation 视觉统一调整为简约风格，并使用 Google 默认字体 `Arial, sans-serif`

### Thought 组件

```tsx
export type ThoughtStatus =
  | 'pending'
  | 'loading'
  | 'success'
  | 'error'
  | 'abort'

export interface ThoughtItem {
  key: string
  title: ReactNode
  content?: ReactNode
  status?: ThoughtStatus
  icon?: ReactNode | false
  collapsible?: boolean
  children?: ThoughtItem[]
}
```

关键设计：

- `ThoughtPrimitive` 管理展开状态、状态图标、ARIA 和列表结构
- `Thought` 只负责 `cn('llm-thought', className)`，默认视觉在 `src/index.css`
- 状态图标使用明确亮色：success 为绿色，error 为红色，loading 为蓝色
- 移除状态文字和额外 description，只保留标题与必要内容
- 仅 loading 项展示可展开 content，loading 标题增加呼吸动画

### Citation 组件

```tsx
export interface CitationItem {
  key: string
  title: ReactNode
  description?: ReactNode
  url?: string
  icon?: ReactNode
}
```

关键设计：

- Citation 块级形态参考 Ant Design X Sources：标题行展示 `Used N sources` 和 chevron
- 展开后只展示来源图标和来源标题，去掉卡片边框、背景、编号和描述
- 来源项使用更小字号、更小图标和更紧凑间距，hover 时切换为淡蓝链接色
- `Citation.Inline` 保留内联引用能力，可在正文中展示 `[1]` 并 hover 预览来源信息
- Storybook 示例改为 bilibili 和 GitHub 两个来源

### Storybook 覆盖

`Thought.stories.tsx` 已覆盖：

- `Basic`：Agent 执行过程
- `Compact`：紧凑模式
- `WithoutLine`：无连接线
- `Statuses`：状态图标展示
- `Empty`：空状态

`Citation.stories.tsx` 已覆盖：

- `Basic`：默认展开来源列表
- `Collapsed`：默认折叠
- `CustomTitle`：自定义标题
- `Empty`：空状态

### 验证结果

- `pnpm lint` ✅
- `pnpm build` ✅

### 遇到的问题

- 初版 Thought 信息层级过多，视觉显得冗杂 → 移除状态文字和 description，仅保留必要标题与 loading content
- 初版 Citation 做成卡片式引用列表，与目标 Sources 截图不符 → 改为透明背景、无边框、小字号的简约来源列表
- Storybook 示例最初仍使用 twitter / youtube / github → 改为 bilibili / GitHub
- Citation hover 初版只是 muted 色 → 改为淡蓝色，强化链接感

---

## Day 13: 指令级 AI 能力 + 虚拟列表

### 完成内容

- 新增 `src/hooks/useVirtualList.ts`，提供固定高度虚拟滚动能力，不引入额外依赖
- 新增 `src/components/actions/ActionsPreset.ts`，沉淀 `summary / polish / explain-code` 等 AI 快捷操作预设
- 为 Actions 补充 AI 操作默认图标，并在 Storybook 中增加 AI 快捷操作与流式总结示例
- 为 Bubble 增加 `actions` 插槽，支持在消息气泡下方组合快捷操作栏
- 为 ConversationList 增加虚拟滚动模式，支持 1000+ 会话列表的高性能滚动
- 新增 MessageList 组件，默认复用 Bubble 渲染消息，并支持自定义 `renderMessage` 与虚拟滚动
- 弱化 ConversationList / MessageList 滚动条视觉，使用透明轨道和低对比度细滚动条
- 清理 Storybook 示例中的实现说明式文案，保持示例内容更接近真实对话场景

### useVirtualList hook

```ts
export interface UseVirtualListOptions<T> {
  items: T[]
  itemHeight: number
  overscan?: number
  enabled?: boolean
  getItemKey?: (item: T, index: number) => string | number
}
```

关键设计：

- 使用 `ResizeObserver` 监听滚动容器高度，并通过 `scrollTop` 计算可见范围
- `enabled` 为 false 时返回完整列表，方便组件保留默认非虚拟模式
- 使用 `overscan` 预渲染上下缓冲区，减少快速滚动时的空白感
- 固定高度方案优先保证 Day 13 目标交付，动态测量留到后续扩展

### AI 快捷操作

```ts
export type ActionPresetKey =
  | 'copy'
  | 'regenerate'
  | 'correct'
  | 'summary'
  | 'polish'
  | 'explain-code'
```

关键设计：

- `ActionsPreset.ts` 只提供预设配置和 `createPresetActions()`，不绑定具体模型调用
- `Actions` 继续保持通用 toolbar 能力，业务逻辑通过 `onAction` 外部组合
- Storybook 的流式总结示例使用 `useStream + mockStream` 展示组合方式
- 将预设常量从组件文件拆出，避免触发 React Fast Refresh 的 `only-export-components` 规则

### Bubble actions 插槽

```tsx
<Bubble
  role="assistant"
  content="我建议先确认用户最常点的三个操作，再把它们放到消息下方。"
  actions={<Actions items={createPresetActions(['summary', 'polish'])} />}
/>
```

关键设计：

- `actions?: ReactNode` 作为插槽，比内置固定 action 配置更灵活
- 对齐方式跟随 `role`：user 右对齐、assistant 左对齐、system 居中
- Primitive 层不再重复注入 `llm-bubble` 根类，保持 Styled wrapper 负责根样式类

### 虚拟列表组件覆盖

ConversationList 新增：

```ts
virtualized?: boolean
itemHeight?: number
overscan?: number
```

MessageList 新增：

```ts
export interface MessageRecord {
  id: string
  role: LLMRole
  content?: string
  avatar?: ReactNode
  timestamp?: Date | string
  status?: messageStatus
  loading?: boolean
  actions?: ReactNode
}
```

关键设计：

- ConversationList 默认非虚拟，开启 `virtualized` 后才使用绝对定位列表项
- MessageList 默认用 Bubble 渲染消息，也支持 `renderMessage(message, index)` 自定义复杂内容
- 两个列表都通过固定 `itemHeight` 估算总高度，避免引入 `react-window` 等运行时依赖
- 虚拟模式下为根节点增加 `data-virtualized`，由 CSS 控制固定视口和定位布局

### Storybook 覆盖

新增 / 更新示例：

- `Actions.AIQuickActions`
- `Actions.StreamingSummary`
- `Bubble.WithAIQuickActions`
- `ConversationList.VirtualizedLargeDataset`
- `MessageList.Basic`
- `MessageList.WithBubbleActions`
- `MessageList.VirtualizedLargeDataset`
- `MessageList.CustomRenderMessage`

### 验证结果

- `pnpm lint` ✅
- `pnpm build` ✅
- Storybook + Playwright 浏览器检查 ✅
  - Actions 流式总结可触发并输出
  - Bubble actions 插槽渲染正常
  - ConversationList 1200 条数据虚拟滚动仅渲染可见项
  - MessageList 1200 条消息虚拟滚动仅渲染可见项

### 遇到的问题

- `react-refresh/only-export-components` 不允许组件文件导出非组件常量 → 将 action 预设移动到 `ActionsPreset.ts`
- `exactOptionalPropertyTypes` 下不能把可选 props 显式传为 `undefined` → MessageList 默认渲染 Bubble 时使用条件展开
- 初版虚拟列表因滚动容器高度不固定导致仍渲染全部数据 → 为虚拟模式补充固定视口与 `data-virtualized` 样式
- Storybook 示例里出现实现说明式文案，影响真实对话感 → 移除类似系统注释的消息内容
- 默认滚动条视觉过强 → 调整为细滚动条、透明轨道和低对比度 thumb

---

## Day 14: 场景化 Demo + Storybook 文档完善

### 完成内容

- 新增完整 AI 对话场景 Demo，组合 `ConfigProvider`、`ConversationList`、`MessageList`、`Bubble`、`Mark`、`Actions`、`Prompts`、`Sender`、`Think`、`Thought`、`Citation`、`CodeHighlighter` 和 `NotificationStack`
- Demo 支持会话选择、新建、删除、置顶、收藏、边栏折叠、快捷提示词、受控输入、模型切换、前缀动作、消息操作和通知反馈
- 使用 `useStream + mockStream` 模拟 AI 流式回复，并在 token 更新时自动滚动到最新内容
- 将 Demo 视觉重构为 ChatGPT / shadcn 风格的全高 chat shell：左侧全高侧边栏、右侧消息线程、底部 prompt 胶囊和 Sender
- 移除 Demo 顶部介绍区域和多余卡片边界，保留轻量顶部工具栏和单个太阳 / 月亮 SVG 主题按钮
- 修复 Storybook 全局主题与 Demo 局部主题冲突，深浅色模式可从 Storybook toolbar 初始化，也可通过 Demo 顶部按钮切换
- 点击 prompt 后自动填充 Sender，并将焦点移动到输入框
- 压缩 prompt、notification、Think、Thought、Citation 和 CodeHighlighter 在 Demo 内的尺寸，让各组件在真实 chat 场景中比例更协调
- 修复 `Mark` Streaming story 中代码块流式输出抖动问题，保持 Markdown 结构、renderer 引用和 Shiki 初始布局稳定

### Storybook 覆盖

- `AIConversationDemo.Default` 覆盖主题切换、边栏折叠、prompt 填充与自动聚焦、发送消息和流式回复出现
- `ConfigProvider.Default` 覆盖主题配置展示，并补充 `useStream` 开始、累积和取消路径
- `Bubble` 覆盖 assistant 渲染、错误状态、加载状态和消息 actions 插槽
- `Sender.InteractiveSend` 覆盖受控输入和发送回调
- `Mark.Basic` 覆盖标题、列表、表格和 fenced code block 渲染

### 技术决策

- Demo 作为 `src/components/demo/AIConversationDemo.tsx` 的 Storybook 场景示例保留，不导出为公共组件
- 继续使用 mock stream，不接入真实 API，避免把密钥或代理方案混入视觉与文档收尾任务
- 主题仍基于 `data-theme` 属性；Demo 根节点同步 `data-theme` / `data-theme-mode`，避免被 Storybook 全局主题覆盖
- Prompt 与 Sender 的联动放在 Demo 组合层完成，基础组件仍保持通用性

### 验证结果

- `pnpm lint` ✅
- `pnpm build` ✅
- `pnpm test:storybook` ✅

---

## Day 15: 打包发布 + Storybook 部署准备

### 完成内容

- 完善 `package.json` npm 发布元数据，移除 `private: true`，补充 `description`、`keywords`、`license` 和 `publishConfig.access`
- 保留现有包入口与导出配置：`main`、`module`、`types`、`exports` 和 `files: ['dist']`
- 重写 `README.md`，替换 Vite 模板内容，补充安装方式、样式导入、基础用法、组件列表、hooks / utils 和本地开发命令
- 新增 `vercel.json`，将 Vercel 构建配置指向 `pnpm build-storybook` 和 `storybook-static`
- 验证 `tsup.config.ts` 继续输出 ESM、CJS、DTS，并 external `react`、`react-dom`、`react/jsx-runtime`
- 验证 `vite.styles.config.ts` 继续输出 `dist/style.css`，并通过 `emptyOutDir: false` 保留库构建产物

### 发布边界

- 本次只完成本地发布准备和 dry-run 验证
- 未执行真实 `npm publish`
- 未执行真实 `vercel deploy`
- `storybook-static` 仅作为本地构建产物，继续由 `.gitignore` 排除

### 验证结果

- `pnpm lint` ✅
- `pnpm build` ✅
- `pnpm test:storybook` ✅
- `pnpm build-storybook` ✅
- `npm pack --dry-run` ✅
  - tarball 包含 README、package.json、ESM、CJS、类型声明、CSS 和 sourcemap
  - 包大小约 105.3 kB，解包后约 570.9 kB，共 10 个文件
- `npm publish --dry-run --access public` ✅
  - dry-run 显示将以 public access 发布 `@oakkles/llm-ui-react@0.1.0`
  - 未执行真实发布

---

## Vercel Demo 真实 AI 接入

### 完成内容

- 新增 `api/chat.ts` Vercel Serverless Function，作为浏览器 Demo 与 OpenAI-compatible 模型服务之间的同源代理
- 服务端只从 `DEEPSEEK_API_KEY` 环境变量读取密钥，可选使用 `DEEPSEEK_MODEL` 配置模型，默认 `deepseek-chat`
- 代理接口将上游 SSE 响应转换为纯文本 stream，前端无需感知供应商协议细节
- 新增 `src/components/demo/deepseekStream.ts`，Demo 只调用 `/api/chat` 并复用 `streamToGenerator`
- 改造 `AIConversationDemo`：线上优先调用真实 AI，接口不可用或未配置时自动回退到本地 mock stream
- 为 `AIConversationDemo` 增加 `forceMock`，Storybook play 测试强制使用 mock，避免 CI 依赖真实网络或服务端环境变量
- 增加服务端 API lint override，并为 `api/chat.ts` 配置 Vercel 函数最大执行时长
- README 补充真实 AI Demo 接入说明，强调 key 只能配置在 Vercel 服务端环境变量中

### 安全边界

- 未将真实 API key 写入任何源码、README、Storybook、日报或构建配置
- 未使用 `VITE_*` 暴露密钥
- 已完成 Vercel 生产部署，但当前 Vercel 项目尚未配置 `DEEPSEEK_API_KEY`
- 建议部署前轮换已经在对话中出现过的 key，再写入 Vercel 服务端环境变量

### 验证结果

- `pnpm lint` ✅
- `pnpm build` ✅
- `pnpm test:storybook` ✅
- `pnpm build-storybook` ✅
- `storybook-static` 中未发现 `DEEPSEEK_API_KEY` 或 key 形态字符串 ✅
- `dist` 中未发现 `DEEPSEEK_API_KEY`、DeepSeek base URL 或 key 形态字符串 ✅

---

## Day 15: 真实发布结果

### 完成内容

- `@oakkles/llm-ui-react@0.1.1` 已在 npm registry 可查询，tarball 地址为 npm 官方 registry
- Vercel 项目 `llm-ui-react` 已创建并关联到当前目录
- Storybook 文档已完成 Vercel Production 部署
- 生产地址：https://llm-ui-react.vercel.app
- 本次部署输出的实例地址：https://llm-ui-react-1i4xegke2-lmh3162066424-9065s-projects.vercel.app

### 当前状态

- Vercel 部署状态：Ready ✅
- Vercel 项目当前未配置环境变量，线上 Demo 会先使用 mock fallback
- 配置 `DEEPSEEK_API_KEY` 后需要重新部署，线上 Demo 才会启用真实 AI 回复

### 验证结果

- `npm view @oakkles/llm-ui-react@0.1.1 version` ✅
- `pnpm dlx vercel ls llm-ui-react` ✅
- Vercel Production deployment Ready ✅

---

## 累计产出

### 目录结构

```
src/
├── components/
│   ├── config-provider/
│   │   ├── ConfigProvider.tsx
│   │   ├── ConfigProvider.stories.tsx
│   │   └── configContext.ts      # Day 5 拆分
│   ├── bubble/                   # Day 5 新增
│   │   ├── Bubble.tsx
│   │   ├── BubblePrimitive.tsx
│   │   └── Bubble.stories.tsx
│   ├── mark/                     # Day 6 新增，Day 9 拆分
│   │   ├── Mark.tsx
│   │   ├── MarkPrimitive.tsx
│   │   └── Mark.stories.tsx
│   ├── code-highlighter/         # Day 7 新增，Day 9 拆分
│   │   ├── CodeHighlighter.tsx
│   │   ├── CodeHighlighterPrimitive.tsx
│   │   └── CodeHighlighter.stories.tsx
│   ├── sender/                   # Day 8 新增，Day 9 拆分，Day 11 补受控能力
│   │   ├── Sender.tsx
│   │   ├── SenderPrimitive.tsx
│   │   └── Sender.stories.tsx
│   ├── actions/                  # Day 11 新增，Day 13 补 AI 预设
│   │   ├── Actions.tsx
│   │   ├── ActionsPrimitive.tsx
│   │   ├── ActionsPreset.ts
│   │   └── Actions.stories.tsx
│   ├── prompts/                  # Day 11 新增
│   │   ├── Prompts.tsx
│   │   ├── PromptsPrimitive.tsx
│   │   └── Prompts.stories.tsx
│   ├── think/                    # Day 9 新增
│   │   ├── Think.tsx
│   │   ├── ThinkPrimitive.tsx
│   │   └── Think.stories.tsx
│   ├── notification/             # Day 9 新增
│   │   ├── Notification.tsx
│   │   ├── NotificationPrimitive.tsx
│   │   └── Notification.stories.tsx
│   ├── conversation/             # Day 10 新增，Day 13 支持虚拟滚动
│   │   ├── ConversationItem.tsx
│   │   ├── ConversationItemPrimitive.tsx
│   │   ├── ConversationList.tsx
│   │   ├── ConversationListPrimitive.tsx
│   │   └── ConversationList.stories.tsx
│   └── message-list/             # Day 13 新增
│       ├── MessageList.tsx
│       ├── MessageListPrimitive.tsx
│       └── MessageList.stories.tsx
├── hooks/
│   ├── useConfig.ts
│   ├── useLocale.ts
│   ├── useTheme.ts
│   ├── useStream.ts          # Day 4 新增
│   └── useVirtualList.ts     # Day 13 新增
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
    ├── cn.ts
    ├── stream.ts              # Day 4 新增
    └── markdown.ts            # Day 4 新增
```

### 关键决策

1. **主题切换**：`data-theme` 属性选择器，非 class
2. **颜色空间**：oklch（对齐 shadcn v4）
3. **字体**：Galaxie Copernicus 衬线体（参考 Claude 风格）
4. **i18n**：Ant Design 风格 Locale 对象，组件自管文案
5. **状态管理**：React Context + useState，setTheme 支持部分更新
6. **组件模式**：Headless (Primitive) + Styled 双层
7. **代码高亮**：Markdown 负责结构解析，CodeHighlighter 负责代码块视觉与交互
8. **输入交互**：Sender 负责输入、发送、快捷操作、模型切换和菜单交互
9. **会话侧边栏**：ConversationList 只负责列表、搜索、折叠和事件抛出，业务数据新增由外部控制
10. **提示词联动**：Prompts 只负责展示快捷入口并抛出 prompt 数据，具体填充 Sender 等业务联动由外部组合完成
11. **AI 快捷操作**：Actions 提供预设 UI，不直接绑定模型调用，具体 AI 能力由外部通过 `onAction` 组合
12. **虚拟滚动**：ConversationList 和 MessageList 共享 `useVirtualList`，默认不启用，按需通过 `virtualized` 开启
