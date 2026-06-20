import './polyfills'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Dev/e2e-only: expose a window hook so WebDriver can drive the real local-AI
// path. Tree-shaken out of production builds (guarded by import.meta.env.DEV).
if (import.meta.env.DEV) {
  import('./lib/ai/e2eHook').then((m) => m.installE2EHook())
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
