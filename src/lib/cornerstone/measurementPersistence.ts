/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Persist cornerstone-tools measurement / ROI tool state across reloads and
 * slice changes.
 *
 * cornerstone-tools keeps tool state in memory keyed by imageId — but our
 * imageIds are ephemeral blob URLs (they change every session), so its built-in
 * `saveToolState` can't round-trip. Instead we store each tool's raw `data`
 * array keyed by the stable DICOM `sopInstanceUID`, and re-add it when that
 * instance is displayed.
 */
import { cornerstone, cornerstoneTools, areToolsInitialized } from './initCornerstone'
import { MEASUREMENT_TOOL_NAMES } from './tools'

const STORAGE_KEY = 'openscans-measurements'
const TOOL_NAMES = Object.values(MEASUREMENT_TOOL_NAMES)

type ToolData = Record<string /* toolName */, any[]>
type Store = Record<string /* sopInstanceUID */, ToolData>

function load(): Store {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function save(store: Store): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch (err) {
    console.warn('[measurements] Failed to persist:', err)
  }
}

/** Snapshot the element's measurement tool state for an instance into storage. */
export function persistMeasurements(element: HTMLElement, sopInstanceUID: string): void {
  if (!areToolsInitialized() || !sopInstanceUID) return
  const store = load()
  const perTool: ToolData = {}
  for (const name of TOOL_NAMES) {
    let state: any
    try {
      state = cornerstoneTools.getToolState(element, name)
    } catch {
      continue
    }
    if (state?.data?.length) {
      // Strip transient interaction flags; keep geometry + stats.
      perTool[name] = state.data.map((d: any) => ({ ...d, active: false, highlight: false }))
    }
  }
  if (Object.keys(perTool).length) store[sopInstanceUID] = perTool
  else delete store[sopInstanceUID]
  save(store)
}

/** Re-add the stored measurement tool state for an instance onto the element. */
export function restoreMeasurements(element: HTMLElement, sopInstanceUID: string): void {
  if (!areToolsInitialized() || !sopInstanceUID) return
  const perTool = load()[sopInstanceUID]
  for (const name of TOOL_NAMES) {
    try {
      // Clear first so a re-display can't duplicate.
      cornerstoneTools.clearToolState(element, name)
      const data = perTool?.[name]
      if (data) {
        for (const d of data) {
          // Force recompute of geometry/stats against the current image.
          cornerstoneTools.addToolState(element, name, { ...d, invalidated: true })
        }
      }
    } catch {
      // Tool not on this element yet — ignore.
    }
  }
  try {
    cornerstone.updateImage(element)
  } catch {
    // Element not displaying an image — ignore.
  }
}

/** True when the given instance has any stored measurements. */
export function hasStoredMeasurements(sopInstanceUID: string): boolean {
  const perTool = load()[sopInstanceUID]
  return !!perTool && Object.values(perTool).some((arr) => arr.length > 0)
}
