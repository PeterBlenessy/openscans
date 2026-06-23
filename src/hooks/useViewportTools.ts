import { RefObject, useEffect } from 'react'
import {
  cornerstoneTools,
  areToolsInitialized,
  addMeasurementToolsForElement,
} from '@/lib/cornerstone/initCornerstone'
import { useViewportStore } from '@/stores/viewportStore'
import { useStudyStore } from '@/stores/studyStore'
import { useAnnotationStore } from '@/stores/annotationStore'
import {
  MEASUREMENT_TOOL_NAMES,
  isMeasurementTool,
  buildAnnotationFromMeasurement,
  ToolMeasurementData,
} from '@/lib/cornerstone/tools'
import { getPixelSpacing } from '@/lib/dicom/pixelSpacing'

const MEASUREMENT_COMPLETED_EVENT = 'cornerstonetoolsmeasurementcompleted'

/** Generate a reasonably-unique annotation id without adding a dependency. */
function generateId(): string {
  return `measurement-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Wires the cornerstone-tools measurement / ROI tools to the viewport element.
 *
 * Responsibilities:
 * - Registers the element with cornerstone-tools' input manager (`addToolForElement`
 *   is implicit; activation is per-element via `setToolActiveForElement`).
 * - Activates the measurement tool that matches `viewportStore.activeTool`
 *   (left mouse button) and deactivates it when a non-measurement tool is chosen.
 * - On `measurementCompleted`, persists the result into the annotation store as a
 *   `MeasurementAnnotation` (length/angle) or `RegionAnnotation` (ROI), calibrated
 *   with the current instance's pixel spacing where available.
 *
 * Cleans up its event listener on unmount / element change.
 *
 * @param canvasRef - Ref to the enabled Cornerstone viewport element
 * @param isInitialized - Whether the viewport element is enabled
 */
export function useViewportTools(
  canvasRef: RefObject<HTMLDivElement>,
  isInitialized: boolean
): void {
  const activeTool = useViewportStore((s) => s.activeTool)

  // Activate / deactivate the matching cornerstone tool when activeTool changes.
  useEffect(() => {
    const element = canvasRef.current
    if (!element || !isInitialized || !areToolsInitialized()) return

    try {
      // Ensure the measurement tools are registered on THIS element — global
      // addTool doesn't reach an element enabled before tools-init. Idempotent.
      addMeasurementToolsForElement(element)

      // Deactivate every measurement tool first, then activate the selected one.
      for (const name of Object.values(MEASUREMENT_TOOL_NAMES)) {
        cornerstoneTools.setToolPassiveForElement(element, name)
      }

      if (isMeasurementTool(activeTool)) {
        // Bind to the left mouse button (mask 1).
        cornerstoneTools.setToolActiveForElement(element, activeTool, { mouseButtonMask: 1 })
      }
    } catch (err) {
      console.warn('[ViewportTools] Failed to switch tool:', err)
    }
  }, [activeTool, isInitialized, canvasRef])

  // Persist completed measurements into the annotation store.
  useEffect(() => {
    const element = canvasRef.current
    if (!element || !isInitialized || !areToolsInitialized()) return

    const handleMeasurementCompleted = (evt: Event) => {
      const detail = (evt as CustomEvent).detail as
        | { toolName?: string; measurementData?: ToolMeasurementData }
        | undefined
      if (!detail?.toolName || !isMeasurementTool(detail.toolName) || !detail.measurementData) {
        return
      }

      const { currentInstance, currentSeries } = useStudyStore.getState()
      if (!currentInstance || !currentSeries) return

      const annotation = buildAnnotationFromMeasurement({
        id: generateId(),
        toolName: detail.toolName,
        data: detail.measurementData,
        seriesInstanceUID: currentSeries.seriesInstanceUID,
        sopInstanceUID: currentInstance.sopInstanceUID,
        instanceNumber: currentInstance.instanceNumber,
        pixelSpacing: getPixelSpacing(currentInstance.metadata),
        // measurementType / shape stays uncalibrated when spacing is missing.
      })

      if (annotation) {
        useAnnotationStore.getState().addAnnotation(annotation)
      }
    }

    element.addEventListener(MEASUREMENT_COMPLETED_EVENT, handleMeasurementCompleted as EventListener)
    return () => {
      element.removeEventListener(
        MEASUREMENT_COMPLETED_EVENT,
        handleMeasurementCompleted as EventListener
      )
    }
  }, [isInitialized, canvasRef])
}
