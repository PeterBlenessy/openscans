import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useSettingsStore } from '@/stores/settingsStore'
import { themeClasses } from '@/lib/utils'
import { CONFIRM_DIALOG_EVENT, type ConfirmDialogRequestDetail } from '@/lib/ui/confirm'

/**
 * Generic in-app confirmation dialog.
 *
 * Mount `<ConfirmDialog />` once near the app root; any call site can then
 * `await confirmDialog({ title, message, ... })` (from `@/lib/ui/confirm`) and
 * this dialog resolves the promise. Replaces native `window.confirm`.
 */
export function ConfirmDialog() {
  const [pending, setPending] = useState<ConfirmDialogRequestDetail | null>(null)
  const theme = useSettingsStore((s) => s.theme)

  useEffect(() => {
    const handleRequest = (event: Event) => {
      const detail = (event as CustomEvent<ConfirmDialogRequestDetail>).detail
      if (!detail) return
      // If a previous request is still open, resolve it as cancelled so its
      // promise never dangles.
      setPending((prev) => {
        if (prev) prev.resolve(false)
        return detail
      })
    }

    window.addEventListener(CONFIRM_DIALOG_EVENT, handleRequest)
    return () => window.removeEventListener(CONFIRM_DIALOG_EVENT, handleRequest)
  }, [])

  const settle = (confirmed: boolean) => {
    if (pending) pending.resolve(confirmed)
    setPending(null)
  }

  if (!pending) return null

  const isDanger = (pending.tone ?? 'danger') === 'danger'
  const confirmClasses = isDanger
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : theme === 'dark'
      ? 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-100'
      : 'bg-gray-700 hover:bg-gray-800 text-white'

  return (
    <Modal
      show={true}
      onClose={() => settle(false)}
      title={pending.title}
      maxWidth="max-w-md"
      maxHeight="max-h-[80vh]"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => settle(false)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              theme === 'dark'
                ? 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-200'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            {pending.cancelLabel ?? 'Cancel'}
          </button>
          <button
            onClick={() => settle(true)}
            data-testid="confirm-dialog-confirm"
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${confirmClasses}`}
          >
            {pending.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      }
    >
      <div className={`space-y-2 text-sm ${themeClasses.text(theme)}`}>
        {pending.message.split('\n').filter((line) => line.length > 0).map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </Modal>
  )
}
