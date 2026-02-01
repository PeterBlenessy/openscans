/**
 * Platform-aware file and folder picker utilities
 *
 * Uses Tauri dialog API in desktop mode, browser File System Access API in web mode
 */

import { isTauri } from './platform'

/**
 * Open a folder picker dialog
 *
 * @returns Directory handle (web) or directory path (Tauri), or null if cancelled
 */
export async function pickDirectory(): Promise<FileSystemDirectoryHandle | string | File[] | null> {
  if (isTauri()) {
    // Use Tauri's dialog API
    const { open } = await import('@tauri-apps/plugin-dialog')

    const result = await open({
      directory: true,
      multiple: false,
    })

    // If user selected a directory, grant recursive access to it
    if (result) {
      try {
        // Import scope module to grant access
        await import('@tauri-apps/plugin-fs')
        // Note: In Tauri v2, user-selected directories via dialog should automatically
        // have scope access, but we'll keep this as a fallback
      } catch (err) {
        console.warn('Failed to setup filesystem scope:', err)
      }
    }

    // Returns string path or null if cancelled
    return result as string | null
  } else {
    // Try modern File System Access API first (Chrome, Edge)
    if ('showDirectoryPicker' in window) {
      try {
        // @ts-expect-error - showDirectoryPicker is not in TypeScript types yet
        const directoryHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
          mode: 'read',
        })
        return directoryHandle
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return null // User cancelled
        }
        throw err
      }
    } else {
      // Fallback for Safari: use file input with webkitdirectory
      return new Promise<File[] | null>((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.setAttribute('webkitdirectory', '')
        input.multiple = true

        input.onchange = () => {
          if (input.files && input.files.length > 0) {
            resolve(Array.from(input.files))
          } else {
            resolve(null)
          }
          input.remove()
        }

        input.oncancel = () => {
          resolve(null)
          input.remove()
        }

        input.click()
      })
    }
  }
}

/**
 * Read all files from a directory (recursive)
 *
 * @param source Directory handle (web), directory path (Tauri), or File array (Safari)
 * @returns Array of File objects
 */
export async function readFilesFromDirectory(
  source: FileSystemDirectoryHandle | string | File[]
): Promise<File[]> {
  // Safari fallback: already have File objects
  if (Array.isArray(source)) {
    console.log(`[Safari] File reading: ${source.length} files`)
    return source
  }

  if (typeof source === 'string') {
    // Tauri mode - use FS plugin (much faster than Rust IPC)
    const startTime = performance.now()
    const { readDir, readFile } = await import('@tauri-apps/plugin-fs')

    const files: File[] = []
    let fileReadTime = 0
    let blobCreateTime = 0

    // eslint-disable-next-line no-inner-declarations
    async function readDirRecursive(dirPath: string) {
      try {
        const entries = await readDir(dirPath)

        for (const entry of entries) {
          const fullPath = `${dirPath}/${entry.name}`

          if (entry.isDirectory) {
            await readDirRecursive(fullPath)
          } else if (entry.isFile) {
            try {
              // Read file content
              const readStart = performance.now()
              const content = await readFile(fullPath)
              fileReadTime += performance.now() - readStart

              // Convert Uint8Array to File object
              const blobStart = performance.now()
              const blob = new Blob([content])
              const file = new File([blob], entry.name, { type: 'application/dicom' })
              blobCreateTime += performance.now() - blobStart
              files.push(file)
            } catch (err) {
              // Skip files that can't be read (permissions, etc)
              // Don't log common system files like .DS_Store
              if (!entry.name.startsWith('.')) {
                console.debug(`Skipped file ${fullPath}:`, err)
              }
            }
          }
        }
      } catch (err) {
        // Skip directories that can't be read
        console.debug(`Skipped directory ${dirPath}:`, err)
      }
    }

    await readDirRecursive(source)
    const totalTime = performance.now() - startTime
    console.log(`[Tauri] File reading performance:`)
    console.log(`  - Total files: ${files.length}`)
    console.log(`  - File read time: ${fileReadTime.toFixed(0)}ms`)
    console.log(`  - Blob creation time: ${blobCreateTime.toFixed(0)}ms`)
    console.log(`  - Total time: ${totalTime.toFixed(0)}ms`)
    return files
  } else {
    // Web mode - source is FileSystemDirectoryHandle
    const startTime = performance.now()
    const files: File[] = []

    // eslint-disable-next-line no-inner-declarations
    async function readDirRecursive(dirHandle: FileSystemDirectoryHandle) {
      // @ts-expect-error - TypeScript doesn't have entries() in types yet
      for await (const [, handle] of dirHandle.entries()) {
        if (handle.kind === 'file') {
          const file = await (handle as FileSystemFileHandle).getFile()
          files.push(file)
        } else if (handle.kind === 'directory') {
          await readDirRecursive(handle as FileSystemDirectoryHandle)
        }
      }
    }

    await readDirRecursive(source)
    const totalTime = performance.now() - startTime
    console.log(`[Web] File reading performance:`)
    console.log(`  - Total files: ${files.length}`)
    console.log(`  - Total time: ${totalTime.toFixed(0)}ms`)
    return files
  }
}

/**
 * Check if directory/file picker is supported
 *
 * Returns true if:
 * - Running in Tauri (desktop app)
 * - Browser supports File System Access API (Chrome, Edge)
 * - Browser supports webkitdirectory (Safari, Firefox fallback)
 */
export function isDirectoryPickerSupported(): boolean {
  if (isTauri()) {
    return true // Tauri always supports directory picking
  }
  // Modern File System Access API (Chrome, Edge)
  if ('showDirectoryPicker' in window) {
    return true
  }
  // Fallback for Safari and older browsers (webkitdirectory)
  // All modern browsers support this, even if they don't have File System Access API
  return true
}
