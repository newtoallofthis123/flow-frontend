import { useEffect, useRef } from 'react'

interface UseResizableOptions {
  side: 'left' | 'right'
  getCurrentWidth: () => number
  onResize: (width: number) => void
  min: number
  max: number
}

export function useResizable({ side, getCurrentWidth, onResize, min, max }: UseResizableOptions) {
  const stateRef = useRef<{ startX: number; startWidth: number } | null>(null)

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!stateRef.current) return
      const { startX, startWidth } = stateRef.current
      const delta = e.clientX - startX
      const next = side === 'right' ? startWidth + delta : startWidth - delta
      onResize(Math.max(min, Math.min(max, next)))
    }

    const handleUp = () => {
      if (!stateRef.current) return
      stateRef.current = null
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [side, onResize, min, max])

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    stateRef.current = { startX: e.clientX, startWidth: getCurrentWidth() }
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
  }

  return { onMouseDown }
}
