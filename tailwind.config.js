/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Design tokens backed by CSS variables (see src/index.css). `accent`
        // follows the OS accent color; semantic colors are a fixed palette.
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        warning: 'var(--warning)',
        error: 'var(--error)',
        success: 'var(--success)',
        // Radiology-optimized dark theme colors
        'radiology': {
          'bg': '#0a0a0a',
          'panel': '#1a1a1a',
          'border': '#2a2a2a',
          'text': '#e5e5e5',
          'text-dim': '#9ca3af',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
