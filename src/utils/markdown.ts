export function sanitizeMarkdown(content: string): string {
  // 处理未闭合的代码块 ```
  const codeBlockCount = (content.match(/```/g) || []).length
  if (codeBlockCount % 2 !== 0) {
    content += '```'
  }

  // 处理未闭合的行内代码 `
  // 先去掉 ``` 中的反引号，再数单个 `
  const stripped = content.replace(/```/g, '')
  const inlineCount = (stripped.match(/`/g) || []).length
  if (inlineCount % 2 !== 0) {
    content += '`'
  }

  return content
}