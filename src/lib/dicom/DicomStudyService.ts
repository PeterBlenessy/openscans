import * as dicomParser from 'dicom-parser'
import { DicomStudy, DicomInstance, DicomMetadata } from '@/types'
import { createImageId } from '../cornerstone/initCornerstone'
import {
  FileWithDirectory,
  saveDirectoryHandle,
  checkDirectoryPermission,
  requestDirectoryPermission,
  readDicomFilesWithDirectories,
} from '../storage/directoryHandleStorage'
import { readFilesFromDirectory } from '../utils/filePicker'
import { getCachedStudies, cacheStudies } from '../storage/studyCache'

/**
 * Service for managing DICOM file operations including parsing, organizing,
 * caching, and loading studies from various sources.
 *
 * Centralizes all DICOM-related business logic in one place for better
 * maintainability and testability.
 *
 * @example
 * ```ts
 * const service = new DicomStudyService()
 *
 * // Load from files
 * const studies = await service.loadStudiesFromFiles(files)
 *
 * // Load from directory handle with caching
 * const cached = await service.loadStudiesFromHandle(handle, {
 *   useCache: true,
 *   cacheKey: 'my-study'
 * })
 * ```
 */
export class DicomStudyService {
  /**
   * Parse DICOM files and organize them into studies
   *
   * @param files - Array of File objects to parse
   * @param folderPath - Optional folder path for desktop mode (Tauri)
   * @returns Array of organized DicomStudy objects
   */
  async loadStudiesFromFiles(files: File[], folderPath?: string): Promise<DicomStudy[]> {
    const instances = await this.parseFiles(files)
    const studies = this.organizeInstances(instances)

    // Assign folder path if provided (desktop mode)
    if (folderPath) {
      studies.forEach((study) => {
        study.folderPath = folderPath
      })
    }

    return studies
  }

  /**
   * Load studies from a directory path (Tauri desktop mode)
   *
   * @param path - Directory path containing DICOM files
   * @param options - Loading options including caching
   * @returns Array of DicomStudy objects
   */
  async loadStudiesFromDirectory(
    path: string,
    options: { useCache?: boolean } = {}
  ): Promise<DicomStudy[]> {
    const { useCache = true } = options

    // Check cache first
    if (useCache) {
      const cached = getCachedStudies(path)
      if (cached) {
        return cached
      }
    }

    // Read files from directory
    const files = await readFilesFromDirectory(path)

    if (files.length === 0) {
      throw new Error('No DICOM files found in the directory')
    }

    // Parse and organize
    const studies = await this.loadStudiesFromFiles(files, path)

    if (studies.length === 0) {
      throw new Error('No valid DICOM studies found in the directory')
    }

    // Cache if enabled
    if (useCache) {
      cacheStudies(path, studies)
    }

    return studies
  }

  /**
   * Load studies from a FileSystemDirectoryHandle (web mode)
   *
   * @param handle - Directory handle to load from
   * @param options - Loading options including caching and permissions
   * @returns Array of DicomStudy objects
   */
  async loadStudiesFromHandle(
    handle: FileSystemDirectoryHandle,
    options: {
      useCache?: boolean
      cacheKey?: string
      requestPermission?: boolean
    } = {}
  ): Promise<DicomStudy[]> {
    const { useCache = true, cacheKey, requestPermission = true } = options

    // Check cache first
    if (useCache && cacheKey) {
      const cached = getCachedStudies(cacheKey)
      if (cached) {
        return cached
      }
    }

    // Check/request permission
    let hasPermission = await checkDirectoryPermission(handle)

    if (!hasPermission && requestPermission) {
      hasPermission = await requestDirectoryPermission(handle)
    }

    if (!hasPermission) {
      throw new Error('Permission denied to access the folder')
    }

    // Read DICOM files with directory tracking
    const filesWithDirs = await readDicomFilesWithDirectories(handle)

    if (filesWithDirs.length === 0) {
      throw new Error('No DICOM files found in the folder')
    }

    // Parse and organize with directory handles
    const studies = await this.loadStudiesWithDirectories(filesWithDirs, handle)

    if (studies.length === 0) {
      throw new Error('No valid DICOM studies found in the folder')
    }

    // Cache if enabled
    if (useCache && cacheKey) {
      cacheStudies(cacheKey, studies)
    }

    return studies
  }

  /**
   * Parse a single DICOM file and extract metadata
   *
   * @param file - DICOM file to parse
   * @returns Extracted metadata
   */
  async parseSingleFile(file: File): Promise<DicomMetadata> {
    const arrayBuffer = await file.arrayBuffer()
    const byteArray = new Uint8Array(arrayBuffer)
    const dataSet = dicomParser.parseDicom(byteArray)
    return this.extractMetadata(dataSet)
  }

  /**
   * Parse multiple DICOM files and return instances with metadata
   *
   * @param files - Array of files to parse
   * @returns Array of parsed instances
   * @private
   */
  private async parseFiles(
    files: File[]
  ): Promise<Array<{ file: File; dataset: dicomParser.DataSet; metadata: DicomMetadata }>> {
    const instances: Array<{
      file: File
      dataset: dicomParser.DataSet
      metadata: DicomMetadata
    }> = []

    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const byteArray = new Uint8Array(arrayBuffer)
        const dataSet = dicomParser.parseDicom(byteArray)
        const metadata = this.extractMetadata(dataSet)

        // Only include files with pixel data (actual images)
        if (this.hasPixelData(dataSet)) {
          instances.push({ file, dataset: dataSet, metadata })
        }
      } catch (error) {
        // Silently skip non-DICOM files
        const errorMsg = error instanceof Error ? error.message : String(error)
        if (!errorMsg.includes('DICM prefix not found')) {
          console.error(`Failed to parse DICOM file:`, error)
        }
      }
    }

    return instances
  }

  /**
   * Parse DICOM files with directory tracking
   *
   * @param filesWithDirs - Files with their directory handles
   * @param rootHandle - Root directory handle
   * @returns Array of organized DicomStudy objects
   * @private
   */
  private async loadStudiesWithDirectories(
    filesWithDirs: FileWithDirectory[],
    rootHandle?: FileSystemDirectoryHandle
  ): Promise<DicomStudy[]> {
    const instances: Array<{
      file: File
      dataset: dicomParser.DataSet
      metadata: DicomMetadata
      directoryHandle: FileSystemDirectoryHandle
    }> = []

    for (const { file, directoryHandle } of filesWithDirs) {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const byteArray = new Uint8Array(arrayBuffer)
        const dataSet = dicomParser.parseDicom(byteArray)
        const metadata = this.extractMetadata(dataSet)

        if (this.hasPixelData(dataSet)) {
          // Check for lossy compression
          const transferSyntaxUID = this.getString(dataSet, 'x00020010', 'Unknown')
          if (!this.isLosslessTransferSyntax(transferSyntaxUID)) {
            const transferSyntaxName = this.getTransferSyntaxName(transferSyntaxUID)
            console.warn(`⚠️ Lossy compression detected: ${transferSyntaxName}`)
          }

          instances.push({ file, dataset: dataSet, metadata, directoryHandle })
        }
      } catch (error) {
        console.error(`Failed to parse DICOM file:`, error)
      }
    }

    return this.organizeInstancesWithDirectories(instances, rootHandle)
  }

  /**
   * Check if dataset contains pixel data
   *
   * @param dataSet - DICOM dataset
   * @returns True if pixel data exists
   * @private
   */
  private hasPixelData(dataSet: dicomParser.DataSet): boolean {
    return dataSet.elements.x7fe00010 !== undefined
  }

  /**
   * Extract metadata from DICOM dataset
   *
   * @param dataSet - DICOM dataset
   * @returns Extracted metadata
   * @private
   */
  private extractMetadata(dataSet: dicomParser.DataSet): DicomMetadata {
    const getString = (tag: string, defaultValue: string = ''): string => {
      try {
        return dataSet.string(tag) || defaultValue
      } catch {
        return defaultValue
      }
    }

    const getNumber = (tag: string, defaultValue?: number): number | undefined => {
      try {
        const value = dataSet.string(tag)
        if (value) {
          const numValue = Number(value)
          return !isNaN(numValue) ? numValue : defaultValue
        }
        return defaultValue
      } catch {
        return defaultValue
      }
    }

    const modality = getString('x00080060', 'OT')

    // Get window/level from DICOM tags or use modality defaults
    let windowCenter = getNumber('x00281050', 0)
    let windowWidth = getNumber('x00281051', 0)

    if (!windowCenter || !windowWidth || isNaN(windowCenter) || isNaN(windowWidth)) {
      const defaults = this.getModalityDefaults(modality)
      windowCenter = defaults.windowCenter
      windowWidth = defaults.windowWidth
    }

    // Extract pixel value range for performance optimization
    const minPixelValue = getNumber('x00280106', undefined)
    const maxPixelValue = getNumber('x00280107', undefined)

    return {
      patientName: getString('x00100010', 'Unknown'),
      patientID: getString('x00100020', 'Unknown'),
      studyDate: getString('x00080020', ''),
      studyDescription: getString('x00081030', ''),
      seriesDescription: getString('x0008103e', ''),
      instanceNumber: getNumber('x00200013', 0),
      windowCenter,
      windowWidth,
      sliceLocation: getNumber('x00201041', 0),
      sliceThickness: getNumber('x00180050', 0),
      studyInstanceUID: getString('x0020000d', ''),
      seriesInstanceUID: getString('x0020000e', ''),
      sopInstanceUID: getString('x00080018', ''),
      seriesNumber: getNumber('x00200011', 0),
      modality,
      rows: getNumber('x00280010', 0),
      columns: getNumber('x00280011', 0),
      minPixelValue,
      maxPixelValue,
    }
  }

  /**
   * Organize parsed instances into studies and series
   *
   * @param instances - Parsed instances
   * @returns Array of organized studies
   * @private
   */
  private organizeInstances(
    instances: Array<{
      file: File
      dataset: dicomParser.DataSet
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
   * Organize instances with directory handle tracking
   *
   * @param instances - Instances with directory handles
   * @param rootHandle - Root directory handle
   * @returns Array of organized studies
   * @private
   */
  private async organizeInstancesWithDirectories(
    instances: Array<{
      file: File
      dataset: dicomParser.DataSet
      metadata: DicomMetadata
      directoryHandle: FileSystemDirectoryHandle
    }>,
    rootHandle?: FileSystemDirectoryHandle
  ): Promise<DicomStudy[]> {
    const studiesMap = new Map<
      string,
      {
        study: DicomStudy
        directoryHandle: FileSystemDirectoryHandle
      }
    >()

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
        const handleToUse = rootHandle || directoryHandle
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

    // Sort and save directory handles
    const studies: DicomStudy[] = []
    for (const { study, directoryHandle } of studiesMap.values()) {
      study.series.sort((a, b) => a.seriesNumber - b.seriesNumber)
      study.series.forEach((series) => {
        series.instances.sort((a, b) => a.instanceNumber - b.instanceNumber)
      })

      // Save directory handle
      const handleId = crypto.randomUUID()
      await saveDirectoryHandle(handleId, directoryHandle)
      study.directoryHandleId = handleId

      studies.push(study)
    }

    return studies
  }

  /**
   * Get default window/level values for a modality
   *
   * @param modality - DICOM modality code
   * @returns Window center and width defaults
   * @private
   */
  private getModalityDefaults(modality: string): { windowCenter: number; windowWidth: number } {
    switch (modality) {
      case 'CR': // Computed Radiography
      case 'DX': // Digital Radiography
      case 'RF': // Radio Fluoroscopy
      case 'XA': // X-ray Angiography
        return { windowCenter: 2048, windowWidth: 4096 }
      case 'CT': // Computed Tomography
        return { windowCenter: 40, windowWidth: 400 }
      case 'MR': // Magnetic Resonance
        return { windowCenter: 600, windowWidth: 1200 }
      case 'MG': // Mammography
        return { windowCenter: 1500, windowWidth: 3000 }
      default:
        return { windowCenter: 600, windowWidth: 1200 }
    }
  }

  /**
   * Get string value from DICOM dataset
   *
   * @param dataSet - DICOM dataset
   * @param tag - DICOM tag
   * @param defaultValue - Default value if tag not found
   * @returns String value
   * @private
   */
  private getString(
    dataSet: dicomParser.DataSet,
    tag: string,
    defaultValue: string = ''
  ): string {
    try {
      return dataSet.string(tag) || defaultValue
    } catch {
      return defaultValue
    }
  }

  /**
   * Get transfer syntax name from UID
   *
   * @param uid - Transfer syntax UID
   * @returns Human-readable name
   * @private
   */
  private getTransferSyntaxName(uid: string): string {
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
   *
   * @param uid - Transfer syntax UID
   * @returns True if lossless
   * @private
   */
  private isLosslessTransferSyntax(uid: string): boolean {
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
}

/**
 * Singleton instance for convenient access
 */
export const dicomStudyService = new DicomStudyService()
