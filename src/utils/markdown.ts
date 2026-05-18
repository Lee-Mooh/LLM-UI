export function sanitizeMarkdown(content: string): string {
  const codeBlockCount = (content.match(/```/g) || []).length
  if (codeBlockCount % 2 !== 0) {
    content += `${content.endsWith('\n') ? '' : '\n'}\n\`\`\``
  }

  const stripped = content.replace(/```/g, '')
  const inlineCount = (stripped.match(/`/g) || []).length
  if (inlineCount % 2 !== 0) {
    content += '`'
  }

  return content
}
