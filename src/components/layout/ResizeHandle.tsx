import { useState, useEffect } from 'react'

interface ResizeHandleProps {
  onResize: (deltaX: number) => void
  side: 'left' | 'right'
  theme: 'dark' | 'light'
  /** Current panel size in px — reflected via aria-valuenow. */
  size?: number
  /** Minimum panel size in px — reflected via aria-valuemin. */
  minSize?: number
  /** Maximum panel size in px — reflected via aria-valuemax. */
  maxSize?: number
}

/**
 * Draggable resize handle for sidebar panels.
 * Supports both mouse and touch interactions.
 */
export function ResizeHandle({ onResize, side, theme, size, minSize, maxSize }: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (!isDragging) return

    let lastX = 0

    const handleMouseMove = (e: MouseEvent) => {
      if (lastX === 0) {
        lastX = e.clientX
        return
      }

      const deltaX = e.clientX - lastX
      lastX = e.clientX

      // For right sidebar, negative delta means wider (moving left)
      // For left sidebar, positive delta means wider (moving right)
      onResize(side === 'right' ? -deltaX : deltaX)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    // Set cursor for entire document during drag
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging, onResize, side])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return

    let lastX = e.touches[0].clientX

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length !== 1) return
      moveEvent.preventDefault()

      const deltaX = moveEvent.touches[0].clientX - lastX
      lastX = moveEvent.touches[0].clientX

      onResize(side === 'right' ? -deltaX : deltaX)
    }

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      setIsDragging(false)
    }

    setIsDragging(true)
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
  }

  return (
    <div
      className={`relative flex-shrink-0 group ${side === 'right' ? 'order-first' : 'order-last'}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: 'col-resize' }}
      aria-label="Resize sidebar"
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={size}
      aria-valuemin={minSize}
      aria-valuemax={maxSize}
      tabIndex={0}
      onKeyDown={(e) => {
        // Keyboard resize: Arrow keys (plain or with Alt) nudge the panel size
        // by 16px per press when the handle is focused.
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          onResize(side === 'right' ? 16 : -16)
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          onResize(side === 'right' ? -16 : 16)
        }
      }}
    >
      {/* Visible handle (4px wide) */}
      <div
        className={`w-1 h-full transition-colors ${
          isDragging
            ? theme === 'dark'
              ? 'bg-[#4a4a4a]'
              : 'bg-gray-400'
            : isHovered
            ? theme === 'dark'
              ? 'bg-[#3a3a3a]'
              : 'bg-gray-300'
            : theme === 'dark'
            ? 'bg-transparent'
            : 'bg-transparent'
        }`}
      />

      {/* Invisible hit area (12px wide for easier grabbing) */}
      <div className="absolute inset-y-0 w-3 -translate-x-1" />
    </div>
  )
}
