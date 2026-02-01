// Polyfill for vtk.js globalthis import issue
/* eslint-disable @typescript-eslint/no-explicit-any */
// vtk.js tries to import globalthis as default, but the package doesn't export it
// This ensures globalThis is available globally
if (typeof globalThis === 'undefined') {
  (window as any).globalThis = window
}
