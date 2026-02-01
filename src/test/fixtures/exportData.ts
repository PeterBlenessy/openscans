/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Test export data fixtures
 *
 * Fixtures for testing export functionality (PDF, PNG, batch exports).
 * Includes mock settings and expected export results.
 */

import { vi } from 'vitest'
import type { DicomInstance } from '@/types'
import { createMockInstance } from './dicomData'

/**
 * Mock export settings (matches ExportSettings type)
 */
export const mockExportSettings = {
  includePatientData: false, // Privacy: default to false
  scale: 1,
  format: 'png' as const,
}

/**
 * Mock export settings with patient data enabled
 */
export const mockExportSettingsWithPatientData = {
  ...mockExportSettings,
  includePatientData: true,
}

/**
 * Expected filename patterns for privacy testing
 */
export const filenamePatterns = {
  withoutPatientData: /^MR - .+ - \d+\.(png|jpg|pdf)$/,
  withPatientData: /^MR - TEST\^PATIENT - PAT12345 - .+ - \d+\.(png|jpg|pdf)$/,
  fallbackTimestamp: /^MR - \d{8}_\d{6}\.(png|jpg|pdf)$/,
}

/**
 * Mock instance for export testing (with sensitive patient data)
 */
export const mockInstanceForExport: DicomInstance = createMockInstance({
  metadata: {
    patientName: 'TEST^PATIENT',
    patientID: 'PAT12345',
    studyDescription: 'Brain MRI',
    seriesDescription: 'T1 MPRAGE SAG',
    studyDate: '20240101',
    instanceNumber: 5,
    modality: 'MR',
  },
})

/**
 * Mock instance with missing metadata (edge case for filename generation)
 */
export const mockInstanceWithMissingMetadata: DicomInstance = createMockInstance({
  metadata: {
    patientName: undefined,
    patientID: undefined,
    studyDescription: undefined,
    seriesDescription: undefined,
    studyDate: undefined,
  },
})

/**
 * Mock batch export data (multiple instances for grid export)
 */
export const mockBatchExportInstances: DicomInstance[] = [
  createMockInstance({ metadata: { instanceNumber: 1, seriesDescription: 'T1 SAG' } }),
  createMockInstance({ metadata: { instanceNumber: 2, seriesDescription: 'T1 SAG' } }),
  createMockInstance({ metadata: { instanceNumber: 3, seriesDescription: 'T2 AX' } }),
  createMockInstance({ metadata: { instanceNumber: 4, seriesDescription: 'T2 AX' } }),
  createMockInstance({ metadata: { instanceNumber: 5, seriesDescription: 'FLAIR' } }),
  createMockInstance({ metadata: { instanceNumber: 6, seriesDescription: 'FLAIR' } }),
  createMockInstance({ metadata: { instanceNumber: 7, seriesDescription: 'DWI' } }),
  createMockInstance({ metadata: { instanceNumber: 8, seriesDescription: 'DWI' } }),
  createMockInstance({ metadata: { instanceNumber: 9, seriesDescription: 'ADC' } }),
]

/**
 * Expected grid layouts for batch export testing
 */
export const gridLayouts = {
  '1x1': { rows: 1, cols: 1, total: 1 },
  '2x2': { rows: 2, cols: 2, total: 4 },
  '2x3': { rows: 2, cols: 3, total: 6 },
  '3x3': { rows: 3, cols: 3, total: 9 },
  '4x4': { rows: 4, cols: 4, total: 16 },
} as const

/**
 * Mock HTML canvas element for export testing
 */
export function createMockCanvas(width = 512, height = 512): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  // Mock getContext
  const mockContext = {
    fillStyle: '',
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height,
    })),
    putImageData: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
  }

  canvas.getContext = vi.fn(() => mockContext as any)

  return canvas
}

/**
 * Mock Blob for file export testing
 */
export function createMockBlob(content = 'mock pdf content'): Blob {
  return new Blob([content], { type: 'application/pdf' })
}
