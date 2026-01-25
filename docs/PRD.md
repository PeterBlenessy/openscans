# Product Requirement Description: OpenScans

## 1. Overview

A modern web-based application for viewing and annotating MR (Magnetic Resonance) images in DICOM format. The application enables real-time viewing of DICOM files without requiring batch conversion, with integrated annotation capabilities for displaying radiologist findings and report comments.

## 2. Goals and Objectives

### Primary Goals
- Provide instant access to MR DICOM images through a web browser
- Enable "live" viewing without pre-conversion or processing delays
- Display radiologist findings and annotations directly on images
- Allow users to export annotated views for sharing and documentation

### Success Metrics
- Load and display DICOM images within 2-3 seconds of selection
- Support standard DICOM MR image formats
- Intuitive UX requiring minimal training
- Accurate overlay of annotations with doctor's findings

## 3. Target Users

- **Primary**: Radiologists and referring physicians reviewing MR scans
- **Secondary**: Medical students, researchers, patients (with appropriate access controls)
- **Technical Level**: Varying from basic computer users to technical specialists

## 4. Core Features

### 4.1 DICOM Image Viewing
- **Real-time Loading**: Stream and display DICOM files without full conversion
- **Multi-slice Navigation**: Navigate through MR image series/stacks
- **Window/Level Adjustment**: Interactive contrast and brightness control
- **Zoom and Pan**: Standard image manipulation tools
- **Multi-planar Reconstruction (MPR)**: Display axial, sagittal, and coronal views
- **Series Management**: Handle multiple series within a study

### 4.2 Annotations and Findings Display
- **Overlay System**: Display annotations on top of images without modifying source
- **Structured Findings**: Show doctor's report findings linked to specific image locations
- **Interactive Annotations**:
  - Markers/pointers
  - Measurement lines and angles
  - Region highlighting
  - Text labels and comments
- **Annotation Management**: Toggle visibility, filter by type or author

### 4.3 Export Capabilities
- **Current View Export**: Export exactly what's displayed on screen
- **Format Options**:
  - PNG/JPEG (with annotations burned in)
  - PDF report format
  - DICOM with annotation metadata
- **Include Metadata**: Option to include patient info, study details, findings
- **Batch Export**: Export multiple views or entire series

### 4.4 User Interface
- **Modern Design**: Clean, responsive interface following modern UX principles
- **Dark/Light Themes**: Optimal viewing in different lighting conditions
- **Touch Support**: Tablet and touch screen compatibility
- **Keyboard Shortcuts**: Efficient navigation for power users
- **Responsive Layout**: Works across desktop, tablet, and large mobile devices

## 5. Technical Requirements

### 5.1 DICOM Processing
- **Client-side Parsing**: Parse DICOM files in the browser
- **Streaming Support**: Progressive loading for large files
- **Format Support**:
  - DICOM Part 10 format
  - Common MR transfer syntaxes (uncompressed, JPEG lossy/lossless, JPEG 2000)
- **Metadata Extraction**: Read and display DICOM tags

### 5.2 Performance
- **Fast Initial Load**: Application loads in < 3 seconds
- **Image Rendering**: Smooth scrolling through image stacks (60 fps target)
- **Memory Management**: Efficient handling of large series (100+ images)
- **Caching**: Smart caching of previously viewed images

### 5.3 Technology Stack Considerations
- **Frontend Framework**: Modern JavaScript framework (React, Vue, or similar)
- **DICOM Library**: Cornerstone.js, OHIF Viewer components, or similar
- **Graphics**: WebGL/Canvas for image rendering
- **File Handling**: File API, drag-and-drop support
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

### 5.4 Data Security and Privacy
- **HIPAA Compliance**: Follow healthcare data privacy requirements
- **Client-side Processing**: Process sensitive data in browser when possible
- **Secure Transport**: HTTPS for all communications
- **Access Controls**: Authentication and authorization mechanisms
- **Audit Logging**: Track access to patient studies

## 6. Data Model

### 6.1 Input Data
- **DICOM Files**: Standard DICOM format MR images
- **Study Organization**: Support DICOM hierarchy (Patient → Study → Series → Instance)
- **Reports**: Structured or semi-structured radiologist reports
- **Annotations**: External annotation files or embedded metadata

### 6.2 Annotation Data Structure
```
{
  "studyId": "...",
  "seriesId": "...",
  "instanceId": "...",
  "findings": [
    {
      "id": "...",
      "type": "marker|measurement|region|text",
      "location": { "x": 0, "y": 0, "slice": 0 },
      "description": "...",
      "severity": "normal|abnormal|critical",
      "author": "...",
      "timestamp": "..."
    }
  ]
}
```

## 7. User Workflows

### 7.1 Basic Viewing Workflow
1. User opens application
2. Loads DICOM file(s) via file picker or drag-and-drop
3. Application parses and displays first image
4. User navigates through series, adjusts window/level
5. Views annotations and findings overlaid on images

### 7.2 Annotation Review Workflow
1. Image displayed with findings list
2. User clicks on finding in list
3. Application navigates to relevant slice and highlights area
4. User reviews annotation details and comments
5. User can add notes or measurements

### 7.3 Export Workflow
1. User positions image to desired view
2. Adjusts window/level, zoom, and annotation visibility
3. Clicks export button
4. Selects format and options
5. Downloads exported file

## 8. Non-Functional Requirements

### 8.1 Usability
- Intuitive interface requiring < 15 minutes to learn basic functions
- Consistent with common medical imaging viewer paradigms
- Accessible (WCAG 2.1 AA compliance where applicable)

### 8.2 Reliability
- Handle malformed DICOM files gracefully
- Clear error messages for unsupported formats
- Auto-save user preferences and view settings

### 8.3 Scalability
- Support studies with 1000+ images
- Handle concurrent users (if multi-user deployment)

## 9. Future Considerations

### Phase 2 Enhancements
- 3D volume rendering
- Advanced measurements (volume calculations, SUV for PET-MR)
- Comparison mode (side-by-side studies)
- Integration with PACS systems
- Cloud storage integration
- Collaborative annotation tools
- AI-assisted findings detection

### Integration Opportunities
- PACS/VNA systems via DICOMweb
- RIS/HIS systems for patient context
- Reporting systems for structured reports
- Cloud storage (AWS S3, Google Cloud Storage)

## 10. Open Questions

1. **Report Format**: What format will doctor's reports be in? (HL7, FHIR, custom JSON, plain text?)
2. **Deployment**: Self-hosted or cloud-based? Single-user or multi-user?
3. **Storage**: Where will DICOM files be stored? (Local filesystem, server, cloud?)
4. **Annotation Creation**: Will users create new annotations or only view existing ones?
5. **Collaboration**: Do multiple users need to view/annotate the same study simultaneously?
6. **Regulatory**: Are there specific regulatory requirements (FDA, CE marking, etc.)?

## 11. Out of Scope (v1.0)

- DICOM file editing or manipulation
- Advanced 3D rendering
- CT, X-ray, or other modality support (focus on MR only initially)
- PACS integration
- Mobile app (responsive web only)
- Real-time collaboration features
- AI/ML analysis features

## 12. Dependencies and Risks

### Dependencies
- Browser support for WebGL and modern JavaScript APIs
- DICOM parsing library availability and licensing
- Annotation data format standardization

### Risks
- **Performance**: Large DICOM files may cause browser performance issues
- **Browser Compatibility**: Older browsers may not support required features
- **Privacy**: Handling PHI requires careful security implementation
- **Format Variability**: DICOM format variations may cause parsing issues

## 13. Timeline Estimate

- **Phase 1**: Basic DICOM viewer with window/level controls
- **Phase 2**: Annotation overlay system
- **Phase 3**: Export functionality
- **Phase 4**: Polish, optimization, and testing

---

**Document Version**: 1.0
**Last Updated**: 2026-01-18
**Status**: Draft
