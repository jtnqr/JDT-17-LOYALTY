import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['json', 'json-summary', 'lcov'],
      exclude: [
        'next.config.ts',
        'postcss.config.mjs',
        'tailwind.config.ts',
        'src/app/layout.tsx',
        'src/components/Providers.tsx',
        'src/lib/mocks.ts',
        'src/types/**',
        '**/*.d.ts',
        '**/*.test.*',
      ],
    },
  },
})
