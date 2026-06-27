/* eslint-disable @typescript-eslint/no-explicit-any */
import { RefObject, useEffect } from 'react'
import { cornerstone, cornerstoneTools, areToolsInitialized } from '@/lib/cornerstone/initCornerstone'
import { useStudyStore } from '@/stores/studyStore'

/**
 * Enables cornerstone-tools `stackPrefetch` on the main viewport so the whole
 * series is pulled into the image cache around the current slice — making
 * subsequent scrolling instant instead of loading each slice on demand.
 *
 * The app navigates via the store (not a cornerstone stack), so we attach a
 * read-only `stack` tool state purely as input for the prefetcher: it never
 * drives navigation. The stack's currentImageIdIndex is kept in sync so the
 * prefetcher prioritises slices nearest the one being viewed.
 *
 * @param canvasRef - Ref to the enabled Cornerstone viewport element
 * @param isInitialized - Whether cornerstone has finished initializing
 */
export function useStackPrefetch(canvasRef: RefObject<HTMLDivElement>, isInitialized: boolean): void {
  const currentSeries = useStudyStore((s) => s.currentSeries)
  const currentInstanceIndex = useStudyStore((s) => s.currentInstanceIndex)

  // (Re)build the stack + enable prefetch once an image is displayed; rebuild
  // when the series changes.
  useEffect(() => {
    const element = canvasRef.current
    if (!element || !isInitialized || !areToolsInitialized() || !currentSeries) return
    const imageIds = currentSeries.instances.map((i) => i.imageId)
    if (imageIds.length < 2) return // nothing to prefetch for a single image

    let done = false
    const setup = () => {
      if (done) return
      try {
        // The element must be enabled and showing an image before prefetch.
        if (!cornerstone.getEnabledElement(element)?.image) return
        cornerstoneTools.addStackStateManager(element, ['stack'])
        const existing: any = cornerstoneTools.getToolState(element, 'stack')
        const index = useStudyStore.getState().currentInstanceIndex
        if (existing?.data?.[0]) {
          existing.data[0].imageIds = imageIds
          existing.data[0].currentImageIdIndex = index
        } else {
          cornerstoneTools.addToolState(element, 'stack', { imageIds, currentImageIdIndex: index })
        }
        cornerstoneTools.stackPrefetch.enable(element)
        done = true
        // Stop listening once prefetch is enabled — `cornerstoneimagerendered`
        // fires every frame (W/L drag, zoom, pan), so the listener must not linger.
        element.removeEventListener('cornerstoneimagerendered', setup)
      } catch (err) {
        console.warn('[StackPrefetch] setup failed:', err)
      }
    }

    setup() // image may already be displayed
    element.addEventListener('cornerstoneimagerendered', setup)
    return () => {
      element.removeEventListener('cornerstoneimagerendered', setup)
      try {
        cornerstoneTools.stackPrefetch.disable(element)
      } catch {
        /* ignore */
      }
    }
  }, [currentSeries, isInitialized, canvasRef])

  // Keep the stack index current so prefetch prioritises nearby slices.
  useEffect(() => {
    const element = canvasRef.current
    if (!element || !isInitialized || !areToolsInitialized()) return
    try {
      const st: any = cornerstoneTools.getToolState(element, 'stack')
      if (st?.data?.[0]) st.data[0].currentImageIdIndex = currentInstanceIndex
    } catch {
      /* ignore */
    }
  }, [currentInstanceIndex, isInitialized, canvasRef])
}
