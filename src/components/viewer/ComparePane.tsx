/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode, useEffect, useRef, useState } from 'react'
import { cornerstone, cornerstoneTools, initCornerstone } from '@/lib/cornerstone/initCornerstone'
import { useSettingsStore } from '@/stores/settingsStore'
import { DicomSeries } from '@/types'
import { Spinner, Slider } from '@/components/ui'

interface ComparePaneProps {
  series: DicomSeries
  /** Study/series picker rendered in the pane header. */
  header: ReactNode
  active: boolean
  onActivate: () => void
  /** Called with the enabled cornerstone element once it has a stack + image. */
  onElementReady: (element: HTMLDivElement) => void
  onElementTeardown: (element: HTMLDivElement) => void
  /** Reports whether this series exposes ImagePositionPatient (for position sync). */
  onPositionAvailable: (available: boolean) => void
}

const STACK_SCROLL_WHEEL = 'StackScrollMouseWheel'

/**
 * Whether the series exposes ImagePositionPatient (needed for position sync).
 * Checks the first slice and, if it's missing (e.g. a leading localizer), the
 * middle slice — so a real volume isn't misreported as position-less.
 */
async function hasPositionData(imageIds: string[]): Promise<boolean> {
  const check = (id: string) => {
    try {
      const plane: any = cornerstone.metaData.get('imagePlaneModule', id)
      return !!plane?.imagePositionPatient
    } catch {
      return false
    }
  }
  if (check(imageIds[0])) return true
  const mid = imageIds[Math.floor(imageIds.length / 2)]
  if (mid && mid !== imageIds[0]) {
    await cornerstone.loadAndCacheImage(mid).catch(() => null)
    if (check(mid)) return true
  }
  return false
}

/**
 * One pane of the comparison view: a cornerstone viewport backed by a `stack`
 * tool state (the native model for a series). Navigation is the library
 * StackScrollMouseWheelTool (wheel) plus a slider that drives the same stack;
 * either fires `cornerstonenewimage`, which the parent's Synchronizer uses to
 * move the other pane. All slices are preloaded so the position synchronizer can
 * read every ImagePositionPatient (via the WADO loader's metadata provider).
 */
export function ComparePane({ series, header, active, onActivate, onElementReady, onElementTeardown, onPositionAvailable }: ComparePaneProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const total = series.instances.length
  // Captured at mount; the pane re-inits (keyed in CompareView) on series change.
  const useWebGL = useSettingsStore.getState().useWebGL

  useEffect(() => {
    let mounted = true
    const element = ref.current
    if (!element) return
    const imageIds = series.instances.map((i) => i.imageId)

    const onNewImage = () => {
      try {
        const st: any = cornerstoneTools.getToolState(element, 'stack')
        if (st?.data?.[0]) setIndex(st.data[0].currentImageIdIndex)
      } catch {
        /* ignore */
      }
    }

    async function setup() {
      try {
        await initCornerstone()
        if (!mounted || !element) return
        cornerstone.enable(element, useWebGL ? { renderer: 'webgl' } : undefined)
        cornerstone.resize(element, true)
        // Show the first slice immediately; the rest stream into cache via
        // stackPrefetch below (so first paint isn't blocked behind the whole
        // series, and large series don't decode all-at-once on open).
        const image = await cornerstone.loadAndCacheImage(imageIds[0])
        if (!mounted) return
        cornerstone.displayImage(element, image)
        cornerstone.resize(element, true)
        cornerstone.fitToWindow(element)

        cornerstoneTools.addStackStateManager(element, ['stack'])
        cornerstoneTools.addToolState(element, 'stack', { imageIds, currentImageIdIndex: 0 })
        cornerstoneTools.addToolForElement(element, cornerstoneTools.StackScrollMouseWheelTool)
        cornerstoneTools.setToolActiveForElement(element, STACK_SCROLL_WHEEL, {})
        // Background-prefetch the series (cornerstone-tools prioritises slices
        // nearest the current one); position sync reads each ImagePositionPatient
        // as slices arrive.
        try {
          cornerstoneTools.stackPrefetch.enable(element)
        } catch {
          /* prefetch is best-effort */
        }

        // Window/level (left drag), zoom (right), pan (middle) — adjustable per
        // pane; the parent optionally syncs these across panes.
        cornerstoneTools.addToolForElement(element, cornerstoneTools.WwwcTool)
        cornerstoneTools.addToolForElement(element, cornerstoneTools.ZoomTool)
        cornerstoneTools.addToolForElement(element, cornerstoneTools.PanTool)
        cornerstoneTools.setToolActiveForElement(element, 'Wwwc', { mouseButtonMask: 1 })
        cornerstoneTools.setToolActiveForElement(element, 'Zoom', { mouseButtonMask: 2 })
        cornerstoneTools.setToolActiveForElement(element, 'Pan', { mouseButtonMask: 4 })

        element.addEventListener('cornerstonenewimage', onNewImage)
        setIndex(0)
        setLoading(false)
        onElementReady(element)
        // Position sync needs ImagePositionPatient via the metadata provider.
        const available = await hasPositionData(imageIds)
        if (mounted) onPositionAvailable(available)
      } catch (err) {
        console.error('[ComparePane] setup failed:', err)
        setLoading(false)
      }
    }

    setup()
    return () => {
      mounted = false
      element.removeEventListener('cornerstonenewimage', onNewImage)
      onElementTeardown(element)
      try {
        cornerstoneTools.stackPrefetch.disable(element)
      } catch {
        /* ignore */
      }
      try {
        cornerstone.disable(element)
      } catch {
        /* ignore */
      }
    }
    // Remounted (via key) when the series changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Drive the stack to a slice index; displayImage fires newimage → sync. */
  const scrollTo = (i: number) => {
    const element = ref.current
    if (!element) return
    const st: any = cornerstoneTools.getToolState(element, 'stack')
    const stack = st?.data?.[0]
    if (!stack) return
    const clamped = Math.max(0, Math.min(Math.round(i), stack.imageIds.length - 1))
    if (clamped === stack.currentImageIdIndex) return
    stack.currentImageIdIndex = clamped
    cornerstone
      .loadAndCacheImage(stack.imageIds[clamped])
      .then((image: any) => {
        if (stack.currentImageIdIndex === clamped) cornerstone.displayImage(element, image)
      })
      .catch(() => {})
  }

  return (
    <div
      className={`relative flex min-w-0 flex-1 flex-col bg-black ${active ? 'z-10 ring-2 ring-inset ring-accent' : ''}`}
      onMouseDown={onActivate}
      data-testid="compare-pane"
    >
      <div className="flex items-center gap-2 border-b border-[#2a2a2a] bg-[#1a1a1a] px-2 py-1.5">{header}</div>

      <div className="relative min-h-0 flex-1">
        <div ref={ref} className="h-full w-full" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner size="md" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2">
        <span className="w-14 shrink-0 text-xs tabular-nums text-gray-300" data-testid="compare-counter">
          {index + 1} / {total}
        </span>
        <Slider
          value={index}
          onChange={scrollTo}
          min={0}
          max={Math.max(0, total - 1)}
          step={1}
          ariaLabel="Slice"
          className="flex-1"
          theme="dark"
        />
      </div>
    </div>
  )
}
