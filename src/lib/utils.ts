import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDicomDate(date: string): string {
  if (!date || date.length !== 8) return date
  const year = date.substring(0, 4)
  const month = date.substring(4, 6)
  const day = date.substring(6, 8)
  return `${year}-${month}-${day}`
}

export function formatDicomTime(time: string): string {
  if (!time || time.length < 6) return time
  const hours = time.substring(0, 2)
  const minutes = time.substring(2, 4)
  const seconds = time.substring(4, 6)
  return `${hours}:${minutes}:${seconds}`
}

export function formatPatientName(name: string): string {
  if (!name) return 'Unknown'
  // DICOM names are formatted as "LastName^FirstName^MiddleName"
  const parts = name.split('^')
  if (parts.length >= 2) {
    return `${parts[1]} ${parts[0]}`
  }
  return name
}

/**
 * Theme-aware utility functions for consistent styling across components.
 * Eliminates repetitive ternary expressions like `theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'`
 */
export const themeClasses = {
  // Background colors
  bg: (theme: 'light' | 'dark') => theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white',
  bgPrimary: (theme: 'light' | 'dark') => theme === 'dark' ? 'bg-black' : 'bg-gray-100',
  bgSecondary: (theme: 'light' | 'dark') => theme === 'dark' ? 'bg-[#0f0f0f]' : 'bg-gray-100',
  bgTertiary: (theme: 'light' | 'dark') => theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50',
  bgActive: (theme: 'light' | 'dark') => theme === 'dark' ? 'bg-[#2a2a2a]' : 'bg-gray-300',

  // Text colors
  text: (theme: 'light' | 'dark') => theme === 'dark' ? 'text-white' : 'text-gray-900',
  textSecondary: (theme: 'light' | 'dark') => theme === 'dark' ? 'text-gray-400' : 'text-gray-500',
  textTertiary: (theme: 'light' | 'dark') => theme === 'dark' ? 'text-gray-500' : 'text-gray-400',
  textMuted: (theme: 'light' | 'dark') => theme === 'dark' ? 'text-gray-600' : 'text-gray-300',

  // Border colors
  border: (theme: 'light' | 'dark') => theme === 'dark' ? 'border-[#2a2a2a]' : 'border-gray-200',
  borderSecondary: (theme: 'light' | 'dark') => theme === 'dark' ? 'border-[#2a2a2a]' : 'border-gray-300',

  // Hover states
  hoverBg: (theme: 'light' | 'dark') => theme === 'dark' ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-200',
  hoverBgSecondary: (theme: 'light' | 'dark') => theme === 'dark' ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100',
  hoverBgTertiary: (theme: 'light' | 'dark') => theme === 'dark' ? 'hover:bg-[#0f0f0f]' : 'hover:bg-gray-50',
  hoverText: (theme: 'light' | 'dark') => theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900',
  hoverBorder: (theme: 'light' | 'dark') => theme === 'dark' ? 'hover:border-[#3a3a3a]' : 'hover:border-gray-300',

  // Separator/divider
  divider: (theme: 'light' | 'dark') => theme === 'dark' ? 'bg-[#2a2a2a]' : 'bg-gray-300',
}

/**
 * Combined utility for commonly used theme-aware class combinations
 */
export const themeUtils = {
  /** Card/panel background with border and text */
  card: (theme: 'light' | 'dark') =>
    `${themeClasses.bg(theme)} ${themeClasses.border(theme)} ${themeClasses.text(theme)}`,

  /** Interactive element with hover state */
  interactive: (theme: 'light' | 'dark') =>
    `${themeClasses.hoverBgSecondary(theme)} transition-colors`,

  /** Button/toggle in active state */
  activeButton: (theme: 'light' | 'dark', isActive: boolean) =>
    isActive
      ? `${themeClasses.bgActive(theme)} ${themeClasses.text(theme)}`
      : `${themeClasses.hoverBg(theme)} ${themeClasses.textSecondary(theme)}`,
}
