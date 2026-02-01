/**
 * Unit tests for useErrorHandler hook
 *
 * Tests error handling utilities including:
 * - Error message formatting
 * - Error severity levels
 * - Async error handling
 * - Error store integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useErrorHandler } from './useErrorHandler'
import { useErrorStore } from '@/stores/errorStore'

describe('useErrorHandler', () => {
  beforeEach(() => {
    // Clear error store before each test
    useErrorStore.getState().clearErrors()
  })

  describe('handleError', () => {
    it('should handle Error objects', () => {
      const { result } = renderHook(() => useErrorHandler())
      const error = new Error('Test error message')

      act(() => {
        result.current.handleError(error, 'TestContext')
      })

      const errors = useErrorStore.getState().errors
      expect(errors).toHaveLength(1)
      expect(errors[0].message).toBe('Test error message')
      expect(errors[0].context).toBe('TestContext')
      expect(errors[0].severity).toBe('error')
    })

    it('should handle string errors', () => {
      const { result } = renderHook(() => useErrorHandler())

      act(() => {
        result.current.handleError('String error', 'TestContext')
      })

      const errors = useErrorStore.getState().errors
      expect(errors).toHaveLength(1)
      expect(errors[0].message).toBe('String error')
      expect(errors[0].context).toBe('TestContext')
    })

    it('should support different severity levels', () => {
      const { result } = renderHook(() => useErrorHandler())

      act(() => {
        result.current.handleError('Warning message', 'TestContext', 'warning')
      })

      const errors = useErrorStore.getState().errors
      expect(errors[0].severity).toBe('warning')
    })

    it('should support info severity', () => {
      const { result } = renderHook(() => useErrorHandler())

      act(() => {
        result.current.handleError('Info message', 'TestContext', 'info')
      })

      const errors = useErrorStore.getState().errors
      expect(errors[0].severity).toBe('info')
    })

    it('should log errors to console', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { result } = renderHook(() => useErrorHandler())
      const error = new Error('Test error')

      act(() => {
        result.current.handleError(error, 'TestContext')
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith('[TestContext]', error)
      consoleErrorSpy.mockRestore()
    })
  })

  describe('handleAsync', () => {
    it('should execute successful async function', async () => {
      const { result } = renderHook(() => useErrorHandler())
      const asyncFn = vi.fn().mockResolvedValue('success')

      let returnValue: string | null = null
      await act(async () => {
        returnValue = await result.current.handleAsync(asyncFn, 'TestContext')
      })

      expect(asyncFn).toHaveBeenCalled()
      expect(returnValue).toBe('success')
      expect(useErrorStore.getState().errors).toHaveLength(0)
    })

    it('should catch and handle async errors', async () => {
      const { result } = renderHook(() => useErrorHandler())
      const error = new Error('Async error')
      const asyncFn = vi.fn().mockRejectedValue(error)

      let returnValue: string | null | undefined
      await act(async () => {
        returnValue = await result.current.handleAsync(asyncFn, 'TestContext')
      })

      expect(asyncFn).toHaveBeenCalled()
      expect(returnValue).toBeNull()

      const errors = useErrorStore.getState().errors
      expect(errors).toHaveLength(1)
      expect(errors[0].message).toBe('Async error')
      expect(errors[0].context).toBe('TestContext')
    })

    it('should return typed result on success', async () => {
      const { result } = renderHook(() => useErrorHandler())
      const asyncFn = vi.fn().mockResolvedValue({ data: 'test' })

      let returnValue: { data: string } | null = null
      await act(async () => {
        returnValue = await result.current.handleAsync(asyncFn, 'TestContext')
      })

      expect(returnValue).toEqual({ data: 'test' })
    })
  })

  describe('hook stability', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useErrorHandler())
      const firstHandleError = result.current.handleError
      const firstHandleAsync = result.current.handleAsync

      rerender()

      expect(result.current.handleError).toBe(firstHandleError)
      expect(result.current.handleAsync).toBe(firstHandleAsync)
    })
  })

  describe('error store integration', () => {
    it('should add multiple errors to store', () => {
      const { result } = renderHook(() => useErrorHandler())

      act(() => {
        result.current.handleError('Error 1', 'Context1')
        result.current.handleError('Error 2', 'Context2')
        result.current.handleError('Error 3', 'Context3')
      })

      const errors = useErrorStore.getState().errors
      expect(errors).toHaveLength(3)
      expect(errors[0].message).toBe('Error 1')
      expect(errors[1].message).toBe('Error 2')
      expect(errors[2].message).toBe('Error 3')
    })

    it('should create unique error IDs', () => {
      const { result } = renderHook(() => useErrorHandler())

      act(() => {
        result.current.handleError('Error 1', 'Context')
        result.current.handleError('Error 2', 'Context')
      })

      const errors = useErrorStore.getState().errors
      expect(errors[0].id).not.toBe(errors[1].id)
    })

    it('should include timestamp in errors', () => {
      const { result } = renderHook(() => useErrorHandler())
      const beforeTimestamp = Date.now()

      act(() => {
        result.current.handleError('Error', 'Context')
      })

      const afterTimestamp = Date.now()
      const error = useErrorStore.getState().errors[0]

      expect(error.timestamp).toBeGreaterThanOrEqual(beforeTimestamp)
      expect(error.timestamp).toBeLessThanOrEqual(afterTimestamp)
    })
  })
})
