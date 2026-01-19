import { useEffect } from 'react'
import { useStudyStore } from '@/stores/studyStore'
import { useViewportStore } from '@/stores/viewportStore'

interface UseKeyboardShortcutsProps {
  onToggleHelp?: () => void
}

export function useKeyboardShortcuts({ onToggleHelp }: UseKeyboardShortcutsProps = {}) {
  const currentSeries = useStudyStore((state) => state.currentSeries)
  const currentInstanceIndex = useStudyStore((state) => state.currentInstanceIndex)
  const { nextInstance, previousInstance, setCurrentInstance } = useStudyStore()
  const { resetSettings, setInvert } = useViewportStore()
  const settings = useViewportStore((state) => state.settings)

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        // Navigation: Up arrow - previous image, or Cmd/Ctrl+Up for first image
        case 'ArrowUp':
          e.preventDefault()
          if (e.ctrlKey || e.metaKey) {
            // Cmd/Ctrl + Up: First image
            setCurrentInstance(0)
          } else if (!e.altKey && !e.shiftKey) {
            // Plain Up: Previous image
            previousInstance()
          }
          break

        // Navigation: Down arrow - next image, or Cmd/Ctrl+Down for last image
        case 'ArrowDown':
          e.preventDefault()
          if (e.ctrlKey || e.metaKey) {
            // Cmd/Ctrl + Down: Last image
            if (currentSeries) {
              setCurrentInstance(currentSeries.instances.length - 1)
            }
          } else if (!e.altKey && !e.shiftKey) {
            // Plain Down: Next image
            nextInstance()
          }
          break

        // Navigation: Left arrow - previous image, or Alt+Left to jump back 10
        case 'ArrowLeft':
          e.preventDefault()
          if (e.altKey && !e.ctrlKey && !e.metaKey) {
            // Alt/Option + Left: Jump back 10 images
            if (currentSeries) {
              const newIndex = Math.max(0, currentInstanceIndex - 10)
              setCurrentInstance(newIndex)
            }
          } else if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
            // Plain Left: Previous image
            previousInstance()
          }
          break

        // Navigation: Right arrow - next image, or Alt+Right to jump forward 10
        case 'ArrowRight':
          e.preventDefault()
          if (e.altKey && !e.ctrlKey && !e.metaKey) {
            // Alt/Option + Right: Jump forward 10 images
            if (currentSeries) {
              const newIndex = Math.min(
                currentSeries.instances.length - 1,
                currentInstanceIndex + 10
              )
              setCurrentInstance(newIndex)
            }
          } else if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
            // Plain Right: Next image
            nextInstance()
          }
          break

        // Viewport: Reset (no modifiers)
        case 'r':
        case 'R':
          if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
            e.preventDefault()
            resetSettings()
            console.log('[Keyboard] Reset viewport settings')
          }
          break

        // Viewport: Invert (no modifiers)
        case 'i':
        case 'I':
          if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
            e.preventDefault()
            setInvert(!settings.invert)
            console.log('[Keyboard] Toggle invert:', !settings.invert)
          }
          break

        // Help
        case '?':
          e.preventDefault()
          if (onToggleHelp) {
            onToggleHelp()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)

    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [
    currentSeries,
    currentInstanceIndex,
    nextInstance,
    previousInstance,
    setCurrentInstance,
    resetSettings,
    setInvert,
    settings.invert,
    onToggleHelp
  ])
}
