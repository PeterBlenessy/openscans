/**
 * Unit tests for fileNaming - PRIVACY CRITICAL
 *
 * Critical privacy compliance tests:
 * - Patient data EXCLUDED by default (HIPAA compliance)
 * - Patient ID ONLY included when explicitly enabled
 * - Special character sanitization (prevent file system issues)
 * - Fallback to timestamp when metadata missing
 *
 * Target: ~15 assertions, 95%+ coverage
 */

import { describe, it, expect } from 'vitest'
import { generateFilename, previewFilename } from './fileNaming'
import { createMockInstance } from '@/test/fixtures/dicomData'
import type { DicomInstance } from '@/types'

describe('fileNaming - Privacy Compliance', () => {
  describe('generateFilename', () => {
    it('should NOT include patient data by default', () => {
      const instance = createMockInstance({
        metadata: {
          patientName: 'SENSITIVE^PATIENT',
          patientID: 'SENSITIVE123',
          modality: 'MR',
          seriesDescription: 'T1 MPRAGE SAG',
          instanceNumber: 5,
        },
      })

      const filename = generateFilename(instance, 'png', false)

      expect(filename).not.toContain('SENSITIVE')
      expect(filename).not.toContain('PATIENT')
      expect(filename).not.toContain('123')
      expect(filename).toContain('MR') // Should include modality instead
    })

    it('should include patient ID ONLY when explicitly enabled', () => {
      const instance = createMockInstance({
        metadata: {
          patientID: 'PAT12345',
          modality: 'MR',
          seriesDescription: 'T1 MPRAGE SAG',
          instanceNumber: 5,
        },
      })

      const filename = generateFilename(instance, 'png', true)

      expect(filename).toContain('PAT12345')
    })

    it('should NOT include patient name even when includePatientID is true', () => {
      const instance = createMockInstance({
        metadata: {
          patientName: 'DOE^JOHN',
          patientID: 'PAT12345',
          modality: 'MR',
          seriesDescription: 'T1 MPRAGE SAG',
          instanceNumber: 5,
        },
      })

      const filename = generateFilename(instance, 'png', true)

      expect(filename).toContain('PAT12345')
      expect(filename).not.toContain('DOE')
      expect(filename).not.toContain('JOHN')
    })

    it('should sanitize special characters in patient ID', () => {
      const instance = createMockInstance({
        metadata: {
          patientID: 'PAT-123/456@HOSPITAL',
          modality: 'MR',
          seriesDescription: 'T1 MPRAGE SAG',
          instanceNumber: 5,
        },
      })

      const filename = generateFilename(instance, 'png', true)

      // Special characters should be replaced with underscores in patient ID
      expect(filename).toContain('PAT_123_456_HOSPITAL')
      // Check patient ID part doesn't have special chars (excluding hyphens used as separators)
      const patientIdPart = filename.split(' - ')[0]
      expect(patientIdPart).not.toMatch(/[/@]/)
    })

    it('should format filename correctly without patient data', () => {
      const instance = createMockInstance({
        metadata: {
          modality: 'MR',
          seriesDescription: 'T1 MPRAGE SAG',
          instanceNumber: 5,
        },
      })

      const filename = generateFilename(instance, 'png', false)

      // Format: MR - {formatted series description} - 5.png
      expect(filename).toMatch(/^MR - .+ - \d+\.png$/)
      expect(filename).toContain('5')
      expect(filename.endsWith('.png')).toBe(true)
      // Series description is formatted by formatSeriesDescription
      expect(filename).toContain('T1')
    })

    it('should use series number when description missing', () => {
      const instance = createMockInstance({
        metadata: {
          modality: 'MR',
          seriesDescription: undefined,
          seriesNumber: 3,
          instanceNumber: 5,
        },
      })

      const filename = generateFilename(instance, 'png', false)

      expect(filename).toContain('Series 3')
    })

    it('should handle missing instance number gracefully', () => {
      const instance = createMockInstance({
        metadata: {
          modality: 'MR',
          seriesDescription: 'T1 MPRAGE SAG',
          instanceNumber: undefined,
        },
      })

      const filename = generateFilename(instance, 'png', false)

      // Should not have instance number in filename
      expect(filename).toMatch(/^MR - .+\.png$/)
      expect(filename).toContain('T1')
    })

    it('should fall back to timestamp when metadata missing', () => {
      const instance: DicomInstance = {
        sopInstanceUID: '1.2.3.4',
        instanceNumber: 1,
        imageId: 'mock://image',
        rows: 512,
        columns: 512,
        metadata: undefined, // No metadata
      }

      const filename = generateFilename(instance, 'png', false)

      expect(filename).toMatch(/^DICOM_Export_\d+\.png$/)
    })

    it('should fall back to timestamp when instance is null', () => {
      const filename = generateFilename(null, 'png', false)

      expect(filename).toMatch(/^DICOM_Export_\d+\.png$/)
    })

    it('should use correct file extension', () => {
      const instance = createMockInstance()

      const pngFilename = generateFilename(instance, 'png', false)
      const jpgFilename = generateFilename(instance, 'jpg', false)
      const pdfFilename = generateFilename(instance, 'pdf', false)

      expect(pngFilename.endsWith('.png')).toBe(true)
      expect(jpgFilename.endsWith('.jpg')).toBe(true)
      expect(pdfFilename.endsWith('.pdf')).toBe(true)
    })

    it('should use modality as default when no patient ID', () => {
      const instance = createMockInstance({
        metadata: {
          patientID: undefined,
          modality: 'CT',
          seriesDescription: 'CHEST CT',
          instanceNumber: 10,
        },
      })

      const filename = generateFilename(instance, 'png', false)

      expect(filename.startsWith('CT')).toBe(true)
    })

    it('should use DICOM as fallback when no modality', () => {
      const instance = createMockInstance({
        metadata: {
          patientID: undefined,
          modality: undefined,
          seriesDescription: 'Unknown Series',
          instanceNumber: 1,
        },
      })

      const filename = generateFilename(instance, 'png', false)

      expect(filename.startsWith('DICOM')).toBe(true)
    })

    it('should use DICOM when only instance metadata missing', () => {
      const instance = createMockInstance({
        metadata: {
          patientID: undefined,
          modality: undefined,
          seriesDescription: undefined,
          seriesNumber: undefined,
          instanceNumber: undefined,
        },
      })

      const filename = generateFilename(instance, 'png', false)

      // When modality defaults to 'DICOM', it's still a valid part
      // Only falls back to timestamp if parts.length === 0
      expect(filename).toBe('DICOM.png')
    })
  })

  describe('previewFilename', () => {
    it('should generate preview filename with lowercase extension', () => {
      const instance = createMockInstance({
        metadata: {
          modality: 'MR',
          seriesDescription: 'T1 MPRAGE SAG',
          instanceNumber: 5,
        },
      })

      const filename = previewFilename(instance, 'PNG', false)

      expect(filename.endsWith('.png')).toBe(true) // Lowercase
    })

    it('should pass through includePatientID flag', () => {
      const instance = createMockInstance({
        metadata: {
          patientID: 'PAT12345',
          modality: 'MR',
          seriesDescription: 'T1 MPRAGE SAG',
          instanceNumber: 5,
        },
      })

      const withoutPatient = previewFilename(instance, 'png', false)
      const withPatient = previewFilename(instance, 'png', true)

      expect(withoutPatient).not.toContain('PAT12345')
      expect(withPatient).toContain('PAT12345')
    })

    it('should default to excluding patient data', () => {
      const instance = createMockInstance({
        metadata: {
          patientID: 'PAT12345',
          modality: 'MR',
          seriesDescription: 'T1 MPRAGE SAG',
          instanceNumber: 5,
        },
      })

      // Call without includePatientID parameter (should default to false)
      const filename = previewFilename(instance, 'png')

      expect(filename).not.toContain('PAT12345')
    })
  })
})
