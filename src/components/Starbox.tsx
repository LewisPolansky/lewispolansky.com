import React, { useState, useEffect, useCallback } from 'react';
import styles from './Starbox.module.css';

interface StarboxProps {
  onPlayAgain?: () => void;
}

// Constants
const GRID_SIZE = 10;
const SCRAMBLE_MOVES = 35; // Number of random flips to initialize the game
const STAR_SYMBOL = '★';
const MOON_SYMBOL = '○';

// IndexedDB configuration
const DB_NAME = 'LewOSFileSystem';
const DB_VERSION = 1;
const STARBOX_STORE = 'starbox_stats';

export const Starbox: React.FC<StarboxProps> = ({ onPlayAgain }) => {
  // Game state
  const [grid, setGrid] = useState<boolean[][]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [fireworks, setFireworks] = useState<{top: number, left: number, color: string}[]>([]);
  const [moves, setMoves] = useState(0);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [dbRef, setDbRef] = useState<IDBDatabase | null>(null);

  // Initialize IndexedDB connection
  useEffect(() => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // Create an object store for Starbox stats if it doesn't exist
      if (!db.objectStoreNames.contains(STARBOX_STORE)) {
        db.createObjectStore(STARBOX_STORE);
      }
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      setDbRef(db);
      loadPersonalBest(db);
    };
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
    };
    
    return () => {
      if (dbRef) {
        dbRef.close();
      }
    };
  }, []);

  // Load personal best from IndexedDB
  const loadPersonalBest = (db: IDBDatabase) => {
    try {
      const transaction = db.transaction(STARBOX_STORE, 'readonly');
      const store = transaction.objectStore(STARBOX_STORE);
      const request = store.get('personal_best');
      
      request.onsuccess = () => {
        if (request.result) {
          setPersonalBest(request.result);
        }
      };
    } catch (error) {
      console.error('Error loading personal best:', error);
    }
  };

  // Save personal best to IndexedDB
  const savePersonalBest = (newBest: number) => {
    if (!dbRef) return;
    
    try {
      const transaction = dbRef.transaction(STARBOX_STORE, 'readwrite');
      const store = transaction.objectStore(STARBOX_STORE);
      store.put(newBest, 'personal_best');
    } catch (error) {
      console.error('Error saving personal best:', error);
    }
  };

  // Initialize a clean grid with all stars
  const initializeCleanGrid = useCallback(() => {
    const newGrid = Array(GRID_SIZE).fill(null).map(() => 
      Array(GRID_SIZE).fill(true)
    );
    return newGrid;
  }, []);

  // Flip the state of a button and its adjacent buttons
  const flipButtons = useCallback((grid: boolean[][], row: number, col: number) => {
    const newGrid = grid.map(r => [...r]);
    
    // Flip the clicked button
    newGrid[row][col] = !newGrid[row][col];
    
    // Flip adjacent buttons
    if (row > 0) newGrid[row-1][col] = !newGrid[row-1][col]; // Up
    if (row < GRID_SIZE-1) newGrid[row+1][col] = !newGrid[row+1][col]; // Down
    if (col > 0) newGrid[row][col-1] = !newGrid[row][col-1]; // Left
    if (col < GRID_SIZE-1) newGrid[row][col+1] = !newGrid[row][col+1]; // Right
    
    return newGrid;
  }, []);

  // Initialize game with randomized grid
  const initializeGame = useCallback(() => {
    let newGrid = initializeCleanGrid();
    
    // Randomly flip buttons to create a scrambled but solvable grid
    for (let i = 0; i < SCRAMBLE_MOVES; i++) {
      const randomRow = Math.floor(Math.random() * GRID_SIZE);
      const randomCol = Math.floor(Math.random() * GRID_SIZE);
      newGrid = flipButtons(newGrid, randomRow, randomCol);
    }
    
    setGrid(newGrid);
    setGameStarted(true);
    setGameWon(false);
    setFireworks([]);
    setMoves(0);
  }, [initializeCleanGrid, flipButtons]);

  // Handle button click
  const handleButtonClick = (row: number, col: number) => {
    if (gameWon) return;
    
    const newGrid = flipButtons(grid, row, col);
    setGrid(newGrid);
    setMoves(prev => prev + 1);
    
    // Check if all buttons are stars (true)
    const allStars = newGrid.every(row => row.every(cell => cell === true));
    if (allStars) {
      setGameWon(true);
      
      // Update personal best if this is a new record
      if (personalBest === null || moves + 1 < personalBest) {
        setPersonalBest(moves + 1);
        savePersonalBest(moves + 1);
      }
      
      // Create fireworks celebration animation
      const createFireworks = () => {
        const newFireworks = [];
        for (let i = 0; i < 20; i++) {
          newFireworks.push({
            top: Math.random() * 100,
            left: Math.random() * 100,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`
          });
        }
        setFireworks(newFireworks);
      };
      
      // Display fireworks with animation
      let count = 0;
      const interval = setInterval(() => {
        createFireworks();
        count++;
        if (count >= 5) clearInterval(interval);
      }, 500);
    }
  };

  // Play again
  const handlePlayAgain = () => {
    initializeGame();
    if (onPlayAgain) onPlayAgain();
  };

  // Start game on mount
  useEffect(() => {
    if (!gameStarted) {
      initializeGame();
    }
  }, [gameStarted, initializeGame]);

  return (
    <div className={styles.starboxContainer}>
      <div className={styles.starboxHeader}>
        <h2>Starbox</h2>
        {gameWon && <div className={styles.winMessage}>You Won!</div>}
      </div>
      
      {!gameStarted ? (
        <div className={styles.startScreen}>
          <p>Click "Play Starbox" to start</p>
          <button className={styles.playButton} onClick={initializeGame}>
            Play Starbox
          </button>
        </div>
      ) : (
        <>
          <div className={styles.stats}>
            <div className={styles.moveCounter}>Moves: {moves}</div>
            {personalBest && (
              <div className={styles.personalBest}>
                Best: {personalBest}
                {gameWon && moves === personalBest && (
                  <span className={styles.newRecord}> New Record!</span>
                )}
              </div>
            )}
          </div>

          <div className={styles.gameGrid}>
            {grid.map((row, rowIndex) => (
              <div key={`row-${rowIndex}`} className={styles.gridRow}>
                {row.map((isOn, colIndex) => (
                  <button
                    key={`cell-${rowIndex}-${colIndex}`}
                    className={styles.gridButton}
                    onClick={() => handleButtonClick(rowIndex, colIndex)}
                    disabled={gameWon}
                    data-symbol={isOn ? STAR_SYMBOL : MOON_SYMBOL}
                  >
                    {isOn ? STAR_SYMBOL : MOON_SYMBOL}
                  </button>
                ))}
              </div>
            ))}
          </div>
          
          <div className={styles.instructions}>
            <p>Turn all buttons to stars {STAR_SYMBOL}</p>
            <p>Clicking a button flips it and adjacent buttons</p>
          </div>
          
          {gameWon && (
            <div className={styles.playAgainContainer}>
              <button className={styles.playButton} onClick={handlePlayAgain}>
                Play Again
              </button>
            </div>
          )}
          
          {gameWon && (
            <div className={styles.fireworksContainer}>
              {fireworks.map((fw, index) => (
                <div
                  key={`firework-${index}`}
                  className={styles.firework}
                  style={{
                    top: `${fw.top}%`,
                    left: `${fw.left}%`,
                    backgroundColor: fw.color
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}; 