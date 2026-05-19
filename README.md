<div align="center">

<img src="./assets/llm-ui-logo.png" alt="LLM UI logo" width="180" />

# @oakkles/llm-ui-react

面向 AI / LLM 产品的 React 组件库，用一套可组合组件快速搭建 Chat、Agent、知识库问答和流式生成界面。

[![npm](https://img.shields.io/npm/v/@oakkles/llm-ui-react?color=0f172a&label=npm)](https://www.npmjs.com/package/@oakkles/llm-ui-react)
![React](https://img.shields.io/badge/React-18%2B-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178C6?logo=typescript&logoColor=white)
![Storybook](https://img.shields.io/badge/Storybook-docs-FF4785?logo=storybook&logoColor=white)
![Package](https://img.shields.io/badge/package-ESM%20%2B%20CJS-111827)
![License](https://img.shields.io/npm/l/@oakkles/llm-ui-react)

[在线 Storybook / Vercel Demo](https://llm-ui-react.vercel.app)

</div>

## 特性

| 能力       | 说明                                                                     |
| ---------- | ------------------------------------------------------------------------ |
| 对话界面   | `Bubble`、`MessageList`、`ConversationList` 组合出完整 Chat UI           |
| 输入体验   | `Sender` 支持受控输入、发送、取消、前缀操作和模型切换入口                |
| 流式生成   | `useStream`、`mockStream` 和 Markdown streaming 状态适配流式回复         |
| 富文本输出 | `Mark`、`CodeHighlighter` 支持 Markdown、GFM、代码块和语法高亮           |
| Agent 过程 | `Think`、`Thought`、`Citation` 展示思考过程、步骤和引用来源              |
| 会话管理   | `ConversationList`、`ConversationItem` 支持搜索、折叠、收藏、置顶和删除  |
| 主题系统   | 基于 `data-theme` 和 CSS Variables，内置 light / dark 主题和柔和切换动画 |
| AI Ready   | 在线 Demo 已接入真实 AI，优先通过 Vercel `/api/chat` 服务端代理请求模型  |

## 安装

```bash
pnpm add @oakkles/llm-ui-react
```

也可以使用 npm：

```bash
npm install @oakkles/llm-ui-react
```

## 快速开始

导入组件和样式：

```tsx
import { ConfigProvider, MessageList, Sender } from '@oakkles/llm-ui-react'
import '@oakkles/llm-ui-react/style.css'

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

## 在线 Demo

当前 Storybook 已部署到 Vercel：

```txt
https://llm-ui-react.vercel.app
```

其中 `Examples / AI Conversation Demo / Default` 已接入真实 AI：

```txt
浏览器 Demo
  -> fetch('/api/chat')
  -> Vercel Serverless Function
  -> OpenAI-compatible 模型服务
```

`Mocked` story 保留本地模拟流式回复，用于稳定的 Storybook interaction / browser tests。

Storybook 的全局 Light / Dark toolbar、左侧 manager、顶部工具栏和组件展示区会保持主题同步；Demo 内部的主题按钮也会反向同步 Storybook 全局主题。

## 真实 AI 接入

推荐把模型 API Key 只放在 Vercel 服务端环境变量中，前端只调用同源后端接口：

```txt
DEEPSEEK_API_KEY=your-server-side-key
DEEPSEEK_MODEL=deepseek-chat
```

前端请求示例：

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

当前 Demo 还提供浏览器直连 DeepSeek 的兜底路径：当 `/api/chat` 不可用或未配置时，可通过 `VITE_DEEPSEEK_API_KEY` 和 `VITE_DEEPSEEK_MODEL` 在静态 Storybook 中直接请求模型。

```txt
VITE_DEEPSEEK_API_KEY=your-browser-visible-key
VITE_DEEPSEEK_MODEL=deepseek-chat
```

注意：`VITE_*` 变量会进入前端构建产物，任何访问页面的人都能在浏览器 DevTools 中看到这个 key。生产环境更推荐使用 `/api/chat` 服务端代理。

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
import { Bubble } from '@oakkles/llm-ui-react'
import '@oakkles/llm-ui-react/style.css'
```
