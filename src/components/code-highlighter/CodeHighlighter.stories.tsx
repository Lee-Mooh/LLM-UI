import { type Meta, type StoryObj } from '@storybook/react-vite'

import { CodeHighlighter } from './CodeHighlighter'

const meta: Meta<typeof CodeHighlighter> = {
  title: 'Components/CodeHighlighter',
  component: CodeHighlighter,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof CodeHighlighter>

const longPythonCode = `from dataclasses import dataclass
from datetime import datetime
from typing import Literal

MessageRole = Literal['user', 'assistant', 'system']

@dataclass
class Message:
    id: str
    role: MessageRole
    content: str
    created_at: datetime


def append_message(messages: list[Message], next_message: Message) -> list[Message]:
    return sorted([*messages, next_message], key=lambda message: message.created_at)


message = append_message(
    [],
    Message(
        id='msg_001',
        role='assistant',
        content='This is a very long line used to demonstrate horizontal scrolling in the code highlighter component without wrapping the code content unexpectedly.',
        created_at=datetime.now(),
    ),
)`

export const Example: Story = {
  args: {
    language: 'python',
    code: `def greet(name: str) -> str:
    return f'Hello, {name}!'


print(greet('World'))`,
  },
}

export const LongCode: Story = {
  args: {
    code: longPythonCode,
    language: 'python',
  },
}

export const WithLineNumbers: Story = {
  args: {
    code: longPythonCode,
    language: 'python',
    showLineNumbers: true,
  },
}
