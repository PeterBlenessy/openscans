/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { cornerstoneTools } from '@/lib/cornerstone/initCornerstone'
import { DicomSeries } from '@/types'
import { ComparePane } from './ComparePane'
import { Button, SegmentedControl } from '@/components/ui'

interface CompareSource {
  series: DicomSeries
  label: string
}
interface CompareViewProps {
  left: CompareSource
  right: CompareSource
  onClose: () => void
}

type SyncMode = 'position' | 'index' | 'off'
const NEW_IMAGE = 'cornerstonenewimage'

/**
 * Side-by-side comparison of two series (e.g. two timepoints of the same
 * patient), linked with a cornerstone-tools Synchronizer so scrolling one pane
 * scrolls the other to the matching slice — by physical ImagePositionPatient
 * ('position', the right choice for follow-ups with different slice counts) or
 * by slice index ('index'). All library; no hand-rolled sync math.
 */
export function CompareView({ left, right, onClose }: CompareViewProps) {
  const [syncMode, setSyncMode] = useState<SyncMode>('position')
  const [activeSide, setActiveSide] = useState<'left' | 'right'>('left')
  const elementsRef = useRef<Set<HTMLDivElement>>(new Set())
  const syncRef = useRef<any>(null)

  const rebuildSynchronizer = useCallback((mode: SyncMode) => {
    if (syncRef.current) {
      try {
        elementsRef.current.forEach((el) => syncRef.current.remove(el))
        syncRef.current.destroy?.()
      } catch {
        /* ignore */
      }
      syncRef.current = null
    }
    if (mode === 'off') return
    const handler =
      mode === 'position'
        ? cornerstoneTools.stackImagePositionSynchronizer
        : cornerstoneTools.stackImageIndexSynchronizer
    const sync = new cornerstoneTools.Synchronizer(NEW_IMAGE, handler)
    elementsRef.current.forEach((el) => {
      try {
        sync.add(el)
      } catch {
        /* ignore */
      }
    })
    syncRef.current = sync
  }, [])

  // Rebuild when the sync mode changes.
  useEffect(() => {
    rebuildSynchronizer(syncMode)
    return () => {
      try {
        syncRef.current?.destroy?.()
      } catch {
        /* ignore */
      }
      syncRef.current = null
    }
  }, [syncMode, rebuildSynchronizer])

  const onElementReady = useCallback((el: HTMLDivElement) => {
    elementsRef.current.add(el)
    try {
      syncRef.current?.add(el)
    } catch {
      /* ignore */
    }
  }, [])
  const onElementTeardown = useCallback((el: HTMLDivElement) => {
    try {
      syncRef.current?.remove(el)
    } catch {
      /* ignore */
    }
    elementsRef.current.delete(el)
  }, [])

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-black" data-testid="compare-view">
      <div className="flex items-center justify-between gap-3 border-b border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2">
        <span className="text-sm font-semibold text-white">Compare</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Scroll sync</span>
          <SegmentedControl
            value={syncMode}
            onChange={(v) => setSyncMode(v as SyncMode)}
            options={[
              { value: 'position', label: 'Position' },
              { value: 'index', label: 'Index' },
              { value: 'off', label: 'Off' },
            ]}
            ariaLabel="Scroll sync mode"
            theme="dark"
          />
          <Button variant="icon" onClick={onClose} theme="dark" aria-label="Close compare" data-testid="compare-close">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 gap-px bg-[#2a2a2a]">
        <ComparePane
          series={left.series}
          label={left.label}
          active={activeSide === 'left'}
          onActivate={() => setActiveSide('left')}
          onElementReady={onElementReady}
          onElementTeardown={onElementTeardown}
        />
        <ComparePane
          series={right.series}
          label={right.label}
          active={activeSide === 'right'}
          onActivate={() => setActiveSide('right')}
          onElementReady={onElementReady}
          onElementTeardown={onElementTeardown}
        />
      </div>
    </div>
  )
}
