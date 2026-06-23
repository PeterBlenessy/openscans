import { useViewportStore } from '@/stores/viewportStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { themeClasses } from '@/lib/utils'
import { Tooltip } from '@/components/ui'

export function ImagePresets() {
  const setWindowLevel = useViewportStore((state) => state.setWindowLevel)
  const resetSettings = useViewportStore((state) => state.resetSettings)
  const theme = useSettingsStore((state) => state.theme)

  const presets = [
    {
      name: 'Soft Tissue',
      contrast: 400,
      brightness: 40,
      description: 'General soft tissue imaging'
    },
    {
      name: 'Lung',
      contrast: 1500,
      brightness: -600,
      description: 'Lung parenchyma'
    },
    {
      name: 'Bone',
      contrast: 2500,
      brightness: 480,
      description: 'Bone structures'
    },
    {
      name: 'Brain',
      contrast: 80,
      brightness: 40,
      description: 'Brain tissue'
    },
    {
      name: 'Liver',
      contrast: 150,
      brightness: 30,
      description: 'Liver parenchyma'
    },
    {
      name: 'Abdomen',
      contrast: 350,
      brightness: 40,
      description: 'General abdomen'
    }
  ]

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {presets.map((preset) => (
          <Tooltip
            key={preset.name}
            label={<>{preset.description}<br />Contrast: {preset.contrast}, Brightness: {preset.brightness}</>}
          >
          <button
            onClick={() => setWindowLevel(preset.brightness, preset.contrast)}
            className={`px-3 py-2 rounded text-xs text-left transition-colors border ${themeClasses.bgSecondary(theme)} ${themeClasses.hoverBg(theme)} ${themeClasses.border(theme)} ${themeClasses.hoverBorder(theme)}`}
            aria-label={`${preset.name}: ${preset.description}`}
          >
            <div className={`font-medium ${themeClasses.text(theme)}`}>{preset.name}</div>
            <div className={`text-[10px] ${themeClasses.textSecondary(theme)}`}>
              C:{preset.contrast} B:{preset.brightness}
            </div>
          </button>
          </Tooltip>
        ))}
      </div>
      <Tooltip label="Reset to DICOM metadata or modality defaults">
      <button
        onClick={resetSettings}
        className={`w-full px-3 py-2 rounded text-xs font-medium transition-colors ${themeClasses.bgActive(theme)} ${themeClasses.text(theme)} ${themeClasses.hoverBgSecondary(theme)}`}
      >
        Reset to Default
      </button>
      </Tooltip>
    </div>
  )
}
