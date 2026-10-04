import { defineConfig } from 'vite-plus'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  pack: {
    entry: [
      'src/index.ts',
      'src/*/dtos/*.dto.ts',
      'src/*/schemas/*.{schema,error}.ts',
    ],
    deps: {
      // tsdown <0.23 compatibility: resolve external dependency subpaths.
      // Remove to preserve subpath imports as written (the new default).
      // https://tsdown.dev/options/dependencies#deps-resolvedepsubpath
      resolveDepSubpath: true,
    },
    dts: {
      generator: 'tsgo',
    },
    exports: true,
  },
})
