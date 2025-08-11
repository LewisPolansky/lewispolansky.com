import React, { useState, useEffect, useRef } from 'react';
import { ProjectWindow } from './ProjectWindow';
import styles from './Race.module.css';
import typingSamples from '../data/typing-samples.json';

interface RaceProps {
  title?: string;
  initialPosition?: { x: number; y: number };
  initialSize?: { width?: number; height?: number };
  onClose?: () => void;
}

interface RaceStats {
  bestWpm: number;
  totalRaces: number;
  totalChars: number;
  totalTime: number;
}

const STORAGE_KEY = 'race_stats.json';

// ASCII car frames for animation
const carFrames = [
  `
    .---------.
   /|         |\\
  / |_________|\\\\
 |  |         |  |
 |  |_________|__|
 |/_____(_)_____\\|
  '._.'     '._.'
  `,
  `
    .---------.
   /|         |\\
  / |_________|\\\\
 |  |         |  |
 |  |_________|__|
 |/_____(_)_____\\|
  '._.·     ·._.'
  `,
  `
    .---------.
   /|         |\\
  / |_________|\\\\
 |  |         |  |
 |  |_________|__|
 |/_____(_)_____\\|
  '·_·'     '·_·'
  `
];

// ASCII finish line
const finishLine = `
|======================|
|                      |
|======================|
|                      |
|======================|
|                      |
|======================|
|         🏁          |
|======================|
`;

export const Race: React.FC<RaceProps> = ({
  title = 'Typing Race',
  initialPosition,
  initialSize = { width: 750, height: 500 },
  onClose,
}) => {
  // Game state
  const [gameState, setGameState] = useState<'ready' | 'racing' | 'finished'>('ready');
  const [currentText, setCurrentText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [currentWpm, setCurrentWpm] = useState(0);
  const [stats, setStats] = useState<RaceStats>({
    bestWpm: 0,
    totalRaces: 0,
    totalChars: 0,
    totalTime: 0
  });
  const [currentRaceStats, setCurrentRaceStats] = useState({
    totalWpm: 0,
    races: 0
  });
  const [carFrame, setCarFrame] = useState(0);
  const [carPosition, setCarPosition] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(1000); // Animation speed in ms

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dbRef = useRef<IDBDatabase | null>(null);
  const animationRef = useRef<number | null>(null);

  // IndexedDB setup
  useEffect(() => {
    const request = indexedDB.open('LewOSFileSystem', 1);
    
    request.onsuccess = (event) => {
      dbRef.current = (event.target as IDBOpenDBRequest).result;
      loadStats();
    };
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
    };
    
    return () => {
      if (dbRef.current) {
        dbRef.current.close();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Load stats from IndexedDB
  const loadStats = () => {
    if (!dbRef.current) return;
    
    try {
      const transaction = dbRef.current.transaction('files', 'readonly');
      const store = transaction.objectStore('files');
      const getRequest = store.get(STORAGE_KEY);
      
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          setStats(JSON.parse(getRequest.result));
        }
      };
      
      getRequest.onerror = (event) => {
        console.error('Error loading race stats:', event);
      };
    } catch (error) {
      console.error('Error in loadStats:', error);
    }
  };

  // Save stats to IndexedDB
  const saveStats = (newStats: RaceStats) => {
    if (!dbRef.current) return;
    
    try {
      const transaction = dbRef.current.transaction('files', 'readwrite');
      const store = transaction.objectStore('files');
      store.put(JSON.stringify(newStats), STORAGE_KEY);
    } catch (error) {
      console.error('Error saving race stats:', error);
    }
  };

  // Start a new race
  const startRace = () => {
    // Get a random sample
    const randomIndex = Math.floor(Math.random() * typingSamples.length);
    setCurrentText(typingSamples[randomIndex].text);
    setUserInput('');
    setStartTime(Date.now());
    setGameState('racing');
    setErrorCount(0);
    setCarPosition(0);
    setCurrentWpm(0);
    
    // Reset animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Start animation loop
    animateCar();
    
    // Focus the input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Animate the car
  const animateCar = () => {
    setCarFrame((prev) => (prev + 1) % carFrames.length);
    
    animationRef.current = requestAnimationFrame(() => {
      setTimeout(animateCar, animationSpeed);
    });
  };

  // Calculate WPM
  const calculateWpm = (text: string, timeInSeconds: number) => {
    // Standard calculation: (characters typed / 5) / minutes elapsed
    const words = text.length / 5;
    const minutes = timeInSeconds / 60;
    return Math.round(words / minutes);
  };

  // Update current WPM in real-time
  useEffect(() => {
    if (gameState === 'racing' && userInput.length > 0) {
      const currentTime = Date.now();
      const timeElapsed = (currentTime - startTime) / 1000; // in seconds
      
      if (timeElapsed > 0) {
        const wpm = calculateWpm(userInput, timeElapsed);
        setCurrentWpm(wpm);
        
        // Update car position based on progress
        const progress = userInput.length / currentText.length;
        setCarPosition(Math.min(progress * 100, 100));
        
        // Update animation speed based on WPM
        // Faster typing = faster animation
        const newSpeed = Math.max(1000 - (wpm * 5), 100);
        setAnimationSpeed(newSpeed);
      }
    }
  }, [userInput, gameState, currentText, startTime]);

  // Handle user input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (gameState !== 'racing') return;
    
    const value = e.target.value;
    setUserInput(value);
    
    // Compare with current text to find errors
    let errors = 0;
    for (let i = 0; i < value.length; i++) {
      if (i >= currentText.length || value[i] !== currentText[i]) {
        errors++;
      }
    }
    setErrorCount(errors);
    
    // Check if race is complete
    if (value.length >= currentText.length && errors === 0) {
      finishRace();
    }
  };

  // Prevent space from triggering parent window actions
  const preventSpaceDefault = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.code === 'Space') {
      e.stopPropagation();
    }
  };

  // Special handling for textarea input
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (gameState !== 'racing') return;
    
    // Handle space key specifically
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault(); // Prevent default space behavior
      e.stopPropagation(); // Stop event bubbling
      
      // Manually insert space at cursor position
      if (e.target instanceof HTMLTextAreaElement) {
        const cursorPosition = e.target.selectionStart || 0;
        const newValue = 
          userInput.substring(0, cursorPosition) + 
          ' ' + 
          userInput.substring(cursorPosition);
        
        setUserInput(newValue);
        
        // Update cursor position after state update
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.selectionStart = cursorPosition + 1;
            inputRef.current.selectionEnd = cursorPosition + 1;
          }
        }, 0);
        
        // Check for errors after adding the space
        let errors = 0;
        for (let i = 0; i < newValue.length; i++) {
          if (i >= currentText.length || newValue[i] !== currentText[i]) {
            errors++;
          }
        }
        setErrorCount(errors);
        
        // Check if race is complete after adding the space
        if (newValue.length >= currentText.length && errors === 0) {
          finishRace();
        }
      }
    }
    
    // Ensure these events don't bubble up to parent elements
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key)) {
      e.stopPropagation();
    }
  };

  // Focus handling
  const handleFocus = () => {
    // Add a class to the body when the Race component is focused
    document.body.classList.add('race-focused');
  };
  
  const handleBlur = () => {
    document.body.classList.remove('race-focused');
  };
  
  // Ensure the textarea stays focused when clicking anywhere in the race container
  const handleContainerClick = () => {
    if (gameState === 'racing' && inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Add effect to focus input when race starts
  useEffect(() => {
    if (gameState === 'racing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState]);

  // Finish the race
  const finishRace = () => {
    const endTimeStamp = Date.now();
    setEndTime(endTimeStamp);
    
    const timeElapsedSeconds = (endTimeStamp - startTime) / 1000;
    const finalWpm = calculateWpm(currentText, timeElapsedSeconds);
    
    // Update session stats
    setCurrentRaceStats(prev => ({
      totalWpm: prev.totalWpm + finalWpm,
      races: prev.races + 1
    }));
    
    // Update all-time stats
    const newStats = {
      bestWpm: Math.max(stats.bestWpm, finalWpm),
      totalRaces: stats.totalRaces + 1,
      totalChars: stats.totalChars + currentText.length,
      totalTime: stats.totalTime + timeElapsedSeconds
    };
    
    setStats(newStats);
    saveStats(newStats);
    setGameState('finished');
    
    // Stop animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  // Render char with highlighting (correct, incorrect, or not typed yet)
  const renderText = () => {
    return currentText.split('').map((char, index) => {
      let className = '';
      
      if (index < userInput.length) {
        // Character has been typed
        className = userInput[index] === char ? styles.correct : styles.incorrect;
      }
      
      // Special handling for spaces to make them visible
      if (char === ' ') {
        return (
          <span key={index} className={`${className} ${styles.space}`}>
            {char}
          </span>
        );
      }
      
      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  };

  // Render car based on position
  const renderCar = () => {
    // Calculate position along the track
    const trackWidth = 100;
    const position = (carPosition / 100) * trackWidth;
    
    return (
      <div className={styles.raceTrack}>
        <div className={styles.car} style={{ left: `${position}%` }}>
          <pre>{carFrames[carFrame]}</pre>
        </div>
        <div className={styles.finishLine}>
          <pre>{finishLine}</pre>
        </div>
      </div>
    );
  };

  return (
    <ProjectWindow
      title={title}
      initialPosition={initialPosition}
      initialSize={initialSize}
      onClose={onClose}
      icon="access_219"
    >
      <div 
        className={styles.raceContainer}
        onKeyDown={preventSpaceDefault}
        onClick={handleContainerClick}
      >
        <div className={styles.header}>
          <h1>ASCII Racing Challenge</h1>
          <div className={styles.statsBar}>
            <div className={styles.wpmCounter}>
              Current WPM: <span className={styles.wpmValue}>{currentWpm}</span>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${carPosition}%` }}
              />
            </div>
            {gameState === 'racing' && (
              <div className={styles.errorCounter}>
                Errors: <span className={styles.errorValue}>{errorCount}</span>
              </div>
            )}
          </div>
        </div>
        
        {renderCar()}
        
        <div className={styles.textArea}>
          {gameState === 'ready' ? (
            <div className={styles.readyScreen}>
              <h2>Ready to Race?</h2>
              <p>Test your typing speed with our ASCII racing challenge!</p>
              <p>Type the provided text as quickly and accurately as possible.</p>
              <button className={styles.startButton} onClick={startRace}>
                Start Race
              </button>
              
              {stats.totalRaces > 0 && (
                <div className={styles.statsBox}>
                  <h3>All-Time Stats</h3>
                  <p>Best WPM: {stats.bestWpm}</p>
                  <p>Races Completed: {stats.totalRaces}</p>
                  <p>Average WPM: {Math.round((stats.totalChars / 5) / (stats.totalTime / 60))}</p>
                </div>
              )}
            </div>
          ) : gameState === 'racing' ? (
            <>
              <div className={styles.textDisplay}>
                {renderText()}
              </div>
              <textarea
                ref={inputRef}
                className={styles.userInput}
                value={userInput}
                onChange={handleInputChange}
                onKeyDown={handleTextareaKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="Start typing here..."
                autoFocus
              />
            </>
          ) : (
            <div className={styles.resultsScreen}>
              <h2>Race Completed!</h2>
              <div className={styles.resultsStats}>
                <p>Your WPM: <span className={styles.wpmResult}>{currentWpm}</span></p>
                <p>Time: {((endTime - startTime) / 1000).toFixed(2)} seconds</p>
                <p>Accuracy: {Math.max(0, 100 - (errorCount / currentText.length * 100)).toFixed(2)}%</p>
              </div>
              
              <div className={styles.sessionStats}>
                <h3>Session Stats</h3>
                <p>Average WPM: {currentRaceStats.races > 0 ? Math.round(currentRaceStats.totalWpm / currentRaceStats.races) : 0}</p>
                <p>Races Completed: {currentRaceStats.races}</p>
              </div>
              
              <div className={styles.allTimeStats}>
                <h3>All-Time Best</h3>
                <p>Best WPM: {stats.bestWpm}</p>
                <p>Total Races: {stats.totalRaces}</p>
              </div>
              
              <button className={styles.startButton} onClick={startRace}>
                Race Again
              </button>
            </div>
          )}
        </div>
      </div>
    </ProjectWindow>
  );
}; 