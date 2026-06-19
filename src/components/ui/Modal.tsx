import { useEffect, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useSettingsStore } from '@/stores/settingsStore'
import { themeClasses } from '@/lib/utils'

interface ModalProps {
  show: boolean
  onClose: () => void
  title: string
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
  headerLeftActions?: ReactNode
  headerRightActions?: ReactNode
  maxWidth?: string
  maxHeight?: string
}

/**
 * Reusable modal component. Follows the active app theme (dark/light) and
 * handles backdrop clicks, escape key, and provides consistent layout.
 *
 * @example
 * ```tsx
 * <Modal
 *   show={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Export Image"
 *   icon={<ExportIcon />}
 *   footer={<ActionButtons />}
 * >
 *   <ModalContent />
 * </Modal>
 * ```
 */
export function Modal({
  show,
  onClose,
  title,
  icon,
  children,
  footer,
  headerLeftActions,
  headerRightActions,
  maxWidth = 'max-w-3xl',
  maxHeight = 'max-h-[80vh]'
}: ModalProps) {
  const theme = useSettingsStore((s) => s.theme)

  // Stable id linking the dialog to its title for aria-labelledby.
  const titleId = `modal-title-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  // Close on Escape key
  useEffect(() => {
    if (!show) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [show, onClose])

  if (!show) return null

  // Render through a portal to document.body so the overlay escapes any
  // ancestor stacking context (e.g. a toolbar with transform/backdrop-filter).
  // Without this, a modal mounted inside such an ancestor can be painted
  // *below* sibling overlays like the annotation/spine-marker layer.
  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`${themeClasses.bg(theme)} border ${themeClasses.border(theme)} rounded-lg shadow-2xl ${maxWidth} w-full ${maxHeight} flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${themeClasses.border(theme)}`}>
          <div className="flex items-center gap-2">
            {icon && <div className={`w-5 h-5 ${themeClasses.text(theme)}`}>{icon}</div>}
            <h2 id={titleId} className={`text-lg font-semibold ${themeClasses.text(theme)}`}>{title}</h2>
            {headerLeftActions}
          </div>
          <div className="flex items-center gap-2">
            {headerRightActions}
            <button
              onClick={onClose}
              title="Close"
              aria-label="Close dialog"
              className={`p-1.5 rounded transition-colors ${themeClasses.textSecondary(theme)} ${themeClasses.hoverText(theme)} ${themeClasses.hoverBgSecondary(theme)}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>

        {/* Footer (optional) */}
        {footer && (
          <div className={`p-4 border-t ${themeClasses.border(theme)}`}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
