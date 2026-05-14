import { useEffect, useState } from 'react'
import ShikiHighlighter from 'react-shiki'

import cn from '../../utils/cn'

export interface CodeHighlighterProps {
  code: string
  copyable?: boolean
  language?: string
  showLineNumbers?: boolean
  startingLineNumber?: number
  className?: string
}

function getLanguageLabel(language: string) {
  const normalizedLanguage = language.toLowerCase()
  const labels: Record<string, string> = {
    astro: 'Astro',
    bash: 'Bash',
    bat: 'Batch',
    c: 'C',
    cpp: 'C++',
    'c++': 'C++',
    csharp: 'C#',
    cs: 'C#',
    css: 'CSS',
    dart: 'Dart',
    diff: 'Diff',
    docker: 'Dockerfile',
    dockerfile: 'Dockerfile',
    elixir: 'Elixir',
    ex: 'Elixir',
    go: 'Go',
    graphql: 'GraphQL',
    groovy: 'Groovy',
    html: 'HTML',
    java: 'Java',
    javascript: 'JavaScript',
    js: 'JavaScript',
    json: 'JSON',
    jsonc: 'JSONC',
    jsx: 'JavaScript JSX',
    kotlin: 'Kotlin',
    kt: 'Kotlin',
    less: 'Less',
    lua: 'Lua',
    markdown: 'Markdown',
    md: 'Markdown',
    objectivec: 'Objective-C',
    objc: 'Objective-C',
    perl: 'Perl',
    php: 'PHP',
    plaintext: 'Plain Text',
    powershell: 'PowerShell',
    prisma: 'Prisma',
    ps1: 'PowerShell',
    py: 'Python',
    python: 'Python',
    r: 'R',
    rb: 'Ruby',
    ruby: 'Ruby',
    rust: 'Rust',
    rs: 'Rust',
    sass: 'Sass',
    scala: 'Scala',
    scss: 'SCSS',
    shell: 'Shell',
    sh: 'Shell',
    sql: 'SQL',
    svelte: 'Svelte',
    swift: 'Swift',
    text: 'Plain Text',
    toml: 'TOML',
    ts: 'TypeScript',
    tsx: 'TypeScript TSX',
    typescript: 'TypeScript',
    vue: 'Vue',
    wasm: 'WebAssembly',
    xml: 'XML',
    yaml: 'YAML',
    yml: 'YAML',
    zig: 'Zig',
  }

  return labels[normalizedLanguage] ?? language
}

function CodeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="llm-code-highlighter__code-icon"
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m9 18-6-6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="m15 6 6 6-6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg
      aria-hidden="true"
      className="llm-code-highlighter__copy-icon"
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        height="13"
        rx="2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        width="13"
        x="9"
        y="2"
      />
      <path
        d="M5 9H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="llm-code-highlighter__copy-icon"
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m20 6-11 11-5-5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

export function CodeHighlighter({
  code,
  copyable = true,
  language = 'text',
  showLineNumbers = false,
  startingLineNumber = 1,
  className,
}: CodeHighlighterProps) {
  const [copied, setCopied] = useState(false)
  const languageLabel = getLanguageLabel(language)

  useEffect(() => {
    if (!copied) return

    const timer = window.setTimeout(() => {
      setCopied(false)
    }, 1500)

    return () => window.clearTimeout(timer)
  }, [copied])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
  }

  return (
    <div className={cn('llm-code-highlighter', className)}>
      <div className="llm-code-highlighter__header">
        <div className="llm-code-highlighter__title">
          <CodeIcon />
          <span className="llm-code-highlighter__language">
            {languageLabel}
          </span>
        </div>
        {copyable ? (
          <button
            aria-label={copied ? 'Code copied' : 'Copy code'}
            className="llm-code-highlighter__copy"
            onClick={handleCopy}
            type="button"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        ) : null}
      </div>

      <div className="llm-code-highlighter__body">
        <ShikiHighlighter
          addDefaultStyles={false}
          defaultColor="light-dark()"
          language={language}
          showLanguage={false}
          showLineNumbers={showLineNumbers}
          startingLineNumber={startingLineNumber}
          theme={{ light: 'github-light', dark: 'github-dark' }}
        >
          {code}
        </ShikiHighlighter>
      </div>
    </div>
  )
}
