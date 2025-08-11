import { useEffect, useRef, useState } from 'react'
import { AsciiScene } from '../components/AsciiScene'
import styles from './Profile.module.css'
import { ProjectWindow } from '../components/ProjectWindow'
import { Browser } from '../components/Browser'
import { Terminal } from '../components/Terminal'
import { Race } from '../components/Race'
import { Starbox } from '../components/Starbox'
import Dropola from '../components/Dropola'
import '@react95/icons/icons.css'
import React from 'react'

type CharacterStyle = 'regular' | 'italic' | 'underline' | 'bold' | 'done'

import aicodefaillogo from '../assets/aicodefaillogo.png'
import captainlogo from '../assets/captainlogo.png'
import cyberspacelogo from '../assets/cyberspacelogo.png'
import lewispolanskylogo from '../assets/logo.png'
import { Footer } from '../components/Footer'

interface StyledChar {
  char: string
  style: CharacterStyle
}

// Define interface for browser instance
interface BrowserInstance {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  url: string;
}

// Define interface for race instance
interface RaceInstance {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

// Define interface for starbox instance
interface StarboxInstance {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

// Define interface for dropola instance
interface DropolaInstance {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export function Profile() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [doneScrolling, setDoneScrolling] = useState(false)
  const [displayProjects, setDisplayProjects] = useState(false)
  const [renderedLabel, setRenderedLabel] = useState<StyledChar[]>(
    '----- -------- -- -----------'.split('').map(char => ({ char, style: 'regular' }))
  )
  const [browsers, setBrowsers] = useState<BrowserInstance[]>([])
  const [races, setRaces] = useState<RaceInstance[]>([])
  const [starboxes, setStarboxes] = useState<StarboxInstance[]>([])
  const [dropolaGames, setDropolaGames] = useState<DropolaInstance[]>([])
  const [terminalMessage, setTerminalMessage] = useState<string | undefined>()

  // Calculate active processes based on browsers, races, starboxes, and dropola
  const activeProcesses = React.useMemo(() => {
    const processes = [
      {
        name: "LewOS Terminal",
        count: 1, // Always one terminal
      }
    ]
    
    // Add browser processes if any
    if (browsers.length > 0) {
      processes.push({
        name: "Constellation Browser",
        count: browsers.length
      })
    }

    // Add race processes if any
    if (races.length > 0) {
      processes.push({
        name: "ASCII Racing Challenge",
        count: races.length
      })
    }

    // Add starbox processes if any
    if (starboxes.length > 0) {
      processes.push({
        name: "Starbox",
        count: starboxes.length
      })
    }
    
    // Add dropola processes if any
    if (dropolaGames.length > 0) {
      processes.push({
        name: "Dropola",
        count: dropolaGames.length
      })
    }
    
    return processes
  }, [browsers.length, races.length, starboxes.length, dropolaGames.length])

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

    const namecrypted = '----- -------- -- -----------'.split('').map(char => ({ char, style: 'regular' as CharacterStyle }))
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
        setTimeout(() => setDisplayProjects(true), 250)
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
          }, Math.random() * 33.5 + 66.5)
        }, i * 33.5 + Math.random() * 16.5)
      })

      if (availableIndices.length > batchSize) {
        setTimeout(updateText, Math.random() * 133.5 + 100)
      }
    }

    for (let i = 0; i < 2; i++) {
      setTimeout(updateText, i * 166.5)
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

  const handleBrowserClose = (id: string) => {
    setBrowsers(prev => prev.filter(browser => browser.id !== id))
    setTerminalMessage('Browser instance closed. Type "run constellation.exe" to open a new browser window.')
  }

  const handleRaceClose = (id: string) => {
    setRaces(prev => prev.filter(race => race.id !== id))
    setTerminalMessage('Racing application closed. Type "run race.exe" to open a new racing window.')
  }

  const handleStarboxClose = (id: string) => {
    setStarboxes(prev => prev.filter(starbox => starbox.id !== id))
    setTerminalMessage('Starbox game closed. Type "run starbox.exe" to open a new game window.')
  }

  const handleDropolaClose = (id: string) => {
    setDropolaGames(prev => prev.filter(game => game.id !== id))
    setTerminalMessage('Dropola game closed. Type "run dropola.exe" to open a new game window.')
  }

  const handleRunCommand = (command: string) => {
    if (command.toLowerCase() === 'constellation.exe') {
      // Create a new browser instance with a unique ID
      const newBrowser: BrowserInstance = {
        id: `browser-${Date.now()}`,
        position: { 
          x: Math.max(50, (window.innerWidth - 700) / 2 + browsers.length * 30),
          y: Math.max(50, (window.innerHeight - 550) / 2 + browsers.length * 30)
        },
        size: { width: 700, height: 550 },
        url: "https://example.com"
      }
      setBrowsers(prev => [...prev, newBrowser])
    } else if (command.toLowerCase() === 'race.exe') {
      // Create a new race instance with a unique ID
      const newRace: RaceInstance = {
        id: `race-${Date.now()}`,
        position: { 
          x: Math.max(50, (window.innerWidth - 750) / 2 + races.length * 30),
          y: Math.max(50, (window.innerHeight - 500) / 2 + races.length * 30)
        },
        size: { width: 750, height: 500 }
      }
      setRaces(prev => [...prev, newRace])
    } else if (command.toLowerCase() === 'starbox.exe') {
      // Create a new starbox instance with a unique ID
      const newStarbox: StarboxInstance = {
        id: `starbox-${Date.now()}`,
        position: { 
          x: Math.max(50, (window.innerWidth - 400) / 2 + starboxes.length * 30),
          y: Math.max(50, (window.innerHeight - 500) / 2 + starboxes.length * 30)
        },
        size: { width: 400, height: 500 }
      }
      setStarboxes(prev => [...prev, newStarbox])
    } else if (command.toLowerCase() === 'dropola.exe') {
      // Create a new dropola instance with a unique ID
      const newDropola: DropolaInstance = {
        id: `dropola-${Date.now()}`,
        position: { 
          x: Math.max(50, (window.innerWidth - 550) / 2 + dropolaGames.length * 30),
          y: Math.max(50, (window.innerHeight - 600) / 2 + dropolaGames.length * 30)
        },
        size: { width: 550, height: 600 }
      }
      setDropolaGames(prev => [...prev, newDropola])
    } else if (command === '') {
      // Reset the terminal message
      setTerminalMessage(undefined)
    }
  }

  const handleKillProcess = (processName: string) => {
    if (processName.toLowerCase() === 'constellation browser') {
      setBrowsers([])
      setTerminalMessage('All browser instances have been terminated.')
    } else if (processName.toLowerCase() === 'ascii racing challenge') {
      setRaces([])
      setTerminalMessage('All racing instances have been terminated.')
    } else if (processName.toLowerCase() === 'starbox') {
      setStarboxes([])
      setTerminalMessage('All Starbox games have been terminated.')
    } else if (processName.toLowerCase() === 'dropola') {
      setDropolaGames([])
      setTerminalMessage('All Dropola games have been terminated.')
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
        <div id="windows-container">
          <Terminal
            title="LewOS Terminal"
            initialPosition={{ x: 17, y: 467 }}
            initialSize={{ width: 600, height: 400 }}
            onRunCommand={handleRunCommand}
            onKillProcess={handleKillProcess}
            systemMessage={terminalMessage}
            activeProcesses={activeProcesses}
          />

          {/* Render all browser instances */}
          {browsers.map(browser => (
            <Browser
              key={browser.id}
              title="Constellation Browser"
              initialPosition={browser.position}
              initialSize={browser.size}
              initialUrl={browser.url}
              onClose={() => handleBrowserClose(browser.id)}
            />
          ))}

          {/* Render race instances */}
          {races.map(race => (
            <Race
              key={race.id}
              initialPosition={race.position}
              initialSize={race.size}
              onClose={() => handleRaceClose(race.id)}
            />
          ))}

          {/* Render starbox instances */}
          {starboxes.map(starbox => (
            <ProjectWindow
              key={starbox.id}
              title="Starbox"
              initialPosition={starbox.position}
              initialSize={starbox.size}
              onClose={() => handleStarboxClose(starbox.id)}
              icon="game_kid_102"
            >
              <Starbox />
            </ProjectWindow>
          ))}

          {/* Render dropola instances */}
          {dropolaGames.map(game => (
            <Dropola
              key={game.id}
              initialPosition={game.position}
              initialSize={game.size}
              onClose={() => handleDropolaClose(game.id)}
            />
          ))}

          <ProjectWindow
            title="CaptainAI.exe"
            initialPosition={{ x: window.innerWidth - 108 - 350, y: 14 }}
            icon="regedit_100"
          >
            <div className={styles.projectWindowContent}>
              <img src={captainlogo} alt="Captain AI Logo" className={styles.projectLogo} />
              <h1>AI for Big Data</h1>
              <p>
                <a href="https://runcaptain.com/" target="_blank" rel="noopener noreferrer">Captain</a> is a tool for analyzing large datasets with LLMs. It's a scalable alternative to RAG that leverages swarms of agents to answer questions over many siloed data sources. 
              </p>
              <button onClick={() => window.open('https://runcaptain.com/', '_blank')}>Learn More</button>
            </div>
          </ProjectWindow>

          <ProjectWindow
            title="AiCodeChecker.exe"
            initialPosition={{ x: window.innerWidth - 17 - 350, y: 280 }}
            icon="computer_2"
          >
            <div className={styles.projectWindowContent}>
              <img src={aicodefaillogo} alt="AI Code Fail Logo" className={styles.projectLogo} />
              <h1>Checkmate ChatGPT</h1>
              <p>
                <a href="https://aicode.fail" target="_blank" rel="noopener noreferrer">AiCode.fail</a> checks code for errors. You can now verify AI-generated code rapidly.
              </p>
              <button onClick={() => window.open('https://aicode.fail', '_blank')}>Learn More</button>
            </div>
          </ProjectWindow>

          <ProjectWindow
            title="CyberSpace.exe"
            initialPosition={{ x: window.innerWidth - 130 - 350, y: 532 }}
            icon="network_2"
          >
            <div className={styles.projectWindowContent}>
              <img src={cyberspacelogo} alt="CyberSpace Logo" className={styles.projectLogo} />
              <h1>Enter CyberSpace</h1>
              <p>
                <a href="https://cyberspaceclub.wordpress.com/" target="_blank" rel="noopener noreferrer">CyberSpace</a> is a cybersecurity club I founded in 2020. Through lessons, guest speakers, and hacking competitions, we aim to make cybersecurity accessible to everyone.
              </p>
              {/* <button onClick={() => window.open('https://cyberspaceclub.wordpress.com/', '_blank')}>Learn More</button> */}
            </div>
          </ProjectWindow>

          <ProjectWindow
            title="README.html"
            initialPosition={{ x: 14, y: 10 }}
            initialSize={{ width: 550, height: 875 }}
            icon="html_page"
          >
            <div className={styles.projectWindowContent}>
              <h1>Lewis Polansky</h1>
              <img src={lewispolanskylogo} alt="LewisPolansky.com" className={styles.projectLogo} />
              <div className={styles.readmeContent}>
                <p>
                  Hey there, I'm Lewis!
                </p>
                <h2>A Full-Stack Software Engineer studying Finance at Purdue University 🚂</h2>

                <p>I'm passionate about leveraging software to <strong>create ridiculously useful products</strong>.</p>

                <h3>Let's connect!</h3>
                <p className={styles.buttonContainer}>
                  <button onClick={() => window.open('https://www.linkedin.com/in/lewispolansky/', '_blank')} className={styles.linkedinButton}>
                    Connect with me on <b>LinkedIn</b>
                  </button>
                  <button onClick={() => window.open('https://github.com/lewispolansky', '_blank')} className={styles.githubButton}>
                    Check out my <b>GitHub</b>
                  </button>
                </p>

                <h3>Currently studying</h3>
                <ul>
                  <li>Advanced FinTech and Financial Engineering at Purdue Daniels School of Business</li>
                  <li>Accuracy & Verification Algorithms for more reliable LLMs</li>
                  <li>Automating RAG-like pipelines for Big Data</li>
                </ul>

                <h3>My Go-To SaaS Stack:</h3>
                <div className={styles.techStack}>
                  <span className={styles.techBadge}>React</span>
                  <span className={styles.techBadge}>Next.js</span>
                  <span className={styles.techBadge}>TypeScript</span>
                  <span className={styles.techBadge}>Tailwind</span>
                  <span className={styles.techBadge}>Three.js</span>
                  <span className={styles.techBadge}>Node.js</span>
                  <span className={styles.techBadge}>Express.js</span>
                  <span className={styles.techBadge}>Vercel</span>
                  <span className={styles.techBadge}>Google Cloud</span>
                  <span className={styles.techBadge}>Stripe</span>
                  <span className={styles.techBadge}>Figma</span>
                  <span className={styles.techBadge}>Vite</span>
                  <span className={styles.techBadge}>Cursor</span>
                  <span className={styles.techBadge}>Claude Code</span>
                  <span className={styles.techBadge}>Cloudflare</span>
                </div>

                <h3>Prev. worked with:</h3>
                <div className={styles.techStack}>
                  <span className={styles.techBadge}>Firebase</span>
                  <span className={styles.techBadge}>Supabase</span>
                  <span className={styles.techBadge}>React Native</span>
                  <span className={styles.techBadge}>Flutter</span>
                  <span className={styles.techBadge}>Dart</span>
                  <span className={styles.techBadge}>PostgreSQL</span>
                  <span className={styles.techBadge}>Prisma ORM</span>
                  <span className={styles.techBadge}>C++</span>
                  <span className={styles.techBadge}>C</span>
                  <span className={styles.techBadge}>C#</span>
                  <span className={styles.techBadge}>Unity</span>
                  <span className={styles.techBadge}>Blender</span>
                  <span className={styles.techBadge}>Java</span>
                  <span className={styles.techBadge}>PHP</span>
                  <span className={styles.techBadge}>Linux</span>
                  <span className={styles.techBadge}>Kali</span>
                  <span className={styles.techBadge}>Vim</span>
                  <span className={styles.techBadge}>Et cetera</span>

                </div>

                <h3>Awards & Achievements</h3>
                <div className={styles.awards}>
                  <div className={styles.award}>
                    <h4>$10,000 R&D Prize (2024)</h4>
                    <p>For inventing the Soy-Based Milk Carton, Indiana Soybean Alliance</p>
                  </div>
                  <div className={styles.award}>
                    <h4>Certificates of Congressional Recognition (2021 & 2023)</h4>
                    <p>For Message Translating Chat App & Community Service Map App, Congresswoman Judy Chu</p>
                  </div>
                  <div className={styles.award}>
                    <h4>Eagle Scout (2024)</h4>
                    <p>Troop 7, South Pasadena, CA</p>
                  </div>
                </div>

                <h3>Relevant Experience</h3>
                <div className={styles.experience}>
                  <div className={styles.role}>
                    <h4>CEO and Co-Founder, Captain</h4>
                    <p>Building the future of LLMs + Big Data. Learn more <a href="https://runcaptain.com/" target="_blank" rel="noopener noreferrer">here</a>.</p>
                  </div>
                  <div className={styles.role}>
                    <h4>Head of Business Development, Purdue IEEE</h4>
                    <p>Purdue's 125 year old Student Branch of the largest technical professional society in the world</p>
                  </div>
                  <div className={styles.role}>
                    <h4>Software Engineering & Business Development Intern, JUA Technologies International</h4>
                    <p>An AgTech startup supplying solar-powered crop dehydration solutions to developing nations</p>
                  </div>
                  <div className={styles.role}>
                    <h4>Founder, CyberSpace</h4>
                    <p>A network of competitive high school cybersecurity education clubs</p>
                  </div>
                </div>
              </div>
            </div>
          </ProjectWindow>

          <Footer />
        </div>
      )}
    </div>
  )
} 