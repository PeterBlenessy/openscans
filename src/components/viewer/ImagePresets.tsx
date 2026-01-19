import { useViewportStore } from '@/stores/viewportStore'

export function ImagePresets() {
  const setWindowLevel = useViewportStore((state) => state.setWindowLevel)

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
      <h3 className="text-sm font-semibold text-gray-400">Image Presets</h3>
      <div className="grid grid-cols-2 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => setWindowLevel(preset.brightness, preset.contrast)}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-left transition-colors"
            title={`${preset.description}\nContrast: ${preset.contrast}, Brightness: ${preset.brightness}`}
          >
            <div className="font-medium text-white">{preset.name}</div>
            <div className="text-[10px] text-gray-400">
              C:{preset.contrast} B:{preset.brightness}
            </div>
          </button>
        ))}
      </div>
      <button
        onClick={() => setWindowLevel(40, 400)}
        className="w-full px-3 py-2 bg-blue-700 hover:bg-blue-600 rounded text-xs font-medium transition-colors"
      >
        Reset to Default
      </button>
    </div>
  )
}
