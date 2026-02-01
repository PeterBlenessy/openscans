/**
 * IndexedDB storage for File System Access API directory handles
 * Allows persisting directory references across page reloads
 */

const DB_NAME = 'openscans-directory-handles'
const DB_VERSION = 1
const STORE_NAME = 'directory-handles'

interface DirectoryHandleEntry {
  id: string
  handle: FileSystemDirectoryHandle
  name: string
  savedAt: number
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })

  return dbPromise
}

/**
 * Save a directory handle to IndexedDB
 */
export async function saveDirectoryHandle(
  id: string,
  handle: FileSystemDirectoryHandle
): Promise<void> {
  const db = await openDB()
  const entry: DirectoryHandleEntry = {
    id,
    handle,
    name: handle.name,
    savedAt: Date.now(),
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(entry)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * Get a directory handle from IndexedDB
 */
export async function getDirectoryHandle(
  id: string
): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const entry = request.result as DirectoryHandleEntry | undefined
        resolve(entry?.handle || null)
      }
    })
  } catch (error) {
    console.error('Failed to get directory handle:', error)
    return null
  }
}

/**
 * Check if we have permission to access a directory handle
 */
export async function checkDirectoryPermission(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  try {
    // @ts-expect-error - queryPermission is experimental File System API
    const permission = await handle.queryPermission({ mode: 'read' })
    return permission === 'granted'
  } catch (error) {
    console.error('Failed to check directory permission:', error)
    return false
  }
}

/**
 * Request permission to access a directory handle
 */
export async function requestDirectoryPermission(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  try {
    // @ts-expect-error - requestPermission is experimental File System API
    const permission = await handle.requestPermission({ mode: 'read' })
    return permission === 'granted'
  } catch (error) {
    console.error('Failed to request directory permission:', error)
    return false
  }
}

/**
 * Remove a directory handle from IndexedDB
 */
export async function removeDirectoryHandle(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * Clear all directory handles from IndexedDB
 */
export async function clearAllDirectoryHandles(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export interface FileWithDirectory {
  file: File
  directoryHandle: FileSystemDirectoryHandle
  directoryName: string
}

/**
 * Read all DICOM files from a directory handle
 */
export async function readDicomFilesFromDirectory(
  handle: FileSystemDirectoryHandle
): Promise<File[]> {
  const files: File[] = []

  async function processDirectory(dirHandle: FileSystemDirectoryHandle) {
    // @ts-expect-error - values() is experimental File System API
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const file = await entry.getFile()
        // Check if it's likely a DICOM file (by extension or no extension)
        if (
          file.name.toLowerCase().endsWith('.dcm') ||
          !file.name.includes('.') ||
          file.name.toLowerCase().endsWith('.dicom')
        ) {
          files.push(file)
        }
      } else if (entry.kind === 'directory') {
        // Recursively process subdirectories
        await processDirectory(entry)
      }
    }
  }

  await processDirectory(handle)
  return files
}

/**
 * Read all DICOM files from a directory handle with directory tracking
 */
export async function readDicomFilesWithDirectories(
  handle: FileSystemDirectoryHandle
): Promise<FileWithDirectory[]> {
  const filesWithDirs: FileWithDirectory[] = []

  async function processDirectory(dirHandle: FileSystemDirectoryHandle) {
    // @ts-expect-error - values() is experimental File System API
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const file = await entry.getFile()
        // Check if it's likely a DICOM file (by extension or no extension)
        if (
          file.name.toLowerCase().endsWith('.dcm') ||
          !file.name.includes('.') ||
          file.name.toLowerCase().endsWith('.dicom')
        ) {
          filesWithDirs.push({
            file,
            directoryHandle: dirHandle,
            directoryName: dirHandle.name,
          })
        }
      } else if (entry.kind === 'directory') {
        // Recursively process subdirectories
        await processDirectory(entry)
      }
    }
  }

  await processDirectory(handle)
  return filesWithDirs
}
