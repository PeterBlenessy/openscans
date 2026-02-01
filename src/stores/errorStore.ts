import { create } from 'zustand'

export interface AppError {
  id: string
  message: string
  context: string
  timestamp: number
  severity: 'error' | 'warning' | 'info'
}

interface ErrorState {
  errors: AppError[]
  addError: (error: Omit<AppError, 'id' | 'timestamp'>) => void
  removeError: (id: string) => void
  clearErrors: () => void
}

export const useErrorStore = create<ErrorState>((set) => ({
  errors: [],

  addError: (error) => {
    const newError: AppError = {
      ...error,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    }
    set((state) => ({
      errors: [...state.errors, newError],
    }))

    // Auto-remove after 5 seconds
    setTimeout(() => {
      set((state) => ({
        errors: state.errors.filter((e) => e.id !== newError.id),
      }))
    }, 5000)
  },

  removeError: (id) =>
    set((state) => ({
      errors: state.errors.filter((e) => e.id !== id),
    })),

  clearErrors: () => set({ errors: [] }),
}))
