import { useCallback } from 'react'
import { useErrorStore } from '../stores/errorStore'

/**
 * Hook for consistent error handling across the application.
 * Provides utilities to handle errors with visual feedback and logging.
 *
 * @example
 * ```tsx
 * const { handleError, handleAsync } = useErrorHandler()
 *
 * // Handle synchronous errors
 * try {
 *   // risky operation
 * } catch (error) {
 *   handleError(error, 'MyComponent')
 * }
 *
 * // Handle async operations automatically
 * const result = await handleAsync(async () => {
 *   return await loadStudy()
 * }, 'StudyLoader')
 * ```
 */
export function useErrorHandler() {
  const addError = useErrorStore((s) => s.addError)

  /**
   * Handle an error with visual feedback and logging.
   *
   * @param error - Error object or string message
   * @param context - Context where error occurred (e.g., component name)
   * @param severity - Severity level for visual styling
   */
  const handleError = useCallback(
    (
      error: Error | string,
      context: string,
      severity: 'error' | 'warning' | 'info' = 'error'
    ) => {
      const message = error instanceof Error ? error.message : error
      console.error(`[${context}]`, error)

      addError({
        message,
        context,
        severity,
      })
    },
    [addError]
  )

  /**
   * Wrap an async function with automatic error handling.
   * Returns null on error, otherwise returns the function's result.
   *
   * @param fn - Async function to execute
   * @param context - Context for error reporting
   * @returns Function result or null on error
   */
  const handleAsync = useCallback(
    async <T>(fn: () => Promise<T>, context: string): Promise<T | null> => {
      try {
        return await fn()
      } catch (error) {
        handleError(error as Error, context)
        return null
      }
    },
    [handleError]
  )

  return { handleError, handleAsync }
}
