# Deployment Guide

This document explains how to build and deploy the OpenScans for production use.

## Table of Contents

- [Building for Production](#building-for-production)
- [Deployment Platforms](#deployment-platforms)
- [HIPAA Compliance](#hipaa-compliance)
- [Environment Configuration](#environment-configuration)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

---

## Building for Production

### Build Command

```bash
# Install dependencies
pnpm install

# Create production build
pnpm build

# Output: dist/ directory with optimized static files
```

### Build Output

The build creates a `dist/` directory with:
- `index.html` - Entry point
- `assets/` - Minified JS, CSS, and assets
- All static files optimized for production

**Build Statistics:**
- Bundle size: ~500KB gzipped (including Cornerstone.js)
- Initial load time: <2s on broadband
- Time to interactive: <3s

### Known Build Issues

#### WASM Loading Warning

You may see this warning during build:

```
WASM module loading is not yet supported in production builds
```

**Impact:** Cornerstone.js WASM modules may not load in production builds.

**Workaround:** Use development mode for now:
```bash
pnpm dev  # Development server
```

**Tracking:** This is a known limitation of Vite + WASM. Will be resolved in future updates.

### Build Verification

```bash
# Build
pnpm build

# Preview production build locally
pnpm preview

# Open http://localhost:4173
```

Test the production build thoroughly:
- [ ] Upload DICOM files
- [ ] Navigate through instances
- [ ] Adjust window/level
- [ ] Export images (PNG, PDF)
- [ ] Check browser console for errors

---

## Deployment Platforms

The OpenScans is a **static site** - no backend required. Deploy to any static hosting platform.

### Recommended Platforms

#### 1. Netlify (Easiest)

**Setup:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

**Configuration:** Create `netlify.toml`

```toml
[build]
  command = "pnpm build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Benefits:**
- Free tier available
- Automatic HTTPS
- Global CDN
- Deploy previews for PRs

**HIPAA Compliance:** Netlify is **NOT HIPAA compliant** by default. For production medical use, choose a HIPAA-ready platform.

---

#### 2. Vercel

**Setup:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Configuration:** Create `vercel.json`

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Benefits:**
- Free tier available
- Automatic HTTPS
- Global edge network
- GitHub integration

**HIPAA Compliance:** Vercel is **NOT HIPAA compliant** by default.

---

#### 3. AWS S3 + CloudFront (Production)

**For HIPAA-compliant production deployments.**

**Setup:**

1. **Create S3 bucket**
   ```bash
   aws s3 mb s3://dicom-viewer-prod
   ```

2. **Configure bucket for static hosting**
   ```bash
   aws s3 website s3://dicom-viewer-prod \
     --index-document index.html \
     --error-document index.html
   ```

3. **Upload build**
   ```bash
   aws s3 sync dist/ s3://dicom-viewer-prod --delete
   ```

4. **Create CloudFront distribution** (for HTTPS and caching)
   - Origin: S3 bucket
   - SSL Certificate: ACM certificate
   - Caching: Aggressive caching for assets, no caching for index.html

**Benefits:**
- HIPAA-eligible with BAA (Business Associate Agreement)
- Full control over infrastructure
- Global CDN via CloudFront
- Scalable to millions of users

**Cost:** ~$1-5/month for low traffic

---

#### 4. Self-Hosted (Docker)

**For on-premise deployments or strict compliance requirements.**

**Dockerfile:**

```dockerfile
# Build stage
FROM node:18 AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf:**

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Serve static files with caching
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**Build and run:**

```bash
# Build Docker image
docker build -t dicom-viewer .

# Run container
docker run -d -p 80:80 dicom-viewer
```

**Benefits:**
- Full control over deployment
- Can run on-premise (air-gapped networks)
- HIPAA-compliant with proper infrastructure
- Easy to integrate with existing systems

---

## HIPAA Compliance

### Important Disclaimer

**The OpenScans is a client-side application that processes DICOM data entirely in the browser. No data is sent to external servers by default.**

### HIPAA Considerations

#### ✅ Compliant by Design

- **Client-side processing**: All DICOM parsing happens in browser
- **No data transmission**: Files never leave the user's device
- **Privacy-first exports**: Patient data excluded from filenames by default
- **No analytics**: No tracking, cookies, or third-party scripts
- **localStorage only**: Data stored locally, never in cloud

#### ⚠️ Deployment Considerations

For HIPAA-compliant production use:

1. **Choose HIPAA-eligible hosting**
   - AWS with BAA (Business Associate Agreement)
   - Google Cloud with BAA
   - Azure with BAA
   - Self-hosted on compliant infrastructure

2. **Implement access controls**
   - HTTPS only (TLS 1.2+)
   - Authentication (OAuth, SAML)
   - Audit logging (who accessed the viewer)
   - IP whitelisting if needed

3. **Physical security**
   - Encrypted devices
   - Secure workstations
   - Screen privacy filters (if viewing in public)

4. **Data handling policies**
   - Clear data retention policies
   - Secure disposal of downloaded files
   - User training on PHI handling

#### 🚫 NOT HIPAA Compliant

These features would require HIPAA compliance review:

- Sending DICOM files to cloud storage
- Cloud-based rendering or processing
- Analytics or telemetry
- Third-party integrations (CDNs for libraries)

**Recommendation:** For production medical use, consult with HIPAA compliance officer and legal team.

---

## Environment Configuration

### Build-time Configuration

Create `.env.production` for production builds:

```env
# App Configuration
VITE_APP_TITLE=OpenScans
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_TELEMETRY=false

# Performance
VITE_MAX_FILE_SIZE=524288000  # 500 MB
VITE_MAX_INSTANCES=1000
```

**Usage in code:**

```typescript
const maxFileSize = import.meta.env.VITE_MAX_FILE_SIZE || 524288000
```

### Runtime Configuration

For configuration that can change without rebuild, use `public/config.json`:

```json
{
  "maxFileSize": 524288000,
  "enableBatchExport": true,
  "supportedFormats": ["dcm", "dicom"]
}
```

Load at runtime:

```typescript
const config = await fetch('/config.json').then(r => r.json())
```

---

## Performance Optimization

### Pre-deployment Checklist

- [x] **Tree shaking**: Unused code removed (handled by Vite)
- [x] **Code splitting**: Async imports for large modules
- [x] **Asset optimization**: Images compressed, SVGs minified
- [x] **Caching headers**: Static assets cached, index.html not cached
- [ ] **WASM optimization**: Currently blocked by Vite limitation

### Caching Strategy

**Static assets** (JS, CSS, images):
```
Cache-Control: public, max-age=31536000, immutable
```

**index.html**:
```
Cache-Control: no-cache
```

### CDN Configuration

For CloudFront or similar CDNs:

**Behaviors:**
- `/assets/*` → Cache aggressively (1 year)
- `/index.html` → No caching, always serve fresh
- `/*` → Forward to origin, cache based on headers

### Performance Monitoring

Use browser DevTools to profile:

1. **Lighthouse audit**
   ```bash
   # Install
   npm install -g lighthouse

   # Run audit
   lighthouse https://your-deployment.com --view
   ```

   **Target scores:**
   - Performance: 90+
   - Accessibility: 95+
   - Best Practices: 95+
   - SEO: 80+

2. **Network tab**
   - Initial bundle: <500 KB gzipped
   - First Contentful Paint: <1.5s
   - Time to Interactive: <3s

3. **Memory tab**
   - Heap size: <100 MB with 100 images loaded
   - No memory leaks after navigation

---

## Troubleshooting

### Build Fails

**Issue:** TypeScript errors during build

```bash
# Check for type errors
pnpm tsc --noEmit

# Fix or suppress errors, then rebuild
pnpm build
```

**Issue:** Out of memory during build

```bash
# Increase Node.js memory
NODE_OPTIONS=--max-old-space-size=4096 pnpm build
```

---

### WASM Not Loading in Production

**Issue:** Cornerstone.js WASM modules fail to load

```
Error: WebAssembly module is not supported in this environment
```

**Workaround:**
1. Use development mode (`pnpm dev`) for now
2. Configure reverse proxy to serve files locally
3. Track upstream Vite WASM support

**Future:** This will be resolved when Vite improves WASM support.

---

### Files Not Loading After Deployment

**Issue:** Single-page app routing broken (404 on refresh)

**Fix:** Configure rewrites/redirects:

**Netlify (`netlify.toml`):**
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Nginx:**
```nginx
try_files $uri $uri/ /index.html;
```

**Apache (`.htaccess`):**
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

---

### CORS Errors

**Issue:** Loading files from file:// protocol fails

```
Access to XMLHttpRequest blocked by CORS policy
```

**Fix:** Always serve via HTTP/HTTPS, never open index.html directly

```bash
# Serve locally
pnpm preview

# Or use simple HTTP server
npx serve dist
```

---

### Performance Issues with Large Files

**Issue:** Browser freezes when loading 500+ instance series

**Optimization strategies:**

1. **Lazy load thumbnails**
   ```typescript
   // Load only visible thumbnails
   const visibleInstances = instances.slice(startIndex, endIndex)
   ```

2. **Increase memory limit**
   ```bash
   # Launch Chrome with more memory
   chrome --js-flags="--max-old-space-size=4096"
   ```

3. **Use Web Workers**
   ```typescript
   // Offload DICOM parsing to worker thread
   const worker = new Worker('./dicomWorker.js')
   ```

4. **Progressive loading**
   ```typescript
   // Load first 50 instances, then batch-load rest
   const initial = await parseDicomFiles(files.slice(0, 50))
   setStudies(initial)

   const remaining = await parseDicomFiles(files.slice(50))
   setStudies([...initial, ...remaining])
   ```

---

## Maintenance

### Updates and Patching

**Security updates:**
```bash
# Check for vulnerabilities
pnpm audit

# Fix automatically if possible
pnpm audit fix

# Review and update manually
pnpm update
```

**Dependency updates:**
```bash
# Check outdated packages
pnpm outdated

# Update all dependencies
pnpm update --latest

# Test thoroughly after updates
pnpm test
pnpm test:e2e
```

### Monitoring

**Client-side error tracking (optional, review HIPAA):**

If implementing error tracking, ensure:
- No PHI in error logs
- Anonymize stack traces
- HIPAA-compliant error tracking service
- BAA with vendor

**Example with Sentry (if HIPAA-cleared):**
```typescript
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: 'YOUR_DSN',
  beforeSend(event) {
    // Strip PHI from errors
    if (event.message) {
      event.message = event.message.replace(/\d{9,}/g, '[REDACTED]')
    }
    return event
  }
})
```

---

## Production Checklist

Before deploying to production:

### Pre-deployment
- [ ] Run full test suite (`pnpm test`, `pnpm test:e2e`)
- [ ] Build succeeds without errors (`pnpm build`)
- [ ] No TypeScript errors (`pnpm tsc --noEmit`)
- [ ] No linting errors (`pnpm lint`)
- [ ] Test production build locally (`pnpm preview`)
- [ ] Load and export 100+ DICOM files successfully
- [ ] Verify privacy: patient data not in filenames
- [ ] Check bundle size (<500 KB gzipped)
- [ ] Run Lighthouse audit (scores 90+)

### Deployment
- [ ] HTTPS enabled (TLS 1.2+)
- [ ] Correct caching headers configured
- [ ] SPA routing configured (rewrites to index.html)
- [ ] CORS headers if needed
- [ ] Security headers (X-Frame-Options, CSP, etc.)

### Post-deployment
- [ ] Smoke test on production URL
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test on different devices (desktop, tablet)
- [ ] Verify no mixed content warnings (HTTP resources on HTTPS)
- [ ] Check browser console for errors
- [ ] Monitor error rates (if tracking implemented)

### HIPAA-specific (if applicable)
- [ ] Platform has BAA in place
- [ ] Access controls configured
- [ ] Audit logging enabled
- [ ] Privacy policy updated
- [ ] User training completed
- [ ] Incident response plan documented

---

## Support

**Technical issues:**
- Check `TROUBLESHOOTING.md` (if exists)
- Review GitHub issues
- Open new issue with reproduction steps

**Security concerns:**
- Report via security@yourcompany.com
- Do not disclose publicly

**HIPAA questions:**
- Consult with compliance officer
- Review with legal team

---

**For development workflow, see `CONTRIBUTING.md`**
**For testing procedures, see `TESTING.md`**
**For API documentation, see `docs/API.md`**
