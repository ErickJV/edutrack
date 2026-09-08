import { useContext } from 'react'
import { ThemeContext, DEFAULT_THEME_CONTEXT, type ThemeContextType } from './ThemeContext'

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  return context || DEFAULT_THEME_CONTEXT
}
