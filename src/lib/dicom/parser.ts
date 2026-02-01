import { DicomStudy, DicomMetadata } from '@/types'
import { dicomStudyService } from './DicomStudyService'
import { FileWithDirectory } from '../storage/directoryHandleStorage'

/**
 * Parse DICOM files and organize them into studies and series
 * @param folderPath Optional folder path for desktop mode (Tauri)
 * @deprecated Use DicomStudyService.loadStudiesFromFiles instead
 */
export async function parseDicomFiles(files: File[], folderPath?: string): Promise<DicomStudy[]> {
  return dicomStudyService.loadStudiesFromFiles(files, folderPath)
}

/**
 * Parse DICOM files with directory tracking and assign directory handles to each study
 * @deprecated Use DicomStudyService.loadStudiesFromHandle instead
 */
export async function parseDicomFilesWithDirectories(
  filesWithDirs: FileWithDirectory[],
  rootDirectoryHandle?: FileSystemDirectoryHandle
): Promise<DicomStudy[]> {
  // Delegate to service (internal method not public, so we need a workaround)
  // For now, keep this implementation until we fully migrate useLoadStudy
  const service = dicomStudyService as any
  return service.loadStudiesWithDirectories(filesWithDirs, rootDirectoryHandle)
}


/**
 * Load a single DICOM file and return metadata
 * @deprecated Use DicomStudyService.parseSingleFile instead
 */
export async function loadSingleDicomFile(file: File): Promise<DicomMetadata> {
  return dicomStudyService.parseSingleFile(file)
}
