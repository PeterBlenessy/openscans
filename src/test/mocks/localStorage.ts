/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Reusable localStorage mock utilities
 *
 * Helper functions for testing localStorage persistence in stores.
 * The actual localStorage mock is set up in setup.ts.
 */

import { vi } from 'vitest'

/**
 * Clear localStorage between tests
 */
export function clearLocalStorage() {
  localStorage.clear()
}

/**
 * Set mock localStorage data
 */
export function setMockLocalStorage(data: Record<string, any>) {
  Object.entries(data).forEach(([key, value]) => {
    localStorage.setItem(key, JSON.stringify(value))
  })
}

/**
 * Get parsed localStorage data
 */
export function getMockLocalStorage(key: string): any {
  const item = localStorage.getItem(key)
  return item ? JSON.parse(item) : null
}

/**
 * Spy on localStorage methods
 */
export function spyOnLocalStorage() {
  return {
    getItem: vi.spyOn(Storage.prototype, 'getItem'),
    setItem: vi.spyOn(Storage.prototype, 'setItem'),
    removeItem: vi.spyOn(Storage.prototype, 'removeItem'),
    clear: vi.spyOn(Storage.prototype, 'clear'),
  }
}
