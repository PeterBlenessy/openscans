# Task: Implement DICOM Anonymization Export

**Feature**: [DICOM Anonymization](../../features/06-export-sharing/dicom-anonymization.md)
**Priority**: Tier 3 — Evaluate Later
**Estimated Effort**: Medium (3-5 days)
**Dependencies**: None

## Overview

Export DICOM files with patient-identifying information removed or replaced. Follows DICOM PS3.15 Confidentiality Profiles.

## Implementation Steps

### Step 1: Define Anonymization Rules

**File**: `src/lib/anonymization/anonymizationRules.ts`

1. Define which DICOM tags contain PII per DICOM PS3.15 Basic Profile:
   ```typescript
   const PII_TAGS = {
     // Direct identifiers — remove or replace
     '00100010': 'replace',  // Patient Name
     '00100020': 'replace',  // Patient ID
     '00100030': 'remove',   // Patient Birth Date
     '00100040': 'keep',     // Patient Sex (useful, not identifying alone)
     '00080050': 'replace',  // Accession Number
     '00080080': 'remove',   // Institution Name
     '00080081': 'remove',   // Institution Address
     '00080090': 'remove',   // Referring Physician Name
     '00081070': 'remove',   // Operator Name
     // ... 50+ additional tags
   }
   ```
2. Actions per tag:
   - `remove` — delete the tag entirely
   - `replace` — replace with anonymized value (e.g., "ANONYMOUS")
   - `hash` — replace with a deterministic hash (allows re-identification by holder of key)
   - `shift` — for dates, shift by a random offset (preserves intervals)
   - `keep` — leave unchanged

### Step 2: Create Anonymization Engine

**File**: `src/lib/anonymization/anonymizer.ts`

1. Create the main anonymization function:
   ```typescript
   async function anonymizeDicomFile(
     arrayBuffer: ArrayBuffer,
     options: AnonymizationOptions
   ): Promise<ArrayBuffer>
   ```
2. Parse the DICOM dataset using `dicom-parser`
3. Apply rules to each tag
4. Re-encode the modified dataset
5. Options:
   - `profile: 'basic' | 'strict'` — Basic or strict de-identification
   - `dateShift: number` — days to shift dates (preserve intervals)
   - `patientName: string` — replacement name (default "ANONYMOUS")

### Step 3: Handle Burned-In Annotations

**File**: `src/lib/anonymization/burnedInDetector.ts`

1. Check the Burned In Annotation tag (0028,0301)
2. If "YES", warn the user that pixel data may contain text with PII
3. Cannot automatically remove burned-in text — flag for manual review
4. Show warning in the UI

### Step 4: Create Anonymization UI

**File**: `src/components/export/AnonymizationDialog.tsx`

1. Anonymization profile selector (Basic, Strict)
2. Custom replacement values (patient name, ID)
3. Date shift toggle with offset value
4. List of tags that will be modified (expandable)
5. Warning for burned-in annotations
6. Export button to download anonymized files

### Step 5: Implement Batch Anonymization

**File**: `src/lib/anonymization/batchAnonymize.ts`

1. Anonymize all files in a study consistently:
   - Same date shift for all files in a study
   - Same replacement patient name/ID across all files
2. Progress indicator for large studies
3. Download as ZIP file

### Step 6: Add Tests

1. Test tag removal, replacement, and hashing
2. Test date shifting preserves intervals
3. Test that pixel data is not modified
4. Test burned-in annotation detection
5. Test round-trip: anonymize → load → verify tags removed

## Acceptance Criteria

- [ ] Patient name, ID, and other PII tags removed or replaced
- [ ] Date shifting preserves time intervals
- [ ] Burned-in annotation warning displayed
- [ ] Basic and strict anonymization profiles
- [ ] Consistent anonymization across study files
- [ ] Anonymized files are valid DICOM
- [ ] Batch export as ZIP
