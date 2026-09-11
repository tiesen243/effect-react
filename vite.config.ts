import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import rsc from '@vitejs/plugin-rsc'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [rsc(), react(), tailwindcss()],
  resolve: { tsconfigPaths: true },
  environments: {
    rsc: {
      build: {
        rollupOptions: {
          input: {
            index: './src/core/entry.rsc.tsx',
          },
        },
      },
    },
    ssr: {
      build: {
        rollupOptions: {
          input: {
            index: './src/core/entry.ssr.tsx',
          },
        },
      },
    },
    client: {
      build: {
        rollupOptions: {
          input: {
            index: './src/core/entry.client.tsx',
          },
        },
      },
    },
  },
})
