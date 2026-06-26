/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react'
import { cornerstone, cornerstoneTools, initCornerstone } from '@/lib/cornerstone/initCornerstone'
import { DicomSeries } from '@/types'
import { Spinner } from '@/components/ui'

interface ComparePaneProps {
  series: DicomSeries
  label: string
  active: boolean
  onActivate: () => void
  /** Called with the enabled cornerstone element once it has a stack + image. */
  onElementReady: (element: HTMLDivElement) => void
  onElementTeardown: (element: HTMLDivElement) => void
}

const STACK_SCROLL_WHEEL = 'StackScrollMouseWheel'

/**
 * One pane of the comparison view: a cornerstone viewport backed by a `stack`
 * tool state (the native model for a series). Mouse-wheel scrolling is the
 * library `StackScrollMouseWheelTool`; the parent links panes with a cornerstone
 * Synchronizer. All slices are preloaded so the position synchronizer can read
 * every slice's ImagePositionPatient (via the WADO loader's metadata provider).
 */
export function ComparePane({ series, label, active, onActivate, onElementReady, onElementTeardown }: ComparePaneProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const total = series.instances.length

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
        cornerstone.enable(element)
        cornerstone.resize(element, true)
        // Preload every slice so the position synchronizer can read all
        // ImagePositionPatient values, and scrolling stays flicker-free.
        await Promise.all(imageIds.map((id) => cornerstone.loadAndCacheImage(id).catch(() => null)))
        if (!mounted) return
        const image = await cornerstone.loadAndCacheImage(imageIds[0])
        if (!mounted) return
        cornerstone.displayImage(element, image)
        cornerstone.resize(element, true)
        cornerstone.fitToWindow(element)

        cornerstoneTools.addStackStateManager(element, ['stack'])
        cornerstoneTools.addToolState(element, 'stack', { imageIds, currentImageIdIndex: 0 })
        cornerstoneTools.addToolForElement(element, cornerstoneTools.StackScrollMouseWheelTool)
        cornerstoneTools.setToolActiveForElement(element, STACK_SCROLL_WHEEL, {})

        element.addEventListener('cornerstonenewimage', onNewImage)
        setLoading(false)
        onElementReady(element)
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
        cornerstone.disable(element)
      } catch {
        /* ignore */
      }
    }
    // series is stable for the life of the pane
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className={`relative flex-1 min-w-0 bg-black ${active ? 'ring-2 ring-inset ring-accent' : ''}`}
      onMouseDown={onActivate}
      data-testid="compare-pane"
    >
      <div ref={ref} className="w-full h-full" />
      <div className="pointer-events-none absolute top-2 left-2 rounded bg-black/55 px-2 py-1 text-xs font-medium text-white/90">
        {label}
      </div>
      <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/55 px-2 py-1 text-xs tabular-nums text-white/90" data-testid="compare-counter">
        {index + 1} / {total}
      </div>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner size="md" />
        </div>
      )}
    </div>
  )
}
