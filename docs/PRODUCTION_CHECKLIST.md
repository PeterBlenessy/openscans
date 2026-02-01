# Production Build Checklist

This checklist ensures OpenScans is production-ready before each release.

## Version: 0.1.0 (Initial Release)
**Release Date**: TBD
**Release Type**: Initial Public Release

---

## 1. Pre-Release Code Quality

### Code Quality
- [x] All TypeScript errors resolved (`npm run build` succeeds)
- [ ] No ESLint errors (`npm run lint` passes)
- [ ] All integration tests passing (`npm run test`)
- [ ] No console errors or warnings in production build
- [ ] No TODO comments in production code (document or remove)
- [ ] All deprecated APIs replaced

### Performance
- [x] Bundle size optimized (main bundle <500KB)
- [x] Code splitting implemented for AI SDKs
- [x] Code splitting implemented for export libraries
- [ ] Lazy loading verified for all heavy dependencies
- [ ] Memory leaks checked (load large studies, navigate, check DevTools)
- [ ] Image loading performance verified with 100+ slice studies

### Security
- [ ] No hardcoded API keys or secrets in code
- [ ] All dependencies up-to-date (check for security advisories)
- [ ] CORS configuration verified for DICOM web sources
- [ ] File upload validation working correctly
- [ ] No sensitive data logged to console in production

---

## 2. Build Validation

### Production Build
```bash
# Clean build
rm -rf dist node_modules/.vite
npm ci
npm run build
```

- [ ] Build completes without errors
- [ ] Build completes without warnings
- [ ] Source maps generated correctly
- [ ] All assets copied to dist/
- [ ] Web workers copied correctly
- [ ] Bundle sizes within limits:
  - [ ] Main bundle: <500KB (current: ~334KB ✅)
  - [ ] Cornerstone chunk: <800KB
  - [ ] Vendor chunks: <300KB each

### Build Output Verification
- [ ] dist/index.html exists and is valid
- [ ] dist/assets/ contains all JS chunks
- [ ] dist/assets/ contains all CSS files
- [ ] dist/codecs/ contains DICOM web workers
- [ ] No missing imports in browser console

---

## 3. Functional Testing

### Core Features
- [ ] **File Upload**
  - [ ] Single DICOM file upload works
  - [ ] Multiple DICOM files upload works
  - [ ] Folder upload works
  - [ ] DICOMDIR handling works
  - [ ] Invalid file types rejected gracefully
  - [ ] Large files (>100MB) load without crashing

- [ ] **DICOM Viewing**
  - [ ] Images render correctly
  - [ ] Window/level adjustments work
  - [ ] Zoom in/out works
  - [ ] Pan works
  - [ ] Invert colors works
  - [ ] Reset viewport works
  - [ ] Multi-series studies load correctly
  - [ ] Instance navigation (slider, arrows) works
  - [ ] Thumbnail grid displays correctly

- [ ] **Window Presets**
  - [ ] Preset dropdown shows options
  - [ ] Applying presets changes window/level
  - [ ] Custom presets can be created
  - [ ] Presets persist across sessions

- [ ] **Annotations**
  - [ ] Markers visible on images
  - [ ] Markers draggable
  - [ ] Marker position saved correctly
  - [ ] Annotations persist on instance navigation
  - [ ] Annotations cleared when requested
  - [ ] Marker visibility toggle works

- [ ] **AI Features**
  - [ ] AI vertebrae detection works (with valid API key)
  - [ ] AI radiology analysis works (with valid API key)
  - [ ] AI markers appear on image
  - [ ] AI analysis modal displays results
  - [ ] AI markers can be deleted via right-click
  - [ ] Manual markers preserved when deleting AI markers
  - [ ] AI errors handled gracefully (invalid API key, network errors)

- [ ] **Favorites**
  - [ ] Images can be favorited
  - [ ] Favorites panel shows starred images
  - [ ] Clicking favorite navigates to image
  - [ ] Favorites persist across sessions
  - [ ] Favorites can be unfavorited

- [ ] **Export**
  - [ ] Single image PDF export works
  - [ ] Batch PDF export works
  - [ ] Grid layout options work
  - [ ] Exported PDFs contain correct images
  - [ ] Export filename matches study description

- [ ] **Settings**
  - [ ] Theme switcher works (dark/light)
  - [ ] AI provider selection works
  - [ ] API key entry works
  - [ ] Settings persist across sessions
  - [ ] Settings reset works

### Keyboard Shortcuts
- [ ] W/L adjustment (W key)
- [ ] Zoom (Z key)
- [ ] Pan (P key)
- [ ] Invert (I key)
- [ ] Reset (R key)
- [ ] AI detection (M key)
- [ ] AI analysis (N key)
- [ ] Next/previous instance (arrow keys)
- [ ] Toggle annotations (A key)
- [ ] Favorite current image (F key)

### Browser Compatibility
- [ ] Chrome (latest) - Primary target
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Responsive Design
- [ ] Desktop (1920x1080) works
- [ ] Laptop (1440x900) works
- [ ] Tablet (1024x768) works
- [ ] Mobile view warning shows (not optimized for mobile)

---

## 4. Edge Cases & Error Handling

### Error Scenarios
- [ ] Loading invalid DICOM file shows error
- [ ] Network error during AI request handled
- [ ] API quota exceeded handled
- [ ] Invalid API key shows helpful error
- [ ] Out of memory error handled (very large studies)
- [ ] Corrupt DICOM file handled gracefully
- [ ] No internet connection handled

### Data Integrity
- [ ] Annotations saved correctly
- [ ] Favorites saved correctly
- [ ] Settings saved correctly
- [ ] LocalStorage quota exceeded handled
- [ ] Clearing browser data doesn't crash app

---

## 5. Performance Benchmarks

### Load Times (with 3G throttling)
- [ ] Initial page load: <5s
- [ ] Small study (10 images): <3s
- [ ] Medium study (100 images): <10s
- [ ] Large study (500 images): <30s

### Memory Usage
- [ ] Small study: <200MB
- [ ] Medium study: <500MB
- [ ] Large study: <1GB
- [ ] No memory leaks after navigating 100+ images

### Rendering Performance
- [ ] Smooth image navigation (60fps)
- [ ] Window/level adjustments smooth
- [ ] Zoom/pan smooth
- [ ] No jank when adding annotations

---

## 6. Documentation

### User Documentation
- [ ] README.md up to date
- [ ] Feature list complete
- [ ] Installation instructions verified
- [ ] Usage examples work
- [ ] Screenshots up to date
- [ ] Known limitations documented

### Developer Documentation
- [ ] ARCHITECTURE.md up to date
- [ ] CLAUDE.md guidelines current
- [ ] API documentation complete
- [ ] Code comments adequate
- [ ] Build process documented

### Legal
- [ ] LICENSE file present (MIT)
- [ ] Third-party licenses documented
- [ ] Attribution to Cornerstone.js
- [ ] Medical disclaimer present

---

## 7. Deployment Preparation

### Hosting Setup
- [ ] Hosting platform selected (Vercel, Netlify, etc.)
- [ ] Custom domain configured (optional)
- [ ] SSL/HTTPS enabled
- [ ] Build command configured: `npm run build`
- [ ] Output directory configured: `dist`
- [ ] Environment variables set (if any)

### Analytics & Monitoring (Optional)
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Analytics configured (Google Analytics, etc.)
- [ ] Privacy policy added
- [ ] Cookie consent implemented (if needed)

### SEO & Metadata
- [ ] Meta tags in index.html
- [ ] Favicon added
- [ ] Social media preview image
- [ ] robots.txt configured
- [ ] sitemap.xml (if needed)

---

## 8. Release Process

### Version Bump
```bash
# Update version in package.json
npm version 0.1.0

# Tag the release
git tag -a v0.1.0 -m "Release v0.1.0: Initial public release"
git push origin v0.1.0
```

### GitHub Release
- [ ] Create release on GitHub
- [ ] Add release notes
- [ ] Attach build artifacts (optional)
- [ ] Mark as pre-release (if beta)

### Deployment
```bash
# Deploy to hosting platform
# (command depends on platform)
npm run build
# Upload dist/ folder or trigger deployment
```

### Post-Deployment Verification
- [ ] Production URL loads
- [ ] All features work in production
- [ ] No console errors
- [ ] Analytics tracking works (if configured)
- [ ] Error reporting works (if configured)

---

## 9. Post-Release

### Communication
- [ ] Announce release (social media, forums, etc.)
- [ ] Update project homepage
- [ ] Notify contributors
- [ ] Update demo site (if applicable)

### Monitoring
- [ ] Monitor error reports (first 24 hours)
- [ ] Check user feedback
- [ ] Monitor performance metrics
- [ ] Address critical issues immediately

---

## 10. Rollback Plan

If critical issues are discovered post-deployment:

1. **Immediate Actions**
   - [ ] Revert to previous version
   - [ ] Communicate issue to users
   - [ ] Document the issue

2. **Investigation**
   - [ ] Reproduce the issue locally
   - [ ] Identify root cause
   - [ ] Create hotfix branch

3. **Hotfix Release**
   - [ ] Fix the issue
   - [ ] Test thoroughly
   - [ ] Deploy hotfix version
   - [ ] Increment patch version (0.1.1)

---

## Sign-Off

**Checked by**: ________________
**Date**: ________________
**Build ID**: ________________
**Deploy URL**: ________________

**Ready for Production**: [ ] Yes [ ] No

**Notes**:
_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________
