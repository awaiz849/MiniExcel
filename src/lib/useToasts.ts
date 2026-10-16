import { useCallback, useState } from 'react'
import type { Toast } from '../types.ts'

let nextId = 1

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    const id = nextId++
    setToasts((current) => [...current, { id, message, tone }])
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 2500)
  }, [])

  return { toasts, showToast }
}
