import React, { useState, useEffect, useRef } from 'react';
import styles from './Dropola.module.css';
import { ProjectWindow } from './ProjectWindow';
import Matter from 'matter-js';

// Define GameState type
type GameState = 'menu' | 'game' | 'gameover';

// Define DB constants for high score
const DB_NAME = 'DropolaHighScore';
const DB_VERSION = 1;
const SCORE_STORE = 'scores';

interface DropolaProps {
  onClose?: () => void;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
}

interface Ball {
  body: Matter.Body;
  value: number;
  size: number;
  isNew: boolean;
}

export const Dropola: React.FC<DropolaProps> = ({ 
  onClose,
  initialPosition,
  initialSize = { width: 550, height: 600 }
}) => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOverTimer, setGameOverTimer] = useState<number | null>(null);
  const [warningCountdown, setWarningCountdown] = useState<number | null>(null);
  const [nextBallValue, setNextBallValue] = useState<number>(1);
  
  // Refs for game elements
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const ballsRef = useRef<Ball[]>([]);
  const worldRef = useRef<Matter.World | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const isAboveLineRef = useRef(false);
  const dbRef = useRef<IDBDatabase | null>(null);
  const redLineYRef = useRef(0);
  const dropTimeoutRef = useRef<number | null>(null);
  const canDropRef = useRef(true);
  const lastDropTimeRef = useRef<number>(0);
  const warningTimerRef = useRef<number | null>(null);
  
  // Constants
  const CANVAS_WIDTH = 300;
  const CANVAS_HEIGHT = 600;
  const BALL_RADIUS = 30;
  const RED_LINE_HEIGHT = 100; // Distance from top where red line appears
  const COLLISION_FILTER = {
    category: 0x0001,
    mask: 0x0001
  };
  
  // Mouse position ref (initialized after constants are defined)
  const mousePositionRef = useRef<{x: number, y: number}>({x: CANVAS_WIDTH / 2, y: 0});
  
  // Initialize the database
  useEffect(() => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(SCORE_STORE)) {
        db.createObjectStore(SCORE_STORE);
      }
    };
    
    request.onsuccess = (event) => {
      dbRef.current = (event.target as IDBOpenDBRequest).result;
      loadHighScore();
    };
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
    };
    
    return () => {
      if (dbRef.current) {
        dbRef.current.close();
      }
    };
  }, []);
  
  // Load high score from database
  const loadHighScore = () => {
    if (!dbRef.current) return;
    
    try {
      const transaction = dbRef.current.transaction(SCORE_STORE, 'readonly');
      const store = transaction.objectStore(SCORE_STORE);
      const getRequest = store.get('highScore');
      
      getRequest.onsuccess = () => {
        if (getRequest.result !== undefined) {
          setHighScore(getRequest.result);
        }
      };
      
      getRequest.onerror = (event) => {
        console.error('Error loading high score:', event);
      };
    } catch (error) {
      console.error('Error in loadHighScore:', error);
    }
  };
  
  // Save high score to database
  const saveHighScore = (newScore: number) => {
    if (!dbRef.current) return;
    
    try {
      const transaction = dbRef.current.transaction(SCORE_STORE, 'readwrite');
      const store = transaction.objectStore(SCORE_STORE);
      store.put(newScore, 'highScore');
    } catch (error) {
      console.error('Error saving high score:', error);
    }
  };
  
  // Initialize Matter.js
  const initPhysics = () => {
    if (!canvasRef.current) return;
    
    console.log('Starting physics initialization...');
    
    // Clear any existing engine
    if (engineRef.current) {
      try {
        Matter.Engine.clear(engineRef.current);
        if (runnerRef.current) {
          Matter.Runner.stop(runnerRef.current);
        }
      } catch (error) {
        console.error('Error clearing previous engine:', error);
      }
    }
    
    // Module aliases
    const Engine = Matter.Engine;
    const World = Matter.World;
    const Bodies = Matter.Bodies;
    const Runner = Matter.Runner;
    
    // Create engine with proper configuration - stronger gravity for immediate effects
    const engine = Engine.create({
      gravity: { x: 0, y: 0.6 }, // Reduced gravity by half for better game feel
      positionIterations: 10,  // Increased for more stable physics
      velocityIterations: 8    // Increased for more stable physics
    });
    
    console.log('Engine created:', engine);
    engineRef.current = engine;
    worldRef.current = engine.world;
    
    // We no longer create a Matter.js renderer - will use our own canvas rendering
    renderRef.current = null;
    
    // Create walls (boundaries) with proper thickness
    const wallOptions = {
      isStatic: true,
      restitution: 0.5,
      collisionFilter: COLLISION_FILTER
    };
    
    const wallThickness = 20;
    const ground = Bodies.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT + wallThickness/2, CANVAS_WIDTH, wallThickness, wallOptions);
    const leftWall = Bodies.rectangle(-wallThickness/2, CANVAS_HEIGHT / 2, wallThickness, CANVAS_HEIGHT, wallOptions);
    const rightWall = Bodies.rectangle(CANVAS_WIDTH + wallThickness/2, CANVAS_HEIGHT / 2, wallThickness, CANVAS_HEIGHT, wallOptions);
    
    // Add walls to world
    World.add(engine.world, [ground, leftWall, rightWall]);
    
    // Create runner with higher framerate for smoother physics
    const runner = Runner.create({
      isFixed: true, // Use fixed timestep
      delta: 1000/60 // 60 FPS
    });
    runnerRef.current = runner;
    
    // Start the physics engine 
    Runner.run(runner, engine);
    
    // Calculate red line Y position (from top)
    redLineYRef.current = RED_LINE_HEIGHT;
    
    // Add collision detection
    Matter.Events.on(engine, 'collisionStart', handleCollisions);
    
    // Add afterUpdate event to check if any ball is above the red line
    Matter.Events.on(engine, 'afterUpdate', checkGameOver);
    
    console.log('Physics initialization complete');
    
    // Return cleanup function
    return () => {
      try {
        Matter.Events.off(engine, 'collisionStart', handleCollisions);
        Matter.Events.off(engine, 'afterUpdate', checkGameOver);
        Runner.stop(runner);
        Engine.clear(engine);
        console.log('Physics engine cleaned up');
      } catch (error) {
        console.error('Error during physics cleanup:', error);
      }
    };
  };
  
  // Handle ball collisions
  const handleCollisions = (event: Matter.IEventCollision<Matter.Engine>) => {
    const pairs = event.pairs;
    console.log(`Collision detected between ${pairs.length} pairs`);
    
    // Track pairs to process to avoid processing the same collision multiple times
    const processedPairs: Set<string> = new Set();
    
    // Check each collision pair
    for (let i = 0; i < pairs.length; i++) {
      const bodyA = pairs[i].bodyA;
      const bodyB = pairs[i].bodyB;
      
      // Skip if either body is a wall
      if (bodyA.isStatic || bodyB.isStatic) continue;
      
      // Create a unique key for this pair to avoid duplicates
      const pairKey = [bodyA.id, bodyB.id].sort().join('-');
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);
      
      // Find corresponding balls
      const ballA = ballsRef.current.find(ball => ball.body.id === bodyA.id);
      const ballB = ballsRef.current.find(ball => ball.body.id === bodyB.id);
      
      // If both balls exist and have the same value
      if (ballA && ballB && ballA.value === ballB.value && !ballA.isNew && !ballB.isNew) {
        console.log(`Merging balls with value ${ballA.value}`);
        
        // Create a new ball with combined value
        const newValue = ballA.value + ballB.value;
        const midX = (bodyA.position.x + bodyB.position.x) / 2;
        const midY = (bodyA.position.y + bodyB.position.y) / 2;
        
        // Calculate new size
        const newSize = Math.min(BALL_RADIUS * Math.sqrt(newValue) * 0.8, BALL_RADIUS * 4);
        
        try {
          // Remove the collided balls directly
          if (worldRef.current) {
            Matter.Composite.remove(worldRef.current, bodyA);
            Matter.Composite.remove(worldRef.current, bodyB);
            
            // Update balls array immediately
            ballsRef.current = ballsRef.current.filter(ball => 
              ball.body.id !== bodyA.id && ball.body.id !== bodyB.id
            );
            
            // Add the new ball with combined value
            addBall(midX, midY, newValue, newSize, true);
          }
        } catch (error) {
          console.error('Error handling collision:', error);
        }
      }
    }
    
    // Additional proximity check for balls that are very close but not colliding
    checkProximityForMerge();
  };
  
  // Check for balls that are close enough to merge but not officially colliding
  const checkProximityForMerge = () => {
    // Only check if we have enough balls
    if (ballsRef.current.length < 2) return;
    
    // Create a copy to avoid modification issues during iteration
    const balls = [...ballsRef.current];
    
    // Check all possible pairs of balls
    for (let i = 0; i < balls.length; i++) {
      // Skip if this ball is marked as new (recently created)
      if (balls[i].isNew) continue;
      
      for (let j = i + 1; j < balls.length; j++) {
        // Skip if this ball is marked as new (recently created)
        if (balls[j].isNew) continue;
        
        // Skip if values don't match
        if (balls[i].value !== balls[j].value) continue;
        
        const ballA = balls[i];
        const ballB = balls[j];
        
        // Calculate distance between centers
        const dx = ballA.body.position.x - ballB.body.position.x;
        const dy = ballA.body.position.y - ballB.body.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate sum of radii plus a small tolerance (10% of radius)
        const mergeThreshold = (ballA.size + ballB.size) * 1.05;
        
        // If close enough, merge them
        if (distance < mergeThreshold) {
          console.log(`Proximity merge for balls with value ${ballA.value}`);
          
          // Calculate midpoint
          const midX = (ballA.body.position.x + ballB.body.position.x) / 2;
          const midY = (ballA.body.position.y + ballB.body.position.y) / 2;
          
          // Calculate new size
          const newValue = ballA.value + ballB.value;
          const newSize = Math.min(BALL_RADIUS * Math.sqrt(newValue) * 0.8, BALL_RADIUS * 4);
          
          try {
            // Remove these balls from the world
            if (worldRef.current) {
              Matter.Composite.remove(worldRef.current, ballA.body);
              Matter.Composite.remove(worldRef.current, ballB.body);
              
              // Update balls array immediately
              ballsRef.current = ballsRef.current.filter(ball => 
                ball.body.id !== ballA.body.id && ball.body.id !== ballB.body.id
              );
              
              // Add the new ball with combined value
              addBall(midX, midY, newValue, newSize, true);
              
              // Exit the loops after a merge to avoid modifying the array while iterating
              return;
            }
          } catch (error) {
            console.error('Error during proximity merge:', error);
          }
        }
      }
    }
  };
  
  // Check if any ball is above the red line
  const checkGameOver = () => {
    if (gameState !== 'game') return;
    
    const isAboveLine = ballsRef.current.some(ball => 
      ball.body.position.y - ball.size < redLineYRef.current
    );
    
    // Only start warning if at least 3 seconds have passed since last ball drop
    const dropDelay = 3000; // 3 seconds delay after drop
    const timeNow = Date.now();
    const timePassedSinceDrop = timeNow - lastDropTimeRef.current;
    const canStartWarning = timePassedSinceDrop > dropDelay;
    
    if (isAboveLine && !isAboveLineRef.current && canStartWarning) {
      // Ball has just crossed above the red line and enough time has passed since drop
      isAboveLineRef.current = true;
      
      // Start warning timer (1 second before starting countdown)
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
      
      warningTimerRef.current = setTimeout(() => {
        // Start countdown from 3
        setWarningCountdown(3);
        
        // Create recursive countdown function
        const startCountdown = (count: number) => {
          if (count <= 0) {
            // When countdown reaches 0, end the game
            if (gameState === 'game') {
              endGame();
            }
            return;
          }
          
          // Set next countdown value
          const timer = setTimeout(() => {
            setWarningCountdown(count - 1);
            startCountdown(count - 1);
          }, 1000);
          
          // Store timer ID
          setGameOverTimer(timer);
        };
        
        // Start the countdown
        startCountdown(3);
      }, 1000); // Wait 1 second before starting the countdown
      
    } else if (!isAboveLine && isAboveLineRef.current) {
      // Ball has moved back below the red line
      isAboveLineRef.current = false;
      
      // Clear all timers
      if (gameOverTimer) {
        clearTimeout(gameOverTimer);
        setGameOverTimer(null);
      }
      
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
      
      // Reset countdown
      setWarningCountdown(null);
    }
  };
  
  // Create and add a new ball
  const addBall = (x: number, y: number, value: number, size = BALL_RADIUS, isNewBall = false) => {
    if (!worldRef.current || !engineRef.current) return;
    
    const Bodies = Matter.Bodies;
    const Body = Matter.Body;
    
    // Scale size based on value - making higher values more visible
    // Using a logarithmic scale for better size distribution
    const scaledSize = isNewBall ? size : Math.min(BALL_RADIUS * (1 + Math.log2(value) * 0.3), BALL_RADIUS * 4);
    
    // Create a new ball with simplified properties
    const ball = Bodies.circle(x, y, scaledSize, {
      restitution: 0.6,  // Doubled bounciness for more dynamic gameplay
      friction: 0.8,     // Increased surface friction for better stacking
      frictionAir: 0.01, // Reduced air resistance
      density: 0.8,      // Affects mass and collision behavior
      collisionFilter: COLLISION_FILTER,  // Ensure it collides with walls and other balls
      slop: 0.15 // Increased slop for more forgiving collision detection
    });
    
    // Apply initial velocity to ensure gravity takes effect immediately
    // User-dropped balls get a higher initial downward velocity for visual effect
    // Merged balls just get a small nudge
    const initialVelocity = isNewBall 
      ? { x: (Math.random() - 0.5) * 0.2, y: 0.5 }  // Small random x movement for merged balls
      : { x: 0, y: 1 };   // Clean initial velocity for user-dropped balls
      
    Body.setVelocity(ball, initialVelocity);
    
    // Add ball to world
    Matter.World.add(worldRef.current, ball);
    
    // Force an update to apply physics immediately
    Matter.Engine.update(engineRef.current, 16.67); // ~60fps
    
    // Apply a small impulse to ensure the ball starts moving
    Body.applyForce(ball, ball.position, { x: 0, y: 0.05 });
    
    // Add to balls array
    ballsRef.current.push({
      body: ball,
      value,
      size: scaledSize,
      isNew: isNewBall
    });
    
    // After a short delay, mark the ball as not new to allow merging
    if (isNewBall) {
      setTimeout(() => {
        // Check if the ball still exists before updating
        const index = ballsRef.current.findIndex(b => b.body.id === ball.id);
        if (index >= 0 && ballsRef.current[index]) {
          ballsRef.current[index].isNew = false;
        }
      }, 300);  // Increased delay to prevent immediate merging
    }
  };
  
  // Drop a new ball
  const dropBall = () => {
    if (gameState !== 'game' || !canDropRef.current) return;
    
    // Prevent dropping multiple balls rapidly
    canDropRef.current = false;
    
    // Use mouse X position for dropping the ball
    const dropX = Math.max(
      BALL_RADIUS * 2, 
      Math.min(mousePositionRef.current.x, CANVAS_WIDTH - BALL_RADIUS * 2)
    );
    
    // Add some variation to initial ball values (mostly 1s, but occasionally 2s)
    const initialValue = nextBallValue;
    
    // Generate next ball value for preview
    const newNextBallValue = Math.random() < 0.9 ? 1 : 2;
    setNextBallValue(newNextBallValue);
    
    // Higher starting position to give more space for falling
    const initialY = BALL_RADIUS;
    
    // Record time of last drop
    lastDropTimeRef.current = Date.now();
    
    // Drop a new ball
    addBall(dropX, initialY, initialValue);
    
    // Increment score
    setScore(prevScore => prevScore + 1);
    
    // Allow dropping again after a short delay
    dropTimeoutRef.current = setTimeout(() => {
      canDropRef.current = true;
    }, 500);
  };
  
  // Start the game
  const startGame = () => {
    // Reset the game state
    setGameState('game');
    setScore(0);
    
    // Pre-generate the first ball's value
    setNextBallValue(Math.random() < 0.9 ? 1 : 2);
    
    // Clear any existing timers
    if (gameOverTimer) {
      clearTimeout(gameOverTimer);
      setGameOverTimer(null);
    }
    
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    
    if (dropTimeoutRef.current) {
      clearTimeout(dropTimeoutRef.current);
      dropTimeoutRef.current = null;
    }
    
    // Reset countdown
    setWarningCountdown(null);
    
    // The physics will be re-initialized in the useEffect triggered by gameState change
    
    // Reset game over state
    isAboveLineRef.current = false;
    canDropRef.current = true;
    lastDropTimeRef.current = 0;
    
    // Clear the balls array to start fresh
    ballsRef.current = [];
  };
  
  // End the game
  const endGame = () => {
    // Clear timers
    if (gameOverTimer) {
      clearTimeout(gameOverTimer);
    }
    
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    
    if (dropTimeoutRef.current) {
      clearTimeout(dropTimeoutRef.current);
      dropTimeoutRef.current = null;
    }
    
    // Reset countdown
    setWarningCountdown(null);
    
    // Update high score if needed
    if (score > highScore) {
      setHighScore(score);
      saveHighScore(score);
    }
    
    // Set game state to gameover - this triggers cleanup in useEffect
    setGameState('gameover');
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (runnerRef.current) {
        Matter.Runner.stop(runnerRef.current);
      }
      
      if (renderRef.current) {
        Matter.Render.stop(renderRef.current);
      }
      
      // Remove event listeners to prevent memory leaks
      if (engineRef.current) {
        Matter.Events.off(engineRef.current, 'collisionStart');
        Matter.Events.off(engineRef.current, 'afterUpdate');
      }
      
      if (gameOverTimer) {
        clearTimeout(gameOverTimer);
      }
      
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
      
      if (dropTimeoutRef.current) {
        clearTimeout(dropTimeoutRef.current);
      }
    };
  }, [gameOverTimer]);
  
  // Initialize physics when the game starts
  useEffect(() => {
    if (gameState === 'game') {
      console.log('Initializing physics engine...');
      
      // Initialize or reinitialize physics
      const cleanup = initPhysics();
      
      // Debug: log that physics engine was initialized
      console.log('Physics engine initialized successfully');
      
      return cleanup;
    }
  }, [gameState]);
  
  // Render the game
  useEffect(() => {
    if (gameState !== 'game' || !canvasRef.current) return;
    
    console.log('Setting up rendering loop...');
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    
    // Custom render function using requestAnimationFrame instead of Matter.js events
    const renderGame = () => {
      if (!ctx || gameState !== 'game') return;
      
      // Update physics engine on each animation frame
      if (engineRef.current) {
        Matter.Engine.update(engineRef.current, 16.67);
      }
      
      // Clear the canvas to start fresh
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // First draw the white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Draw the boundaries (walls)
      if (worldRef.current) {
        const bodies = Matter.Composite.allBodies(worldRef.current);
        bodies.forEach(body => {
          if (body.isStatic) {
            // Draw walls
            const vertices = body.vertices;
            ctx.beginPath();
            ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let i = 1; i < vertices.length; i++) {
              ctx.lineTo(vertices[i].x, vertices[i].y);
            }
            ctx.closePath();
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });
      }
      
      // Draw preview ball when the user can drop
      if (canDropRef.current) {
        const previewX = Math.max(
          BALL_RADIUS * 2, 
          Math.min(mousePositionRef.current.x, CANVAS_WIDTH - BALL_RADIUS * 2)
        );
        const previewY = BALL_RADIUS;
        
        // Get color based on next ball value
        const hue = (nextBallValue * 30) % 360;
        const fillColor = nextBallValue === 1 ? '#ffffff' : `hsl(${hue}, 80%, 85%)`;
        
        // Draw semi-transparent preview ball
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(previewX, previewY, BALL_RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle = fillColor;
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw value
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const fontSize = Math.max(10, Math.min(16, BALL_RADIUS * 0.7));
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillText(nextBallValue.toString(), previewX, previewY);
        
        // Reset alpha
        ctx.globalAlpha = 1.0;
      }
      
      // Draw red line
      ctx.beginPath();
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.moveTo(0, redLineYRef.current);
      ctx.lineTo(CANVAS_WIDTH, redLineYRef.current);
      ctx.stroke();
      
      // Add warning text if balls are above the line
      if (isAboveLineRef.current) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('WARNING!', CANVAS_WIDTH / 2, redLineYRef.current - 25);
        
        // Show countdown if active
        if (warningCountdown !== null) {
          ctx.font = 'bold 24px monospace';
          ctx.fillText(warningCountdown.toString(), CANVAS_WIDTH / 2, redLineYRef.current - 5);
        }
      }
      
      // Draw ball values and ensure borders are drawn
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Draw each ball's value and border
      ballsRef.current.forEach(ball => {
        const pos = ball.body.position;
        const radius = ball.size;
        
        // Only render if ball is within view
        if (pos.y > -100 && pos.y < CANVAS_HEIGHT + 100 && 
            pos.x > -100 && pos.x < CANVAS_WIDTH + 100) {
          
          // Get color based on value
          const hue = (ball.value * 30) % 360;
          const fillColor = ball.value === 1 ? '#ffffff' : `hsl(${hue}, 80%, 85%)`;
          
          // Draw ball fill manually
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
          ctx.fillStyle = fillColor;
          ctx.fill();
          
          // Draw ball border manually to ensure it shows up
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Scale font size based on ball size
          const fontSize = Math.max(10, Math.min(16, radius * 0.7));
          ctx.font = `bold ${fontSize}px monospace`;
          ctx.fillStyle = 'black';
          
          ctx.fillText(
            ball.value.toString(),
            pos.x,
            pos.y
          );
        }
      });
      
      // Request the next animation frame
      animationFrameId = requestAnimationFrame(renderGame);
    };
    
    // Start the rendering loop
    renderGame();
    console.log('Rendering loop started');
    
    return () => {
      // Clean up on unmount or when gameState changes
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        console.log('Rendering loop stopped');
      }
    };
  }, [gameState, isAboveLineRef.current]);
  
  // Handle canvas click
  const handleCanvasClick = () => {
    if (gameState === 'game') {
      dropBall();
    }
  };
  
  // Add keyboard event handler for spacebar to drop balls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'game' && (e.code === 'Space' || e.key === ' ')) {
        dropBall();
        e.preventDefault(); // Prevent page scroll
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState]);
  
  // Set focus to canvas when game starts
  useEffect(() => {
    if (gameState === 'game' && canvasRef.current) {
      canvasRef.current.focus();
    }
  }, [gameState]);
  
  // Track mouse position for ball dropping
  useEffect(() => {
    if (gameState !== 'game' || !canvasRef.current) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      
      // Get canvas position
      const rect = canvasRef.current.getBoundingClientRect();
      
      // Calculate mouse position relative to canvas
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Update mouse position ref
      mousePositionRef.current = { x, y };
    };
    
    // Add mouse move listener
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gameState]);
  
  return (
    <ProjectWindow
      title="Dropola"
      initialPosition={initialPosition}
      initialSize={initialSize}
      onClose={onClose}
      icon="joy_110"
      maximizable
    >
      <div className={styles.dropolaContainer}>
        <h2>❖ Dropola ❖</h2>
        
        {gameState === 'menu' && (
          <div className={styles.menuContainer}>
            <div className={styles.instructions}>
              <p>Drop balls and combine same numbers.</p>
              <p>Click to drop a ball.</p>
              <p>Keep balls below the red line!</p>
              <p>Highest score: {highScore}</p>
            </div>
            <button className={styles.button} onClick={startGame}>Play</button>
          </div>
        )}
        
        {gameState === 'game' && (
          <div className={styles.gameContainer}>
            <div className={styles.scoreBoard}>
              <span>Score: {score}</span>
              <span>High Score: {highScore}</span>
            </div>
            <canvas 
              ref={canvasRef} 
              id="gameCanvas" 
              width={CANVAS_WIDTH} 
              height={CANVAS_HEIGHT}
              onClick={handleCanvasClick}
              className={styles.gameCanvas}
              tabIndex={0} // Make canvas focusable
            ></canvas>
            <div className={styles.controls}>
              <button className={styles.dropButton} onClick={dropBall}>Drop Ball</button>
            </div>
          </div>
        )}
        
        {gameState === 'gameover' && (
          <div className={styles.gameoverContainer}>
            <h3>Game Over!</h3>
            <p>Your Score: {score}</p>
            <p>High Score: {highScore}</p>
            <button className={styles.button} onClick={startGame}>Play Again</button>
          </div>
        )}
      </div>
    </ProjectWindow>
  );
};

export default Dropola; 