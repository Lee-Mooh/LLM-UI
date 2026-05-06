# LLM-UI 组件库开发计划

## Context

在 15-20 天内完成一个面向 AI/LLM 场景的 React 组件库，核心参考 assistant-ui（架构模式）、Vercel chatbot（项目结构）、Vercel AI SDK（流式处理）、chatbot-ui（产品级 UI）。目标是产出一个可通过 npm 安装、Storybook 文档驱动、可部署到 Vercel 验收的完整组件库。

**技术决策**：React + TypeScript | Tailwind CSS + CSS Variables | 单包发布 `@llm-ui/react` | Storybook 中文文档

---

## 技术栈

| 层       | 选型                                    | 理由                                            |
| -------- | --------------------------------------- | ----------------------------------------------- |
| 语言     | TypeScript (strict)                     | 类型安全，组件库标配                            |
| 框架     | React 18+                               | 目标平台                                        |
| 构建     | **Vite (dev)** + **tsup (library)**     | Vite 开发快，tsup 打包库产物（ESM + CJS + DTS），Vite 单独负责样式打包 |
| 样式     | Tailwind CSS 4 + @tailwindcss/vite + CSS Variables | 使用 Tailwind v4 官方 Vite 接入方式，结合 CSS Variables 做主题与 tokens |
| 文档     | Storybook 10 (Vite)                     | 交互式文档，自带部署支持，集成 Vitest 测试      |
| 测试     | Vitest + Playwright (browser mode)      | Storybook 10 原生集成，浏览器环境测试           |
| 代码规范 | ESLint (flat config) + Prettier + Husky + lint-staged | 提交前校验，ESLint 10 使用 eslint.config.js 扁平配置 |
| 包管理   | pnpm                                    | 速度快，磁盘占用小                              |
| 部署     | Vercel (Storybook 静态站点)             | 验收用                                          |

---

## 项目结构

```
llm-ui/
├── .storybook/              # Storybook 10 配置
│   ├── main.ts              # stories 路径、addons、framework
│   └── preview.ts           # 全局装饰器（主题切换 toolbar）
├── src/
│   ├── components/          # 所有组件
│   │   ├── config-provider/ # 全局配置（✅ 已完成）
│   │   ├── bubble/          # 对话气泡
│   │   ├── conversation/    # 会话管理
│   │   ├── sender/          # 输入框
│   │   ├── mark/            # 流式 Markdown 渲染
│   │   ├── think/           # 思考过程
│   │   ├── code-highlighter/# 代码高亮
│   │   ├── prompts/         # 提示集预设
│   │   ├── notification/    # 系统通知
│   │   ├── actions/         # 快捷操作
│   │   ├── thought/         # 思维链（高级）
│   │   └── citation/        # 引用溯源（高级）
│   ├── hooks/               # 公共 hooks
│   │   ├── useStream.ts     # 流式输出核心 hook
│   │   ├── useTheme.ts      # 主题切换（✅ 已完成）
│   │   ├── useConfig.ts     # 读取 ConfigProvider（✅ 已完成）
│   │   └── useLocale.ts     # 读取 locale 对象（✅ 已完成）
│   ├── locale/              # 国际化语言包（✅ 已完成）
│   │   ├── type.ts          # Locale 接口定义
│   │   ├── zh-CN.ts         # 中文包
│   │   └── en-US.ts         # 英文包
│   ├── styles/              # 全局样式 & CSS Variables 定义
│   │   ├── tokens.css       # 设计令牌（颜色、间距、圆角、字体）
│   │   └── themes/          # light.css / dark.css（oklch 色彩空间）
│   ├── utils/               # 工具函数
│   │   ├── stream.ts        # 流处理工具
│   │   └── markdown.ts      # Markdown 解析工具
│   ├── types/               # 公共类型定义
│   │   ├── common.ts        # LLMRole、messageStatus、BaseComponentProps
│   │   └── config.ts        # ConfigProvider 类型定义（✅ 已完成）
│   └── index.ts             # 统一出口
├── stories/                 # Storybook stories (.stories.tsx)
├── __tests__/               # Vitest 测试
├── package.json
├── tsconfig.json              # 项目引用，指向 tsconfig.app.json 和 tsconfig.node.json
├── tsconfig.app.json          # 应用配置（strict、jsx react-jsx）
├── tsconfig.lib.json          # 库打包配置（tsup 使用）
├── tsconfig.node.json         # Node 配置（vite.config.ts 等）
├── vite.config.ts             # 开发服务器 + Vitest 配置
├── vite.styles.config.ts      # 样式打包专用配置
├── tsup.config.ts             # 库打包配置（ESM + CJS + DTS）
├── eslint.config.js           # ESLint 10 扁平配置
├── .prettierrc
├── .husky/
├── .mcp.json                  # MCP 服务器配置（shadcn、assistant-ui）
├── CLAUDE.md                  # Claude Code 项目指导文档
├── daily.md                   # 开发日报（Day 1-3）
└── skills-lock.json           # skills 锁文件
```

---

## 核心设计模式（来自 assistant-ui）

### 1. Headless + Styled 双层

每个组件拆为：

- **Primitive（无样式）**：管理状态和行为，渲染最小 DOM，通过 hooks 暴露
- **Styled（带样式）**：包裹 Primitive + Tailwind 类，开箱即用

```tsx
// Primitive 层
const BubblePrimitive = ({ role, children, ...props }) => {
  return (
    <div data-role={role} {...props}>
      {children}
    </div>
  )
}

// Styled 层
const Bubble = ({ role, className, ...props }) => {
  return (
    <BubblePrimitive
      className={cn(
        'rounded-2xl px-4 py-3',
        role === 'user'
          ? 'bg-primary text-primary-foreground ml-auto'
          : 'bg-muted',
        className,
      )}
      {...props}
    />
  )
}
```

### 2. ConfigProvider 上下文注入

```tsx
<ConfigProvider
  theme={{ mode: 'dark', primaryColor: '#1677ff' }}
  locale="zh-CN"
  ai={{ apiKey: '...', model: 'gpt-4' }}
  components={{ Bubble: { avatar: <MyAvatar /> } }}
>
  <App />
</ConfigProvider>
```

### 3. 流式渲染管道

```
async generator / ReadableStream
  → useStream() hook (累积 token，管理状态)
    → Mark 组件 (增量 Markdown 渲染)
      → react-markdown + remark-gfm + rehype-highlight
```

---

## 15 天执行计划

### Phase 1: 基础设施 (Day 1-2)

**Day 1: 项目初始化** ✅

- `pnpm create vite llm-ui --template react-ts`
- 安装依赖：tailwindcss, @tailwindcss/vite, react, react-dom, typescript
- 配置 tsconfig.json (strict, JSX transform)
- 接入 `@tailwindcss/vite`，在 `src/index.css` 中使用 `@import "tailwindcss"` + CSS Variables tokens
- 配置 vite.config.ts (library mode)
- 创建 `src/styles/tokens.css` 设计令牌文件（oklch 色彩空间，zinc 色系）
- 创建 `src/styles/themes/light.css` + `dark.css`（扩充至 18 个颜色变量）
- 验证：`pnpm dev` 能跑起来

**Day 2: 工具链 + Storybook** ✅

- 初始化 Storybook 10 (`pnpm dlx storybook@latest init`)
- 配置 `.storybook/preview.ts`（主题切换 toolbar + 全局装饰器 withTheme）
- 配置 ESLint 10 (flat config `eslint.config.js`) + Prettier
- 配置 Husky + lint-staged
- 配置 tsup 打包（ESM, CJS, DTS 输出，`tsconfig.lib.json`）
- 配置 `vite.styles.config.ts` 样式单独打包
- 创建 `src/index.ts` 统一出口骨架
- 创建 `src/types/common.ts` 公共类型（LLMRole、messageStatus、BaseComponentProps）
- 创建 `src/utils/cn.ts` 工具函数（clsx + tailwind-merge）
- 测试框架：Vitest + Playwright (browser mode)，集成到 Storybook
- 验证：`pnpm storybook` 能启动，`pnpm build` 能产出 dist

---

### Phase 2: 核心基础设施组件 (Day 3-4)

**Day 3: ConfigProvider** ✅

- `src/components/config-provider/ConfigProvider.tsx`
  - React Context 管理全局配置
  - 主题 token 注入（CSS Variables 动态切换）
  - 深浅色模式切换 + 系统偏好检测
  - 国际化 i18n 基础框架（Ant Design 风格 Locale 对象方案）
  - 组件全局默认参数注入
  - AI 请求配置（apiKey, model, baseURL）
- `src/hooks/useConfig.ts` — 读取配置的 hook
- `src/hooks/useTheme.ts` — 主题切换 hook（mode, isDark, setMode, primaryColor）
- `src/hooks/useLocale.ts` — 读取 locale 对象的 hook
- `src/locale/` — i18n 语言包目录（type.ts, zh-CN.ts, en-US.ts）
- `src/types/config.ts` — ConfigProvider 类型定义
- Story: 展示主题切换、深浅色效果、颜色令牌一览

**Day 4: 流式输出核心 + 代码规范强化**

- `src/hooks/useStream.ts`
  - 接受 async generator 或 ReadableStream
  - 管理 streaming/loading/error/complete 状态
  - 支持 AbortController 取消
  - token 增量累积
- `src/utils/stream.ts` — 流处理工具函数
- `src/utils/markdown.ts` — Markdown 解析辅助
- 验证：写一个 mock 流式 generator，useStream 能正确累积

---

### Phase 3: 核心 UI 组件 (Day 5-9)

**Day 5: Bubble 对话气泡**

- `src/components/bubble/Bubble.tsx`
  - role 区分 (user / assistant / system)
  - 头像插槽 (avatar prop + Slot 模式)
  - 时间戳显示
  - 消息状态 (sending / sent / error)
  - 气泡样式：用户靠右主色，AI 靠左灰色
  - 加载中动画
- BubblePrimitive (headless 层)
- Stories: 不同角色、状态、自定义头像

**Day 6: Mark 流式 Markdown 渲染**

- `src/components/mark/Mark.tsx`
  - 集成 react-markdown + remark-gfm
  - 代码块语法高亮 (rehype-highlight 或 Prism)
  - 流式打字机效果（与 useStream 联动）
  - 超长文本自动折叠
  - 图片懒加载
  - 表格、列表等 Markdown 完整渲染
- Stories: 静态 Markdown、流式渲染效果、代码块、超长文本折叠

**Day 7: CodeHighlighter 代码高亮**

- `src/components/code-highlighter/CodeHighlighter.tsx`
  - 基于 Prism.js / highlight.js 语法高亮
  - 语言标识 badge
  - 一键复制按钮
  - 长代码块展开/收起
  - 行号显示（可选）
- Stories: 各语言代码、复制功能、展开收起

**Day 8: Sender 输入框**

- `src/components/sender/Sender.tsx`
  - 多行 textarea 自动高度 (auto-resize)
  - 发送按钮 + 加载状态 spinner
  - 禁用状态
  - 快捷键：Enter 发送，Shift+Enter 换行
  - placeholder 支持
  - 文件上传插槽（预留）
  - onSend 回调
- SenderPrimitive (headless)
- Stories: 默认、禁用、加载中、自定义快捷键

**Day 9: Think 思考过程 + Notification 通知**

- `src/components/think/Think.tsx`
  - 折叠/展开动画 (CSS transition)
  - 加载中思考动画 (pulse / dots)
  - 自定义文案（"思考中..." / "分析中..."）
  - 状态切换（thinking → done）
- `src/components/notification/Notification.tsx`
  - 成功/错误/加载三种状态
  - 自动消失 + 手动关闭
  - 进度条（可选）
  - Toast 堆叠管理
- Stories: 各状态、自定义文案、通知堆叠

---

### Phase 4: 复合组件 + 高级功能 (Day 10-13)

**Day 10: Conversation 会话组件**

- `src/components/conversation/ConversationList.tsx`
  - 会话列表渲染
  - 历史会话卡片
  - 会话搜索
  - 收藏/删除/置顶操作
  - 侧边栏布局
- `src/components/conversation/ConversationItem.tsx`
  - 单个会话项
  - 活跃状态高亮
  - 操作菜单（右键或三点按钮）
- Stories: 会话列表、搜索、操作

**Day 11: Prompts 提示集 + Actions 快捷操作**

- `src/components/prompts/Prompts.tsx`
  - 提示词卡片网格
  - 点击回调（填充输入框）
  - 分类标签
  - 自定义卡片样式
- `src/components/actions/Actions.tsx`
  - 消息下方操作栏
  - 内置：复制、重新生成、纠错
  - 自定义操作项扩展
  - 批量操作模式
- Stories: 提示集展示、操作栏自定义

**Day 12: Thought 思维链 + Citation 引用溯源（高级）**

- `src/components/thought/Thought.tsx`
  - 多步骤思维链展示
  - 每步可折叠/展开
  - 步骤间连接线/动画
  - 思考中逐段加载动画
- `src/components/citation/Citation.tsx`
  - RAG 引用卡片
  - 来源标注（数字角标）
  - hover 预览弹出框
  - 文献溯源信息展示
- Stories: 思维链流程、引用卡片、hover 预览

**Day 13: 指令级 AI 能力 + 虚拟列表**

- 在 Bubble/Actions 中集成轻量 AI 快捷操作
  - 一键总结（调用 useStream）
  - 文案润色
  - 代码解释
  - 这些作为 Actions 的预设操作项
- 虚拟列表优化
  - `src/hooks/useVirtualList.ts` 或集成 react-window
  - Conversation 列表和消息列表支持虚拟滚动
  - 大量会话高性能滚动
- 验证：1000+ 消息列表流畅滚动

---

### Phase 5: 场景化 Demo + 测试 + 打包 (Day 14-15)

**Day 14: 场景化 Demo + Storybook 文档完善**

- 搭建完整 AI 对话 Demo 页面
  - 集成所有组件：Conversation 侧边栏 + Bubble 消息列表 + Sender 输入框 + Prompts 快捷入口
  - Mock 流式 AI 响应
  - 主题切换展示
- 完善每个组件的 Storybook 文档
  - 组件介绍、使用场景（中文）
  - Props API 表格
  - 可交互示例
  - 不同状态/主题预览
- Vitest 单元测试（集成到 Storybook）
  - ConfigProvider 主题注入测试
  - Bubble 渲染测试（不同 role、状态）
  - useStream hook 测试（流式累积、取消）
  - Sender 发送回调测试
  - Mark Markdown 渲染测试

**Day 15: 打包发布 + 部署**

- tsup 打包配置验证
  - ESM + CJS 双格式输出
  - TypeScript 声明文件 (.d.ts)
  - CSS 提取（Tailwind purge 配置）
  - 外部化 react/react-dom (peerDependencies)
- package.json 配置
  - name: `@llm-ui/react`
  - main / module / types 字段
  - peerDependencies: react, react-dom
  - exports 字段 (条件导出)
  - files 字段（只发布 dist）
- Storybook 构建为静态站点
- 部署 Storybook 到 Vercel
- 验证：`npm pack` 检查产物，`npm publish --dry-run` 验证发布

---

## 关键依赖清单

```json
{
  "dependencies": {
    "react-markdown": "^9.0.0",
    "remark-gfm": "^4.0.0",
    "rehype-highlight": "^7.0.0",
    "highlight.js": "^11.9.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "~6.0.0",
    "vite": "^8.0.0",
    "tsup": "^8.5.0",
    "@tailwindcss/vite": "^4.2.4",
    "tailwindcss": "^4.2.4",
    "postcss": "^8.5.0",
    "autoprefixer": "^10.5.0",
    "storybook": "^10.3.0",
    "@storybook/react-vite": "^10.3.0",
    "@storybook/addon-vitest": "^10.3.0",
    "vitest": "^4.0.0",
    "@vitest/browser-playwright": "^4.0.0",
    "playwright": "^1.59.0",
    "eslint": "^10.2.0",
    "prettier": "^3.8.0",
    "husky": "^9.0.0",
    "lint-staged": "^16.0.0"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  }
  // 注意：react/react-dom 仅在 peerDependencies，不在 devDependencies
  // @types/react 使用 v19 类型定义
}
```

---

## 组件 Props 速览

### ConfigProvider

```tsx
interface ConfigProviderProps {
  theme?: { mode?: 'light' | 'dark' | 'system'; primaryColor?: string }
  locale?: 'zh-CN' | 'en-US' | Locale  // Locale 为语言包对象
  ai?: { apiKey: string; model: string; baseURL?: string }
  components?: Record<string, Record<string, any>>  // 组件全局默认参数
  children: ReactNode
}
```

### Bubble

```tsx
interface BubbleProps {
  role: 'user' | 'assistant' | 'system'
  content: string
  avatar?: React.ReactNode
  timestamp?: Date | string
  status?: 'sending' | 'sent' | 'error'
  loading?: boolean
  className?: string
  actions?: ActionItem[]
  children?: React.ReactNode
}
```

### Mark

```tsx
interface MarkProps {
  content: string
  streaming?: boolean
  onComplete?: () => void
  codeHighlight?: boolean
  maxLength?: number // 超过则折叠
  className?: string
}
```

### Sender

```tsx
interface SenderProps {
  onSend: (message: string) => void
  loading?: boolean
  disabled?: boolean
  placeholder?: string
  maxLength?: number
  submitKey?: 'Enter' | 'Ctrl+Enter'
  className?: string
  prefix?: React.ReactNode // 前缀插槽（如附件按钮）
  suffix?: React.ReactNode // 后缀插槽
}
```

### Conversation

```tsx
interface ConversationListProps {
  conversations: ConversationItem[]
  activeId?: string
  onSelect: (id: string) => void
  onDelete?: (id: string) => void
  onPin?: (id: string) => void
  onFavorite?: (id: string) => void
  searchable?: boolean
  className?: string
}

interface ConversationItem {
  id: string
  title: string
  lastMessage?: string
  timestamp?: Date
  pinned?: boolean
  favorite?: boolean
  avatar?: React.ReactNode
}
```

### Think

```tsx
interface ThinkProps {
  content?: string
  status: 'thinking' | 'done'
  label?: string // "思考中..." / "分析中..."
  defaultOpen?: boolean
  className?: string
}
```

### Actions

```tsx
interface ActionsProps {
  items: ActionItem[]
  onAction?: (key: string) => void
  className?: string
}

interface ActionItem {
  key: string
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}
```

---

## 验证方式

1. **Storybook 站点**：每个组件有完整交互示例，主题切换正常，中文文档齐全
2. **Vercel 部署**：Storybook 静态站点在线可访问
3. **npm 发布**：`npm pack` 产物包含 dist/ 和类型声明，`import { Bubble } from '@llm-ui/react'` 可用
4. **单元测试**：核心组件测试通过 `pnpm test`（Vitest）
5. **场景化 Demo**：完整对话页面可交互，流式输出动画流畅
6. **代码规范**：`pnpm lint` 无错误，git commit 触发 lint-staged 校验

---

## 风险与应对

| 风险                   | 影响             | 应对                                                                     |
| ---------------------- | ---------------- | ------------------------------------------------------------------------ |
| 流式 Markdown 渲染性能 | 打字机效果卡顿   | 使用 requestAnimationFrame 节流，react-markdown 的 `skipHtml` 减少解析量 |
| Tailwind purge 误删    | 组件样式丢失     | safelist 动态类名，或使用 CSS Variables 替代动态 Tailwind 类             |
| 15 天时间紧张          | 高级功能可能延期 | Day 12 的 Thought/Citation 为可选，核心组件优先保证质量                  |
| Storybook 构建产物大   | 部署慢           | 配置 Storybook 优化，lazy-load stories                                   |
