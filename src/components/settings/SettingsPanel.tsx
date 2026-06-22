import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { ThemePreference, ScrollDirection, AIProvider } from '@/stores/settingsStore'
import { themeClasses } from '@/lib/utils'
import { useSettingsState } from '@/hooks/useSettingsState'
import { isTauri } from '@/lib/utils/platform'
import { MrEngineSettings } from './MrEngineSettings'
import { confirmDialog } from '@/lib/ui/confirm'
import {
  Field,
  Select,
  Slider,
  Toggle,
  ApiKeyField,
  TextField,
  InlineNote,
} from './controls'

interface SettingsPanelProps {
  show: boolean
  onClose: () => void
}

type SettingsState = ReturnType<typeof useSettingsState>
type CategoryId = 'appearance' | 'viewport' | 'privacy' | 'ai' | 'data'

interface Category {
  id: CategoryId
  label: string
  icon: React.ReactNode
}

export function SettingsPanel({ show, onClose }: SettingsPanelProps) {
  const settings = useSettingsState()
  const theme = settings.theme
  const [active, setActive] = useState<CategoryId>('appearance')

  // Cloud AI is desktop-only — the entire AI category is hidden in the web build.
  const showAiSettings = isTauri()

  const categories: Category[] = [
    { id: 'appearance', label: 'Appearance', icon: <SwatchIcon /> },
    { id: 'viewport', label: 'Viewport', icon: <CursorIcon /> },
    { id: 'privacy', label: 'Privacy', icon: <ShieldIcon /> },
    ...(showAiSettings ? [{ id: 'ai' as const, label: 'AI', icon: <SparkleIcon /> }] : []),
    { id: 'data', label: 'Data', icon: <DatabaseIcon /> },
  ]

  const activeCategory = categories.find((c) => c.id === active) ?? categories[0]

  return (
    <Dialog.Root open={show} onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <Dialog.Content
            aria-describedby={undefined}
            className={`pointer-events-auto relative flex flex-col rounded-xl shadow-2xl w-full max-w-3xl h-[34rem] max-h-[85vh] overflow-hidden border focus:outline-none ${themeClasses.bg(theme)} ${themeClasses.border(theme)}`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${themeClasses.border(theme)}`}>
              <Dialog.Title id="settings-panel-title" className={`text-lg font-semibold ${themeClasses.text(theme)}`}>
                Settings
              </Dialog.Title>
              <Dialog.Close
                aria-label="Close dialog"
                className={`p-2 rounded-lg transition-colors ${themeClasses.hoverBgSecondary(theme)}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${themeClasses.textSecondary(theme)}`} aria-hidden="true">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </Dialog.Close>
            </div>

            {/* Body: nav + content */}
            <div className="flex flex-1 min-h-0">
              {/* Sidebar */}
              <nav className={`w-44 flex-shrink-0 border-r p-2 overflow-y-auto ${themeClasses.border(theme)} ${themeClasses.bgTertiary(theme)}`}>
                {categories.map((c) => {
                  const isActive = c.id === active
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActive(c.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`relative flex w-full items-center gap-2.5 px-3 py-2 mb-0.5 rounded-lg text-sm ${
                        isActive
                          ? `${themeClasses.text(theme)} font-medium`
                          : `${themeClasses.textSecondary(theme)} ${themeClasses.hoverBg(theme)} transition-colors`
                      }`}
                    >
                      {/* The active highlight is a freshly-mounted, keyed node
                          rather than a background toggled on the persistent
                          button. WKWebView (Tauri) fails to repaint a
                          background-color change onto the newly-active row,
                          leaving the highlight stuck on the first item; a new
                          DOM node always paints. */}
                      {isActive && (
                        <span
                          key="active-bg"
                          aria-hidden
                          className="absolute inset-0 rounded-lg"
                          style={{ backgroundColor: theme === 'dark' ? '#2a2a2a' : '#d1d5db' }}
                        />
                      )}
                      <span className={`relative z-10 ${isActive ? themeClasses.text(theme) : themeClasses.textSecondary(theme)}`}>
                        {c.icon}
                      </span>
                      <span className="relative z-10">{c.label}</span>
                    </button>
                  )
                })}
              </nav>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <h3 className={`text-base font-semibold mb-5 ${themeClasses.text(theme)}`}>
                  {activeCategory.label}
                </h3>
                {active === 'appearance' && <AppearanceSection settings={settings} />}
                {active === 'viewport' && <ViewportSection settings={settings} />}
                {active === 'privacy' && <PrivacySection settings={settings} />}
                {active === 'ai' && showAiSettings && <AiSection settings={settings} />}
                {active === 'data' && <DataSection settings={settings} />}
              </div>
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-between px-5 py-3 border-t ${themeClasses.border(theme)}`}>
              <button
                onClick={settings.resetToDefaults}
                className={`px-3 py-1.5 text-sm transition-colors ${themeClasses.textSecondary(theme)} ${themeClasses.hoverText(theme)}`}
              >
                Reset to Defaults
              </button>
              <button
                onClick={onClose}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors text-white ${theme === 'dark' ? 'bg-[#2a2a2a] hover:bg-[#3a3a3a]' : 'bg-gray-700 hover:bg-gray-800'}`}
              >
                Done
              </button>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── Sections ─────────────────────────────────────────────────────────────────

function AppearanceSection({ settings }: { settings: SettingsState }) {
  const theme = settings.theme
  return (
    <div className="space-y-5">
      <Field label="Theme" description="Follow the system appearance, or pick Light/Dark" theme={theme}>
        <Select
          value={settings.themePreference}
          onChange={(v) => settings.setThemePreference(v as ThemePreference)}
          ariaLabel="Theme"
          theme={theme}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </Field>
    </div>
  )
}

function ViewportSection({ settings }: { settings: SettingsState }) {
  const theme = settings.theme
  return (
    <div className="space-y-5">
      <Field label="Scroll Direction" description="Mouse wheel behavior for image navigation" theme={theme}>
        <Select
          value={settings.scrollDirection}
          onChange={(v) => settings.setScrollDirection(v as ScrollDirection)}
          ariaLabel="Scroll Direction"
          theme={theme}
          options={[
            { value: 'natural', label: 'Natural (up = next)' },
            { value: 'inverted', label: 'Inverted (up = previous)' },
          ]}
        />
      </Field>

      <Field label="Window/Level Sensitivity" description="Drag speed for window/level adjustment" theme={theme}>
        <Slider
          value={settings.windowLevelSensitivity}
          onChange={settings.setWindowLevelSensitivity}
          min={0.5}
          max={3}
          step={0.1}
          ariaLabel="Window/Level Sensitivity"
          display={`${settings.windowLevelSensitivity.toFixed(1)}x`}
          theme={theme}
        />
      </Field>

      <Field label="Zoom Sensitivity" description="Scroll speed for zooming" theme={theme}>
        <Slider
          value={settings.zoomSensitivity}
          onChange={settings.setZoomSensitivity}
          min={0.01}
          max={0.15}
          step={0.01}
          ariaLabel="Zoom Sensitivity"
          display={`${(settings.zoomSensitivity * 100).toFixed(0)}%`}
          theme={theme}
        />
      </Field>
    </div>
  )
}

function PrivacySection({ settings }: { settings: SettingsState }) {
  const theme = settings.theme
  return (
    <div className="space-y-5">
      <Field label="Hide Personal Information" description="Hide patient names and IDs throughout the app" theme={theme}>
        <Toggle
          checked={settings.hidePersonalInfo}
          onChange={settings.setHidePersonalInfo}
          theme={theme}
          ariaLabel="Hide Personal Information"
        />
      </Field>

      <InlineNote
        theme={theme}
        title="HIPAA-compliant by design"
        points={[
          'All processing happens locally in your browser',
          'No patient data is sent to external servers',
          'Console logs contain zero patient information',
          'Exported files exclude patient data by default',
        ]}
      />
    </div>
  )
}

function AiSection({ settings }: { settings: SettingsState }) {
  const theme = settings.theme

  // Per-provider API-key wiring — collapses what were three duplicated blocks.
  const keyFields: Partial<Record<AIProvider, { label: string; placeholder: string; value: string; set: (v: string) => void }>> = {
    claude: { label: 'Anthropic API key', placeholder: 'sk-ant-...', value: settings.aiApiKey, set: settings.setAiApiKey },
    gemini: { label: 'Google AI API key', placeholder: 'AIza...', value: settings.geminiApiKey, set: settings.setGeminiApiKey },
    openai: { label: 'OpenAI API key', placeholder: 'sk-...', value: settings.openaiApiKey, set: settings.setOpenaiApiKey },
  }
  const keyField = keyFields[settings.aiProvider]

  return (
    <div className="space-y-5">
      <Field label="Enable AI Detection" description="Use AI vision models for vertebrae detection" theme={theme}>
        <Toggle
          checked={settings.aiEnabled}
          ariaLabel="Enable AI Detection"
          theme={theme}
          onChange={async (enabled) => {
            if (enabled && !settings.aiConsentGiven) {
              // Themed, always-async consent prompt (replaces the native
              // window.confirm, which was unstyled and behaved differently
              // on web vs. the Tauri desktop build).
              const consent = await confirmDialog({
                title: 'AI Detection Privacy Notice',
                message:
                  'When you explicitly use the AI analysis or detection features, DICOM images will be sent to external AI services (Claude, Gemini, or OpenAI API).\n' +
                  'Images are sent without patient metadata, but the pixel data itself leaves your device when you click the AI analysis button.\n' +
                  'This is NOT HIPAA-compliant by default. Only use with de-identified images or in non-clinical settings.\n' +
                  'Do you consent to sending image data to external AI services when using AI features?',
                confirmLabel: 'I consent',
                cancelLabel: 'Cancel',
                tone: 'default',
              })
              if (consent) {
                settings.setAiConsentGiven(true)
                settings.setAiEnabled(true)
              }
            } else {
              settings.setAiEnabled(enabled)
            }
          }}
        />
      </Field>

      {settings.aiEnabled && (
        <>
          <Field label="AI Provider" description="Which AI service to use" theme={theme}>
            <Select
              value={settings.aiProvider}
              onChange={(v) => settings.setAiProvider(v as AIProvider)}
              ariaLabel="AI Provider"
              theme={theme}
              options={[
                { value: 'claude', label: 'Claude (Anthropic)' },
                { value: 'gemini', label: 'Gemini (Google)' },
                { value: 'openai', label: 'OpenAI (GPT-4o)' },
                { value: 'local', label: 'Local (on-device)' },
                { value: 'none', label: 'None (Mock Only)' },
              ]}
            />
          </Field>

          <Field label="Response Language" description="Language for AI analysis text" theme={theme}>
            <Select
              value={settings.aiResponseLanguage}
              onChange={settings.setAiResponseLanguage}
              ariaLabel="Response Language"
              theme={theme}
              options={LANGUAGES.map((l) => ({ value: l, label: l }))}
            />
          </Field>

          {keyField && (
            <Field label={keyField.label} description="Stored locally on this device" theme={theme} stacked>
              <ApiKeyField
                value={keyField.value}
                onChange={keyField.set}
                placeholder={keyField.placeholder}
                theme={theme}
              />
            </Field>
          )}

          {settings.aiProvider === 'local' && (
            <Field label="Model" description="Local model id (downloaded on first use)" theme={theme} stacked>
              <TextField
                value={settings.localModel}
                onChange={settings.setLocalModel}
                placeholder="medgemma-4b-it"
                theme={theme}
              />
            </Field>
          )}

          {settings.aiProvider === 'local' ? (
            <InlineNote
              theme={theme}
              title="Fully on-device — nothing leaves your device"
              points={[
                'Runs on the bundled local AI server — no image or data leaves your device',
                'The model is downloaded once, on first use',
                'No API key, no cost, and no send-confirmation needed',
                'Requires the OpenScans desktop app',
              ]}
            />
          ) : (
            <InlineNote
              theme={theme}
              tone="warn"
              title="Privacy & security notice"
              points={[
                'Image data is sent only when you click AI analysis buttons',
                'Patient metadata (names, IDs) is stripped before sending',
                'Cost: ~$0.004–0.01 per image analyzed',
                'API keys are stored locally (not encrypted)',
                'For production use, implement a secure backend proxy',
              ]}
            />
          )}

          {/* MR-precision segmentation engine (on-device, opt-in install) */}
          <MrEngineSettings theme={theme} />
        </>
      )}
    </div>
  )
}

function DataSection({ settings }: { settings: SettingsState }) {
  const theme = settings.theme
  return (
    <div className="space-y-5">
      <Field label="Persist Studies" description="Remember recently opened studies and reload them after refresh" theme={theme}>
        <Toggle
          checked={settings.persistStudies}
          onChange={settings.setPersistStudies}
          theme={theme}
          ariaLabel="Persist Studies"
        />
      </Field>

      <div className={`p-4 rounded-lg border ${themeClasses.bgSecondary(theme)} ${themeClasses.border(theme)}`}>
        <p className={`text-sm font-medium ${themeClasses.text(theme)}`}>Clear AI Data</p>
        <p className={`text-xs mt-0.5 mb-3 ${themeClasses.textSecondary(theme)}`}>
          Remove all stored AI analyses and annotations from localStorage
        </p>
        <button
          onClick={async () => {
            if (
              await confirmDialog({
                title: 'Clear AI Data',
                message: 'Clear all stored AI analyses and annotations? This cannot be undone.',
                confirmLabel: 'Clear All',
              })
            ) {
              localStorage.removeItem('openscans-ai-analyses')
              localStorage.removeItem('openscans-annotations')
              // Reload page to clear in-memory state
              window.location.reload()
            }
          }}
          className={`px-3 py-2 text-sm rounded-lg transition-colors text-white ${theme === 'dark' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'}`}
        >
          Clear All AI Data
        </button>
      </div>
    </div>
  )
}

const LANGUAGES = [
  'English', 'Swedish', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Dutch', 'Chinese (Simplified)', 'Japanese', 'Korean', 'Arabic', 'Russian', 'Hindi',
]

// ── Category icons ───────────────────────────────────────────────────────────

const iconCls = 'w-4 h-4'

function SwatchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={iconCls} aria-hidden="true">
      <path d="M10 2a8 8 0 100 16 1.5 1.5 0 001.5-1.5c0-.4-.15-.74-.4-1a1.5 1.5 0 01-.35-.97c0-.83.67-1.5 1.5-1.5H14a4 4 0 004-4c0-3.86-3.58-7-8-7zm-4.5 8a1 1 0 110-2 1 1 0 010 2zm2-3a1 1 0 110-2 1 1 0 010 2zm5 0a1 1 0 110-2 1 1 0 010 2zm2.5 3a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
  )
}

function CursorIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={iconCls} aria-hidden="true">
      <path fillRule="evenodd" d="M6.22 5.22a.75.75 0 011.06 0l1.97 1.97V3.75a.75.75 0 011.5 0v3.44l1.97-1.97a.75.75 0 111.06 1.06l-1.97 1.97h3.44a.75.75 0 010 1.5h-3.44l1.97 1.97a.75.75 0 11-1.06 1.06l-1.97-1.97v3.44a.75.75 0 01-1.5 0v-3.44l-1.97 1.97a.75.75 0 01-1.06-1.06l1.97-1.97H3.75a.75.75 0 010-1.5h3.44L5.22 6.28a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={iconCls} aria-hidden="true">
      <path fillRule="evenodd" d="M9.661 2.237a.531.531 0 01.678 0 11.947 11.947 0 007.078 2.749.5.5 0 01.479.425c.069.52.104 1.05.104 1.589 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 01-.332 0C5.26 16.812 2 12.411 2 7.25c0-.539.035-1.07.104-1.589a.5.5 0 01.48-.425 11.947 11.947 0 007.077-2.75z" clipRule="evenodd" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={iconCls} aria-hidden="true">
      <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5z" clipRule="evenodd" />
    </svg>
  )
}

function DatabaseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={iconCls} aria-hidden="true">
      <path d="M10 1c-3.866 0-7 1.343-7 3s3.134 3 7 3 7-1.343 7-3-3.134-3-7-3z" />
      <path d="M3 7.4v3.1c0 1.657 3.134 3 7 3s7-1.343 7-3V7.4c-1.3 1-3.91 1.6-7 1.6s-5.7-.6-7-1.6z" />
      <path d="M3 12.9V16c0 1.657 3.134 3 7 3s7-1.343 7-3v-3.1c-1.3 1-3.91 1.6-7 1.6s-5.7-.6-7-1.6z" />
    </svg>
  )
}
