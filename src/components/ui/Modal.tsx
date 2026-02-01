import { useEffect, ReactNode } from 'react'

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
 * Reusable modal component with dark theme styling.
 * Handles backdrop clicks, escape key, and provides consistent layout.
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

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-2xl ${maxWidth} w-full ${maxHeight} flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            {icon && <div className="w-5 h-5 text-white">{icon}</div>}
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {headerLeftActions}
          </div>
          <div className="flex items-center gap-2">
            {headerRightActions}
            <button
              onClick={onClose}
              title="Close"
              className="p-1.5 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded transition-colors"
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
          <div className="p-4 border-t border-[#2a2a2a]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
