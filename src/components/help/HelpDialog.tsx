import { useEffect } from 'react'

interface HelpDialogProps {
  show: boolean
  onClose: () => void
}

export function HelpDialog({ show, onClose }: HelpDialogProps) {
  // Close on Escape key
  useEffect(() => {
    if (!show) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [show, onClose])

  if (!show) return null

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1a] rounded-lg p-6 max-w-3xl max-h-[85vh] overflow-y-auto border border-[#2a2a2a]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-100">OpenScans Help</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-100 text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-6 text-gray-300">
          {/* About */}
          <section>
            <h3 className="text-xl font-semibold text-blue-400 mb-3">About</h3>
            <p className="text-sm leading-relaxed mb-2">
              OpenScans is a web-based medical imaging viewer for DICOM files.
              All processing happens locally in your browser - no data is sent to external servers.
            </p>
            <p className="text-sm leading-relaxed">
              The viewer supports MR, CT, and other DICOM imaging modalities with advanced
              viewing tools, image manipulation, favorites, and export capabilities.
            </p>
          </section>

          {/* Getting Started */}
          <section>
            <h3 className="text-xl font-semibold text-blue-400 mb-3">Getting Started</h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong className="text-gray-200">Loading Files:</strong>
                <p>Drag and drop DICOM files or folders onto the upload zone, or click to browse.</p>
              </div>
              <div>
                <strong className="text-gray-200">Navigation:</strong>
                <p>Use arrow keys (← →) or the slider below the image to navigate through the series.</p>
              </div>
              <div>
                <strong className="text-gray-200">Image Adjustment:</strong>
                <p>Click and drag on the image to adjust window/level (brightness/contrast).</p>
              </div>
              <div>
                <strong className="text-gray-200">Zooming:</strong>
                <p>Use the scroll wheel or pinch gestures to zoom in/out.</p>
              </div>
              <div>
                <strong className="text-gray-200">Panning:</strong>
                <p>Hold Ctrl/Cmd and drag to pan the image when zoomed in.</p>
              </div>
            </div>
          </section>

          {/* Favorites */}
          <section>
            <h3 className="text-xl font-semibold text-blue-400 mb-3">Favorites</h3>
            <div className="space-y-2 text-sm">
              <p>Mark important images as favorites for quick access and batch export.</p>
              <div>
                <strong className="text-gray-200">Adding Favorites:</strong>
                <p>Click the star icon in the toolbar or on thumbnails to mark images as favorites.</p>
              </div>
              <div>
                <strong className="text-gray-200">Viewing Favorites:</strong>
                <p>The Favorites panel in the right sidebar shows all favorited images. Toggle between text list and thumbnail view.</p>
              </div>
              <div>
                <strong className="text-gray-200">Batch Export:</strong>
                <p>Export all favorites to a single PDF with customizable grid layouts (1×1, 2×2, 2×3, 3×3, 4×4).</p>
              </div>
            </div>
          </section>

          {/* Export */}
          <section>
            <h3 className="text-xl font-semibold text-blue-400 mb-3">Export</h3>
            <div className="space-y-2 text-sm">
              <p>Export images in various formats with enhanced quality and metadata control.</p>
              <div>
                <strong className="text-gray-200">Formats:</strong>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>PNG</strong> - Lossless image format (recommended)</li>
                  <li><strong>JPEG</strong> - Compressed format with quality control</li>
                  <li><strong>PDF</strong> - Professional report with optional metadata</li>
                </ul>
              </div>
              <div>
                <strong className="text-gray-200">Resolution Scaling:</strong>
                <p>Export at 1×, 2×, or 4× resolution for enhanced detail and print quality.</p>
              </div>
              <div>
                <strong className="text-gray-200">Privacy-First Naming:</strong>
                <p>Files are named using modality, date, and series numbers by default. Patient information is never included unless explicitly enabled.</p>
              </div>
            </div>
          </section>

          {/* Image Presets */}
          <section>
            <h3 className="text-xl font-semibold text-blue-400 mb-3">Image Presets</h3>
            <div className="space-y-2 text-sm">
              <p>Quick access to common window/level settings for different tissue types:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Brain</strong> - Optimized for brain tissue visualization</li>
                <li><strong>Bone</strong> - High contrast for bone structures</li>
                <li><strong>Soft Tissue</strong> - General soft tissue viewing</li>
                <li><strong>Lung</strong> - Wide window for lung parenchyma</li>
                <li><strong>Liver</strong> - Optimized for abdominal imaging</li>
              </ul>
            </div>
          </section>

          {/* Abbreviations */}
          <section>
            <h3 className="text-xl font-semibold text-blue-400 mb-3">Series Name Abbreviations</h3>
            <p className="text-sm mb-3">
              DICOM series descriptions use abbreviated naming conventions. The viewer automatically
              formats these for readability.
            </p>

            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-200 mb-2">Common MR Sequences</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div><strong>T1, T2</strong> - MR sequence types</div>
                  <div><strong>PD</strong> - Proton Density</div>
                  <div><strong>FLAIR</strong> - Fluid Attenuated Inversion Recovery</div>
                  <div><strong>STIR</strong> - Short TI Inversion Recovery</div>
                  <div><strong>TSE</strong> - Turbo Spin Echo</div>
                  <div><strong>GRE</strong> - Gradient Echo</div>
                  <div><strong>DWI</strong> - Diffusion Weighted Imaging</div>
                  <div><strong>SWI</strong> - Susceptibility Weighted Imaging</div>
                  <div><strong>SPACE</strong> - 3D acquisition technique</div>
                  <div><strong>MPR</strong> - Multi-Planar Reformation</div>
                  <div><strong>VIBE</strong> - Volume Interpolated Breath-hold</div>
                  <div><strong>FLASH</strong> - Fast Low Angle Shot</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-200 mb-2">Orientations</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div><strong>Sagittal (sag)</strong> - Side view (left/right)</div>
                  <div><strong>Coronal (cor)</strong> - Front/back view</div>
                  <div><strong>Transverse (tra)</strong> - Cross-section view</div>
                  <div><strong>Axial (ax)</strong> - Horizontal cross-section</div>
                  <div><strong>Oblique</strong> - Angled plane</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-200 mb-2">Modifiers</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div><strong>Fat Sat (fs)</strong> - Fat suppression</div>
                  <div><strong>Isotropic (iso)</strong> - Equal voxel dimensions</div>
                  <div><strong>Pre/Post</strong> - Contrast administration timing</div>
                  <div><strong>3D/2D</strong> - Acquisition dimensionality</div>
                </div>
              </div>

              <div className="mt-3 p-3 bg-[#0f0f0f] rounded border border-[#2a2a2a]">
                <p className="text-xs text-gray-400">
                  <strong>Example:</strong> "t2_space_sag_iso" becomes "T2 SPACE Sagittal Isotropic"
                </p>
              </div>
            </div>
          </section>

          {/* Privacy & Security */}
          <section>
            <h3 className="text-xl font-semibold text-blue-400 mb-3">Privacy & Security</h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong className="text-gray-200">Client-Side Processing:</strong>
                <p>All DICOM files are processed locally in your browser. No patient data is transmitted to external servers.</p>
              </div>
              <div>
                <strong className="text-gray-200">No Storage:</strong>
                <p>Studies are held in memory only and are cleared when you close the browser or load new files.</p>
              </div>
              <div>
                <strong className="text-gray-200">Privacy-First Exports:</strong>
                <p>Exported filenames exclude patient identifiable information by default. You must explicitly enable patient data inclusion in exports.</p>
              </div>
              <div>
                <strong className="text-gray-200">HIPAA-Compliant Logging:</strong>
                <p>Console logs never contain patient names, IDs, or identifiable information. Only critical errors and compression warnings are logged to maintain privacy while allowing technical debugging.</p>
              </div>
              <div className="mt-3 p-3 bg-[#0f0f0f] rounded border border-[#2a2a2a]">
                <p className="text-xs text-gray-400">
                  <strong>Safe to Use:</strong> This viewer can be safely used in clinical and research environments that require strict patient data protection. All processing happens locally with zero data transmission.
                </p>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-xl font-semibold text-blue-400 mb-3">Keyboard Shortcuts</h3>
            <p className="text-sm mb-2">
              Press <kbd className="px-2 py-1 bg-[#0f0f0f] text-gray-100 rounded text-xs font-mono border border-[#2a2a2a]">?</kbd> or
              use the keyboard icon to view all available shortcuts.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
