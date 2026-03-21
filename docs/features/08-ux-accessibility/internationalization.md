# Internationalization (i18n)

**Status**: ❌ Not Implemented
**Category**: UX & Accessibility
**Priority**: Tier 2 — Should Consider
**Present In**: OHIF, Weasis, DWV, Stone Web Viewer

## Description

Support multiple languages for the user interface, allowing users to interact with the application in their preferred language. This includes translating all UI labels, tooltips, error messages, and help text.

## Benefits

- **Global accessibility** — Medical imaging is used worldwide; language barriers should not prevent adoption
- **Institutional deployment** — Hospitals in non-English-speaking countries need localized interfaces
- **User comfort** — Users work more efficiently in their native language, especially for complex tools
- **Broader adoption** — Localization dramatically increases the potential user base

## Why It Matters for OpenScans

Four of five major competitors support i18n. OpenScans' AI response language is already selectable, showing awareness of multilingual needs. Extending this to the full UI would significantly broaden adoption, especially in European, Asian, and Latin American markets.

## Implementation Considerations

- i18n library integration (react-i18next or similar)
- Extract all hardcoded strings to translation files
- Initial languages: English, Spanish, French, German, Chinese, Japanese
- Right-to-left (RTL) layout support for Arabic/Hebrew (future)
- Date and number formatting per locale
- Community contribution model for translations
