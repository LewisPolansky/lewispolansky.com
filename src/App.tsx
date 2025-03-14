import { useEffect, useRef } from 'react'
import './App.css'
import { AsciiScene } from './components/AsciiScene'

function App() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new AsciiScene(containerRef.current)
    scene.animate()

    return () => {
      scene.dispose()
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

export default App
