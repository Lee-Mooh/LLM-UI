import type { Preview, StoryContext } from '@storybook/react-vite'
import '../src/index.css'
import './preview.css'

const withTheme = (Story: () => React.JSX.Element, context: StoryContext) => {
  const theme = context.globals.theme === 'dark' ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  window.parent.postMessage({ type: 'llm-ui-theme-change', theme }, '*')
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

  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      test: 'todo',
    },
  },
}

export default preview
