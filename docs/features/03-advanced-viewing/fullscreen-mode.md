# Full-Screen Mode

**Status**: ❌ Not Implemented
**Category**: Advanced Viewing
**Priority**: Tier 1 — Should Implement
**Present In**: OHIF, Weasis, DWV, Stone Web Viewer

## Description

Expand the viewport to fill the entire screen, hiding the browser chrome, toolbar, sidebars, and all other UI elements. This maximizes the viewing area for the medical image, which is especially important on smaller displays.

## Benefits

- **Maximum image real estate** — Every pixel is dedicated to the medical image, providing the best possible viewing conditions
- **Reduced distraction** — Hides all non-essential UI, letting the user focus entirely on the image
- **Small screen utility** — On laptops and tablets, full-screen mode provides a significantly better viewing experience
- **Presentation mode** — Ideal for case presentations, teaching sessions, and multidisciplinary meetings
- **Low implementation effort** — The browser Fullscreen API makes this straightforward to implement

## Why It Matters for OpenScans

Full-screen mode is a basic expected feature present in virtually every image viewer. Its absence is immediately noticeable. Given that medical images benefit from maximum display area and that implementation is straightforward (Browser Fullscreen API), this is high-value for low effort.

## Implementation Considerations

- Use the Browser Fullscreen API (`element.requestFullscreen()`)
- Toggle button in the toolbar and keyboard shortcut
- Auto-hide toolbar and sidebars in full-screen (show on mouse hover)
- Exit via Escape key (browser default) or toggle button
- Handle browser compatibility (webkit prefix for Safari)
