import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

/**
 * Per-send confirmation dialog for cloud AI requests.
 *
 * The DICOM pixel data physically leaves the device when a cloud provider
 * (Claude / OpenAI / Gemini) is invoked. This dialog forces an explicit,
 * per-send acknowledgement of that egress — and, since the user must click
 * "Send to <provider>" every time, it doubles as the consent gate.
 *
 * It is driven imperatively via {@link confirmAiSend} so it can be awaited from
 * non-React code (the `useAiOperations` hook) rather than threaded through props.
 * Mount `<AiSendConfirmDialog />` once in a persistent surface (the viewport
 * toolbar) and any call site can `await confirmAiSend(provider)`.
 */

const CONFIRM_EVENT = 'openscans:ai-send-confirm-request'

interface ConfirmRequestDetail {
  provider: string
  resolve: (confirmed: boolean) => void
}

/**
 * Request per-send confirmation before an image is sent to a cloud provider.
 *
 * @param provider - Human-readable provider name shown in the dialog
 * @returns Promise resolving to `true` if the user confirmed, `false` if cancelled
 */
export function confirmAiSend(provider: string): Promise<boolean> {
  // SSR / non-DOM safety: if there's no window, deny the send.
  if (typeof window === 'undefined') {
    return Promise.resolve(false)
  }

  return new Promise<boolean>((resolve) => {
    const detail: ConfirmRequestDetail = { provider, resolve }
    window.dispatchEvent(new CustomEvent<ConfirmRequestDetail>(CONFIRM_EVENT, { detail }))
  })
}

export function AiSendConfirmDialog() {
  const [pending, setPending] = useState<ConfirmRequestDetail | null>(null)

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
      icon={<AlertTriangle />}
      maxWidth="max-w-md"
      maxHeight="max-h-[80vh]"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => settle(false)}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => settle(true)}
            data-testid="ai-send-confirm"
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-red-600 hover:bg-red-700 text-white"
          >
            Send to {pending.provider}
          </button>
        </div>
      }
    >
      <div className="space-y-3 text-sm text-gray-300">
        <p className="text-gray-200">
          This image will be sent to{' '}
          <span className="font-semibold text-white">{pending.provider}</span> and
          leaves your device.
        </p>
        <div className="p-3 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] text-xs text-gray-400">
          <p className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-500" />
            <span>
              Any patient information <span className="font-medium text-gray-300">burned into the
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
