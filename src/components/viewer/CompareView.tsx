/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { X } from 'lucide-react'
import { cornerstoneTools } from '@/lib/cornerstone/initCornerstone'
import { DicomStudy } from '@/types'
import { ComparePane } from './ComparePane'
import { Button, Checkbox, SegmentedControl, Select } from '@/components/ui'

interface CompareViewProps {
  studies: DicomStudy[]
  onClose: () => void
}

type SyncMode = 'position' | 'index' | 'off'
const NEW_IMAGE = 'cornerstonenewimage'
const IMAGE_RENDERED = 'cornerstoneimagerendered'

/**
 * One cornerstone-tools Synchronizer bound to a shared element set. Created when
 * `active`, rebuilt when event/handler/active change, destroyed on cleanup.
 * Returns a stable ref to the live Synchronizer (or null when inactive).
 */
function useSynchronizer(
  event: string,
  handler: any,
  active: boolean,
  elementsRef: MutableRefObject<Set<HTMLDivElement>>
): MutableRefObject<any> {
  const ref = useRef<any>(null)
  useEffect(() => {
    if (!active) {
      ref.current = null
      return
    }
    const sync = new cornerstoneTools.Synchronizer(event, handler)
    elementsRef.current.forEach((el) => {
      try {
        sync.add(el)
      } catch {
        /* ignore */
      }
    })
    ref.current = sync
    return () => {
      try {
        sync.destroy?.()
      } catch {
        /* ignore */
      }
      ref.current = null
    }
  }, [event, handler, active, elementsRef])
  return ref
}

/**
 * Side-by-side comparison of two series (e.g. two timepoints of the same
 * patient), each chosen with a study/series picker. The panes are linked with a
 * cornerstone-tools Synchronizer — by physical ImagePositionPatient ('position',
 * the right choice for follow-ups with different slice counts) or slice index —
 * so scrolling/scrubbing one pane moves the other to the matching slice.
 * All library; no hand-rolled sync math.
 */
export function CompareView({ studies, onClose }: CompareViewProps) {
  // Grouped by study so two timepoints with the SAME series name stay tellable
  // apart by their study (date / description) header.
  const groups = useMemo(
    () =>
      studies.map((st, si) => ({
        label: `${st.studyDate || `Study ${si + 1}`}${st.studyDescription ? ` · ${st.studyDescription}` : ''}`,
        options: st.series.map((se, sei) => ({
          value: `${si}:${sei}`,
          label: `${se.seriesDescription || 'Series'} · ${se.instances.length} img`,
        })),
      })),
    [studies]
  )

  // Auto-match: given a series key, find the comparable series (same description)
  // in a *different* study — so picking the left pane auto-selects the matching
  // follow-up on the right. Falls back to the first series of another study.
  const matchInOtherStudy = (forKey: string): string => {
    const srcStudy = Number(forKey.split(':')[0])
    const [si0, sei0] = forKey.split(':').map(Number)
    const desc = (studies[si0]?.series[sei0]?.seriesDescription || '').trim().toLowerCase()
    for (let si = 0; si < studies.length; si++) {
      if (si === srcStudy) continue
      const sei = studies[si].series.findIndex((se) => (se.seriesDescription || '').trim().toLowerCase() === desc && desc !== '')
      if (sei >= 0) return `${si}:${sei}`
    }
    for (let si = 0; si < studies.length; si++) if (si !== srcStudy && studies[si].series[0]) return `${si}:0`
    return forKey
  }

  const [leftKey, setLeftKey] = useState('0:0')
  const [rightKey, setRightKey] = useState(() => matchInOtherStudy('0:0'))

  // Picking the left pane auto-selects the comparable series on the right.
  const handleLeftChange = (v: string) => {
    setLeftKey(v)
    setRightKey(matchInOtherStudy(v))
  }
  const [syncMode, setSyncMode] = useState<SyncMode>('position')
  const [activeSide, setActiveSide] = useState<'left' | 'right'>('left')
  const [leftHasPos, setLeftHasPos] = useState(true)
  const [rightHasPos, setRightHasPos] = useState(true)
  const [syncWL, setSyncWL] = useState(false)
  const [syncZoom, setSyncZoom] = useState(false)
  const positionUnavailable = syncMode === 'position' && (!leftHasPos || !rightHasPos)

  const resolve = (key: string) => {
    const [si, sei] = key.split(':').map(Number)
    return studies[si]?.series[sei]
  }
  const leftSeries = resolve(leftKey)
  const rightSeries = resolve(rightKey)

  // ── synchronizers ─────────────────────────────────────────────────────────
  // Scroll (newimage) + window/level and zoom/pan (imagerendered), each a
  // cornerstone-tools Synchronizer over the same set of pane elements.
  const elementsRef = useRef<Set<HTMLDivElement>>(new Set())
  const scrollSyncRef = useSynchronizer(
    NEW_IMAGE,
    syncMode === 'position'
      ? cornerstoneTools.stackImagePositionSynchronizer
      : cornerstoneTools.stackImageIndexSynchronizer,
    syncMode !== 'off',
    elementsRef
  )
  const wlSyncRef = useSynchronizer(IMAGE_RENDERED, cornerstoneTools.wwwcSynchronizer, syncWL, elementsRef)
  const zoomSyncRef = useSynchronizer(IMAGE_RENDERED, cornerstoneTools.panZoomSynchronizer, syncZoom, elementsRef)

  // A pane reports its element here once ready / before teardown; we add/remove
  // it from every live synchronizer. (The sync refs are stable across renders.)
  const onElementReady = useCallback(
    (el: HTMLDivElement) => {
      elementsRef.current.add(el)
      for (const r of [scrollSyncRef, wlSyncRef, zoomSyncRef]) {
        try {
          r.current?.add(el)
        } catch {
          /* ignore */
        }
      }
    },
    [scrollSyncRef, wlSyncRef, zoomSyncRef]
  )
  const onElementTeardown = useCallback(
    (el: HTMLDivElement) => {
      for (const r of [scrollSyncRef, wlSyncRef, zoomSyncRef]) {
        try {
          r.current?.remove(el)
        } catch {
          /* ignore */
        }
      }
      elementsRef.current.delete(el)
    },
    [scrollSyncRef, wlSyncRef, zoomSyncRef]
  )

  const picker = (value: string, onChange: (v: string) => void, label: string) => (
    <Select value={value} onChange={onChange} groups={groups} ariaLabel={label} theme="dark" className="min-w-0 max-w-full" />
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
          <div className="mx-1 h-5 w-px bg-[#2a2a2a]" />
          <Checkbox checked={syncWL} onChange={setSyncWL} label="W/L" theme="dark" ariaLabel="Sync window/level" />
          <Checkbox checked={syncZoom} onChange={setSyncZoom} label="Zoom+Pan" theme="dark" ariaLabel="Sync zoom and pan" />
          <Button variant="icon" onClick={onClose} theme="dark" aria-label="Close compare" data-testid="compare-close">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {positionUnavailable && (
        <div
          className="border-b border-amber-700/50 bg-amber-900/40 px-3 py-1.5 text-xs text-amber-200"
          data-testid="compare-position-warning"
        >
          Position sync needs <span className="font-mono">ImagePositionPatient</span>, which one of these series doesn&apos;t
          provide — the panes won&apos;t align by anatomy. Switch to <strong>Index</strong> to sync by slice number instead.
        </div>
      )}

      <div className="flex min-h-0 flex-1 gap-px bg-[#2a2a2a]">
        {leftSeries && (
          <ComparePane
            key={`L:${leftKey}`}
            series={leftSeries}
            header={picker(leftKey, handleLeftChange, 'Left study and series')}
            active={activeSide === 'left'}
            onActivate={() => setActiveSide('left')}
            onElementReady={onElementReady}
            onElementTeardown={onElementTeardown}
            onPositionAvailable={setLeftHasPos}
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
            onPositionAvailable={setRightHasPos}
          />
        )}
      </div>
    </div>
  )
}
