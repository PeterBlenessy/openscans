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
                className={`relative flex items-center pl-8 pr-3 py-2 text-sm rounded-md cursor-pointer select-none outline-none ${themeClasses.text(theme)} ${themeClasses.menuHighlight(theme)}`}
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
  /** Formatted value shown in the pill (e.g. "1.5x", "8%"). Omit for no pill. */
  display?: string
  theme: Theme
  /** Root width/sizing override (default `w-32`; pass `flex-1` for full width). */
  className?: string
  /** Forwarded as data-testid on the slider root (for e2e). */
  testId?: string
}

/** Range slider (optionally with a value pill), built on Radix Slider. */
export function Slider({ value, onChange, min, max, step, ariaLabel, display, theme, className = 'w-32', testId }: SliderProps) {
  return (
    <div className="flex flex-1 items-center gap-3">
      <RSlider.Root
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        aria-label={ariaLabel}
        data-testid={testId}
        className={`relative flex h-5 cursor-pointer touch-none select-none items-center ${className}`}
      >
        <RSlider.Track className={`relative h-1.5 grow rounded-full ${themeClasses.bgActive(theme)}`}>
          <RSlider.Range className={`absolute h-full rounded-full ${isDark(theme) ? 'bg-gray-300' : 'bg-gray-600'}`} />
        </RSlider.Track>
        <RSlider.Thumb className="block h-4 w-4 rounded-full bg-white shadow border border-black/10 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-gray-400" />
      </RSlider.Root>
      {display != null && (
        <span className={`text-xs tabular-nums w-10 text-right ${themeClasses.textSecondary(theme)}`}>
          {display}
        </span>
      )}
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

