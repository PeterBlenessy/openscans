import { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
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
 * Reusable modal component, built on `@radix-ui/react-dialog`.
 *
 * Radix provides the accessibility primitives that the previous hand-rolled
 * version lacked: a focus trap, focus restoration to the previously-focused
 * element on close, `aria-modal`, and Escape-to-close — all for free. The
 * public props API is unchanged, so every consumer (ExportDialog,
 * ConfirmDialog, AiSendConfirmDialog, AiAnalysisModal, …) gains those
 * behaviours without edits.
 *
 * Backdrop click and Escape both route through `onOpenChange → onClose`,
 * preserving the original behaviour.
 *
 * @example
 * ```tsx
 * <Modal show={isOpen} onClose={() => setIsOpen(false)} title="Export Image">
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

  return (
    <Dialog.Root open={show} onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        {/* Backdrop. Pointer-down anywhere outside the content closes the
            dialog (Radix's onPointerDownOutside → onOpenChange), preserving the
            original backdrop-click behaviour. */}
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />

        {/* Centering layer is non-interactive so outside pointer-downs reach the
            overlay; the content itself re-enables pointer events. */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <Dialog.Content
            // The app supplies its own description text; suppress Radix's
            // missing-Description console warning.
            aria-describedby={undefined}
            className={`pointer-events-auto ${themeClasses.bg(theme)} border ${themeClasses.border(theme)} rounded-lg shadow-2xl ${maxWidth} w-full ${maxHeight} flex flex-col focus:outline-none`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${themeClasses.border(theme)}`}>
              <div className="flex items-center gap-2">
                {icon && <div className={`w-5 h-5 ${themeClasses.text(theme)}`} aria-hidden="true">{icon}</div>}
                <Dialog.Title className={`text-lg font-semibold ${themeClasses.text(theme)}`}>{title}</Dialog.Title>
                {headerLeftActions}
              </div>
              <div className="flex items-center gap-2">
                {headerRightActions}
                <Dialog.Close
                  title="Close"
                  aria-label="Close dialog"
                  className={`p-1.5 rounded transition-colors ${themeClasses.textSecondary(theme)} ${themeClasses.hoverText(theme)} ${themeClasses.hoverBgSecondary(theme)}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4"
                    aria-hidden="true"
                  >
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </Dialog.Close>
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
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
