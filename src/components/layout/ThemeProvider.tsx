import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

type Theme = 'light' | 'dark' | 'fullscreen'

const ThemeContext = createContext<Theme>('light')

export function useTheme() {
  return useContext(ThemeContext)
}

/** Détermine le thème selon la route courante */
function getThemeForRoute(pathname: string): Theme {
  if (pathname.startsWith('/workout/')) return 'fullscreen'
  if (pathname.startsWith('/profile')) return 'dark'
  if (pathname === '/stats') return 'dark'
  return 'light'
}

/** Couleur du meta theme-color selon la route (status bar iOS) */
function getThemeColor(theme: Theme, pathname: string): string {
  if (pathname === '/login') return '#fff8d0'
  if (pathname.startsWith('/onboarding')) return '#f1f4fb'
  return theme === 'light' ? '#f1f4fb' : '#0C0C0C'
}

/** Provider de thème basé sur la route — CLAUDE.md règle de thème par route */
export default function ThemeProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const theme = getThemeForRoute(location.pathname)

  // Met à jour le meta theme-color pour que la status bar iOS
  // prenne la couleur de fond de la page active
  useEffect(() => {
    const color = getThemeColor(theme, location.pathname)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', color)
    document.documentElement.style.backgroundColor = color
    document.body.style.backgroundColor = color
  }, [theme, location.pathname])

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}
