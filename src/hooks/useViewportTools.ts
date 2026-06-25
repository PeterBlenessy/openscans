/* eslint-disable @typescript-eslint/no-explicit-any */
import { RefObject, useEffect } from 'react'
import {
  cornerstoneTools,
  areToolsInitialized,
  addMeasurementToolsForElement,
} from '@/lib/cornerstone/initCornerstone'
import { useViewportStore } from '@/stores/viewportStore'
import { useStudyStore } from '@/stores/studyStore'
import { MEASUREMENT_TOOL_NAMES, isMeasurementTool } from '@/lib/cornerstone/tools'
import {
  persistMeasurements,
  restoreMeasurements,
  hasStoredMeasurements,
} from '@/lib/cornerstone/measurementPersistence'

const DRAW_TOOLS = Object.values(MEASUREMENT_TOOL_NAMES)
const ERASER = 'Eraser'

/** Resolve a cornerstone imageId to its DICOM sopInstanceUID via the series. */
function sopForImageId(imageId: string | undefined): string | undefined {
  const { currentSeries, currentInstance } = useStudyStore.getState()
  if (imageId && currentSeries) {
    const inst = currentSeries.instances.find((i) => i.imageId === imageId)
    if (inst) return inst.sopInstanceUID
  }
  return currentInstance?.sopInstanceUID
}

/**
 * Wires the cornerstone-tools measurement / ROI / eraser tools to the viewport
 * element. cornerstone-tools is the single source: it draws, moves, resizes and
 * deletes measurements natively. We add a `Pointer` mode (select/move/resize)
 * and an `Eraser` mode (click to delete), drive the cursor per mode, and persist
 * tool state per `sopInstanceUID` so measurements survive reloads / slice changes.
 *
 * @param canvasRef - Ref to the enabled Cornerstone viewport element
 * @param isInitialized - Whether the viewport element is enabled
 */
export function useViewportTools(
  canvasRef: RefObject<HTMLDivElement>,
  isInitialized: boolean
): void {
  const activeTool = useViewportStore((s) => s.activeTool)

  // Map activeTool → cornerstone tool modes + cursor.
  useEffect(() => {
    const element = canvasRef.current
    if (!element || !isInitialized || !areToolsInitialized()) return

    try {
      addMeasurementToolsForElement(element)
      cornerstoneTools.setToolPassiveForElement(element, ERASER)

      if (isMeasurementTool(activeTool)) {
        // Drawing: the chosen tool owns the left button; others stay movable.
        for (const name of DRAW_TOOLS) cornerstoneTools.setToolPassiveForElement(element, name)
        cornerstoneTools.setToolActiveForElement(element, activeTool, { mouseButtonMask: 1 })
        // cornerstone (showSVGCursors) sets a crosshair cursor.
      } else if (activeTool === ERASER) {
        for (const name of DRAW_TOOLS) cornerstoneTools.setToolPassiveForElement(element, name)
        cornerstoneTools.setToolActiveForElement(element, ERASER, { mouseButtonMask: 1 })
      } else if (activeTool === 'Pointer') {
        // Select / move / resize existing measurements (handles grabbable).
        for (const name of DRAW_TOOLS) cornerstoneTools.setToolPassiveForElement(element, name)
        element.style.cursor = 'default'
      } else {
        // Navigation (WindowLevel / Pan / Zoom / StackScroll): measurements are
        // visible but not grabbable, so a drag never accidentally moves a handle.
        for (const name of DRAW_TOOLS) cornerstoneTools.setToolEnabledForElement(element, name)
        element.style.cursor = 'default'
      }
    } catch (err) {
      console.warn('[ViewportTools] Failed to switch tool:', err)
    }
  }, [activeTool, isInitialized, canvasRef])

  // Persist tool state on change; restore it the first time a slice is shown.
  useEffect(() => {
    const element = canvasRef.current
    if (!element || !isInitialized || !areToolsInitialized()) return

    let persistTimer: number | undefined
    const schedulePersist = () => {
      const sop = useStudyStore.getState().currentInstance?.sopInstanceUID
      if (!sop) return
      if (persistTimer) window.clearTimeout(persistTimer)
      persistTimer = window.setTimeout(() => persistMeasurements(element, sop), 250)
    }

    // Restore from localStorage once per imageId per session (cornerstone keeps
    // measurements in memory for the rest of the session). Guarded by
    // hasStoredMeasurements so we never clear unsaved in-memory state.
    const restored = new Set<string>()
    const handleNewImage = (evt: Event) => {
      const imageId = (evt as any).detail?.image?.imageId as string | undefined
      if (!imageId || restored.has(imageId)) return
      restored.add(imageId)
      const sop = sopForImageId(imageId)
      if (sop && hasStoredMeasurements(sop)) restoreMeasurements(element, sop)
    }

    element.addEventListener('cornerstonetoolsmeasurementadded', schedulePersist)
    element.addEventListener('cornerstonetoolsmeasurementmodified', schedulePersist)
    element.addEventListener('cornerstonetoolsmeasurementremoved', schedulePersist)
    element.addEventListener('cornerstonenewimage', handleNewImage as EventListener)

    return () => {
      if (persistTimer) window.clearTimeout(persistTimer)
      element.removeEventListener('cornerstonetoolsmeasurementadded', schedulePersist)
      element.removeEventListener('cornerstonetoolsmeasurementmodified', schedulePersist)
      element.removeEventListener('cornerstonetoolsmeasurementremoved', schedulePersist)
      element.removeEventListener('cornerstonenewimage', handleNewImage as EventListener)
    }
  }, [isInitialized, canvasRef])
}
