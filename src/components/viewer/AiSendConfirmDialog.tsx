import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useSettingsStore } from '@/stores/settingsStore'
import { themeClasses } from '@/lib/utils'
import { CONFIRM_EVENT, type ConfirmRequestDetail } from '@/lib/ai/ai-send-confirm'

/**
 * Per-send confirmation dialog for cloud AI requests.
 *
 * Mount `<AiSendConfirmDialog />` once in a persistent surface (the viewport
 * toolbar); any call site can then `await confirmAiSend(provider)` (from
 * `@/lib/ai/ai-send-confirm`) and this dialog resolves the promise.
 */
export function AiSendConfirmDialog() {
  const [pending, setPending] = useState<ConfirmRequestDetail | null>(null)
  const theme = useSettingsStore((s) => s.theme)

  useEffect(() => {
    const handleRequest = (event: Event) => {
      const detail = (event as CustomEvent<ConfirmRequestDetail>).detail
      if (!detail) return
      // If a previous request is still open, resolve it as cancelled so its
      // promise never dangles.
      setPending((prev) => {
        if (prev) prev.resolve(false)
        return detail
      })
    }

    window.addEventListener(CONFIRM_EVENT, handleRequest)
    return () => window.removeEventListener(CONFIRM_EVENT, handleRequest)
  }, [])

  const settle = (confirmed: boolean) => {
    if (pending) pending.resolve(confirmed)
    setPending(null)
  }

  if (!pending) return null

  return (
    <Modal
      show={true}
      onClose={() => settle(false)}
      title="Send image to cloud AI?"
      icon={<AlertTriangle className="w-5 h-5" />}
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
            Cancel
          </button>
          <button
            onClick={() => settle(true)}
            data-testid="ai-send-confirm"
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors text-white ${
              theme === 'dark'
                ? 'bg-[#2a2a2a] hover:bg-[#3a3a3a]'
                : 'bg-gray-700 hover:bg-gray-800'
            }`}
          >
            Send
          </button>
        </div>
      }
    >
      <div className={`space-y-3 text-sm ${themeClasses.textSecondary(theme)}`}>
        <p className={themeClasses.text(theme)}>
          This image will be sent to{' '}
          <span className={`font-semibold ${themeClasses.text(theme)}`}>{pending.provider}</span> and
          leaves your device. Selecting <span className={`font-medium ${themeClasses.text(theme)}`}>Send</span>{' '}
          is your consent to this transfer.
        </p>
        <div className={`p-3 rounded-lg text-xs border ${themeClasses.bgSecondary(theme)} ${themeClasses.border(theme)} ${themeClasses.textSecondary(theme)}`}>
          <p className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-500" />
            <span>
              Any patient information <span className={`font-medium ${themeClasses.text(theme)}`}>burned into the
              image pixels</span> (e.g. name overlays, stickers) cannot be stripped and
              would be included in what is sent. Only proceed with de-identified images
              or in non-clinical settings.
            </span>
          </p>
        </div>
      </div>
    </Modal>
  )
}
