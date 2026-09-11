import react from '@vitejs/plugin-react'
import rsc from '@vitejs/plugin-rsc'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    rsc({
      entries: {
        rsc: './src/framework/entry.rsc.tsx',
        ssr: './src/framework/entry.ssr.tsx',
        client: './src/framework/entry.browser.tsx',
      },
    }),
  ],
  resolve: { tsconfigPaths: true },
  build: {
    sourcemap: true,
    target: 'es2022',
  },
})
