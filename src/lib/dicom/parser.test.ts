/**
 * Unit tests for DICOM parser - MEDICAL SAFETY CRITICAL
 *
 * Critical medical safety tests:
 * - Pixel data filtering (DICOMDIR detection)
 * - Metadata extraction with missing tags
 * - Study/series/instance organization
 * - Compression type detection
 * - Window/Level defaults by modality
 *
 * Target: ~40 assertions, 90%+ coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { parseDicomFiles, loadSingleDicomFile } from './parser'
import {
  createMockDataSet,
  createMockMRDataSet,
  createMockCTDataSet,
  createMockDICOMDIRDataSet,
} from '@/test/mocks/dicom'

// Mock dicom-parser
vi.mock('dicom-parser', () => ({
  parseDicom: vi.fn((_byteArray: Uint8Array) => {
    // Return a mock dataset based on what's being parsed
    // We'll control this in individual tests
    return createMockMRDataSet()
  }),
}))

// Mock cornerstone image ID creation
vi.mock('../cornerstone/initCornerstone', () => ({
  createImageId: vi.fn((file: File) => `wadouri:${file.name}`),
}))

// Mock directory handle storage
vi.mock('../storage/directoryHandleStorage', () => ({
  saveDirectoryHandle: vi.fn(),
}))

/**
 * Create a mock File with arrayBuffer() method for DICOM parsing
 */
function createMockFile(name: string, size: number = 1024): File {
  const buffer = new ArrayBuffer(size)
  const blob = new Blob([buffer], { type: 'application/dicom' })
  const file = new File([blob], name, { type: 'application/dicom' })

  // Add arrayBuffer method that File API provides
  Object.defineProperty(file, 'arrayBuffer', {
    value: async () => buffer,
    writable: false,
  })

  return file
}

describe('DICOM Parser - Medical Safety', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('parseDicomFiles - Pixel Data Filtering', () => {
    it('should parse files with pixel data (actual images)', async () => {
      const dicomParser = await import('dicom-parser')

      // Mock dataset with pixel data
      vi.mocked(dicomParser.parseDicom).mockReturnValue(createMockMRDataSet())

      const file = createMockFile('image.dcm')

      const studies = await parseDicomFiles([file])

      expect(studies).toHaveLength(1)
      expect(studies[0].series).toHaveLength(1)
      expect(studies[0].series[0].instances).toHaveLength(1)
    })

    it('should filter out DICOMDIR files (no pixel data)', async () => {
      const dicomParser = await import('dicom-parser')

      // Mock DICOMDIR dataset (no pixel data tag)
      vi.mocked(dicomParser.parseDicom).mockReturnValue(createMockDICOMDIRDataSet())

      const file = createMockFile('DICOMDIR')

      const studies = await parseDicomFiles([file])

      // Should be empty because DICOMDIR has no pixel data
      expect(studies).toHaveLength(0)
    })

    it('should filter out non-image DICOM files', async () => {
      const dicomParser = await import('dicom-parser')

      // Mock dataset without pixel data element
      const dataset = createMockMRDataSet()
      delete dataset.elements.x7fe00010 // Remove pixel data tag

      vi.mocked(dicomParser.parseDicom).mockReturnValue(dataset)

      const file = createMockFile('metadata.dcm')

      const studies = await parseDicomFiles([file])

      expect(studies).toHaveLength(0)
    })

    it('should handle parsing errors gracefully', async () => {
      const dicomParser = await import('dicom-parser')

      // Mock parsing error
      vi.mocked(dicomParser.parseDicom).mockImplementation(() => {
        throw new Error('Invalid DICOM file')
      })

      const file = createMockFile('corrupt.dcm')

      const studies = await parseDicomFiles([file])

      // Should return empty array, not crash
      expect(studies).toHaveLength(0)
    })
  })

  describe('Metadata Extraction - Missing Tags', () => {
    it('should extract all metadata when tags present', async () => {
      const dicomParser = await import('dicom-parser')
      vi.mocked(dicomParser.parseDicom).mockReturnValue(createMockMRDataSet())

      const file = createMockFile('image.dcm')

      const studies = await parseDicomFiles([file])

      const instance = studies[0].series[0].instances[0]
      expect(instance.metadata).toBeDefined()
      expect(instance.metadata?.patientName).toBe('TEST^PATIENT')
      expect(instance.metadata?.patientID).toBe('PAT12345')
      expect(instance.metadata?.modality).toBe('MR')
      expect(instance.metadata?.studyDate).toBe('20240101')
    })

    it('should use defaults when metadata tags missing', async () => {
      const dicomParser = await import('dicom-parser')

      // Create dataset with missing tags
      const dataset = createMockMRDataSet()
      dataset.string = () => undefined // All strings return undefined

      vi.mocked(dicomParser.parseDicom).mockReturnValue(dataset)

      const file = createMockFile('image.dcm')

      const studies = await parseDicomFiles([file])

      const metadata = studies[0].series[0].instances[0].metadata
      expect(metadata?.patientName).toBe('Unknown')
      expect(metadata?.patientID).toBe('Unknown')
      expect(metadata?.studyDescription).toBe('')
      expect(metadata?.seriesDescription).toBe('')
    })

    it('should handle missing UIDs gracefully', async () => {
      const dicomParser = await import('dicom-parser')

      const dataset = createMockMRDataSet()
      // Override string method to return empty for UIDs
      const originalString = dataset.string.bind(dataset)
      dataset.string = (tag: string) => {
        if (tag === 'x0020000d' || tag === 'x0020000e' || tag === 'x00080018') {
          return ''
        }
        return originalString(tag)
      }

      vi.mocked(dicomParser.parseDicom).mockReturnValue(dataset)

      const file = createMockFile('image.dcm')

      const studies = await parseDicomFiles([file])

      // Empty UIDs are converted to 'unknown' string
      expect(studies).toHaveLength(1)
      expect(studies[0].studyInstanceUID).toBe('unknown')
    })
  })

  describe('Window/Level Defaults by Modality', () => {
    it('should use DICOM W/L when available', async () => {
      const dicomParser = await import('dicom-parser')
      vi.mocked(dicomParser.parseDicom).mockReturnValue(createMockMRDataSet())

      const file = createMockFile('image.dcm')

      const studies = await parseDicomFiles([file])

      const metadata = studies[0].series[0].instances[0].metadata
      expect(metadata?.windowCenter).toBe(128) // From mock DICOM
      expect(metadata?.windowWidth).toBe(256)
    })

    it('should use MR defaults when W/L missing', async () => {
      const dicomParser = await import('dicom-parser')

      const dataset = createMockMRDataSet()
      // Remove W/L tags
      const originalString = dataset.string.bind(dataset)
      dataset.string = (tag: string) => {
        if (tag === 'x00281050' || tag === 'x00281051') {
          return undefined
        }
        return originalString(tag)
      }

      vi.mocked(dicomParser.parseDicom).mockReturnValue(dataset)

      const file = createMockFile('image.dcm')

      const studies = await parseDicomFiles([file])

      const metadata = studies[0].series[0].instances[0].metadata
      expect(metadata?.windowCenter).toBe(600) // MR default
      expect(metadata?.windowWidth).toBe(1200)
    })

    it('should use CT defaults when W/L missing', async () => {
      const dicomParser = await import('dicom-parser')

      const dataset = createMockCTDataSet()
      // Remove W/L tags
      const originalString = dataset.string.bind(dataset)
      dataset.string = (tag: string) => {
        if (tag === 'x00281050' || tag === 'x00281051') {
          return undefined
        }
        return originalString(tag)
      }

      vi.mocked(dicomParser.parseDicom).mockReturnValue(dataset)

      const file = createMockFile('ct.dcm')

      const studies = await parseDicomFiles([file])

      const metadata = studies[0].series[0].instances[0].metadata
      expect(metadata?.windowCenter).toBe(40) // CT default (soft tissue)
      expect(metadata?.windowWidth).toBe(400)
    })

    it('should use CR/DX defaults for X-ray modalities', async () => {
      const dicomParser = await import('dicom-parser')

      const dataset = createMockDataSet({
        x00080060: 'CR', // Computed Radiography
      })
      const originalString = dataset.string.bind(dataset)
      dataset.string = (tag: string) => {
        if (tag === 'x00281050' || tag === 'x00281051') {
          return undefined
        }
        return originalString(tag)
      }

      vi.mocked(dicomParser.parseDicom).mockReturnValue(dataset)

      const file = createMockFile('xray.dcm')

      const studies = await parseDicomFiles([file])

      const metadata = studies[0].series[0].instances[0].metadata
      expect(metadata?.windowCenter).toBe(2048) // X-ray default
      expect(metadata?.windowWidth).toBe(4096)
    })

    it('should handle NaN W/L values by using modality defaults', async () => {
      const dicomParser = await import('dicom-parser')

      const dataset = createMockMRDataSet()
      const originalString = dataset.string.bind(dataset)
      dataset.string = (tag: string) => {
        if (tag === 'x00281050') return 'invalid' // Would parse to NaN
        if (tag === 'x00281051') return 'invalid'
        return originalString(tag)
      }

      vi.mocked(dicomParser.parseDicom).mockReturnValue(dataset)

      const file = createMockFile('image.dcm')

      const studies = await parseDicomFiles([file])

      const metadata = studies[0].series[0].instances[0].metadata
      expect(metadata?.windowCenter).toBe(600) // MR default (not NaN)
      expect(metadata?.windowWidth).toBe(1200)
    })

    it('should handle zero W/L values by using modality defaults', async () => {
      const dicomParser = await import('dicom-parser')

      const dataset = createMockMRDataSet()
      const originalString = dataset.string.bind(dataset)
      dataset.string = (tag: string) => {
        if (tag === 'x00281050') return '0'
        if (tag === 'x00281051') return '0'
        return originalString(tag)
      }

      vi.mocked(dicomParser.parseDicom).mockReturnValue(dataset)

      const file = createMockFile('image.dcm')

      const studies = await parseDicomFiles([file])

      const metadata = studies[0].series[0].instances[0].metadata
      expect(metadata?.windowCenter).toBe(600) // MR default (not 0)
      expect(metadata?.windowWidth).toBe(1200)
    })
  })

  describe('Study/Series/Instance Organization', () => {
    it('should organize single file into study/series/instance', async () => {
      const dicomParser = await import('dicom-parser')
      vi.mocked(dicomParser.parseDicom).mockReturnValue(createMockMRDataSet())

      const file = createMockFile('image.dcm')

      const studies = await parseDicomFiles([file])

      expect(studies).toHaveLength(1)
      expect(studies[0].series).toHaveLength(1)
      expect(studies[0].series[0].instances).toHaveLength(1)
    })

    it('should group instances from same series', async () => {
      const dicomParser = await import('dicom-parser')

      // Create 3 instances from same series
      const files = [
        createMockFile('image1.dcm'),
        createMockFile('image2.dcm'),
        createMockFile('image3.dcm'),
      ]

      vi.mocked(dicomParser.parseDicom).mockImplementation((_, index) => {
        const dataset = createMockMRDataSet(index as number + 1)
        return dataset
      })

      const studies = await parseDicomFiles(files)

      expect(studies).toHaveLength(1)
      expect(studies[0].series).toHaveLength(1)
      expect(studies[0].series[0].instances).toHaveLength(3)
    })

    it('should group series from same study', async () => {
      const dicomParser = await import('dicom-parser')

      const files = [
        createMockFile('series1.dcm'),
        createMockFile('series2.dcm'),
      ]

      vi.mocked(dicomParser.parseDicom).mockImplementation(() => {
        // Alternate between two different series in same study
        const callCount = vi.mocked(dicomParser.parseDicom).mock.calls.length
        const dataset = createMockMRDataSet(1)

        if (callCount === 1) {
          dataset.string = (tag: string) => {
            if (tag === 'x0020000e') return '1.2.840.series1'
            if (tag === 'x00200011') return '1'
            return dataset.string(tag)
          }
        } else {
          dataset.string = (tag: string) => {
            if (tag === 'x0020000e') return '1.2.840.series2'
            if (tag === 'x00200011') return '2'
            return dataset.string(tag)
          }
        }

        return dataset
      })

      const studies = await parseDicomFiles(files)

      expect(studies).toHaveLength(1)
      expect(studies[0].series).toHaveLength(2)
    })

    it('should sort series by series number', async () => {
      const dicomParser = await import('dicom-parser')

      const files = [
        createMockFile('series3.dcm'),
        createMockFile('series1.dcm'),
        createMockFile('series2.dcm'),
      ]

      let callIndex = 0
      vi.mocked(dicomParser.parseDicom).mockImplementation(() => {
        const seriesNumbers = [3, 1, 2]
        const dataset = createMockMRDataSet(1)

        const seriesNum = seriesNumbers[callIndex]
        callIndex++

        // Override to return unique series UIDs
        const originalString = dataset.string.bind(dataset)
        dataset.string = (tag: string) => {
          if (tag === 'x0020000e') return `1.2.840.series${seriesNum}`
          if (tag === 'x00200011') return String(seriesNum)
          return originalString(tag)
        }

        return dataset
      })

      const studies = await parseDicomFiles(files)

      expect(studies[0].series).toHaveLength(3)
      expect(studies[0].series[0].seriesNumber).toBe(1)
      expect(studies[0].series[1].seriesNumber).toBe(2)
      expect(studies[0].series[2].seriesNumber).toBe(3)
    })

    it('should sort instances by instance number', async () => {
      const dicomParser = await import('dicom-parser')

      const files = [
        createMockFile('instance3.dcm'),
        createMockFile('instance1.dcm'),
        createMockFile('instance2.dcm'),
      ]

      const instanceNumbers = [3, 1, 2]
      let callIndex = 0

      vi.mocked(dicomParser.parseDicom).mockImplementation(() => {
        const instanceNum = instanceNumbers[callIndex]
        callIndex++

        return createMockMRDataSet(instanceNum)
      })

      const studies = await parseDicomFiles(files)

      const instances = studies[0].series[0].instances
      expect(instances).toHaveLength(3)
      expect(instances[0].instanceNumber).toBe(1)
      expect(instances[1].instanceNumber).toBe(2)
      expect(instances[2].instanceNumber).toBe(3)
    })
  })

  describe('Compression Detection', () => {
    it('should detect lossless compression', async () => {
      const dicomParser = await import('dicom-parser')

      const dataset = createMockMRDataSet()
      const originalString = dataset.string.bind(dataset)
      dataset.string = (tag: string) => {
        if (tag === 'x00020010') return '1.2.840.10008.1.2.4.90' // JPEG 2000 Lossless
        return originalString(tag)
      }

      vi.mocked(dicomParser.parseDicom).mockReturnValue(dataset)

      const file = createMockFile('image.dcm')

      // Should not warn about lossy compression
      const consoleWarnSpy = vi.spyOn(console, 'warn')

      await parseDicomFiles([file])

      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('should warn about lossy compression', async () => {
      const dicomParser = await import('dicom-parser')

      const dataset = createMockMRDataSet()
      const originalString = dataset.string.bind(dataset)
      dataset.string = (tag: string) => {
        if (tag === 'x00020010') return '1.2.840.10008.1.2.4.50' // JPEG Baseline (Lossy)
        return originalString(tag)
      }

      vi.mocked(dicomParser.parseDicom).mockReturnValue(dataset)

      const file = createMockFile('image.dcm')

      const consoleWarnSpy = vi.spyOn(console, 'warn')

      await parseDicomFiles([file])

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Lossy compression detected')
      )
    })
  })

  describe('loadSingleDicomFile', () => {
    it('should load and extract metadata from single file', async () => {
      const dicomParser = await import('dicom-parser')
      vi.mocked(dicomParser.parseDicom).mockReturnValue(createMockMRDataSet())

      const file = createMockFile('image.dcm')

      const metadata = await loadSingleDicomFile(file)

      expect(metadata.patientName).toBe('TEST^PATIENT')
      expect(metadata.modality).toBe('MR')
      expect(metadata.windowCenter).toBe(128)
      expect(metadata.windowWidth).toBe(256)
    })
  })
})
