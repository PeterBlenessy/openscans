import { useState } from 'react'
import * as RSelect from '@radix-ui/react-select'
import * as RSlider from '@radix-ui/react-slider'
import type { Theme } from '@/stores/settingsStore'
import { themeClasses } from '@/lib/utils'

/**
 * Shared, theme-token-driven settings controls. Centralises styling so every
 * control in the panel looks identical instead of hand-rolling `isDark ? …`
 * ternaries per call site.
 */

const isDark = (theme: Theme) => theme === 'dark'

const fieldRing = (theme: Theme) =>
  isDark(theme) ? 'focus:ring-[#3a3a3a]' : 'focus:ring-gray-400'

const fieldBase = (theme: Theme) =>
  `border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors ${themeClasses.bgSecondary(theme)} ${themeClasses.border(theme)} ${themeClasses.text(theme)} ${fieldRing(theme)}`

// ── Field row ──────────────────────────────────────────────────────────────

interface FieldProps {
  label: string
  description?: string
  theme: Theme
  /** Stack the control below the label (full-width inputs) instead of inline. */
  stacked?: boolean
  children: React.ReactNode
}

/** Label + optional description paired with a control. */
export function Field({ label, description, theme, stacked, children }: FieldProps) {
  if (stacked) {
    return (
      <div className="space-y-2">
        <div>
          <p className={`text-sm font-medium ${themeClasses.text(theme)}`}>{label}</p>
          {description && (
            <p className={`text-xs mt-0.5 ${themeClasses.textSecondary(theme)}`}>{description}</p>
          )}
        </div>
        {children}
      </div>
    )
  }
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${themeClasses.text(theme)}`}>{label}</p>
        {description && (
          <p className={`text-xs mt-0.5 ${themeClasses.textSecondary(theme)}`}>{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

// ── Select ─────────────────────────────────────────────────────────────────

interface SelectOption<T extends string> {
  value: T
  label: string
}

interface SelectProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: SelectOption<T>[]
  ariaLabel: string
  theme: Theme
  className?: string
}

/** Styled dropdown built on Radix Select (consistent across browsers/OS). */
export function Select<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  theme,
  className = '',
}: SelectProps<T>) {
  return (
    <RSelect.Root value={value} onValueChange={(v) => onChange(v as T)}>
      <RSelect.Trigger
        aria-label={ariaLabel}
        className={`inline-flex items-center justify-between gap-2 min-w-[12rem] ${fieldBase(theme)} ${themeClasses.hoverBorder(theme)} ${className}`}
      >
        <RSelect.Value />
        <RSelect.Icon>
          <ChevronDown className={themeClasses.textSecondary(theme)} />
        </RSelect.Icon>
      </RSelect.Trigger>

      <RSelect.Portal>
        <RSelect.Content
          position="popper"
          sideOffset={6}
          className={`z-[60] overflow-hidden rounded-lg border shadow-2xl ${themeClasses.bg(theme)} ${themeClasses.border(theme)}`}
        >
          <RSelect.Viewport className="p-1">
            {options.map((opt) => (
              <RSelect.Item
                key={opt.value}
                value={opt.value}
                className={`relative flex items-center pl-8 pr-3 py-2 text-sm rounded-md cursor-pointer select-none outline-none ${themeClasses.text(theme)} ${isDark(theme) ? 'data-[highlighted]:bg-[#2a2a2a]' : 'data-[highlighted]:bg-gray-100'}`}
              >
                <RSelect.ItemIndicator className="absolute left-2 inline-flex">
                  <Check className={themeClasses.text(theme)} />
                </RSelect.ItemIndicator>
                <RSelect.ItemText>{opt.label}</RSelect.ItemText>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  )
}

// ── Slider ─────────────────────────────────────────────────────────────────

interface SliderProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  ariaLabel: string
  /** Formatted value shown in the pill (e.g. "1.5x", "8%"). */
  display: string
  theme: Theme
}

/** Range slider with a value pill, built on Radix Slider. */
export function Slider({ value, onChange, min, max, step, ariaLabel, display, theme }: SliderProps) {
  return (
    <div className="flex items-center gap-3">
      <RSlider.Root
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        aria-label={ariaLabel}
        className="relative flex items-center w-32 h-5 cursor-pointer touch-none select-none"
      >
        <RSlider.Track className={`relative h-1.5 grow rounded-full ${themeClasses.bgActive(theme)}`}>
          <RSlider.Range className={`absolute h-full rounded-full ${isDark(theme) ? 'bg-gray-300' : 'bg-gray-600'}`} />
        </RSlider.Track>
        <RSlider.Thumb className="block h-4 w-4 rounded-full bg-white shadow border border-black/10 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-gray-400" />
      </RSlider.Root>
      <span className={`text-xs tabular-nums w-10 text-right ${themeClasses.textSecondary(theme)}`}>
        {display}
      </span>
    </div>
  )
}

// ── Toggle ─────────────────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  theme: Theme
  ariaLabel?: string
}

export function Toggle({ checked, onChange, theme, ariaLabel }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${fieldRing(theme)} ${
        checked
          ? isDark(theme) ? 'bg-gray-300' : 'bg-gray-700'
          : isDark(theme) ? 'bg-[#2a2a2a]' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
          checked ? 'translate-x-6 bg-[#1a1a1a]' : 'translate-x-1 bg-white'
        }`}
      />
    </button>
  )
}

// ── API key field ────────────────────────────────────────────────────────────

interface ApiKeyFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  theme: Theme
}

/** Password input with show/hide toggle. Replaces three duplicated blocks. */
export function ApiKeyField({ value, onChange, placeholder, theme }: ApiKeyFieldProps) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex gap-2 items-center">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        className={`flex-1 ${fieldBase(theme)} ${isDark(theme) ? 'placeholder-gray-600' : 'placeholder-gray-400'}`}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? 'Hide API key' : 'Show API key'}
        className={`p-2 rounded-lg transition-colors ${themeClasses.textSecondary(theme)} ${themeClasses.hoverBgSecondary(theme)}`}
      >
        {show ? <EyeOff /> : <Eye />}
      </button>
    </div>
  )
}

// ── Text field ───────────────────────────────────────────────────────────────

interface TextFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  theme: Theme
}

export function TextField({ value, onChange, placeholder, theme }: TextFieldProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      spellCheck={false}
      className={`w-full ${fieldBase(theme)} ${isDark(theme) ? 'placeholder-gray-600' : 'placeholder-gray-400'}`}
    />
  )
}

// ── Inline note ──────────────────────────────────────────────────────────────

interface InlineNoteProps {
  title: string
  /** Bullet points, shown when expanded. */
  points: string[]
  theme: Theme
  /** 'info' (quiet) or 'warn' (amber accent). */
  tone?: 'info' | 'warn'
  /** Start expanded (default collapsed). */
  defaultOpen?: boolean
}

/**
 * Quiet, collapsible note. Replaces the heavy emoji + bullet boxes — the title
 * line is always visible, details expand on demand.
 */
export function InlineNote({ title, points, theme, tone = 'info', defaultOpen = false }: InlineNoteProps) {
  const [open, setOpen] = useState(defaultOpen)
  const accent = tone === 'warn'
    ? 'text-amber-500'
    : themeClasses.textSecondary(theme)
  return (
    <div className={`rounded-lg border ${themeClasses.bgSecondary(theme)} ${themeClasses.border(theme)}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <span className={accent}>{tone === 'warn' ? <Warn /> : <Info />}</span>
        <span className={`flex-1 text-xs font-medium ${themeClasses.text(theme)}`}>{title}</span>
        <ChevronDown
          className={`${themeClasses.textSecondary(theme)} transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ul className={`px-3 pb-3 pl-9 space-y-1 text-xs ${themeClasses.textSecondary(theme)}`}>
          {points.map((p, i) => (
            <li key={i} className="list-disc list-outside ml-1">{p}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Icons ────────────────────────────────────────────────────────────────────

function ChevronDown({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${className}`} aria-hidden="true">
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  )
}

function Check({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${className}`} aria-hidden="true">
      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 011.4-1.4l2.8 2.79 6.8-6.79a1 1 0 011.4 0z" clipRule="evenodd" />
    </svg>
  )
}

function Eye({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${className}`} aria-hidden="true">
      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
      <path fillRule="evenodd" d="M.664 10.59a1.65 1.65 0 010-1.18A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41a1.65 1.65 0 010 1.18A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
  )
}

function EyeOff({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${className}`} aria-hidden="true">
      <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd" />
    </svg>
  )
}

function Info({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${className}`} aria-hidden="true">
      <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
    </svg>
  )
}

function Warn({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${className}`} aria-hidden="true">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.515 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  )
}
