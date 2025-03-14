import { useEffect, useRef, useState } from 'react'
import { AsciiScene } from '../components/AsciiScene'
import styles from './Profile.module.css'
import { ProjectWindow } from '../components/ProjectWindow'
type CharacterStyle = 'regular' | 'italic' | 'underline' | 'bold' | 'done'

interface StyledChar {
  char: string
  style: CharacterStyle
}

export function Profile() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [doneScrolling, setDoneScrolling] = useState(false)
  const [displayProjects, setDisplayProjects] = useState(false)
  const [renderedLabel, setRenderedLabel] = useState<StyledChar[]>(
    '░▓▒░▒ ▓░▓▒░▓▓░ ▒░ ▒░░▓▒▓░▒░▒▓'.split('').map(char => ({ char, style: 'regular' }))
  )

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new AsciiScene(containerRef.current, {
      onDoneScrolling: () => {
        setDoneScrolling(true)
      }
    })
    scene.animate()

    return () => {
      scene.dispose()
    }
  }, [])

  useEffect(() => {
    if (!doneScrolling) return

    const namecrypted = '░▓▒░▒ ▓░▓▒░▓▓░ ▒░ ▒░░▓▒▓░▒░▒▓'.split('').map(char => ({ char, style: 'regular' as CharacterStyle }))
    const namealphanumeric = '13215 90147567 05 197749462336'.split('')
    const namenormal = 'LEWIS POLANSKY OS INITIALIZED'.split('')

    let current = [...namecrypted]
    let animatingIndices = new Set<number>()

    // Create array of indices and shuffle them
    const indices = Array.from({ length: namenormal.length }, (_, i) => i)
    const shuffleArray = (array: number[]) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]
      }
      return array
    }

    const getRandomStyle = (): CharacterStyle => {
      const styles: CharacterStyle[] = ['regular', 'italic', 'underline']
      return styles[Math.floor(Math.random() * styles.length)]
    }

    const updateText = () => {
      // Get available indices (not currently animating)
      const availableIndices = indices.filter(i => !animatingIndices.has(i) && current[i].char !== namenormal[i])
      if (availableIndices.length === 0) {
        // All animations are complete, trigger projects display
        setTimeout(() => setDisplayProjects(true), 500)
        return
      }

      const batchSize = Math.min(Math.floor(Math.random() * 2) + 1, availableIndices.length)
      const shuffledIndices = shuffleArray([...availableIndices])
      const batch = shuffledIndices.slice(0, batchSize)

      batch.forEach(index => animatingIndices.add(index))

      batch.forEach((index, i) => {
        setTimeout(() => {
          // First transition to symbols with random style
          current[index] = { char: namealphanumeric[index], style: getRandomStyle() }
          setRenderedLabel([...current])

          // Second transition to final letter with bold style
          setTimeout(() => {
            current[index] = { char: namenormal[index], style: 'done' }
            setRenderedLabel([...current])
            animatingIndices.delete(index)
          }, Math.random() * 67 + 133)
        }, i * 67 + Math.random() * 33)
      })

      if (availableIndices.length > batchSize) {
        setTimeout(updateText, Math.random() * 267 + 200)
      }
    }

    for (let i = 0; i < 2; i++) {
      setTimeout(updateText, i * 333)
    }
  }, [doneScrolling])

  useEffect(() => {
    if (!displayProjects) return

    // considering what to do here...


  }, [displayProjects])

  const getStyleClass = (style: CharacterStyle): string => {
    switch (style) {
      case 'italic': return styles.charItalic
      case 'underline': return styles.charUnderline
      case 'bold': return styles.charBold
      case 'done': return styles.charDone
      default: return styles.charRegular
    }
  }

  return (
    <div className={styles.profileContainer}>
      <div
        ref={containerRef}
        className={styles.sceneContainer}
      />
      {!doneScrolling && (
        <>
          <pre
            id="ascii-progress"
            className={styles.progressText}
          >
            Scroll: [  0%] [--------------------]
          </pre>
          <button
            className={styles.advanceButton}
            onClick={() => {
              const event = new KeyboardEvent('keydown', { code: 'Space' });
              window.dispatchEvent(event);
            }}
          >
            [Press Here]
          </button>
        </>
      )}
      {doneScrolling && (
        <pre className={styles.labelText}>
          {renderedLabel.map((char, index) => (
            <span
              key={index}
              className={`${styles.charSpan} ${getStyleClass(char.style)}`}
            >
              {char.char}
            </span>
          ))}
        </pre>
      )}
      {displayProjects && (
        <>
          <ProjectWindow 
            title="CaptainAI.exe" 
            initialPosition={{ x: 80, y: 60 }}
          >
            <div className={styles.projectWindowContent}>
              <h1>An AI Copilot for CFOs</h1>
              <p>
                <a href="https://v0-captain-mu.vercel.app/" target="_blank" rel="noopener noreferrer">Captain</a> is an AI copilot for CFOs. It helps you understand your data and make better decisions.
              </p>
              <button onClick={() => window.open('https://v0-captain-mu.vercel.app/', '_blank')}>Learn More</button>
            </div>
          </ProjectWindow>

          <ProjectWindow 
            title="AiCodeChecker.exe" 
            initialPosition={{ x: window.innerWidth - 460, y: 80 }}
          >
            <div className={styles.projectWindowContent}>
              <h1>Checkmate ChatGPT</h1>
              <p>
                <a href="https://aicode.fail" target="_blank" rel="noopener noreferrer">AiCode.fail</a> checks code for errors. You can now verify AI-generated code rapidly.
              </p>
              <button onClick={() => window.open('https://aicode.fail', '_blank')}>Learn More</button>
            </div>
          </ProjectWindow>

          <ProjectWindow 
            title="CyberSpace.exe" 
            initialPosition={{ x: 190, y: 320 }}
          >
            <div className={styles.projectWindowContent}>
              <h1>Enter CyberSpace</h1>
              <p>
                <a href="https://cyberspaceclub.wordpress.com/" target="_blank" rel="noopener noreferrer">CyberSpace</a> is a cybersecurity club I founded in 2020. Through lessons, guest speakers, and hacking competitions, we aim to make cybersecurity accessible to everyone.
              </p>
              <button onClick={() => window.open('https://cyberspaceclub.wordpress.com/', '_blank')}>Learn More</button>
            </div>
          </ProjectWindow>
        </>
      )}
    </div>
  )
} 