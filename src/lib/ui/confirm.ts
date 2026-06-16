/**
 * Imperative request side of the generic in-app confirmation dialog.
 *
 * Mirrors the `confirmAiSend` pattern (`@/lib/ai/ai-send-confirm`): kept in a
 * non-component module so the component file only exports a component (required
 * for React Fast Refresh and the `react-refresh/only-export-components` lint).
 *
 * Replaces the native `window.confirm`, which is unstyled and — critically —
 * behaves inconsistently between the web build (synchronous boolean) and the
 * Tauri desktop build (asynchronous `Promise<boolean>`). `confirmDialog` is
 * always async and always renders the app's themed `Modal`.
 */

export const CONFIRM_DIALOG_EVENT = 'openscans:confirm-dialog-request'

export interface ConfirmDialogOptions {
  /** Dialog heading. */
  title: string
  /** Body text. Newlines are rendered as separate paragraphs. */
  message: string
  /** Label for the confirm button (default "Confirm"). */
  confirmLabel?: string
  /** Label for the cancel button (default "Cancel"). */
  cancelLabel?: string
  /**
   * Visual tone of the confirm button. `danger` (default) styles it red for
   * destructive actions; `default` uses the neutral button style.
   */
  tone?: 'danger' | 'default'
}

export interface ConfirmDialogRequestDetail extends ConfirmDialogOptions {
  resolve: (confirmed: boolean) => void
}

/**
 * Show a themed confirmation dialog and await the user's choice.
 *
 * Awaitable from any code (hooks, event handlers). Dispatches a `CustomEvent`;
 * the mounted `<ConfirmDialog />` listens and resolves the returned promise on
 * confirm (`true`) / cancel (`false`).
 *
 * @returns Promise resolving to `true` if confirmed, `false` if cancelled.
 */
export function confirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  // SSR / non-DOM safety: if there's no window, deny (the safe default for a
  // destructive or consent action).
  if (typeof window === 'undefined') {
    return Promise.resolve(false)
  }

  return new Promise<boolean>((resolve) => {
    const detail: ConfirmDialogRequestDetail = { ...options, resolve }
    window.dispatchEvent(
      new CustomEvent<ConfirmDialogRequestDetail>(CONFIRM_DIALOG_EVENT, { detail })
    )
  })
}
