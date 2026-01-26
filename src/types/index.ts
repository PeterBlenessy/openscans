// Core DICOM types
export interface DicomStudy {
  studyInstanceUID: string
  studyDate: string
  studyDescription: string
  patientName: string
  patientID: string
  series: DicomSeries[]
  directoryHandleId?: string // Reference to directory handle for this specific study (web mode)
  folderPath?: string // Folder path for this specific study (desktop mode)
}

export interface DicomSeries {
  seriesInstanceUID: string
  seriesNumber: number
  seriesDescription: string
  modality: string
  instances: DicomInstance[]
}

export interface DicomInstance {
  sopInstanceUID: string
  instanceNumber: number
  imageId: string
  rows: number
  columns: number
  metadata?: DicomMetadata
}

export interface DicomMetadata {
  [key: string]: string | number | undefined
  patientName?: string
  patientID?: string
  studyDate?: string
  studyDescription?: string
  seriesDescription?: string
  modality?: string
  seriesNumber?: number
  instanceNumber?: number
  rows?: number
  columns?: number
  windowCenter?: number
  windowWidth?: number
  sliceLocation?: number
  sliceThickness?: number
}

// Viewport types
export interface ViewportSettings {
  windowCenter: number
  windowWidth: number
  zoom: number
  pan: { x: number; y: number }
  rotation: number
  invert: boolean
  flipHorizontal: boolean
  flipVertical: boolean
}

export interface Tool {
  name: string
  mode: 'active' | 'passive' | 'enabled' | 'disabled'
  bindings?: ToolBinding[]
}

export interface ToolBinding {
  mouseButton: number
  modifierKey?: string
}
