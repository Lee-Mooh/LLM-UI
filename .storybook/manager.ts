import { addons } from 'storybook/manager-api'
import { themes } from 'storybook/theming'

function setStorybookTheme(theme: 'light' | 'dark') {
  addons.setConfig({
    theme: theme === 'dark' ? themes.dark : themes.light,
  })
}

setStorybookTheme('light')

window.addEventListener('message', (event: MessageEvent<unknown>) => {
  const data = event.data

  if (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    'theme' in data &&
    data.type === 'llm-ui-theme-change' &&
    (data.theme === 'light' || data.theme === 'dark')
  ) {
    setStorybookTheme(data.theme)
  }
})
