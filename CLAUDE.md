# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本仓库中工作时提供指导。

## 项目概述

`@llm-ui/react` — 面向 AI/LLM 场景的 React 组件库，可通过 npm 发布，带 Storybook 文档，可部署到 Vercel。

## 常用命令

```bash
pnpm dev              # Vite 开发服务器
pnpm build            # 完整构建：tsup (JS+DTS) + vite (CSS) → dist/
pnpm build:lib        # 仅库代码 (tsup)
pnpm build:styles     # 仅样式 (vite)
pnpm storybook        # Storybook 开发服务器，端口 6006
pnpm build-storybook  # 构建 Storybook 静态站点
pnpm lint             # ESLint 检查
pnpm format           # Prettier 自动格式化
```

## 构建架构

三条独立的构建管线，均输出到 `dist/`：

1. **tsup** (`tsup.config.ts`) — 库代码 → `index.js` (ESM), `index.cjs` (CJS), `index.d.ts`。使用 `tsconfig.lib.json`。外部依赖：react, react-dom。
2. **Vite** (`vite.styles.config.ts`) — 样式 → `style.css`。入口为 `src/style.ts`（导入 `index.css`）。使用 `emptyOutDir: false` 避免清除 tsup 产物。
3. **Vite** (`vite.config.ts`) — 仅用于开发服务器 + Vitest 配置（不参与生产构建）。

## 设计令牌与主题系统

所有 CSS 变量使用 `--llm-` 前缀。主题切换基于属性，而非类名：

- 亮色：`:root` 或 `[data-theme="light"]`，定义在 `src/styles/themes/light.css`
- 暗色：`[data-theme="dark"]`，定义在 `src/styles/themes/dark.css`
- 令牌：`src/styles/tokens.css`（圆角、间距、字体、阴影）

切换主题：`document.documentElement.setAttribute('data-theme', 'dark')`

## 组件架构

每个组件遵循 **Headless (Primitive) + Styled 双层模式**：

```tsx
// Primitive — 管理状态和行为，最小 DOM
const BubblePrimitive = ({ role, children, ...props }) => {
  return <div data-role={role} {...props}>{children}</div>
}

// Styled — 包裹 Primitive + Tailwind 类
const Bubble = ({ role, className, ...props }) => {
  return (
    <BubblePrimitive
      className={cn('rounded-2xl px-4 py-3', role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted', className)}
      {...props}
    />
  )
}
```

使用 `src/utils/cn.ts` 中的 `cn()` 合并 Tailwind 类名（clsx + tailwind-merge）。

## 组件设计规范

### 组件命名

- 使用**名词**，大驼峰命名（如 Button、Form、Table）
- **沿用已存在的名称定义**，让使用者从名字就能理解组件功能（如 `UserSelect`、`InputTrim`）
- 命名步骤：先确定组件类型（Button/Modal/Card 等），再找出关键特征（业务特征或功能特征）

### Props 设计

属性分为三类：

- **数据型属性**：组件核心，如 Table 的 `dataSource`、Input 的 `value`，通常是必传的
- **配置型属性**：修饰组件特征，如 `disabled`、`maxLength`、`bordered`
- **事件**：以 `on` 开头（`onClick`、`onChange`、`onSearch`），均为非必须

事件设计原则：
- 事件都是非必须的，不应强制外部处理
- 控制流自上而下（父到子），不能反向。抛出具体事件（`onEdited`、`onDeleted`），而非通用事件（`onRefresh`），符合开闭原则

### 插槽（Slot）

当组件某部分内容需要高度灵活时，使用 `ReactNode` 类型的属性作为插槽，而非一堆布尔开关：

```tsx
// 好的做法 — 插槽
type EmptyTipProps = {
  text: string
  append?: JSX.Element  // 灵活插槽
  className?: string
}
```

`children` 本身就是最常见的插槽。

### 组件方法

尽量使用声明式（props），少用命令式（`useImperativeHandle`）。只有当属性和事件无法实现时才暴露方法（如父组件需要获取子组件内部数据的场景）。

### State 管理

- 公式：`UI = f(props, state)`
- 能从其他 state/props 推导的状态，使用 `useMemo` 而非 `useState`，避免重复定义
- 所有 UI 会变化的地方都需要 state 或属性来承接：仅内部知晓用 state，外部可控用属性

### 组件样式

- 不使用 CSS Module，直接使用公共样式（方便外部覆盖）
- 最外层元素类名与组件名称一致（加库前缀如 `llm-`）
- 内部元素使用 BEM 规范：`__` 连接元素，`--` 连接修饰符（如 `.button--primary`）
- 提供 `className` 和 `style` 属性用于外部微调，直接应用于最外层元素

### 实现 render 的过程

1. **先写静态 HTML 结构**，为每个 div 赋予有意义的 class 名（container、content、header、item 等）
2. **定义 state 和属性**，所有 UI 会变化的地方都需要承接
3. **将 state/属性映射到 HTML**，复杂逻辑用 `useMemo` 抽离，保持 render 简洁
4. **加入事件及处理函数**，复杂事件逻辑抽取为 handle 函数

## TypeScript 配置

严格模式，额外启用：`exactOptionalPropertyTypes`、`noUncheckedIndexedAccess`、`verbatimModuleSyntax`、`noUnusedLocals`、`noUnusedParameters`。

三个 tsconfig 文件：
- `tsconfig.app.json` — 主配置（src + .storybook）
- `tsconfig.lib.json` — 库构建（继承 app，仅包含 src/index.ts, types, utils, components, hooks）
- `tsconfig.node.json` — 仅 vite.config.ts

## 代码风格

- Prettier：不加分号，单引号，所有尾逗号
- ESLint：扁平配置（`eslint.config.js`）
- 提交前：Husky → lint-staged → prettier + eslint --fix

## Storybook

Story 文件与组件同目录：`src/**/*.stories.@(ts|tsx)`。主题切换工具栏在 `.storybook/preview.ts` 中通过 `withTheme` 装饰器和 `globalTypes.theme` 配置。

## 导出方式

用户分别导入组件和样式：

```tsx
import { Bubble } from '@llm-ui/react'
import '@llm-ui/react/style.css'
```
