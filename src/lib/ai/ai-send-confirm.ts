/**
 * Imperative request side of the per-send AI confirmation dialog.
 *
 * Kept in a non-component module (separate from `AiSendConfirmDialog.tsx`) so the
 * component file only exports a component — required for React Fast Refresh and
 * the `react-refresh/only-export-components` lint rule.
 *
 * The DICOM pixel data physically leaves the device when a cloud provider
 * (Claude / OpenAI / Gemini) is invoked. `confirmAiSend` forces an explicit,
 * per-send acknowledgement of that egress, and — since the user must click
 * "Send to <provider>" every time — it doubles as the consent gate.
 */

export const CONFIRM_EVENT = 'openscans:ai-send-confirm-request'

export interface ConfirmRequestDetail {
  provider: string
  resolve: (confirmed: boolean) => void
}

/**
 * Request per-send confirmation before an image is sent to a cloud provider.
 *
 * Awaitable from non-React code (the `useAiOperations` hook). Dispatches a
 * `CustomEvent`; the mounted `<AiSendConfirmDialog />` listens and resolves the
 * returned promise on confirm (`true`) / cancel (`false`).
 *
 * @param provider - Human-readable provider name shown in the dialog
 * @returns Promise resolving to `true` if confirmed, `false` if cancelled
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
