/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Global test setup for Vitest
 *
 * This file runs before all tests and sets up the testing environment.
 * - Mocks browser APIs (localStorage, FileReader)
 * - Configures @testing-library/jest-dom matchers
 * - Sets up global test utilities
 */

import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock FileReader for DICOM file loading
class FileReaderMock {
  result: ArrayBuffer | string | null = null
  error: Error | null = null
  readyState: number = 0
  onload: ((event: ProgressEvent) => void) | null = null
  onerror: ((event: ProgressEvent) => void) | null = null
  onloadend: ((event: ProgressEvent) => void) | null = null

  readAsArrayBuffer(blob: Blob) {
    this.readyState = 2 // DONE
    // Mock ArrayBuffer with some data
    this.result = new ArrayBuffer(8)
    if (this.onloadend) {
      this.onloadend({ target: this } as ProgressEvent)
    }
  }

  readAsDataURL(blob: Blob) {
    this.readyState = 2 // DONE
    this.result = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    if (this.onloadend) {
      this.onloadend({ target: this } as ProgressEvent)
    }
  }

  readAsText(blob: Blob) {
    this.readyState = 2 // DONE
    this.result = 'mock file content'
    if (this.onloadend) {
      this.onloadend({ target: this } as ProgressEvent)
    }
  }

  abort() {
    // No-op
  }

  addEventListener(type: string, listener: EventListener) {
    // No-op
  }

  removeEventListener(type: string, listener: EventListener) {
    // No-op
  }

  dispatchEvent(event: Event): boolean {
    return true
  }
}

// @ts-expect-error - FileReader mock
global.FileReader = FileReaderMock as any

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock IntersectionObserver (used by some UI components)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
} as any

// Mock ResizeObserver (used by some UI components)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any

// Suppress console errors in tests (optional - uncomment if needed)
// global.console.error = vi.fn()
// global.console.warn = vi.fn()
