/**
 * Platform-aware file saver
 *
 * Uses Tauri dialog/fs APIs in desktop mode, file-saver in web mode
 */

import { saveAs as browserSaveAs } from 'file-saver'
import { isTauri } from '../utils/platform'

/**
 * Save a blob to a file with proper platform handling
 *
 * @param blob - The blob to save
 * @param filename - Suggested filename
 */
export async function saveFile(blob: Blob, filename: string): Promise<void> {
  if (isTauri()) {
    // Tauri desktop mode - use save dialog + fs API
    const { save } = await import('@tauri-apps/plugin-dialog')
    const { writeFile } = await import('@tauri-apps/plugin-fs')

    // Show save dialog with suggested filename
    const savePath = await save({
      defaultPath: filename,
      filters: [{
        name: getFileTypeDescription(filename),
        extensions: [getExtension(filename)]
      }]
    })

    if (!savePath) {
      // User cancelled
      return
    }

    // Convert blob to Uint8Array
    const arrayBuffer = await blob.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Write file
    await writeFile(savePath, uint8Array)
    console.log(`[Tauri] File saved to: ${savePath}`)
  } else {
    // Web mode - use file-saver library
    browserSaveAs(blob, filename)
  }
}

/**
 * Get file extension from filename
 */
function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1) return ''
  return filename.substring(lastDot + 1).toLowerCase()
}

/**
 * Get user-friendly file type description
 */
function getFileTypeDescription(filename: string): string {
  const ext = getExtension(filename)
  switch (ext) {
    case 'png':
      return 'PNG Image'
    case 'jpg':
    case 'jpeg':
      return 'JPEG Image'
    case 'pdf':
      return 'PDF Document'
    default:
      return 'File'
  }
}
