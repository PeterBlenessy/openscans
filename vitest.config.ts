import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

// https://vitest.dev/config/
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Test environment
      environment: 'jsdom',

      // Global setup
      setupFiles: ['./src/test/setup.ts'],

      // Coverage configuration
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'json'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.d.ts',
          '**/*.config.*',
          '**/mockData',
          '**/dist/',
          '**/.{idea,git,cache,output,temp}/',
        ],

        // Tiered coverage thresholds
        thresholds: {
          // Overall project: 70%+
          lines: 70,
          functions: 70,
          branches: 70,
          statements: 70,
        },
      },

      // Test globals (optional - enables describe, it, expect without imports)
      globals: true,

      // Include/exclude patterns
      include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      // Exclude the Playwright e2e suite — those specs use the Playwright
      // runner (test.beforeEach etc.) and must not be executed by vitest.
      exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'e2e/**'],

      // Timeout
      testTimeout: 10000,
    },
  })
)
