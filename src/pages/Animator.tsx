import { useEffect, useRef } from 'react'
import { KeyframeMaker } from '../components/KeyframeMaker'

export function Animator() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const keyframeMaker = new KeyframeMaker(containerRef.current)
    keyframeMaker.animate()

    return () => {
      keyframeMaker.dispose()
    }
  }, [])

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100vw', 
        height: '100vh', 
        overflow: 'hidden' 
      }}
    />
  )
} 