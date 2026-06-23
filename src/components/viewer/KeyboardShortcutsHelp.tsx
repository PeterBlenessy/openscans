import { useSettingsStore } from '@/stores/settingsStore'
import { themeClasses } from '@/lib/utils'
import { Modal } from '@/components/ui'

interface KeyboardShortcutsHelpProps {
  show: boolean
  onClose: () => void
}

export function KeyboardShortcutsHelp({ show, onClose }: KeyboardShortcutsHelpProps) {
  const theme = useSettingsStore((s) => s.theme)
  const shortcuts = [
    { category: 'Navigation', items: [
      { keys: ['←', '↑'], description: 'Previous image' },
      { keys: ['→', '↓'], description: 'Next image' },
      { keys: ['Cmd/Ctrl', '↑'], description: 'First image' },
      { keys: ['Cmd/Ctrl', '↓'], description: 'Last image' },
      { keys: ['Alt/Opt', '←'], description: 'Jump back 10' },
      { keys: ['Alt/Opt', '→'], description: 'Jump forward 10' },
    ]},
    { category: 'Viewport', items: [
      { keys: ['Drag'], description: 'Window/Level' },
      { keys: ['Cmd/Ctrl', 'Drag'], description: 'Pan' },
      { keys: ['Scroll'], description: 'Zoom' },
      { keys: ['R'], description: 'Reset viewport' },
      { keys: ['I'], description: 'Invert colors' },
      { keys: ['Shift', 'F'], description: 'Toggle full screen' },
    ]},
    { category: 'Cine', items: [
      { keys: ['Space'], description: 'Play / pause cine loop' },
      { keys: ['+'], description: 'Increase frame rate' },
      { keys: ['-'], description: 'Decrease frame rate' },
    ]},
    { category: 'Measurements', items: [
      { keys: ['L'], description: 'Distance / ruler tool' },
      { keys: ['Shift', 'A'], description: 'Angle tool' },
    ]},
    { category: 'Annotations & AI', items: [
      { keys: ['A'], description: 'Toggle annotations' },
      { keys: ['F'], description: 'Toggle favorite' },
      { keys: ['M'], description: 'AI detection' },
      { keys: ['N'], description: 'AI analysis' },
    ]},
    { category: 'Help', items: [
      { keys: ['?'], description: 'Toggle this help' },
    ]},
  ]

  return (
    <Modal show={show} onClose={onClose} title="Keyboard Shortcuts" maxWidth="max-w-2xl">
      <div className="space-y-4">
        {shortcuts.map((section) => (
          <div key={section.category}>
            <h3 className={`text-xs font-medium uppercase tracking-wider mb-2 ${themeClasses.textSecondary(theme)}`}>
              {section.category}
            </h3>
            <div className="space-y-2">
              {section.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between gap-4">
                  <span className={`text-sm ${themeClasses.text(theme)}`}>{item.description}</span>
                  <div className="flex gap-1 flex-shrink-0">
                    {item.keys.map((key, keyIndex) => (
                      <kbd
                        key={keyIndex}
                        className={`px-1.5 py-0.5 rounded text-xs font-mono border ${themeClasses.bgSecondary(theme)} ${themeClasses.border(theme)} ${themeClasses.text(theme)}`}
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
    </Modal>
  )
}
