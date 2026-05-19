import { addons } from 'storybook/manager-api'
import { themes } from 'storybook/theming'

type StorybookTheme = 'light' | 'dark'

type ThemeMessage = {
  theme?: unknown
  type?: unknown
}

function isStorybookTheme(theme: unknown): theme is StorybookTheme {
  return theme === 'light' || theme === 'dark'
}

function setStorybookTheme(theme: StorybookTheme) {
  addons.setConfig({
    theme: theme === 'dark' ? themes.dark : themes.light,
  })
}

function getThemeFromUrl() {
  const globals = new URLSearchParams(window.location.search).get('globals')

  if (!globals) return null

  const themeEntry = globals
    .split(';')
    .find((entry) => entry.startsWith('theme:'))

  const theme = themeEntry?.split(':')[1]

  return isStorybookTheme(theme) ? theme : null
}

function getThemeFromPayload(payload: unknown) {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('globals' in payload)
  ) {
    return null
  }

  const globals = payload.globals

  if (
    typeof globals !== 'object' ||
    globals === null ||
    !('theme' in globals)
  ) {
    return null
  }

  return isStorybookTheme(globals.theme) ? globals.theme : null
}

setStorybookTheme(getThemeFromUrl() ?? 'light')

addons.getChannel().on('globalsUpdated', (payload) => {
  const theme = getThemeFromPayload(payload)

  if (theme) {
    setStorybookTheme(theme)
  }
})

window.addEventListener('popstate', () => {
  setStorybookTheme(getThemeFromUrl() ?? 'light')
})

window.addEventListener('message', (event: MessageEvent<ThemeMessage>) => {
  const data = event.data

  if (data.type === 'llm-ui-theme-change' && isStorybookTheme(data.theme)) {
    setStorybookTheme(data.theme)
  }
})
