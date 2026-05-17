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
<section className={className} data-open={open ? '' : undefined} data-status={status}>
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
<section className={className} data-type={type} role={type === 'error' ? 'alert' : 'status'}>
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
│   ├── mark/                     # Day 6 新增
│   │   ├── Mark.tsx
│   │   └── Mark.stories.tsx
│   ├── code-highlighter/         # Day 7 新增
│   │   ├── CodeHighlighter.tsx
│   │   └── CodeHighlighter.stories.tsx
│   └── sender/                   # Day 8 新增
│       ├── Sender.tsx
│       └── Sender.stories.tsx
├── hooks/
│   ├── useConfig.ts
│   ├── useLocale.ts
│   ├── useTheme.ts
│   └── useStream.ts          # Day 4 新增
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
