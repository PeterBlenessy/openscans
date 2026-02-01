/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Mock DICOM datasets for testing
 *
 * These mocks simulate dicom-parser DataSet objects with realistic DICOM tags.
 * Use these to test DICOM parsing logic without requiring actual DICOM files.
 */

import type { DataSet } from 'dicom-parser'

/**
 * Creates a mock DICOM DataSet with common tags
 */
export function createMockDataSet(overrides: Partial<any> = {}): DataSet {
  const mockElements: Record<string, any> = {
    // Patient Module
    x00100010: {
      // Patient Name
      tag: 'x00100010',
      vr: 'PN',
      length: 16,
    },
    x00100020: {
      // Patient ID
      tag: 'x00100020',
      vr: 'LO',
      length: 8,
    },
    x00100030: {
      // Patient Birth Date
      tag: 'x00100030',
      vr: 'DA',
      length: 8,
    },
    x00100040: {
      // Patient Sex
      tag: 'x00100040',
      vr: 'CS',
      length: 2,
    },

    // Study Module
    x0020000d: {
      // Study Instance UID
      tag: 'x0020000d',
      vr: 'UI',
      length: 52,
    },
    x00080020: {
      // Study Date
      tag: 'x00080020',
      vr: 'DA',
      length: 8,
    },
    x00080030: {
      // Study Time
      tag: 'x00080030',
      vr: 'TM',
      length: 6,
    },
    x00081030: {
      // Study Description
      tag: 'x00081030',
      vr: 'LO',
      length: 20,
    },
    x00200010: {
      // Study ID
      tag: 'x00200010',
      vr: 'SH',
      length: 6,
    },

    // Series Module
    x0020000e: {
      // Series Instance UID
      tag: 'x0020000e',
      vr: 'UI',
      length: 54,
    },
    x00080060: {
      // Modality
      tag: 'x00080060',
      vr: 'CS',
      length: 2,
    },
    x0020000011: {
      // Series Number
      tag: 'x00200011',
      vr: 'IS',
      length: 2,
    },
    x0008103e: {
      // Series Description
      tag: 'x0008103e',
      vr: 'LO',
      length: 20,
    },

    // Instance Module
    x00080018: {
      // SOP Instance UID
      tag: 'x00080018',
      vr: 'UI',
      length: 56,
    },
    x00200013: {
      // Instance Number
      tag: 'x00200013',
      vr: 'IS',
      length: 2,
    },

    // Image Pixel Module (indicates this is an image DICOM)
    x7fe00010: {
      // Pixel Data
      tag: 'x7fe00010',
      vr: 'OW',
      length: 262144, // 512x512 pixels
    },
    x00280010: {
      // Rows
      tag: 'x00280010',
      vr: 'US',
      length: 2,
    },
    x00280011: {
      // Columns
      tag: 'x00280011',
      vr: 'US',
      length: 2,
    },

    // Window/Level
    x00281050: {
      // Window Center
      tag: 'x00281050',
      vr: 'DS',
      length: 4,
    },
    x00281051: {
      // Window Width
      tag: 'x00281051',
      vr: 'DS',
      length: 4,
    },

    ...overrides,
  }

  const mockDataSet = {
    elements: mockElements,
    byteArray: new Uint8Array(512),

    string: (tag: string, index?: number): string | undefined => {
      const mockData: Record<string, string> = {
        x00100010: 'TEST^PATIENT',
        x00100020: 'PAT12345',
        x00100030: '19900101',
        x00100040: 'M',
        x0020000d: '1.2.840.113619.2.1.1.1.1.20240101',
        x00080020: '20240101',
        x00080030: '120000',
        x00081030: 'Brain MRI',
        x00200010: 'STU001',
        x0020000e: '1.2.840.113619.2.1.2.2.2.20240101',
        x00080060: 'MR',
        x00200011: '1',
        x0008103e: 'T1 MPRAGE SAG',
        x00080018: '1.2.840.113619.2.1.3.3.3.20240101',
        x00200013: '1',
        x00281050: '128',
        x00281051: '256',
        ...overrides,
      }
      return mockData[tag]
    },

    uint16: (tag: string, index?: number): number | undefined => {
      const mockData: Record<string, number> = {
        x00280010: 512, // Rows
        x00280011: 512, // Columns
        ...overrides,
      }
      return mockData[tag]
    },

    intString: (tag: string, index?: number): number | undefined => {
      const strValue = mockDataSet.string(tag, _index)
      return strValue ? parseInt(strValue, 10) : undefined
    },

    floatString: (tag: string, index?: number): number | undefined => {
      const strValue = mockDataSet.string(tag, _index)
      return strValue ? parseFloat(strValue) : undefined
    },
  } as DataSet

  return mockDataSet
}

/**
 * Creates a mock MR (Magnetic Resonance) DICOM dataset
 */
export function createMockMRDataSet(instanceNumber = 1): DataSet {
  return createMockDataSet({
    x00080060: 'MR', // Modality
    x0008103e: 'T1 MPRAGE SAG',
    x00200013: instanceNumber.toString(),
    x00281050: '128', // Window Center
    x00281051: '256', // Window Width
  })
}

/**
 * Creates a mock CT (Computed Tomography) DICOM dataset
 */
export function createMockCTDataSet(instanceNumber = 1): DataSet {
  return createMockDataSet({
    x00080060: 'CT', // Modality
    x0008103e: 'CHEST CT',
    x00200013: instanceNumber.toString(),
    x00281050: '40', // Window Center (lung window)
    x00281051: '400', // Window Width
  })
}

/**
 * Creates a mock DICOMDIR dataset (no pixel data)
 */
export function createMockDICOMDIRDataSet(): DataSet {
  const dataset = createMockDataSet()
  // Remove pixel data element to simulate DICOMDIR
  delete dataset.elements.x7fe00010
  return dataset
}

/**
 * Creates a mock DICOM dataset with missing optional tags
 */
export function createMockIncompleteDataSet(): DataSet {
  return createMockDataSet({
    // Missing: Study Description, Series Description, Window/Level
    x00081030: undefined,
    x0008103e: undefined,
    x00281050: undefined,
    x00281051: undefined,
  })
}

/**
 * Creates a mock File object for DICOM testing
 */
export function createMockDicomFile(
  filename = 'test.dcm',
  dataset?: DataSet
): File {
  const blob = new Blob([new ArrayBuffer(1024)], {
    type: 'application/dicom',
  })
  const file = new File([blob], filename, { type: 'application/dicom' })

  // Attach mock dataset for testing (non-standard but useful for tests)
  ;(file as any).__mockDataSet = dataset || createMockDataSet()

  return file
}
