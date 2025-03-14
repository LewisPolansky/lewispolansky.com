import React, { useState, useRef, useEffect } from 'react';
import styles from './ProjectWindow.module.css';
import clsx from 'clsx';

interface ProjectWindowProps {
  title: string;
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  initialSize?: { width?: number; height?: number };
  onClose?: () => void;
  minimizable?: boolean;
  maximizable?: boolean;
  isTerminal?: boolean;
}

export const ProjectWindow: React.FC<ProjectWindowProps> = ({
  title,
  children,
  initialPosition = { x: 50, y: 50 },
  initialSize = { width: 350, height: 275 },
  onClose,
  // minimizable = true,
  maximizable = true,
  isTerminal = false,
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  // const [isMinimized, setIsMinimized] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [prevSize, setPrevSize] = useState(initialSize);
  const [prevPosition, setPrevPosition] = useState(initialPosition);
  const [isFocused, setIsFocused] = useState(false);
  
  const windowRef = useRef<HTMLDivElement>(null);

  // Handle window focus
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (windowRef.current && windowRef.current.contains(e.target as Node)) {
        setIsFocused(true);
      } else {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // Handle resizing
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      } else if (isResizing) {
        const newWidth = Math.max(200, e.clientX - position.x);
        const newHeight = Math.max(100, e.clientY - position.y);
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, position]);

  const handleMaximize = () => {
    if (!isMaximized) {
      setPrevSize(size);
      setPrevPosition(position);
      setIsMaximized(true);
      setSize({ width: window.innerWidth, height: window.innerHeight - 40 });
      setPosition({ x: 0, y: 0 });
    } else {
      setIsMaximized(false);
      setSize(prevSize);
      setPosition(prevPosition);
    }
  };

  // Minimize functionality to be implemented
  // const handleMinimize = () => {
  //   setIsMinimized(!isMinimized);
  // };

  return (
    <div 
      className={clsx(
        styles.window,
        isMaximized && styles.maximized,
        // isMinimized && styles.minimized,
        isFocused ? styles.focused : styles.unfocused
      )}
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
      ref={windowRef}
    >
      <div className={clsx(
        styles.titleBar, 
        isTerminal && styles.terminalTitleBar,
        isFocused ? styles.focused : styles.unfocused
      )} onMouseDown={handleMouseDown}>
        <div className={styles.titleText}>{title}</div>
        <div className={styles.windowControls}>
          {/* {minimizable && (
            <button 
              className={clsx(styles.controlButton, styles.minimizeButton)} 
              onClick={handleMinimize}
            >
              _
            </button>
          )} */}
          {maximizable && (
            <button className={styles.controlButton} onClick={handleMaximize}>
              □
            </button>
          )}
          {onClose && (
            <button className={styles.controlButton} onClick={onClose}>
              ×
            </button>
          )}
        </div>
      </div>
      <div className={styles.menuBar}>
        <div className={styles.menuItem}>File</div>
        <div className={styles.menuItem}>Edit</div>
        <div className={styles.menuItem}>View</div>
        <div className={styles.menuItem}>Help</div>
      </div>
      <div className={styles.windowContent}>
        {children}
      </div>
      <div 
        className={styles.resizeHandle}
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
};
