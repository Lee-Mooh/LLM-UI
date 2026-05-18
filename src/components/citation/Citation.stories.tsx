import { type Meta, type StoryObj } from '@storybook/react-vite'

import { Citation, type CitationItem } from './Citation'

const meta: Meta<typeof Citation> = {
  title: 'Components/Citation',
  component: Citation,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 760, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Citation>

function BilibiliIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
    >
      <path
        d="m7 4 2.5 3M17 4l-2.5 3M6.5 8h11A3.5 3.5 0 0 1 21 11.5v4A3.5 3.5 0 0 1 17.5 19h-11A3.5 3.5 0 0 1 3 15.5v-4A3.5 3.5 0 0 1 6.5 8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M8 13h.01M16 13h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.8"
      />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      height="20"
      viewBox="0 0 24 24"
      width="20"
    >
      <path d="M12 2.3a9.7 9.7 0 0 0-3.1 18.9c.5.1.7-.2.7-.5v-1.8c-2.9.6-3.5-1.2-3.5-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 0 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-2.3-.3-4.7-1.2-4.7-5.1 0-1.1.4-2.1 1.1-2.8-.1-.3-.5-1.4.1-2.8 0 0 .9-.3 2.9 1.1.8-.2 1.7-.3 2.6-.3s1.8.1 2.6.3c2-1.4 2.9-1.1 2.9-1.1.6 1.4.2 2.5.1 2.8.7.8 1.1 1.7 1.1 2.8 0 4-2.4 4.8-4.7 5.1.4.3.7 1 .7 2v2.9c0 .3.2.6.7.5A9.7 9.7 0 0 0 12 2.3Z" />
    </svg>
  )
}

const citationItems: CitationItem[] = [
  {
    key: 'bilibili',
    title: 'Data source from bilibili',
    icon: <BilibiliIcon />,
  },
  {
    key: 'github',
    title: 'Data source from GitHub',
    icon: <GitHubIcon />,
  },
]

export const Basic: Story = {
  args: {
    items: citationItems,
  },
}

export const Collapsed: Story = {
  args: {
    defaultExpanded: false,
    items: citationItems,
  },
}

export const CustomTitle: Story = {
  args: {
    title: 'Used 2 sources',
    items: citationItems,
  },
}

export const Empty: Story = {
  args: {
    items: [],
  },
}
