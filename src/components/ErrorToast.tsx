import { X, AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'
import { useErrorStore, AppError } from '../stores/errorStore'

export function ErrorToast() {
  const errors = useErrorStore((s) => s.errors)
  const removeError = useErrorStore((s) => s.removeError)

  if (errors.length === 0) return null

  const getSeverityStyles = (severity: AppError['severity']) => {
    const baseStyles = 'border-l-4'
    switch (severity) {
      case 'error':
        return `${baseStyles} border-red-500 bg-red-50 dark:bg-red-950/50`
      case 'warning':
        return `${baseStyles} border-amber-500 bg-amber-50 dark:bg-amber-950/50`
      case 'info':
        return `${baseStyles} border-blue-500 bg-blue-50 dark:bg-blue-950/50`
      case 'success':
        return `${baseStyles} border-green-500 bg-green-50 dark:bg-green-950/50`
    }
  }

  const getSeverityIcon = (severity: AppError['severity']) => {
    const iconClass = 'w-5 h-5'
    switch (severity) {
      case 'error':
        return <AlertCircle className={`${iconClass} text-red-600 dark:text-red-400`} />
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-amber-600 dark:text-amber-400`} />
      case 'info':
        return <Info className={`${iconClass} text-blue-600 dark:text-blue-400`} />
      case 'success':
        return <CheckCircle2 className={`${iconClass} text-green-600 dark:text-green-400`} />
    }
  }

  const getSeverityTextColor = (severity: AppError['severity']) => {
    switch (severity) {
      case 'error':
        return 'text-red-900 dark:text-red-100'
      case 'warning':
        return 'text-amber-900 dark:text-amber-100'
      case 'info':
        return 'text-blue-900 dark:text-blue-100'
      case 'success':
        return 'text-green-900 dark:text-green-100'
    }
  }

  return (
    <div role="alert" aria-live="assertive" className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {errors.map((error) => (
        <div
          key={error.id}
          className={`${getSeverityStyles(error.severity)} shadow-lg rounded-lg p-4 flex items-start gap-3 animate-slide-in`}
        >
          <div className="flex-shrink-0 mt-0.5">{getSeverityIcon(error.severity)}</div>

          <div className="flex-1 min-w-0">
            <div className={`font-medium text-sm ${getSeverityTextColor(error.severity)}`}>
              {error.context}
            </div>
            <div
              className={`text-sm mt-1 ${getSeverityTextColor(error.severity)} opacity-90`}
            >
              {error.message}
            </div>
          </div>

          <button
            onClick={() => removeError(error.id)}
            className={`flex-shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${getSeverityTextColor(error.severity)} opacity-70 hover:opacity-100`}
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
