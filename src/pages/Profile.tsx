import { useEffect, useRef, useState } from 'react'
import { AsciiScene } from '../components/AsciiScene'
import styles from './Profile.module.css'
import { ProjectWindow } from '../components/ProjectWindow'
import { Terminal } from '../components/Terminal'
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

export function Profile() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [doneScrolling, setDoneScrolling] = useState(false)
  const [displayProjects, setDisplayProjects] = useState(false)
  const [renderedLabel, setRenderedLabel] = useState<StyledChar[]>(
    '----- -------- -- -----------'.split('').map(char => ({ char, style: 'regular' }))
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
          <Terminal
            title="LewOS Terminal"
            initialPosition={{ x: 17, y: 467 }}
            initialSize={{ width: 600, height: 400 }}
          />

          <ProjectWindow
            title="CaptainAI.exe"
            initialPosition={{ x: window.innerWidth - 108 - 350, y: 14 }}
          >
            <div className={styles.projectWindowContent}>
              <img src={captainlogo} alt="Captain AI Logo" className={styles.projectLogo} />
              <h1>An AI Copilot for CFOs</h1>
              <p>
                <a href="https://v0-captain-mu.vercel.app/" target="_blank" rel="noopener noreferrer">Captain</a> is an AI copilot for CFOs. It helps you understand your data and make better decisions.
              </p>
              <button onClick={() => window.open('https://v0-captain-mu.vercel.app/', '_blank')}>Learn More</button>
            </div>
          </ProjectWindow>

          <ProjectWindow
            title="AiCodeChecker.exe"
            initialPosition={{ x: window.innerWidth - 17 - 350, y: 280 }}
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
          >
            <div className={styles.projectWindowContent}>
              <h1>Lewis Polansky</h1>
              <img src={lewispolanskylogo} alt="LewisPolansky.com" className={styles.projectLogo} />
              <div className={styles.readmeContent}>
                <p>
                  Hey there, I'm Lewis!
                </p>
                <h2>I'm a Software Engineer 💻 studying Finance 📈 at Purdue University 🚂</h2>

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
                  <li>Rapid-Growth Operations for Startups</li>
                </ul>

                <h3>My SaaS Stack</h3>
                <div className={styles.techStack}>
                  <span className={styles.techBadge}>React</span>
                  <span className={styles.techBadge}>Next.js</span>
                  <span className={styles.techBadge}>TypeScript</span>
                  <span className={styles.techBadge}>CSS3</span>
                  <span className={styles.techBadge}>Three.js</span>
                  <span className={styles.techBadge}>Node.js</span>
                  <span className={styles.techBadge}>Express.js</span>
                  <span className={styles.techBadge}>Supabase</span>
                  <span className={styles.techBadge}>Google Cloud</span>
                  <span className={styles.techBadge}>Stripe</span>
                  <span className={styles.techBadge}>Figma</span>
                  <span className={styles.techBadge}>Vite</span>
                  <span className={styles.techBadge}>VS Code</span>
                  <span className={styles.techBadge}>GitHub Copilot</span>
                  <span className={styles.techBadge}>Cloudflare</span>
                </div>

                <h3>I also know</h3>
                <div className={styles.techStack}>
                  <span className={styles.techBadge}>Firebase</span>
                  <span className={styles.techBadge}>React</span>
                  <span className={styles.techBadge}>React Native</span>
                  <span className={styles.techBadge}>Flutter</span>
                  <span className={styles.techBadge}>Dart</span>
                  <span className={styles.techBadge}>SQL</span>
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
                </div>
                <p className={styles.footnote}>and almost anything else if you give me a few weeks 🫡</p>

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
        </>
      )}
    </div>
  )
} 