import { defineConfig } from 'oxlint'

export default defineConfig({
  plugins: [
    'eslint',
    'typescript',

    'node',
    'import',

    'react',
    'react-perf',
    'jsx-a11y',

    'unicorn',
    'promise',
    'oxc',
  ],
})
