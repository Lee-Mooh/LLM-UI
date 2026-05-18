<div align="center">

# @llm-ui/react

面向 AI / LLM 产品的 React 组件库，用一套可组合组件快速搭建 Chat、Agent、知识库问答和流式生成界面。

[![npm](https://img.shields.io/npm/v/@llm-ui/react?color=0f172a&label=npm)](https://www.npmjs.com/package/@llm-ui/react)
![React](https://img.shields.io/badge/React-18%2B-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178C6?logo=typescript&logoColor=white)
![Storybook](https://img.shields.io/badge/Storybook-docs-FF4785?logo=storybook&logoColor=white)
![Package](https://img.shields.io/badge/package-ESM%20%2B%20CJS-111827)
![License](https://img.shields.io/npm/l/@llm-ui/react)

</div>

## 特性

| 能力       | 说明                                                                     |
| ---------- | ------------------------------------------------------------------------ |
| 对话界面   | `Bubble`、`MessageList`、`ConversationList` 组合出完整 Chat UI           |
| 输入体验   | `Sender` 支持受控输入、发送、取消、前缀操作和模型切换入口                |
| 流式生成   | `useStream`、`mockStream` 和 Markdown streaming 状态适配流式回复         |
| 富文本输出 | `Mark`、`CodeHighlighter` 支持 Markdown、GFM、代码块和语法高亮           |
| Agent 过程 | `Think`、`Thought`、`Citation` 展示思考过程、步骤和引用来源              |
| 主题系统   | 基于 `data-theme` 和 CSS Variables，内置 light / dark 主题和柔和切换动画 |
| AI Ready   | Demo 可接入 `/api/chat` 这类后端接口，安全使用真实模型能力               |

## 安装

```bash
pnpm add @llm-ui/react
```

也可以使用 npm：

```bash
npm install @llm-ui/react
```

## 快速开始

导入组件和样式：

```tsx
import { ConfigProvider, MessageList, Sender } from '@llm-ui/react'
import '@llm-ui/react/style.css'

const messages = [
  {
    id: 'hello-user',
    role: 'user',
    content: '帮我总结今天的发布风险。',
  },
  {
    id: 'hello-assistant',
    role: 'assistant',
    content: '可以从接口稳定性、文档一致性和回归覆盖三个方向拆分。',
  },
] as const

export function Chat() {
  return (
    <ConfigProvider theme={{ mode: 'light' }} locale="zh-CN">
      <MessageList messages={messages} />
      <Sender onSend={(message) => console.log(message)} />
    </ConfigProvider>
  )
}
```

## 真实 AI Demo 接入

组件库可以发布静态 Demo，也可以在部署到 Vercel 后接入真实 AI 能力。推荐结构是：

```txt
浏览器 Demo
  -> fetch('/api/chat')
  -> Vercel Serverless Function
  -> OpenAI-compatible 模型服务
```

不要把模型 API Key 放进前端代码、Storybook stories 或任何 `VITE_*` 环境变量。Key 应该只存在于 Vercel 服务端环境变量中，例如：

```txt
DEEPSEEK_API_KEY=your-server-side-key
DEEPSEEK_MODEL=deepseek-chat
```

前端 Demo 只调用自己的后端接口：

```ts
async function* requestAI(message: string) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) return

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    yield decoder.decode(value)
  }
}
```

这样 npm 包保持安全、可复用，Vercel 上的在线 Demo 仍然可以拥有真实 AI 回复。

## 组件矩阵

| 分类            | 组件                                   |
| --------------- | -------------------------------------- |
| 基础上下文      | `ConfigProvider`                       |
| 消息展示        | `Bubble`、`MessageList`                |
| 输入与发送      | `Sender`                               |
| Markdown 与代码 | `Mark`、`CodeHighlighter`              |
| 会话管理        | `ConversationList`、`ConversationItem` |
| 快捷操作        | `Prompts`、`Actions`                   |
| 推理与引用      | `Think`、`Thought`、`Citation`         |
| 通知反馈        | `Notification`、`NotificationStack`    |

## Hooks 与工具

| API                 | 用途                               |
| ------------------- | ---------------------------------- |
| `useConfig`         | 读取全局配置                       |
| `useLocale`         | 读取当前语言包                     |
| `useTheme`          | 读取和切换主题                     |
| `useStream`         | 管理流式文本状态                   |
| `useVirtualList`    | 虚拟列表能力                       |
| `mockStream`        | 本地模拟流式输出                   |
| `streamToGenerator` | 将 Web Stream 转为 async generator |
| `generatorToStream` | 将 async generator 转为 Web Stream |
| `sanitizeMarkdown`  | 修复 streaming 阶段不完整 Markdown |

## 主题

主题通过 `data-theme` 属性和 CSS Variables 驱动：

```ts
document.documentElement.setAttribute('data-theme', 'dark')
```

也可以通过 `ConfigProvider` 和 `useTheme` 控制：

```tsx
<ConfigProvider theme={{ mode: 'dark' }} locale="zh-CN">
  <App />
</ConfigProvider>
```

内置主题文件：

```txt
src/styles/themes/light.css
src/styles/themes/dark.css
src/styles/tokens.css
```

所有变量都使用 `--llm-` 前缀，便于外部覆盖。

## 本地开发

```bash
pnpm install
pnpm storybook
```

常用命令：

```bash
pnpm lint              # ESLint 检查
pnpm build             # 构建库代码、类型声明和 CSS
pnpm test:storybook    # 运行 Storybook browser tests
pnpm build-storybook   # 构建 Storybook 静态站点
```

## 发布产物

库构建输出到 `dist/`：

```txt
dist/index.js      # ESM
dist/index.cjs     # CommonJS
dist/index.d.ts    # 类型声明
dist/style.css     # 组件样式
```

用户应同时导入组件入口和样式入口：

```tsx
import { Bubble } from '@llm-ui/react'
import '@llm-ui/react/style.css'
```

## 在线文档

Storybook / Vercel Demo：Coming soon
