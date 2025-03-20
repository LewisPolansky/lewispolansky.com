import React, { useState, useRef, useEffect } from 'react';
import { ProjectWindow } from './ProjectWindow';
import styles from './Terminal.module.css';
import heyThereTxt from '../data/heyo.txt?raw';
import Dropola from './Dropola';

interface TerminalProps {
  title?: string;
  initialPosition?: { x: number; y: number };
  initialSize?: { width?: number; height?: number };
  onClose?: () => void;
  onRunCommand?: (command: string) => void;
  onKillProcess?: (processName: string) => void;
  systemMessage?: string;
  activeProcesses?: { name: string; count: number }[];
}

interface TerminalCommand {
  command: string;
  output: string;
}

// Added TextEditor interface
interface TextEditor {
  filename: string;
  content: string;
  isOpen: boolean;
}

// IndexedDB configuration
const DB_NAME = 'LewOSFileSystem';
const DB_VERSION = 1;
const FILE_STORE = 'files';

const LEWOS_ASCII = `
____                                 ____      ____   
\`MM'                                6MMMMb    6MMMMb\\ 
 MM                                8P    Y8  6M'    \` 
 MM        ____  ____    _    ___ 6M      Mb MM       
 MM       6MMMMb \`MM(   ,M.   )M' MM      MM YM.      
 MM      6M'  \`Mb \`Mb   dMb   d'  MM      MM  YMMMMb  
 MM      MM    MM  YM. ,PYM. ,P   MM      MM      \`Mb 
 MM      MMMMMMMM  \`Mb d'\`Mb d'   MM      MM       MM 
 MM      MM         YM,P  YM,P    YM      M9       MM 
 MM    / YM    d9   \`MM'  \`MM'     8b    d8  L    ,M9 
_MMMMMMM  YMMMM9     YP    YP       YMMMM9   MYMMMM9  

                                      
Welcome to LewOS v1.0.0
Type 'help' for available commands.
`;

// Initial files that will be loaded if no IndexedDB data exists
const INITIAL_FILES: Record<string, string> = {
  'heyo.txt': heyThereTxt
};

const HELP_TEXT = `
Available commands:
  ls    - List files in the current directory
  cat   - Display contents of a file (usage: cat filename)
  clear - Clear the terminal screen
  help  - Show this help message
  lew   - Lewis's Editing Workshop (usage: lew filename)
  rm    - Delete a file (usage: rm filename)
  download - Download a file to your PC (usage: download filename)
  run   - Run a program (usage: run program.exe)
         - Try "run constellation.exe" to open a new browser window!
         - Try "run race.exe" to test your typing speed!
         - Try "run starbox.exe" to play the Starbox puzzle!
         - Try "run dropola.exe" to play Dropola!
  ps    - List running processes
  kill  - Close a running process (usage: kill process_name)
`;

export const Terminal: React.FC<TerminalProps> = ({
  title = 'LewOS Terminal',
  initialPosition,
  initialSize = { width: 600, height: 400 },
  onClose,
  onRunCommand,
  onKillProcess,
  systemMessage,
  activeProcesses = [],
}) => {
  const [commandHistory, setCommandHistory] = useState<TerminalCommand[]>([]);
  const [currentChars, setCurrentChars] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);
  // Added for text editor functionality
  const [textEditor, setTextEditor] = useState<TextEditor | null>(null);
  // State to hold virtual files
  const [virtualFiles, setVirtualFiles] = useState<Record<string, string>>({});
  // Database reference
  const dbRef = useRef<IDBDatabase | null>(null);
  // Added for save feedback
  const [showSaveFeedback, setShowSaveFeedback] = useState(false);
  // Added for Dropola game
  const [isDropolaRunning, setIsDropolaRunning] = useState(false);

  // Open IndexedDB connection
  useEffect(() => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // Create an object store to hold file data
      if (!db.objectStoreNames.contains(FILE_STORE)) {
        db.createObjectStore(FILE_STORE);
      }
    };
    
    request.onsuccess = (event) => {
      dbRef.current = (event.target as IDBOpenDBRequest).result;
      loadFiles();
    };
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      // Fall back to initial files if database fails
      setVirtualFiles(INITIAL_FILES);
    };
    
    return () => {
      if (dbRef.current) {
        dbRef.current.close();
      }
    };
  }, []);

  // Load files from IndexedDB
  const loadFiles = async () => {
    if (!dbRef.current) return;
    
    try {
      const transaction = dbRef.current.transaction(FILE_STORE, 'readonly');
      const store = transaction.objectStore(FILE_STORE);
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        // Convert array of files to object format
        const files: Record<string, string> = {};
        
        // First check if we have any stored files
        if (getAllRequest.result.length > 0) {
          // Get all keys
          const getAllKeysRequest = store.getAllKeys();
          getAllKeysRequest.onsuccess = () => {
            getAllKeysRequest.result.forEach((key, index) => {
              files[key.toString()] = getAllRequest.result[index];
            });
            setVirtualFiles(files);
          };
        } else {
          // Initialize with default files if store is empty
          setVirtualFiles(INITIAL_FILES);
          // Save initial files to database
          Object.entries(INITIAL_FILES).forEach(([filename, content]) => {
            saveFile(filename, content);
          });
        }
      };
      
      getAllRequest.onerror = (event) => {
        console.error('Error loading files:', event);
        setVirtualFiles(INITIAL_FILES);
      };
    } catch (error) {
      console.error('Error in loadFiles:', error);
      setVirtualFiles(INITIAL_FILES);
    }
  };

  // Save a file to IndexedDB
  const saveFile = (filename: string, content: string) => {
    if (!dbRef.current) return;
    
    try {
      const transaction = dbRef.current.transaction(FILE_STORE, 'readwrite');
      const store = transaction.objectStore(FILE_STORE);
      store.put(content, filename);
      
      // Update state
      setVirtualFiles(prev => ({
        ...prev,
        [filename]: content
      }));

      // Show save feedback
      setShowSaveFeedback(true);
      setTimeout(() => {
        setShowSaveFeedback(false);
      }, 1000); // Reset after 1 second
      
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  // Delete a file from IndexedDB
  const deleteFile = (filename: string) => {
    if (!dbRef.current) return false;
    
    try {
      const transaction = dbRef.current.transaction(FILE_STORE, 'readwrite');
      const store = transaction.objectStore(FILE_STORE);
      store.delete(filename);
      
      // Update state
      setVirtualFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[filename];
        return newFiles;
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  };

  const executeCommand = (chars: string[]): string => {
    const command = chars.join('');
    const trimmedCommand = command.trim();
    if (!trimmedCommand) return '';

    const args = trimmedCommand.split(/\s+/);
    const cmd = args[0].toLowerCase();

    switch (cmd) {
      case 'ls':
        return Object.keys(virtualFiles).join('\n');
      case 'cat': {
        if (args.length < 2) return 'Usage: cat <filename>';
        const filename = args[1];
        return virtualFiles[filename] !== undefined 
          ? virtualFiles[filename] 
          : `cat: ${filename}: No such file`;
      }
      case 'clear':
        setCommandHistory([]);
        return '';
      case 'help':
        return HELP_TEXT;
      case 'ps': {
        if (activeProcesses.length === 0) {
          return 'No processes currently running.';
        }
        
        let output = 'PROCESS NAME                COUNT\n';
        output += '-----------------------------\n';
        
        activeProcesses.forEach(proc => {
          // Pad the name to align columns
          const paddedName = proc.name.padEnd(25, ' ');
          output += `${paddedName} ${proc.count}\n`;
        });
        
        return output;
      }
      case 'run': {
        if (args.length < 2) return 'Usage: run <program.exe>';
        const program = args[1].toLowerCase();
        
        // Handle system programs
        if (program === 'constellation.exe') {
          if (onRunCommand) {
            onRunCommand('constellation.exe');
            return 'Starting Constellation Browser...';
          }
          return 'Unable to start program: Constellation Browser not installed';
        } else if (program === 'race.exe') {
          if (onRunCommand) {
            onRunCommand('race.exe');
            return 'Starting ASCII Racing Challenge...';
          }
          return 'Unable to start program: Racing app not installed';
        } else if (program === 'starbox.exe') {
          if (onRunCommand) {
            onRunCommand('starbox.exe');
            return 'Starting Starbox puzzle game...';
          }
          return 'Unable to start program: Starbox not installed';
        } else if (program === 'dropola.exe') {
          if (onRunCommand) {
            // If we're running in the Terminal window, start Dropola in the embedded view
            if (!initialPosition) {
              setIsDropolaRunning(true);
              return 'Starting Dropola game in terminal window...';
            }
            // Otherwise delegate to the parent component to open in a new window
            onRunCommand('dropola.exe');
            return 'Starting Dropola game...';
          }
          return 'Unable to start program: Dropola not installed';
        }
        
        return `Unknown program: ${args[1]}`;
      }
      case 'lew': {
        if (args.length < 2) return 'Usage: lew <filename>';
        const filename = args[1];
        
        // Validate filename has proper extension (at least one alphanumeric after period)
        const extensionRegex = /\.[a-zA-Z0-9]+$/;
        if (!extensionRegex.test(filename)) {
          return `Error: Invalid filename '${filename}'. Filename must have an extension (e.g. .txt, .md, .js)`;
        }
        
        const content = virtualFiles[filename] || '';
        setTextEditor({
          filename,
          content,
          isOpen: true
        });
        return `Opening ${filename} in the lew editor...`;
      }
      case 'rm': {
        if (args.length < 2) return 'Usage: rm <filename>';
        const filename = args[1];
        
        if (virtualFiles[filename] === undefined) {
          return `rm: ${filename}: No such file`;
        }
        
        const success = deleteFile(filename);
        return success 
          ? `${filename} has been deleted.` 
          : `Failed to delete ${filename}.`;
      }
      case 'download': {
        if (args.length < 2) return 'Usage: download <filename>';
        const filename = args[1];
        
        if (virtualFiles[filename] === undefined) {
          return `download: ${filename}: No such file`;
        }
        
        downloadFile(filename, virtualFiles[filename]);
        return `Downloading ${filename} to your PC...`;
      }
      case 'kill': {
        if (args.length < 2) return 'Usage: kill <process_name>';
        
        const processName = args.slice(1).join(' ');
        const processExists = activeProcesses.some(proc => 
          proc.name.toLowerCase() === processName.toLowerCase());
        
        if (!processExists) {
          return `No process found with name: ${processName}`;
        }
        
        if (processName.toLowerCase() === 'lewos terminal') {
          return `Cannot kill the Terminal process. That would be suicide!`;
        }
        
        if (onKillProcess) {
          onKillProcess(processName);
          return `Sending termination signal to ${processName}...`;
        }
        
        return `Unable to kill process: ${processName}`;
      }
      default:
        return `Command not found: ${cmd}. Type 'help' for available commands.`;
    }
  };

  // Function to download a file to the user's PC
  const downloadFile = (filename: string, content: string) => {
    // Create a blob with the file content
    const blob = new Blob([content], { type: 'text/plain' });
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Append to the document
    document.body.appendChild(link);
    
    // Trigger a click on the link
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // New handler for editor key events
  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    if (!textEditor) return;

    // Ctrl+S to save
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveFile(textEditor.filename, textEditor.content);
      setCommandHistory(prev => [...prev, { 
        command: '',
        output: `File ${textEditor.filename} saved.` 
      }]);
      return;
    }

    // Escape to exit editor
    if (e.key === 'Escape') {
      e.preventDefault();
      setTextEditor(null);
      setCommandHistory(prev => [...prev, { 
        command: '', 
        output: `Exited lew editor.` 
      }]);
      return;
    }

    // Handle text editing
    if (e.key === 'Enter') {
      e.preventDefault();
      setTextEditor({
        ...textEditor,
        content: textEditor.content + '\n'
      });
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      if (textEditor.content.length > 0) {
        setTextEditor({
          ...textEditor,
          content: textEditor.content.slice(0, -1)
        });
      }
    } else if (e.key.length === 1) {
      e.preventDefault();
      setTextEditor({
        ...textEditor,
        content: textEditor.content + e.key
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (textEditor?.isOpen) {
      handleEditorKeyDown(e);
      return;
    }

    e.preventDefault();

    if (e.key === 'Enter') {
      const command = currentChars.join('');
      const output = executeCommand(currentChars);
      if (command.trim()) {
        setCommandHistory(prev => [...prev, { command, output }]);
      }
      setCurrentChars([]);
      setHistoryIndex(-1);
    } else if (e.key === 'Backspace') {
      setCurrentChars(prev => prev.slice(0, -1));
    } else if (e.key === 'ArrowUp') {
      if (commandHistory.length > 0) {
        const newIndex = historyIndex + 1;
        if (newIndex < commandHistory.length) {
          setHistoryIndex(newIndex);
          setCurrentChars(commandHistory[commandHistory.length - 1 - newIndex].command.split(''));
        }
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIndex > -1) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentChars(
          newIndex >= 0 
            ? commandHistory[commandHistory.length - 1 - newIndex].command.split('')
            : []
        );
      }
    } else if (e.key.length === 1) {
      // Only add printable characters
      setCurrentChars(prev => [...prev, e.key]);
    }
  };

  // Focus handling
  const handleTerminalClick = () => {
    terminalRef.current?.focus();
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commandHistory, textEditor]);

  // Handle system messages
  useEffect(() => {
    if (systemMessage) {
      setCommandHistory(prev => [...prev, { 
        command: '', 
        output: `System: ${systemMessage}` 
      }]);
      
      // Reset the message after it's displayed
      if (onRunCommand) {
        // We're using onRunCommand as a callback function to reset the message
        // A bit of a hack, but it works for this simple use case
        setTimeout(() => onRunCommand(''), 100);
      }
    }
  }, [systemMessage, onRunCommand]);

  // Handle Dropola exit
  const handleDropolaExit = () => {
    setIsDropolaRunning(false);
    setCommandHistory(prev => [...prev, { 
      command: '', 
      output: 'Dropola game closed.' 
    }]);
  };

  return (
    <ProjectWindow
      title={
        isDropolaRunning 
          ? 'Dropola' 
          : textEditor 
            ? `LewOS Editor - ${textEditor.filename}` 
            : title
      }
      initialPosition={initialPosition}
      initialSize={initialSize}
      onClose={onClose}
      icon={isDropolaRunning ? "joystick_106" : textEditor ? "html_page" : "computer"}
      maximizable
      isTerminal
    >
      {isDropolaRunning ? (
        <Dropola onClose={handleDropolaExit} />
      ) : (
        <div 
          className={styles.terminalContent} 
          ref={terminalRef}
          onClick={handleTerminalClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {!textEditor ? (
            <>
              <pre 
                className={styles.asciiArt} 
                style={{ animationDelay: '0s' }}
              >
                {LEWOS_ASCII}
              </pre>
              {commandHistory.map((entry, i) => (
                <div key={i}>
                  <div 
                    className={styles.commandLine}
                    style={{ animationDelay: `${0.1 * (i * 2)}s` }}
                  >
                    <span className={styles.prompt}>{'#'}</span> {entry.command}
                  </div>
                  {entry.output && (
                    <pre 
                      className={styles.commandOutput}
                      style={{ animationDelay: `${0.1 * (i * 2 + 1)}s` }}
                    >
                      {entry.output}
                    </pre>
                  )}
                </div>
              ))}
              <div className={styles.inputLine}>
                <span className={styles.prompt}>{'#'}</span>
                <span className={styles.commandInput}>
                  {currentChars.join('')}
                  <span className={styles.cursor} />
                </span>
              </div>
            </>
          ) : (
            <div className={styles.editorContainer}>
              <div className={styles.editorHeader} style={showSaveFeedback ? { backgroundColor: '#008800', transition: 'background-color 0.3s' } : {}}>
                {textEditor.filename} | {showSaveFeedback ? 'Saved!' : 'Press Ctrl+S to save, Esc to exit'}
              </div>
              <div className={styles.editorContent}>
                {textEditor.content}
                <span className={styles.cursor} />
              </div>
            </div>
          )}
        </div>
      )}
    </ProjectWindow>
  );
};
