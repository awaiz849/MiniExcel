import { useEffect, useState } from 'react'

// useState that is also written to localStorage. If storage is blocked or the saved
// value is unreadable, it falls back to `initial` and the app still works.
export function useLocalStorage<T>(key: string, initial: () => T, isValid: (value: unknown) => value is T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed: unknown = JSON.parse(stored)
        if (isValid(parsed)) return parsed
      }
    } catch {
      // Fall through to the initial value.
    }
    return initial()
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage full or blocked: keep working in memory.
    }
  }, [key, value])

  return [value, setValue] as const
}
