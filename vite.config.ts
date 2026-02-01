import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Default port for web mode is 3001
    // Tauri dev will override to 5173 via CLI flag
    port: 3001,
    // Only auto-open browser in pure web mode, not when Tauri launches it
    open: !process.env.TAURI_ENV_PLATFORM,
    watch: {
      ignored: ['**/node_modules/**'],
    },
    // Configure headers for Tauri to allow workers
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  logLevel: 'warn', // Suppress source map warnings in dev
  optimizeDeps: {
    exclude: [],
    // Include cornerstone-wado-image-loader to ensure proper bundling
    include: ['cornerstone-wado-image-loader'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Increase chunk size warning limit (we're aware of large medical imaging libraries)
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Ensure workers are bundled as separate files with proper naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        // Exclude source maps for workers to avoid Tauri errors
        sourcemapExcludeSources: true,
        // Manual chunking for better code splitting and caching
        manualChunks: (id) => {
          // AI SDKs - separate chunks (lazy loaded, highest priority to avoid bundling in main)
          if (id.includes('node_modules/@anthropic-ai/sdk')) {
            return 'vendor-ai-claude'
          }
          if (id.includes('node_modules/@google/genai')) {
            return 'vendor-ai-gemini'
          }
          if (id.includes('node_modules/openai')) {
            return 'vendor-ai-openai'
          }

          // Export libraries - separate chunk (lazy loaded)
          if (
            id.includes('node_modules/jspdf') ||
            id.includes('node_modules/html-to-image') ||
            id.includes('node_modules/file-saver')
          ) {
            return 'vendor-export'
          }

          // Markdown rendering - separate chunk (lazy loaded)
          if (id.includes('node_modules/react-markdown') || id.includes('node_modules/remark-gfm')) {
            return 'vendor-markdown'
          }

          // Cornerstone medical imaging chunk (keep together for performance)
          if (
            id.includes('node_modules/cornerstone-core') ||
            id.includes('node_modules/cornerstone-tools') ||
            id.includes('node_modules/cornerstone-wado-image-loader') ||
            id.includes('node_modules/dicom-parser') ||
            id.includes('node_modules/dcmjs')
          ) {
            return 'cornerstone'
          }

          // UI library chunk (Radix UI, Headless UI)
          if (id.includes('node_modules/@radix-ui') || id.includes('node_modules/@headlessui')) {
            return 'vendor-ui'
          }

          // React vendor chunk (includes react, react-dom, and scheduler)
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/scheduler')) {
            return 'vendor-react'
          }

          // Zustand and state management
          if (id.includes('node_modules/zustand')) {
            return 'vendor-state'
          }

          // Don't chunk remaining node_modules - let Rollup decide
          // This avoids circular dependencies
        },
      }
    }
  },
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        // Ensure worker files are properly named and accessible
        entryFileNames: 'worker-[name]-[hash].js',
      }
    }
  },
})
