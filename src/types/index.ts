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

/**
 * Comprehensive DICOM metadata interface with explicit typing for all standard DICOM tags.
 * This interface provides strong typing for commonly used DICOM attributes while maintaining
 * flexibility for custom/vendor-specific tags through the customTags property.
 *
 * DICOM tag references are provided in (group,element) format for documentation.
 */
export interface DicomMetadata {
  // ========== Patient Information Module ==========
  /** Patient's full name (0010,0010) */
  patientName?: string
  /** Primary hospital identification number (0010,0020) */
  patientID?: string
  /** Patient's birth date in YYYYMMDD format (0010,0030) */
  patientBirthDate?: string
  /** Patient's sex: M, F, O (other), or undefined (0010,0040) */
  patientSex?: string
  /** Patient's age in format like "025Y" or "6M" (0010,1010) */
  patientAge?: string
  /** Patient's weight in kg (0010,1030) */
  patientWeight?: number

  // ========== Study Information Module ==========
  /** Unique identifier for the study (0020,000D) */
  studyInstanceUID?: string
  /** Date study started in YYYYMMDD format (0008,0020) */
  studyDate?: string
  /** Time study started in HHMMSS format (0008,0030) */
  studyTime?: string
  /** Institution-generated study description (0008,1030) */
  studyDescription?: string
  /** Hospital/institution accession number (0008,0050) */
  accessionNumber?: string
  /** Referring physician's name (0008,0090) */
  referringPhysicianName?: string

  // ========== Series Information Module ==========
  /** Unique identifier for the series (0020,000E) */
  seriesInstanceUID?: string
  /** Series number for ordering (0020,0011) */
  seriesNumber?: number
  /** User-defined description of the series (0008,103E) */
  seriesDescription?: string
  /** Date series started in YYYYMMDD format (0008,0021) */
  seriesDate?: string
  /** Time series started in HHMMSS format (0008,0031) */
  seriesTime?: string

  // ========== Equipment Information Module ==========
  /** Type of equipment: CT, MR, CR, DX, etc. (0008,0060) */
  modality?: string
  /** Manufacturer of the equipment (0008,0070) */
  manufacturer?: string
  /** Manufacturer's model name (0008,1090) */
  manufacturerModelName?: string
  /** Institution name where equipment is located (0008,0080) */
  institutionName?: string
  /** User-defined name for the station (0008,1010) */
  stationName?: string

  // ========== Instance (Image) Information Module ==========
  /** Unique identifier for this instance (0008,0018) */
  sopInstanceUID?: string
  /** Instance number for ordering within series (0020,0013) */
  instanceNumber?: number

  // ========== Image Pixel Module ==========
  /** Number of rows in the image (0028,0010) */
  rows?: number
  /** Number of columns in the image (0028,0011) */
  columns?: number
  /** Number of bits allocated for each pixel (0028,0100) - typically 8, 12, or 16 */
  bitsAllocated?: number
  /** Number of bits stored per pixel (0028,0101) */
  bitsStored?: number
  /** High bit position (0028,0102) */
  highBit?: number
  /** Samples per pixel: 1=grayscale, 3=RGB (0028,0002) */
  samplesPerPixel?: number
  /** Photometric interpretation: MONOCHROME1, MONOCHROME2, RGB, etc. (0028,0004) */
  photometricInterpretation?: string

  // ========== Display and Presentation ==========
  /** Default window center for display (0028,1050) */
  windowCenter?: number
  /** Default window width for display (0028,1051) */
  windowWidth?: number
  /** Smallest pixel value in the image (0028,0106) */
  minPixelValue?: number
  /** Largest pixel value in the image (0028,0107) */
  maxPixelValue?: number
  /** Rescale intercept for modality LUT (0028,1052) - used in CT/PET */
  rescaleIntercept?: number
  /** Rescale slope for modality LUT (0028,1053) - used in CT/PET */
  rescaleSlope?: number

  // ========== Spatial Information Module ==========
  /** Position of slice along patient axis in mm (0020,1041) */
  sliceLocation?: number
  /** Nominal slice thickness in mm (0018,0050) */
  sliceThickness?: number
  /** Physical spacing between pixel centers in mm [row, col] (0028,0030) */
  pixelSpacing?: [number, number]
  /** X, Y, Z coordinates of upper left pixel in mm (0020,0032) */
  imagePosition?: [number, number, number]
  /** Direction cosines of row and column (0020,0037) - [rowX, rowY, rowZ, colX, colY, colZ] */
  imageOrientation?: [number, number, number, number, number, number]

  // ========== Clinical and Anatomical ==========
  /** Body part examined (0018,0015) - e.g., "CHEST", "HEAD", "ABDOMEN" */
  bodyPartExamined?: string
  /** Patient position: HFS, FFS, HFP, FFP, etc. (0018,5100) */
  patientPosition?: string
  /** User-defined image comments (0020,4000) */
  imageComments?: string

  // ========== Acquisition Parameters (modality-specific) ==========
  /** KVP (kilovoltage peak) for X-ray/CT (0018,0060) */
  kvp?: number
  /** Exposure time in ms (0018,1150) */
  exposureTime?: number
  /** X-ray tube current in mA (0018,1151) */
  xRayTubeCurrent?: number
  /** Repetition time in MR (0018,0080) */
  repetitionTime?: number
  /** Echo time in MR (0018,0081) */
  echoTime?: number
  /** Magnetic field strength in Tesla (0018,0087) */
  magneticFieldStrength?: number

  // ========== Custom/Vendor-Specific Tags ==========
  /**
   * Container for non-standard, vendor-specific, or uncommon DICOM tags
   * that don't fit into the predefined categories above.
   * Keys should be DICOM tag identifiers (e.g., "x00091001")
   */
  customTags?: Record<string, string | number>
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
