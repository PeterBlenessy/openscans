/* eslint-disable react-hooks/exhaustive-deps */
import { RefObject, useEffect, useState, useRef } from 'react'
import { useViewportStore } from '../stores/viewportStore'
import { cornerstone } from '../lib/cornerstone/initCornerstone'

/**
 * Hook for handling window/level mouse interactions on a DICOM viewport.
 * Provides smooth window/level adjustment by applying changes directly to
 * Cornerstone during drag and updating the store only on mouse up/leave.
 *
 * @param canvasRef - Reference to the viewport canvas element
 * @param isInitialized - Whether Cornerstone is initialized on the element
 * @returns Object with isDragging state and current window/level values
 *
 * @example
 * ```tsx
 * const canvasRef = useRef<HTMLDivElement>(null)
 * const [isInitialized, setIsInitialized] = useState(false)
 * const { isDragging, currentWL } = useViewportMouseInteraction(canvasRef, isInitialized)
 * ```
 */
export function useViewportMouseInteraction(
  canvasRef: RefObject<HTMLDivElement>,
  isInitialized: boolean
) {
  const [isDragging, setIsDragging] = useState(false)
  const [currentWL, setCurrentWL] = useState({ width: 0, center: 0 })

  const dragStartPos = useRef({ x: 0, y: 0 })
  const dragStartWL = useRef({ width: 0, center: 0 })
  const currentWLRef = useRef({ width: 0, center: 0 })

  const settings = useViewportStore((s) => s.settings)
  const setWindowLevel = useViewportStore((s) => s.setWindowLevel)

  useEffect(() => {
    const element = canvasRef.current
    if (!element || !isInitialized) return

    let isCurrentlyDragging = false

    const handleMouseDown = (e: MouseEvent) => {
      // Left mouse button without modifier keys (Ctrl/Cmd are for pan)
      if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
        isCurrentlyDragging = true
        setIsDragging(true)
        dragStartPos.current = { x: e.clientX, y: e.clientY }
        // Store the starting window/level values from current settings
        dragStartWL.current = { width: settings.windowWidth, center: settings.windowCenter }
        currentWLRef.current = { ...dragStartWL.current }
        setCurrentWL(dragStartWL.current)
        e.preventDefault()
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isCurrentlyDragging) return

      // Calculate total delta from initial mouse down position
      const totalDeltaX = e.clientX - dragStartPos.current.x
      const totalDeltaY = e.clientY - dragStartPos.current.y

      // Adjust window/level based on mouse movement
      // Horizontal movement: window width (contrast)
      // Vertical movement: window center (brightness)
      const newWidth = Math.max(1, dragStartWL.current.width + totalDeltaX * 1.5)
      const newCenter = dragStartWL.current.center - totalDeltaY * 1.5

      // Store in ref for mouseUp
      currentWLRef.current = { width: newWidth, center: newCenter }

      // Apply directly to Cornerstone viewport (no store update yet)
      try {
        const viewport = cornerstone.getViewport(element)
        if (viewport) {
          viewport.voi.windowWidth = newWidth
          viewport.voi.windowCenter = newCenter
          cornerstone.setViewport(element, viewport)

          // Update local state for display only
          setCurrentWL({ width: newWidth, center: newCenter })
        }
      } catch (err) {
        console.error('Failed to update viewport during drag:', err)
      }
    }

    const handleMouseUp = () => {
      if (isCurrentlyDragging) {
        isCurrentlyDragging = false
        setIsDragging(false)
        // Now update the store with final values
        setWindowLevel(currentWLRef.current.center, currentWLRef.current.width)
      }
    }

    const handleMouseLeave = () => {
      if (isCurrentlyDragging) {
        isCurrentlyDragging = false
        setIsDragging(false)
        // Update store on mouse leave too
        setWindowLevel(currentWLRef.current.center, currentWLRef.current.width)
      }
    }

    element.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isInitialized, settings.windowWidth, settings.windowCenter, setWindowLevel])

  return { isDragging, currentWL }
}
