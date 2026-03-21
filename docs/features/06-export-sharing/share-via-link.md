# Share via Link/URL

**Status**: ❌ Not Implemented
**Category**: Export & Sharing
**Priority**: Tier 3 — Evaluate Later
**Present In**: OHIF, Stone Web Viewer

## Description

Generate a shareable URL that opens a specific study, series, or image in the viewer. The link encodes enough information for the recipient to view the same imaging data directly in their browser.

## Benefits

- **Instant collaboration** — Share a link to a specific finding with a colleague instead of exporting and attaching files
- **Deep linking** — Link directly to a specific image and viewport state (W/L, zoom, annotations)
- **Electronic health record integration** — Embed viewer links in EHR notes or reports
- **Teleradiology** — Enable remote reading by sharing study links

## Why It Matters for OpenScans

Link sharing is primarily valuable in server-based deployments where studies are stored centrally. Since OpenScans currently loads local files, there's no persistent URL to share. This feature would become relevant with DICOMweb/PACS integration or if a file-hosting mechanism is added.

## Implementation Considerations

- Requires server-side storage or DICOMweb endpoint for the study data
- URL encoding of study/series/instance identifiers
- Optional viewport state encoding (W/L, zoom, annotations)
- Authentication considerations for accessing shared links
- Alternative: export a "session file" that can be opened locally
