import { defineConfig } from 'vite-plus'

import fmt from './oxfmt.config'
import lint from './oxlint.config'

export default defineConfig({
  staged: { '*': 'vp check --fix' },
  fmt,
  lint,
  run: { cache: true },
})
