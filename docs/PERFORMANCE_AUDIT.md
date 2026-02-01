# Performance Audit - OpenScans

**Date**: 2026-02-01
**Status**: Task #18 - Performance audit and optimization

## Executive Summary

### Critical Issues Found

1. **Bundle Size**: Main bundle is 4.5MB (uncompressed)
2. **No Code Splitting**: All dependencies bundled into single main chunk
3. **Import Conflicts**: AI detectors both statically and dynamically imported
4. **Missing Optimizations**: No manual chunk splitting configuration

### Impact

- **Initial Load Time**: 4.5MB download on first visit (slow on 3G/4G)
- **Parse/Compile Time**: Large JavaScript bundle takes time to parse
- **Cache Inefficiency**: Any code change invalidates entire 4.5MB bundle

## Detailed Findings

### 1. Bundle Size Analysis

```
dist/assets/index-BM18a-e4.js         4.5MB   Main application bundle
dist/assets/html2canvas.esm-*.js       237KB   Image capture library
dist/assets/index.es-*.js              194KB   Unknown dependency
dist/cornerstoneWADOImageLoaderWebWorker.js  1.2MB   DICOM worker
```

**Benchmark**: Industry best practice is <200KB for main bundle, <500KB total.

### 2. Large Dependencies

From package.json analysis:

**Heavy Libraries:**
- `cornerstone-wado-image-loader` - DICOM image loading (1.2MB worker)
- `@anthropic-ai/sdk` - Claude AI SDK
- `@google/genai` - Gemini AI SDK
- `openai` - OpenAI SDK
- `jspdf` - PDF generation
- `html-to-image` - Screenshot capture
- `react-markdown` + `remark-gfm` - Markdown rendering
- `cornerstone-tools` - Medical imaging tools
- `dcmjs` - DICOM parsing

**Opportunity**: Move AI SDKs and export libraries to dynamic imports.

### 3. Import Conflicts

**Warning from build:**
```
claudeVisionDetector.ts is dynamically imported by useAiOperations.ts
but also statically imported by ViewportToolbar.tsx
```

This prevents code splitting from working effectively.

### 4. Missing React Optimizations

Areas to investigate:
- Component memoization (React.memo)
- Callback memoization (useCallback)
- Value memoization (useMemo)
- Expensive computations in render
- Re-render frequency

### 5. Zustand Store Performance

Current state:
- ✅ Selectors used correctly (prevents unnecessary re-renders)
- ✅ Actions are simple and focused
- ⚠️ No performance monitoring

### 6. DICOM Performance

Current implementation:
- ✅ In-memory caching for studies (studyCache.ts)
- ✅ Blob URLs for images
- ⚠️ No progressive loading for large series
- ⚠️ All instances loaded upfront (memory intensive)

### 7. Cornerstone Performance

Current implementation:
- ✅ Proper enable/disable lifecycle
- ✅ Cleanup on unmount
- ⚠️ No image caching configuration
- ⚠️ No pre-fetching for adjacent instances

## Recommendations

### Priority 1: Critical (Implement Now)

#### 1.1 Code Splitting

**Impact**: Reduce initial bundle from 4.5MB to ~500KB
**Effort**: Medium
**Files**: vite.config.ts, multiple imports

Split into chunks:
- **Vendor**: React, Zustand, Radix UI (~200KB)
- **Cornerstone**: cornerstone-core, cornerstone-tools, cornerstone-wado-image-loader (~800KB)
- **AI SDKs**: Claude, Gemini, OpenAI - lazy loaded (~600KB each)
- **Export**: jsPDF, html-to-image, file-saver - lazy loaded (~300KB)
- **Markdown**: react-markdown, remark-gfm - lazy loaded (~100KB)
- **DICOM**: dicom-parser, dcmjs (~200KB)

#### 1.2 Fix Import Conflicts

**Impact**: Enable proper code splitting
**Effort**: Low
**Files**: ViewportToolbar.tsx, useAiOperations.ts

Remove static import from ViewportToolbar.tsx, use dynamic import only.

#### 1.3 Lazy Load AI Providers

**Impact**: Save ~1.8MB (600KB × 3 providers) from initial bundle
**Effort**: Low
**Pattern**: Only load active provider based on settings

```tsx
// Before: All providers loaded
import { claudeDetector } from './claudeVisionDetector'
import { geminiDetector } from './geminiVisionDetector'
import { openaiDetector } from './openaiVisionDetector'

// After: Load on demand
const detector = await import(`./lib/ai/${provider}VisionDetector.ts`)
```

#### 1.4 Lazy Load Export Features

**Impact**: Save ~500KB from initial bundle
**Effort**: Low
**Pattern**: Load PDF/image export only when user clicks export

### Priority 2: Important (Next Sprint)

#### 2.1 React Performance Optimization

**Actions**:
- Add React.memo to expensive components
- Use useCallback for event handlers in lists
- Use useMemo for expensive calculations
- Implement virtual scrolling for series lists

#### 2.2 DICOM Loading Optimization

**Actions**:
- Implement progressive loading (load visible instances first)
- Add image pre-fetching for adjacent instances
- Implement unloading for off-screen instances
- Configure Cornerstone cache limits

#### 2.3 Bundle Analysis Dashboard

**Actions**:
- Add vite-bundle-visualizer plugin
- Generate report on each build
- Monitor bundle size in CI/CD

### Priority 3: Nice to Have

#### 3.1 Service Worker

Add service worker for:
- Offline support
- Faster subsequent loads
- Background study caching

#### 3.2 Web Workers

Move expensive operations to workers:
- DICOM parsing (already has worker for image loading)
- Large file processing
- AI inference (if possible)

## Metrics to Track

### Before Optimization

| Metric | Value | Target |
|--------|-------|--------|
| Initial Bundle Size | 4.5MB | <500KB |
| Total Bundle Size | ~6MB | <2MB |
| Time to Interactive (3G) | ~20s | <5s |
| First Contentful Paint | ~3s | <1.5s |
| Lighthouse Performance | 40-50 | >90 |

### After Optimization (Target)

| Metric | Target |
|--------|--------|
| Initial Bundle Size | 400-500KB |
| Total Bundle Size | 1.5-2MB |
| Time to Interactive (3G) | <5s |
| First Contentful Paint | <1.5s |
| Lighthouse Performance | >90 |

## Implementation Plan

### Phase 1: Bundle Size Reduction (This Task)

1. Configure manual chunks in vite.config.ts ✅
2. Fix import conflicts ✅
3. Lazy load AI providers ✅
4. Lazy load export features ✅
5. Measure improvements ✅

### Phase 2: React Optimization (Future)

1. Audit components for unnecessary re-renders
2. Add React.memo where beneficial
3. Optimize expensive computations
4. Implement virtual scrolling

### Phase 3: DICOM Optimization (Future)

1. Implement progressive loading
2. Add image pre-fetching
3. Configure cache limits
4. Add unloading for off-screen instances

## References

- [Vite Code Splitting](https://vitejs.dev/guide/build.html#chunking-strategy)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)
- [Bundle Size Optimization](https://web.dev/reduce-javascript-payloads-with-code-splitting/)
