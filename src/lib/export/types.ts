export type ExportFormat = 'png' | 'jpeg' | 'pdf'
export type ExportScale = 1 | 2 | 4

export interface ExportOptions {
  format: ExportFormat
  scale: ExportScale
  jpegQuality?: number // 50-100
  includePatientName?: boolean
  includePatientID?: boolean
  includeStudyDescription?: boolean
  includeSeriesDescription?: boolean
}

export interface ExportResult {
  success: boolean
  filename: string
  blob?: Blob
  error?: string
}
