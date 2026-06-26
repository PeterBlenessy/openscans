/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { cornerstoneTools } from '@/lib/cornerstone/initCornerstone'
import { DicomStudy } from '@/types'
import { ComparePane } from './ComparePane'
import { Button, SegmentedControl, Select } from '@/components/ui'

interface CompareViewProps {
  studies: DicomStudy[]
  onClose: () => void
}

type SyncMode = 'position' | 'index' | 'off'
const NEW_IMAGE = 'cornerstonenewimage'

/**
 * Side-by-side comparison of two series (e.g. two timepoints of the same
 * patient), each chosen with a study/series picker. The panes are linked with a
 * cornerstone-tools Synchronizer — by physical ImagePositionPatient ('position',
 * the right choice for follow-ups with different slice counts) or slice index —
 * so scrolling/scrubbing one pane moves the other to the matching slice.
 * All library; no hand-rolled sync math.
 */
export function CompareView({ studies, onClose }: CompareViewProps) {
  // Every study × series becomes a selectable option ("studyIdx:seriesIdx").
  const options = useMemo(
    () =>
      studies.flatMap((st, si) =>
        st.series.map((se, sei) => ({
          value: `${si}:${sei}`,
          label: `${st.studyDate || `Study ${si + 1}`} · ${se.seriesDescription || 'Series'} (${se.instances.length})`,
        }))
      ),
    [studies]
  )

  const [leftKey, setLeftKey] = useState('0:0')
  const [rightKey, setRightKey] = useState(
    () => options.find((o) => o.value.split(':')[0] !== '0')?.value ?? options[1]?.value ?? '0:0'
  )
  const [syncMode, setSyncMode] = useState<SyncMode>('position')
  const [activeSide, setActiveSide] = useState<'left' | 'right'>('left')

  const resolve = (key: string) => {
    const [si, sei] = key.split(':').map(Number)
    return studies[si]?.series[sei]
  }
  const leftSeries = resolve(leftKey)
  const rightSeries = resolve(rightKey)

  // ── synchronizer ──────────────────────────────────────────────────────────
  const elementsRef = useRef<Set<HTMLDivElement>>(new Set())
  const syncRef = useRef<any>(null)

  const rebuild = useCallback((mode: SyncMode) => {
    if (syncRef.current) {
      try {
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

  useEffect(() => {
    rebuild(syncMode)
    return () => {
      try {
        syncRef.current?.destroy?.()
      } catch {
        /* ignore */
      }
      syncRef.current = null
    }
  }, [syncMode, rebuild])

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

  const picker = (value: string, onChange: (v: string) => void, label: string) => (
    <Select value={value} onChange={onChange} options={options} ariaLabel={label} theme="dark" className="min-w-0 max-w-full" />
  )

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
        {leftSeries && (
          <ComparePane
            key={`L:${leftKey}`}
            series={leftSeries}
            header={picker(leftKey, setLeftKey, 'Left study and series')}
            active={activeSide === 'left'}
            onActivate={() => setActiveSide('left')}
            onElementReady={onElementReady}
            onElementTeardown={onElementTeardown}
          />
        )}
        {rightSeries && (
          <ComparePane
            key={`R:${rightKey}`}
            series={rightSeries}
            header={picker(rightKey, setRightKey, 'Right study and series')}
            active={activeSide === 'right'}
            onActivate={() => setActiveSide('right')}
            onElementReady={onElementReady}
            onElementTeardown={onElementTeardown}
          />
        )}
      </div>
    </div>
  )
}
