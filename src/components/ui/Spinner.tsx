import { Loader2 } from 'lucide-react'

const SIZES = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-8 h-8' } as const

interface SpinnerProps {
  size?: keyof typeof SIZES
  /** Extra classes (e.g. a color override; defaults to the OS accent). */
  className?: string
  /** Accessible label; rendered visually-hidden. Omit inside a labelled overlay. */
  label?: string
}

/**
 * The single spinner primitive. Replaces the four hand-rolled spinners
 * (border-spin div, two-part SVG, Heroicons arrow SVG, bare Loader2) with one
 * lucide `Loader2` tinted with the accent color.
 */
export function Spinner({ size = 'md', className = 'text-accent', label }: SpinnerProps) {
  return (
    <span role={label ? 'status' : undefined} className="inline-flex">
      <Loader2 className={`animate-spin ${SIZES[size]} ${className}`} aria-hidden="true" />
      {label && <span className="sr-only">{label}</span>}
    </span>
  )
}
