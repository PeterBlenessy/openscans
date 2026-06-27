import { useEffect, useRef, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useSettingsStore } from '@/stores/settingsStore'
import { themeClasses } from '@/lib/utils'
import { TEXT_PROMPT_EVENT, type TextPromptRequestDetail } from '@/lib/ui/promptText'

/**
 * Generic in-app text-input prompt.
 *
 * Mount `<TextPrompt />` once near the app root; any call site can then
 * `await promptText({ title, ... })` (from `@/lib/ui/promptText`) and this
 * dialog resolves the promise with the entered string (or `null` on cancel).
 * Replaces native `window.prompt`.
 */
export function TextPrompt() {
  const [pending, setPending] = useState<TextPromptRequestDetail | null>(null)
  const [value, setValue] = useState('')
  const theme = useSettingsStore((s) => s.theme)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleRequest = (event: Event) => {
      const detail = (event as CustomEvent<TextPromptRequestDetail>).detail
      if (!detail) return
      // Resolve any still-open request as cancelled so its promise never dangles.
      setPending((prev) => {
        if (prev) prev.resolve(null)
        return detail
      })
      setValue(detail.initialValue ?? '')
    }

    window.addEventListener(TEXT_PROMPT_EVENT, handleRequest)
    return () => window.removeEventListener(TEXT_PROMPT_EVENT, handleRequest)
  }, [])

  // Focus the field when a prompt opens.
  useEffect(() => {
    if (pending) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 50)
      return () => window.clearTimeout(t)
    }
  }, [pending])

  const settle = (result: string | null) => {
    if (pending) pending.resolve(result)
    setPending(null)
    setValue('')
  }

  if (!pending) return null

  const submit = () => {
    const trimmed = value.trim()
    settle(trimmed.length > 0 ? trimmed : null)
  }

  return (
    <Modal
      show={true}
      onClose={() => settle(null)}
      title={pending.title}
      maxWidth="max-w-sm"
      maxHeight="max-h-[50vh]"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => settle(null)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              theme === 'dark' ? 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            data-testid="text-prompt-confirm"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-accent-foreground transition-colors hover:opacity-90"
          >
            {pending.confirmLabel ?? 'Save'}
          </button>
        </div>
      }
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            submit()
          }
        }}
        placeholder={pending.placeholder}
        data-testid="text-prompt-input"
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${themeClasses.bg(theme)} ${themeClasses.border(theme)} ${themeClasses.text(theme)}`}
      />
    </Modal>
  )
}
