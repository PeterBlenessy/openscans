import { useState, useEffect } from 'react'
import { useStudyStore } from '@/stores/studyStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { DicomStudy, DicomSeries } from '@/types'
import { formatSeriesDescription } from '@/lib/utils/formatSeriesDescription'
import { themeClasses } from '@/lib/utils'
import { EmptyState } from '@/components/ui'

export function StudySeriesBrowser() {
  const studies = useStudyStore((state) => state.studies)
  const currentStudy = useStudyStore((state) => state.currentStudy)
  const currentSeries = useStudyStore((state) => state.currentSeries)
  const setCurrentSeries = useStudyStore((state) => state.setCurrentSeries)

  // Track which studies are expanded (only current study expanded by default)
  const [expandedStudies, setExpandedStudies] = useState<Set<string>>(new Set())

  // Auto-expand only the current study when it changes
  useEffect(() => {
    if (currentStudy) {
      setExpandedStudies(new Set([currentStudy.studyInstanceUID]))
    }
  }, [currentStudy])

  const toggleStudy = (studyUID: string) => {
    setExpandedStudies(prev => {
      const next = new Set(prev)
      if (next.has(studyUID)) {
        next.delete(studyUID)
      } else {
        next.add(studyUID)
      }
      return next
    })
  }

  const handleSeriesClick = (seriesUID: string) => {
    setCurrentSeries(seriesUID)
  }

  if (studies.length === 0) {
    return <EmptyState title="No DICOM files loaded" className="py-8" />
  }

  return (
    <div className="space-y-2">
      {studies.map((study) => (
        <StudyItem
          key={study.studyInstanceUID}
          study={study}
          isExpanded={expandedStudies.has(study.studyInstanceUID)}
          onToggle={() => toggleStudy(study.studyInstanceUID)}
          currentSeriesUID={currentSeries?.seriesInstanceUID}
          onSeriesClick={handleSeriesClick}
        />
      ))}
    </div>
  )
}

interface StudyItemProps {
  study: DicomStudy
  isExpanded: boolean
  onToggle: () => void
  currentSeriesUID?: string
  onSeriesClick: (seriesUID: string) => void
}

function StudyItem({ study, isExpanded, onToggle, currentSeriesUID, onSeriesClick }: StudyItemProps) {
  const hidePersonalInfo = useSettingsStore((state) => state.hidePersonalInfo)
  const theme = useSettingsStore((state) => state.theme)

  return (
    <div className={`border rounded ${themeClasses.border(theme)} ${themeClasses.bgSecondary(theme)}`}>
      {/* Study Header */}
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        className={`w-full px-3 py-2 flex items-start gap-2 ${themeClasses.hoverBg(theme)} transition-colors text-left`}
      >
        <span aria-hidden="true" className={`mt-0.5 flex-shrink-0 ${themeClasses.textSecondary(theme)}`}>
          {isExpanded ? '▼' : '▶'}
        </span>
        <div className="flex-1 min-w-0">
          {!hidePersonalInfo && (
            <div className={`font-medium text-sm truncate ${themeClasses.text(theme)}`}>
              {study.patientName || 'Unknown Patient'}
            </div>
          )}
          <div className={`text-xs truncate ${themeClasses.textSecondary(theme)}`}>
            {hidePersonalInfo ? study.studyDate : `${study.patientID} • ${study.studyDate}`}
          </div>
          {study.studyDescription && (
            <div className={`text-xs truncate ${themeClasses.textTertiary(theme)}`}>
              {study.studyDescription}
            </div>
          )}
        </div>
      </button>

      {/* Series List */}
      {isExpanded && (
        <div className={`border-t ${themeClasses.border(theme)}`}>
          {study.series.map((series) => (
            <SeriesItem
              key={series.seriesInstanceUID}
              series={series}
              isSelected={series.seriesInstanceUID === currentSeriesUID}
              onClick={() => onSeriesClick(series.seriesInstanceUID)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface SeriesItemProps {
  series: DicomSeries
  isSelected: boolean
  onClick: () => void
}

function SeriesItem({ series, isSelected, onClick }: SeriesItemProps) {
  const theme = useSettingsStore((state) => state.theme)
  return (
    <button
      onClick={onClick}
      aria-current={isSelected ? 'true' : undefined}
      className={`w-full px-3 py-2 pl-8 text-left transition-colors ${
        isSelected
          ? `${themeClasses.bgActive(theme)} border ${themeClasses.border(theme)}`
          : `border border-transparent ${themeClasses.hoverBg(theme)}`
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className={`text-sm truncate ${themeClasses.text(theme)}`}>
            {formatSeriesDescription(series.seriesDescription) || `Series ${series.seriesNumber}`}
          </div>
          <div className={`text-xs ${themeClasses.textSecondary(theme)}`}>
            {series.modality} • {series.instances.length} {series.instances.length === 1 ? 'image' : 'images'}
          </div>
        </div>
      </div>
    </button>
  )
}
