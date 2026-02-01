/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Mock for Cornerstone.js
 *
 * Cornerstone is a complex medical imaging library with WebGL dependencies
 * that are difficult to test in jsdom. This mock provides a minimal API
 * that allows testing component logic without actual image rendering.
 *
 * Usage in tests:
 *   vi.mock('cornerstone-core', () => import('@/test/mocks/cornerstone'))
 */

import { vi } from 'vitest'

export interface MockImage {
  imageId: string
  minPixelValue: number
  maxPixelValue: number
  slope: number
  intercept: number
  windowCenter: number
  windowWidth: number
  render: any
  getPixelData: () => Uint8Array
  rows: number
  columns: number
  height: number
  width: number
  color: boolean
  columnPixelSpacing: number
  rowPixelSpacing: number
  invert: boolean
  sizeInBytes: number
}

export interface MockViewport {
  scale: number
  translation: { x: number; y: number }
  voi: {
    windowWidth: number
    windowCenter: number
  }
  invert: boolean
  pixelReplication: boolean
  rotation: number
  hflip: boolean
  vflip: boolean
  modalityLUT: any
  voiLUT: any
}

// Mock enabled elements registry
const enabledElements = new Map<HTMLElement, any>()

// Create a mock image
export function createMockImage(imageId = 'mock://image/1'): MockImage {
  return {
    imageId,
    minPixelValue: 0,
    maxPixelValue: 4095,
    slope: 1,
    intercept: 0,
    windowCenter: 2048,
    windowWidth: 4096,
    render: null,
    getPixelData: () => new Uint8Array(512 * 512),
    rows: 512,
    columns: 512,
    height: 512,
    width: 512,
    color: false,
    columnPixelSpacing: 1.0,
    rowPixelSpacing: 1.0,
    invert: false,
    sizeInBytes: 512 * 512 * 2,
  }
}

// Create a mock viewport
export function createMockViewport(): MockViewport {
  return {
    scale: 1.0,
    translation: { x: 0, y: 0 },
    voi: {
      windowWidth: 4096,
      windowCenter: 2048,
    },
    invert: false,
    pixelReplication: false,
    rotation: 0,
    hflip: false,
    vflip: false,
    modalityLUT: undefined,
    voiLUT: undefined,
  }
}

// Mock Cornerstone API
export const cornerstone = {
  // Element management
  enable: vi.fn((element: HTMLElement) => {
    enabledElements.set(element, {
      element,
      image: null,
      viewport: createMockViewport(),
      canvas: document.createElement('canvas'),
    })
  }),

  disable: vi.fn((element: HTMLElement) => {
    enabledElements.delete(_element)
  }),

  getEnabledElement: vi.fn((element: HTMLElement) => {
    const enabled = enabledElements.get(_element)
    if (!enabled) {
      throw new Error('Element is not enabled')
    }
    return enabled
  }),

  // Image loading
  loadImage: vi.fn((imageId: string) => {
    return Promise.resolve(createMockImage(_imageId))
  }),

  loadAndCacheImage: vi.fn((imageId: string) => {
    return Promise.resolve(createMockImage(_imageId))
  }),

  // Image display
  displayImage: vi.fn((element: HTMLElement, image: MockImage) => {
    const enabled = enabledElements.get(_element)
    if (enabled) {
      enabled.image = image
    }
  }),

  // Viewport management
  getViewport: vi.fn((element: HTMLElement): MockViewport => {
    const enabled = enabledElements.get(_element)
    return enabled?.viewport || createMockViewport()
  }),

  setViewport: vi.fn((element: HTMLElement, viewport: Partial<MockViewport>) => {
    const enabled = enabledElements.get(_element)
    if (enabled) {
      enabled.viewport = { ...enabled.viewport, ...viewport }
    }
  }),

  reset: vi.fn((element: HTMLElement) => {
    const enabled = enabledElements.get(_element)
    if (enabled) {
      enabled.viewport = createMockViewport()
    }
  }),

  // Rendering
  updateImage: vi.fn((element: HTMLElement) => {
    // No-op in tests
  }),

  draw: vi.fn((element: HTMLElement) => {
    // No-op in tests
  }),

  invalidate: vi.fn((element: HTMLElement) => {
    // No-op in tests
  }),

  // Image cache
  imageCache: {
    cachedImages: [],
    maximumSizeInBytes: 1024 * 1024 * 1024, // 1GB
    cacheSizeInBytes: 0,
    putImagePromise: vi.fn(),
    getImagePromise: vi.fn(),
    removeImagePromise: vi.fn(),
    purgeCache: vi.fn(),
  },

  // Events
  events: {
    IMAGE_RENDERED: 'cornerstoneimagerendered',
    IMAGE_LOADED: 'cornerstoneimageloaded',
    NEW_IMAGE: 'cornerstonenewimage',
    ELEMENT_ENABLED: 'cornerstoneelementenabled',
    ELEMENT_DISABLED: 'cornerstoneelementdisabled',
  },

  // Metadata
  metaData: {
    get: vi.fn((type: string, imageId: string) => {
      if (type === 'imagePlaneModule') {
        return {
          rows: 512,
          columns: 512,
          rowPixelSpacing: 1.0,
          columnPixelSpacing: 1.0,
        }
      }
      return null
    }),
    add: vi.fn(),
    remove: vi.fn(),
  },

  // Pixel data
  getPixels: vi.fn((element: HTMLElement, x: number, y: number, width: number, height: number) => {
    return new Uint8Array(width * height)
  }),

  getStoredPixels: vi.fn((element: HTMLElement, x: number, y: number, width: number, height: number) => {
    return new Uint8Array(width * height)
  }),

  // Utilities
  pageToPixel: vi.fn((element: HTMLElement, pageX: number, pageY: number) => {
    return { x: pageX, y: pageY }
  }),

  registerImageLoader: vi.fn(),
  unregisterImageLoader: vi.fn(),
}

// Default export
export default cornerstone
