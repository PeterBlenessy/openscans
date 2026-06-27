/**
 * Imperative request side of the generic in-app text-input prompt.
 *
 * Mirrors `confirmDialog` (`@/lib/ui/confirm`): a non-component module so the
 * component file only exports a component (React Fast Refresh / the
 * `react-refresh/only-export-components` lint). Replaces native `window.prompt`
 * — used e.g. by the cornerstone ArrowAnnotate tool to ask for a label, which
 * otherwise fires a blocking browser dialog that breaks the Tauri webview.
 */

export const TEXT_PROMPT_EVENT = 'openscans:text-prompt-request'

export interface TextPromptOptions {
  /** Dialog heading. */
  title: string
  /** Prefilled value (for editing an existing label). */
  initialValue?: string
  /** Placeholder shown when the field is empty. */
  placeholder?: string
  /** Label for the confirm button (default "Save"). */
  confirmLabel?: string
}

export interface TextPromptRequestDetail extends TextPromptOptions {
  resolve: (value: string | null) => void
}

/**
 * Show a themed single-line text prompt and await the user's input.
 *
 * @returns Promise resolving to the entered string, or `null` if cancelled.
 */
export function promptText(options: TextPromptOptions): Promise<string | null> {
  if (typeof window === 'undefined') {
    return Promise.resolve(null)
  }

  return new Promise<string | null>((resolve) => {
    const detail: TextPromptRequestDetail = { ...options, resolve }
    window.dispatchEvent(new CustomEvent<TextPromptRequestDetail>(TEXT_PROMPT_EVENT, { detail }))
  })
}
