import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/style.ts'),
      fileName: 'style',
      formats: ['es'],
    },
  },
})
