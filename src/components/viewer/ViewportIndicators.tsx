import { annotationColors } from '@/lib/colors'

interface ViewportIndicatorsProps {
  isDragging: boolean
  isPanning: boolean
  isActivelyZooming: boolean
  currentWL: { width: number; center: number }
  zoom: number
}

/**
 * Displays viewport state indicators (window/level, pan, zoom) in the bottom-left corner.
 * Indicators animate and highlight when the user is actively adjusting values.
 */
export function ViewportIndicators({
  isDragging,
  isPanning,
  isActivelyZooming,
  currentWL,
  zoom
}: ViewportIndicatorsProps) {
  return (
    <>
      {/* Window/Level indicator - bottom-left corner (above zoom) */}
      <div
        className={`absolute bottom-[3.125rem] left-4 transition-all duration-300 ${
          isDragging
            ? 'bg-black/90 px-4 py-2.5 rounded-lg shadow-xl scale-110'
            : 'bg-black/60 px-3 py-1.5 rounded shadow-md'
        }`}
      >
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`transition-all duration-300 ${
              isDragging ? 'w-4 h-4' : 'w-3 h-3 text-gray-500'
            }`}
            style={isDragging ? { color: annotationColors.yellow } : {}}
          >
            <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.061 1.06l1.06 1.06z" />
          </svg>
          <div
            className={`font-mono font-medium transition-all duration-300 flex gap-3 ${
              isDragging
                ? 'text-sm text-white'
                : 'text-[11px] text-gray-400'
            }`}
          >
            <span>C: {Math.round(currentWL.width)}</span>
            <span>B: {Math.round(currentWL.center)}</span>
          </div>
        </div>
      </div>

      {/* Pan indicator overlay */}
      {isPanning && (
        <div className="absolute top-4 left-4 bg-black/80 text-white px-4 py-2 rounded shadow-lg">
          <div className="text-sm font-mono">
            <div>Panning</div>
          </div>
        </div>
      )}

      {/* Zoom level indicator - bottom-left corner */}
      <div
        className={`absolute bottom-4 left-4 transition-all duration-300 ${
          isActivelyZooming
            ? 'bg-black/90 px-4 py-2.5 rounded-lg shadow-xl scale-110'
            : 'bg-black/60 px-3 py-1.5 rounded shadow-md'
        }`}
      >
        <div className="flex items-baseline gap-1.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`transition-all duration-300 ${
              isActivelyZooming ? 'w-4 h-4' : 'w-3 h-3 text-gray-500'
            }`}
            style={isActivelyZooming ? { color: annotationColors.cyan } : {}}
          >
            <path d="M9 6a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 019 6z" />
            <path fillRule="evenodd" d="M2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9zm7-5.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11z" clipRule="evenodd" />
          </svg>
          <span
            className={`font-mono font-medium transition-all duration-300 ${
              isActivelyZooming
                ? 'text-base text-white'
                : 'text-xs text-gray-400'
            }`}
          >
            {zoom.toFixed(1)}x
          </span>
        </div>
      </div>
    </>
  )
}
