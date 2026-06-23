import { ViewportStatusOverlay } from '@/components/ui'

interface AiStatusOverlaysProps {
  isDetecting: boolean
  detectionError: string | null
  isAnalyzing: boolean
  analysisError: string | null
  onDismissDetectionError: () => void
  onDismissAnalysisError: () => void
}

/**
 * Displays AI detection and analysis status overlays on the viewport.
 * Shows loading spinners during operations and error messages when operations fail.
 */
export function AiStatusOverlays({
  isDetecting,
  detectionError,
  isAnalyzing,
  analysisError,
  onDismissDetectionError,
  onDismissAnalysisError
}: AiStatusOverlaysProps) {
  return (
    <>
      {/* AI Detection Status */}
      {isDetecting && <ViewportStatusOverlay title="Detecting vertebrae…" />}

      {detectionError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div role="alert" className="bg-red-900/95 text-white px-6 py-4 rounded-lg shadow-2xl max-w-md border-2 border-red-500/50 pointer-events-auto">
            <div className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 flex-shrink-0 text-red-300 mt-0.5">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <div className="font-semibold text-base mb-1">AI Detection Failed</div>
                <div className="text-sm text-red-100 leading-relaxed">{detectionError}</div>
              </div>
              <button
                onClick={onDismissDetectionError}
                className="flex-shrink-0 text-red-300 hover:text-white transition-colors p-1 rounded hover:bg-red-800/50"
                title="Dismiss"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Status */}
      {isAnalyzing && <ViewportStatusOverlay title="Analyzing image…" />}

      {analysisError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div role="alert" className="bg-red-900/95 text-white px-6 py-4 rounded-lg shadow-2xl max-w-md border-2 border-red-500/50 pointer-events-auto">
            <div className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 flex-shrink-0 text-red-300 mt-0.5">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <div className="font-semibold text-base mb-1">AI Analysis Failed</div>
                <div className="text-sm text-red-100 leading-relaxed">{analysisError}</div>
              </div>
              <button
                onClick={onDismissAnalysisError}
                className="flex-shrink-0 text-red-300 hover:text-white transition-colors p-1 rounded hover:bg-red-800/50"
                title="Dismiss"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
