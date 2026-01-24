import { useState, useEffect } from 'react'
import { useStudyStore } from '@/stores/studyStore'
import { DicomStudy, DicomSeries } from '@/types'
import { formatSeriesDescription } from '@/lib/utils/formatSeriesDescription'

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
    return (
      <div className="text-gray-400 text-sm text-center py-8">
        No DICOM files loaded
      </div>
    )
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
  console.log(`StudyItem rendering: ${study.patientName}, series count: ${study.series.length}`, study.series)

  return (
    <div className="border border-[#2a2a2a] rounded bg-[#0f0f0f]/50">
      {/* Study Header */}
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 flex items-start gap-2 hover:bg-[#1a1a1a]/50 transition-colors text-left"
      >
        <span className="text-gray-400 mt-0.5 flex-shrink-0">
          {isExpanded ? '▼' : '▶'}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {study.patientName || 'Unknown Patient'}
          </div>
          <div className="text-xs text-gray-400 truncate">
            {study.patientID} • {study.studyDate}
          </div>
          {study.studyDescription && (
            <div className="text-xs text-gray-500 truncate">
              {study.studyDescription}
            </div>
          )}
        </div>
      </button>

      {/* Series List */}
      {isExpanded && (
        <div className="border-t border-[#2a2a2a]">
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
  return (
    <button
      onClick={onClick}
      className={`w-full px-3 py-2 pl-8 text-left transition-colors ${
        isSelected ? 'bg-[#2a2a2a] border border-[#3a3a3a] hover:bg-[#3a3a3a]' : 'border border-transparent hover:bg-[#1a1a1a]/50'
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="text-gray-400 text-xs mt-0.5 flex-shrink-0">📊</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm truncate">
            {formatSeriesDescription(series.seriesDescription) || `Series ${series.seriesNumber}`}
          </div>
          <div className="text-xs text-gray-400">
            {series.modality} • {series.instances.length} {series.instances.length === 1 ? 'image' : 'images'}
          </div>
        </div>
      </div>
    </button>
  )
}
