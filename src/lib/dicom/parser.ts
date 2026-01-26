import * as dicomParser from 'dicom-parser'
import { DicomStudy, DicomInstance, DicomMetadata } from '@/types'
import { createImageId } from '../cornerstone/initCornerstone'
import { FileWithDirectory, saveDirectoryHandle } from '../storage/directoryHandleStorage'

/**
 * Parse DICOM files and organize them into studies and series
 * @param folderPath Optional folder path for desktop mode (Tauri)
 */
export async function parseDicomFiles(files: File[], folderPath?: string): Promise<DicomStudy[]> {
  const instances: Array<{
    file: File
    dataset: any
    metadata: DicomMetadata
  }> = []

  // Parse all files
  for (const file of files) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const byteArray = new Uint8Array(arrayBuffer)

      // Parse DICOM file using dicom-parser
      const dataSet = dicomParser.parseDicom(byteArray)

      const metadata = extractMetadata(dataSet)

      // Only include files with pixel data (actual images)
      // Skip DICOMDIR and other non-image DICOM files
      // Check if the file has pixel data by checking for the pixel data tag
      const hasPixelData = dataSet.elements.x7fe00010 !== undefined

      if (hasPixelData) {
        // Check for lossy compression
        const transferSyntaxUID = getString(dataSet, 'x00020010', 'Unknown')
        const isLossless = isLosslessTransferSyntax(transferSyntaxUID)

        if (!isLossless) {
          const transferSyntaxName = getTransferSyntaxName(transferSyntaxUID)
          console.warn(`⚠️ Lossy compression detected: ${transferSyntaxName}`)
        }

        instances.push({ file, dataset: dataSet, metadata })
      }
    } catch (error) {
      console.error(`Failed to parse DICOM file:`, error)
    }
  }

  // Organize into studies and series
  const studies = organizeDicomData(instances)

  // If folderPath is provided (desktop mode), assign it to all studies
  if (folderPath) {
    studies.forEach(study => {
      study.folderPath = folderPath
    })
  }

  return studies
}

/**
 * Parse DICOM files with directory tracking and assign directory handles to each study
 */
export async function parseDicomFilesWithDirectories(
  filesWithDirs: FileWithDirectory[],
  rootDirectoryHandle?: FileSystemDirectoryHandle
): Promise<DicomStudy[]> {
  const instances: Array<{
    file: File
    dataset: any
    metadata: DicomMetadata
    directoryHandle: FileSystemDirectoryHandle
  }> = []

  // Parse all files
  for (const { file, directoryHandle } of filesWithDirs) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const byteArray = new Uint8Array(arrayBuffer)

      // Parse DICOM file using dicom-parser
      const dataSet = dicomParser.parseDicom(byteArray)

      const metadata = extractMetadata(dataSet)

      // Only include files with pixel data (actual images)
      const hasPixelData = dataSet.elements.x7fe00010 !== undefined

      if (hasPixelData) {
        // Check for lossy compression
        const transferSyntaxUID = getString(dataSet, 'x00020010', 'Unknown')
        const isLossless = isLosslessTransferSyntax(transferSyntaxUID)

        if (!isLossless) {
          const transferSyntaxName = getTransferSyntaxName(transferSyntaxUID)
          console.warn(`⚠️ Lossy compression detected: ${transferSyntaxName}`)
        }

        instances.push({ file, dataset: dataSet, metadata, directoryHandle })
      }
    } catch (error) {
      console.error(`Failed to parse DICOM file:`, error)
    }
  }

  // Organize into studies and series, tracking directory handles
  const studies = await organizeDicomDataWithDirectories(instances, rootDirectoryHandle)

  return studies
}

/**
 * Helper function to get string from dataset (used for transfer syntax too)
 */
function getString(dataSet: dicomParser.DataSet, tag: string, defaultValue: string = ''): string {
  try {
    return dataSet.string(tag) || defaultValue
  } catch {
    return defaultValue
  }
}

/**
 * Map transfer syntax UID to human-readable name
 */
function getTransferSyntaxName(uid: string): string {
  const syntaxMap: Record<string, string> = {
    '1.2.840.10008.1.2': 'Implicit VR Little Endian (Uncompressed)',
    '1.2.840.10008.1.2.1': 'Explicit VR Little Endian (Uncompressed)',
    '1.2.840.10008.1.2.2': 'Explicit VR Big Endian (Uncompressed)',
    '1.2.840.10008.1.2.4.50': 'JPEG Baseline (Lossy)',
    '1.2.840.10008.1.2.4.51': 'JPEG Extended (Lossy)',
    '1.2.840.10008.1.2.4.57': 'JPEG Lossless Non-Hierarchical',
    '1.2.840.10008.1.2.4.70': 'JPEG Lossless Non-Hierarchical First-Order Prediction',
    '1.2.840.10008.1.2.4.80': 'JPEG-LS Lossless',
    '1.2.840.10008.1.2.4.81': 'JPEG-LS Lossy',
    '1.2.840.10008.1.2.4.90': 'JPEG 2000 Lossless',
    '1.2.840.10008.1.2.4.91': 'JPEG 2000 Lossy',
    '1.2.840.10008.1.2.5': 'RLE Lossless',
    '1.2.840.10008.1.2.1.99': 'Deflated Explicit VR Little Endian',
  }
  return syntaxMap[uid] || `Unknown (${uid})`
}

/**
 * Check if transfer syntax is lossless
 */
function isLosslessTransferSyntax(uid: string): boolean {
  const losslessSyntaxes = [
    '1.2.840.10008.1.2',      // Implicit VR Little Endian
    '1.2.840.10008.1.2.1',    // Explicit VR Little Endian
    '1.2.840.10008.1.2.2',    // Explicit VR Big Endian
    '1.2.840.10008.1.2.4.57', // JPEG Lossless Non-Hierarchical
    '1.2.840.10008.1.2.4.70', // JPEG Lossless First-Order Prediction
    '1.2.840.10008.1.2.4.80', // JPEG-LS Lossless
    '1.2.840.10008.1.2.4.90', // JPEG 2000 Lossless
    '1.2.840.10008.1.2.5',    // RLE Lossless
    '1.2.840.10008.1.2.1.99', // Deflated Explicit VR Little Endian
  ]
  return losslessSyntaxes.includes(uid)
}

/**
 * Extract relevant metadata from a DICOM dataset
 */
function extractMetadata(dataSet: dicomParser.DataSet): DicomMetadata {
  const getStringLocal = (tag: string, defaultValue: string = ''): string => {
    try {
      return dataSet.string(tag) || defaultValue
    } catch {
      return defaultValue
    }
  }

  const getNumber = (tag: string, defaultValue: number = 0): number => {
    try {
      const value = dataSet.string(tag)
      return value ? Number(value) : defaultValue
    } catch {
      return defaultValue
    }
  }

  const modality = getStringLocal('x00080060', 'OT')

  // Get window/level from DICOM tags if available
  let windowCenter = getNumber('x00281050', 0)
  let windowWidth = getNumber('x00281051', 0)

  // If not in DICOM metadata or invalid (NaN, 0), use modality-specific defaults
  if (!windowCenter || !windowWidth || isNaN(windowCenter) || isNaN(windowWidth)) {
    // Default values based on modality
    switch (modality) {
      case 'CR': // Computed Radiography (X-ray)
      case 'DX': // Digital Radiography (X-ray)
      case 'RF': // Radio Fluoroscopy
      case 'XA': // X-ray Angiography
        windowCenter = 2048
        windowWidth = 4096
        break
      case 'CT': // Computed Tomography
        windowCenter = 40
        windowWidth = 400
        break
      case 'MR': // Magnetic Resonance
        windowCenter = 600
        windowWidth = 1200
        break
      case 'MG': // Mammography
        windowCenter = 1500
        windowWidth = 3000
        break
      default:
        windowCenter = 600
        windowWidth = 1200
        break
    }
  }

  return {
    patientName: getStringLocal('x00100010', 'Unknown'),
    patientID: getStringLocal('x00100020', 'Unknown'),
    studyDate: getStringLocal('x00080020', ''),
    studyDescription: getStringLocal('x00081030', ''),
    seriesDescription: getStringLocal('x0008103e', ''),
    instanceNumber: getNumber('x00200013', 0),
    windowCenter,
    windowWidth,
    sliceLocation: getNumber('x00201041', 0),
    sliceThickness: getNumber('x00180050', 0),
    studyInstanceUID: getStringLocal('x0020000d', ''),
    seriesInstanceUID: getStringLocal('x0020000e', ''),
    sopInstanceUID: getStringLocal('x00080018', ''),
    seriesNumber: getNumber('x00200011', 0),
    modality,
    rows: getNumber('x00280010', 0),
    columns: getNumber('x00280011', 0),
  }
}

/**
 * Organize DICOM instances into studies and series
 */
function organizeDicomData(
  instances: Array<{
    file: File
    dataset: any
    metadata: DicomMetadata
  }>
): DicomStudy[] {
  const studiesMap = new Map<string, DicomStudy>()

  for (const { file, metadata } of instances) {
    const studyUID = String(metadata.studyInstanceUID || 'unknown')
    const seriesUID = String(metadata.seriesInstanceUID || 'unknown')

    // Get or create study
    let study = studiesMap.get(studyUID)
    if (!study) {
      study = {
        studyInstanceUID: studyUID,
        studyDate: String(metadata.studyDate || ''),
        studyDescription: String(metadata.studyDescription || ''),
        patientName: String(metadata.patientName || 'Unknown'),
        patientID: String(metadata.patientID || 'Unknown'),
        series: [],
      }
      studiesMap.set(studyUID, study)
    }

    // Get or create series
    let series = study.series.find((s) => s.seriesInstanceUID === seriesUID)
    if (!series) {
      series = {
        seriesInstanceUID: seriesUID,
        seriesNumber: Number(metadata.seriesNumber || 0),
        seriesDescription: String(metadata.seriesDescription || ''),
        modality: String(metadata.modality || 'OT'),
        instances: [],
      }
      study.series.push(series)
    }

    // Create instance
    const instance: DicomInstance = {
      sopInstanceUID: String(metadata.sopInstanceUID || ''),
      instanceNumber: Number(metadata.instanceNumber || 0),
      imageId: createImageId(file),
      rows: Number(metadata.rows || 0),
      columns: Number(metadata.columns || 0),
      metadata,
    }

    series.instances.push(instance)
  }

  // Sort everything
  const studies = Array.from(studiesMap.values())
  studies.forEach((study) => {
    study.series.sort((a, b) => a.seriesNumber - b.seriesNumber)
    study.series.forEach((series) => {
      series.instances.sort((a, b) => a.instanceNumber - b.instanceNumber)
    })
  })

  return studies
}

/**
 * Organize DICOM instances into studies and series with directory handle tracking
 */
async function organizeDicomDataWithDirectories(
  instances: Array<{
    file: File
    dataset: any
    metadata: DicomMetadata
    directoryHandle: FileSystemDirectoryHandle
  }>,
  rootDirectoryHandle?: FileSystemDirectoryHandle
): Promise<DicomStudy[]> {
  const studiesMap = new Map<string, {
    study: DicomStudy
    directoryHandle: FileSystemDirectoryHandle
  }>()

  for (const { file, metadata, directoryHandle } of instances) {
    const studyUID = String(metadata.studyInstanceUID || 'unknown')
    const seriesUID = String(metadata.seriesInstanceUID || 'unknown')

    // Get or create study
    let studyData = studiesMap.get(studyUID)
    if (!studyData) {
      const study: DicomStudy = {
        studyInstanceUID: studyUID,
        studyDate: String(metadata.studyDate || ''),
        studyDescription: String(metadata.studyDescription || ''),
        patientName: String(metadata.patientName || 'Unknown'),
        patientID: String(metadata.patientID || 'Unknown'),
        series: [],
      }
      // Use root directory handle if provided, otherwise use per-file directory handle
      const handleToUse = rootDirectoryHandle || directoryHandle
      studyData = { study, directoryHandle: handleToUse }
      studiesMap.set(studyUID, studyData)
    }

    const study = studyData.study

    // Get or create series
    let series = study.series.find((s) => s.seriesInstanceUID === seriesUID)
    if (!series) {
      series = {
        seriesInstanceUID: seriesUID,
        seriesNumber: Number(metadata.seriesNumber || 0),
        seriesDescription: String(metadata.seriesDescription || ''),
        modality: String(metadata.modality || 'OT'),
        instances: [],
      }
      study.series.push(series)
    }

    // Create instance
    const instance: DicomInstance = {
      sopInstanceUID: String(metadata.sopInstanceUID || ''),
      instanceNumber: Number(metadata.instanceNumber || 0),
      imageId: createImageId(file),
      rows: Number(metadata.rows || 0),
      columns: Number(metadata.columns || 0),
      metadata,
    }

    series.instances.push(instance)
  }

  // Sort and save directory handles for each study
  const studies: DicomStudy[] = []
  for (const { study, directoryHandle } of studiesMap.values()) {
    // Sort series and instances
    study.series.sort((a, b) => a.seriesNumber - b.seriesNumber)
    study.series.forEach((series) => {
      series.instances.sort((a, b) => a.instanceNumber - b.instanceNumber)
    })

    // Save directory handle and assign ID to study
    const handleId = crypto.randomUUID()
    await saveDirectoryHandle(handleId, directoryHandle)
    study.directoryHandleId = handleId

    studies.push(study)
  }

  return studies
}

/**
 * Load a single DICOM file and return metadata
 */
export async function loadSingleDicomFile(file: File): Promise<DicomMetadata> {
  const arrayBuffer = await file.arrayBuffer()
  const byteArray = new Uint8Array(arrayBuffer)
  const dataSet = dicomParser.parseDicom(byteArray)
  return extractMetadata(dataSet)
}
