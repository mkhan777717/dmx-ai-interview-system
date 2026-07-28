import React, { createContext, useContext } from 'react'

// ── Aggressively purge dark class from root immediately (before React renders) ──
// This runs at module load time, not after hydration — prevents flash of dark UI.
;(function purgeDarkMode() {
  try {
    const root = document.documentElement
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
    localStorage.removeItem('app-theme')
    localStorage.removeItem('theme')
    localStorage.setItem('app-theme', 'light')
  } catch {}
})()

const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
})

export function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={{ theme: 'light', isDark: false, toggleTheme: () => {}, setTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

// No-op toggle — light mode is permanent
export function ThemeToggle() {
  return null
}
