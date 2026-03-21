# Hanging Protocols

**Status**: ❌ Not Implemented
**Category**: Advanced Viewing
**Priority**: Tier 3 — Evaluate Later
**Present In**: OHIF, Weasis

## Description

Automatically arrange study series into predefined viewport layouts based on the study type, modality, and body part. For example, a brain MRI protocol might automatically display T1, T2, FLAIR, and DWI series in a 2x2 grid. Hanging protocols eliminate the manual work of selecting and arranging series each time a study is opened.

## Benefits

- **Automated workflow** — Studies open in the correct layout immediately, saving 10-30 seconds per study (significant across hundreds of daily studies)
- **Consistency** — Every radiologist sees the same standardized layout for a given study type, reducing errors
- **Customizable** — Different protocols for different specialties (neuro, MSK, chest, abdomen)
- **Efficiency** — Reduces the cognitive load of manually arranging series into viewports

## Why It Matters for OpenScans

Hanging protocols are primarily valuable in high-volume clinical settings where radiologists read dozens of studies per day. For OpenScans' current use cases (standalone review, education, research), this is lower priority. It becomes important if OpenScans targets institutional deployment.

## Implementation Considerations

- Requires split/comparison view first
- Protocol matching rules based on modality, body part, study description
- Protocol definitions (JSON configuration)
- Default protocols for common study types
- User-customizable protocols
- OHIF has a well-documented hanging protocol engine that could serve as reference
