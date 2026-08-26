import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({
  theme: 'dark',
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
})

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('theme') || localStorage.getItem('app-theme')
      if (saved === 'light' || saved === 'dark') {
        return saved
      }
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
      }
    } catch {
      // fallback
    }
    return 'dark'
  })

  const applyTheme = (newTheme) => {
    const root = document.documentElement
    root.setAttribute('data-theme', newTheme)
    root.classList.remove('dark', 'light')
    root.classList.add(newTheme)
    root.style.colorScheme = newTheme
  }

  const setTheme = (newTheme) => {
    if (newTheme !== 'dark' && newTheme !== 'light') return
    setThemeState(newTheme)
    try {
      localStorage.setItem('theme', newTheme)
      localStorage.setItem('app-theme', newTheme)
    } catch {}
    applyTheme(newTheme)
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Listen for system theme changes if user hasn't explicitly set localStorage override
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
    const handleChange = (e) => {
      const saved = localStorage.getItem('theme') || localStorage.getItem('app-theme')
      if (!saved) {
        const sysTheme = e.matches ? 'light' : 'dark'
        setThemeState(sysTheme)
        applyTheme(sysTheme)
      }
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export default ThemeContext
