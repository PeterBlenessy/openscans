/**
 * Shared UI kit. New code should import primitives from `@/components/ui`.
 *
 * The control primitives (Select/Slider/Toggle/Field/ApiKeyField/TextField)
 * currently live in `../settings/controls` and are re-exported here; they will
 * be physically relocated into this folder in the final consolidation phase
 * (one import change in SettingsPanel) — keeping the move last avoids churn.
 */

// New primitives
export { Spinner } from './Spinner'
export { ProgressBar } from './ProgressBar'
export { ViewportStatusOverlay } from './ViewportStatusOverlay'
export { Button } from './Button'
export { CardButton } from './CardButton'
export { SegmentedControl } from './SegmentedControl'
export { Checkbox } from './Checkbox'
export { Callout } from './Callout'
export { Badge } from './Badge'
export { EmptyState } from './EmptyState'
export { useUiTheme } from './theme'

// Existing shared components
export { Modal } from './Modal'

// Shared control primitives (to be relocated here in the final phase)
export { Select, Slider, Toggle, Field, ApiKeyField, TextField } from '../settings/controls'
