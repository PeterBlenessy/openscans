import { useEffect } from 'react'

interface KeyboardShortcutsHelpProps {
  show: boolean
  onClose: () => void
}

export function KeyboardShortcutsHelp({ show, onClose }: KeyboardShortcutsHelpProps) {
  // Close on Escape key
  useEffect(() => {
    if (!show) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [show, onClose])

  if (!show) return null

  const shortcuts = [
    { category: 'Navigation', items: [
      { keys: ['←', '↑'], description: 'Previous image' },
      { keys: ['→', '↓'], description: 'Next image' },
      { keys: ['Cmd/Ctrl', '↑'], description: 'First image' },
      { keys: ['Cmd/Ctrl', '↓'], description: 'Last image' },
      { keys: ['Alt/Opt', '←'], description: 'Jump back 10 images' },
      { keys: ['Alt/Opt', '→'], description: 'Jump forward 10 images' },
    ]},
    { category: 'Viewport', items: [
      { keys: ['R'], description: 'Reset viewport settings' },
      { keys: ['I'], description: 'Invert image colors' },
    ]},
    { category: 'Tools', items: [
      { keys: ['Drag'], description: 'Adjust contrast/brightness' },
      { keys: ['Ctrl/Cmd + Drag'], description: 'Pan image' },
      { keys: ['Scroll Wheel'], description: 'Zoom in/out' },
    ]},
    { category: 'Help', items: [
      { keys: ['?'], description: 'Toggle this help' },
    ]},
  ]

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1a] rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto border border-[#2a2a2a]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-100">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-100 text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="text-lg font-semibold text-blue-400 mb-3">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-300">{item.description}</span>
                    <div className="flex gap-1">
                      {item.keys.map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className="px-2 py-1 bg-[#0f0f0f] text-gray-100 rounded text-sm font-mono border border-[#2a2a2a]"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
