import { DicomInstance } from '@/types'
import { formatSeriesDescription } from '../utils/formatSeriesDescription'

/**
 * Generate a privacy-first filename for DICOM exports
 * Default: No patient identifiable information
 * Format: {Modality} - {SeriesDescription} - {InstanceNum}.{ext}
 * Example: MR - T2 SPACE Sagittal Isotropic - 45.png
 */
export function generateFilename(
  instance: DicomInstance | null,
  extension: string,
  includePatientID: boolean = false
): string {
  if (!instance?.metadata) {
    // Fallback if metadata missing
    const timestamp = new Date().getTime()
    return `DICOM_Export_${timestamp}.${extension}`
  }

  const { metadata } = instance
  const parts: string[] = []

  // Privacy-first: Use PatientID only if explicitly enabled
  if (includePatientID && metadata.patientID) {
    parts.push(metadata.patientID.replace(/[^a-zA-Z0-9]/g, '_'))
  } else {
    // Default: Use modality (no patient data)
    parts.push(metadata.modality || 'DICOM')
  }

  // Series description (formatted for readability)
  if (metadata.seriesDescription) {
    const formatted = formatSeriesDescription(metadata.seriesDescription)
    parts.push(formatted)
  } else if (metadata.seriesNumber !== undefined) {
    parts.push(`Series ${metadata.seriesNumber}`)
  }

  // Instance number
  if (metadata.instanceNumber !== undefined) {
    parts.push(String(metadata.instanceNumber))
  }

  // If we have no metadata parts, use timestamp
  if (parts.length === 0) {
    const timestamp = new Date().getTime()
    return `DICOM_Export_${timestamp}.${extension}`
  }

  return `${parts.join(' - ')}.${extension}`
}

/**
 * Preview filename before export
 */
export function previewFilename(
  instance: DicomInstance | null,
  format: string,
  includePatientID: boolean = false
): string {
  const extension = format.toLowerCase()
  return generateFilename(instance, extension, includePatientID)
}
