# Task: Implement Internationalization (i18n)

**Feature**: [Internationalization](../../features/08-ux-accessibility/internationalization.md)
**Priority**: Tier 2 — Should Consider
**Estimated Effort**: Medium (4-5 days for framework + first 2 languages)
**Dependencies**: None

## Overview

Add multi-language support using react-i18next, starting with English and one additional language. Establish the i18n framework so that adding more languages is easy.

## Implementation Steps

### Step 1: Add i18n Dependencies

**File**: `package.json`

1. Install: `pnpm add i18next react-i18next i18next-browser-languagedetector`

### Step 2: Create i18n Configuration

**File**: `src/lib/i18n/i18n.ts`

1. Configure i18next:
   ```typescript
   import i18n from 'i18next'
   import { initReactI18next } from 'react-i18next'
   import LanguageDetector from 'i18next-browser-languagedetector'

   i18n
     .use(LanguageDetector)
     .use(initReactI18next)
     .init({
       fallbackLng: 'en',
       interpolation: { escapeValue: false },
       resources: {
         en: { translation: enTranslations },
         es: { translation: esTranslations },
       },
     })
   ```
2. Initialize in `src/main.tsx` before app render

### Step 3: Create Translation Files

**File**: `src/lib/i18n/locales/en.json`

1. Extract all user-facing strings from components into a translation file:
   ```json
   {
     "toolbar": {
       "reset": "Reset",
       "fitToWindow": "Fit to Window",
       "zoomIn": "Zoom In",
       "zoomOut": "Zoom Out",
       "rotateClockwise": "Rotate Clockwise",
       "rotateCounterClockwise": "Rotate Counter-Clockwise",
       "flipHorizontal": "Flip Horizontal",
       "flipVertical": "Flip Vertical",
       "invert": "Invert"
     },
     "fileDropzone": {
       "dropFiles": "Drop DICOM files here",
       "selectFiles": "Select Files",
       "selectFolder": "Select Folder"
     },
     "settings": {
       "title": "Settings",
       "theme": "Theme",
       "dark": "Dark",
       "light": "Light"
     }
   }
   ```
2. Create equivalent `es.json` for Spanish (or another language)

### Step 4: Replace Hardcoded Strings in Components

**Files**: All components in `src/components/`

1. Replace all hardcoded strings with `t()` function calls:
   ```typescript
   // Before:
   <button>Reset</button>

   // After:
   import { useTranslation } from 'react-i18next'
   const { t } = useTranslation()
   <button>{t('toolbar.reset')}</button>
   ```
2. Work through components systematically:
   - ViewportToolbar
   - FileDropzone
   - SettingsPanel
   - ExportDialog
   - KeyboardShortcutsHelp
   - LeftDrawer
   - StudySeriesBrowser
   - ErrorToast
   - All dialog/modal components

### Step 5: Add Language Selector to Settings

**File**: `src/components/settings/SettingsPanel.tsx`

1. Add a language selector dropdown in the settings panel
2. Options: English, Español (+ more as translations are added)
3. Persist selected language in localStorage
4. Apply language change immediately (no page reload needed)

### Step 6: Handle Dynamic Content

1. Format dates according to locale: `new Intl.DateTimeFormat(locale).format(date)`
2. Format numbers according to locale: `new Intl.NumberFormat(locale).format(number)`
3. DICOM metadata values stay in their original language (not translated)

### Step 7: Add Tests

1. Test that all translation keys exist in all language files
2. Test language switching
3. Test fallback to English for missing keys
4. Test date/number formatting per locale

## Acceptance Criteria

- [ ] i18n framework integrated and initialized
- [ ] All user-facing strings extracted to translation files
- [ ] At least 2 languages available (English + one other)
- [ ] Language selector in settings
- [ ] Language persists across sessions
- [ ] Dates and numbers formatted per locale
- [ ] Missing translations fall back to English
