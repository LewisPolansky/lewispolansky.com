import React, { useState, useEffect } from 'react';
import { ProjectWindow } from './ProjectWindow';
import { Starbox } from './Starbox';
import styles from './Browser.module.css';

interface BrowserProps {
  title?: string;
  initialPosition?: { x: number; y: number };
  initialSize?: { width?: number; height?: number };
  initialUrl?: string;
  onClose?: () => void;
}

export const Browser: React.FC<BrowserProps> = ({
  title = 'Internet Browser',
  initialPosition,
  initialSize = { width: 640, height: 480 },
  initialUrl = 'https://lewis.polansky.com',
  onClose,
}) => {
  const [url, setUrl] = useState<string>(initialUrl);
  const [inputUrl, setInputUrl] = useState<string>(initialUrl);
  const [history, setHistory] = useState<string[]>([initialUrl]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showFavorites, setShowFavorites] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(true);
  
  const favorites = [
    { name: 'Lewis Polansky', url: 'https://lewispolansky.com' },
    { name: 'Captain', url: 'https://v0-captain-mu.vercel.app/' },
    { name: 'AiCode.fail', url: 'https://aicode.fail' },
    { name: 'CyberSpace', url: 'https://cyberspaceclub.wordpress.com/' },
  ];

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const handleNavigate = (newUrl: string) => {
    // Validate URL format
    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
      newUrl = 'https://' + newUrl;
    }
    
    setIsLoading(true);
    setShowError(false);
    
    // Simulate loading time
    setTimeout(() => {
      setUrl(newUrl);
      setInputUrl(newUrl);
      
      // Simulate error for non-whitelisted domains
      const allowedDomains = ['example.com', 'lewispolansky.com'];
      const urlDomain = new URL(newUrl).hostname.replace('www.', '');
      const isDomainAllowed = allowedDomains.some(domain => urlDomain.includes(domain));
      
      if (!isDomainAllowed) {
        setShowError(true);
      }
      
      // Update history
      if (newUrl !== history[historyIndex]) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newUrl);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
      
      setIsLoading(false);
    }, 800);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setUrl(history[historyIndex - 1]);
      setInputUrl(history[historyIndex - 1]);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setUrl(history[historyIndex + 1]);
      setInputUrl(history[historyIndex + 1]);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setShowError(false);
    setTimeout(() => {
      setIsLoading(false);
      
      // Check if we should show an error
      const allowedDomains = ['example.com', 'lewispolansky.com'];
      const urlDomain = new URL(url).hostname.replace('www.', '');
      const isDomainAllowed = allowedDomains.some(domain => urlDomain.includes(domain));
      
      if (!isDomainAllowed) {
        setShowError(true);
      }
    }, 500);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleNavigate(inputUrl);
  };

  const toggleFavorites = () => {
    setShowFavorites(!showFavorites);
  };

  const getDefaultPage = () => {
    return (
      <div className={styles.defaultPage}>
        <h1>Welcome to Constellation</h1>
        <p>The Internet starts here</p>
        <div className={styles.quickLinks}>
          <h2>Quick Links</h2>
          <ul>
            {favorites.map((fav, index) => (
              <li key={index}>
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate(fav.url); }}>
                  {fav.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.searchSection}>
          <h2>Search the web</h2>
          <form onSubmit={(e) => { e.preventDefault(); handleNavigate(`https://example.com/search?q=${encodeURIComponent(inputUrl)}`); }}>
            <input 
              type="text" 
              className={styles.searchBox} 
              placeholder="Enter search terms..."
              value={inputUrl === initialUrl ? '' : inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
            />
            <button type="submit" className={styles.searchButton}>Search</button>
          </form>
        </div>
      </div>
    );
  };

  const getErrorPage = () => {
    return (
      <div className={styles.errorPage}>
        <h1>Page cannot be displayed</h1>
        <p>The page you are looking for is currently unavailable.</p>
        <p>The Web site might be experiencing technical difficulties, or you may need to adjust your browser settings.</p>
        <div className={styles.errorActions}>
          <button onClick={handleRefresh} className={styles.errorButton}>Refresh</button>
          <button onClick={() => handleNavigate('https://example.com')} className={styles.errorButton}>Go to Homepage</button>
        </div>
        
        {/* Starbox Game */}
        <Starbox onPlayAgain={() => setShowError(true)} />
      </div>
    );
  };

  // If the browser is closed, don't render anything
  if (!isOpen) {
    return null;
  }

  return (
    <ProjectWindow
      title={title}
      initialPosition={initialPosition}
      initialSize={initialSize}
      onClose={handleClose}
      maximizable={true}
      icon="msrating_108"
    >
      <div className={styles.browserContainer}>
        <div className={styles.toolbar}>
          <button 
            className={styles.navButton} 
            onClick={handleBack}
            disabled={historyIndex <= 0}
          >
            ←
          </button>
          <button 
            className={styles.navButton} 
            onClick={handleForward}
            disabled={historyIndex >= history.length - 1}
          >
            →
          </button>
          <button 
            className={styles.navButton} 
            onClick={handleRefresh}
          >
            ↻
          </button>
          <button 
            className={styles.navButton} 
            onClick={() => handleNavigate('https://example.com')}
          >
            Home
          </button>
          <button 
            className={styles.navButton} 
            onClick={toggleFavorites}
          >
            ★
          </button>
          <form onSubmit={handleUrlSubmit} className={styles.urlForm}>
            <span className={styles.addressLabel}>Address:</span>
            <input
              type="text"
              className={styles.urlBar}
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
            />
            <button type="submit" className={styles.goButton}>Go</button>
          </form>
        </div>
        
        {showFavorites && (
          <div className={styles.favoritesBar}>
            {favorites.map((fav, index) => (
              <button 
                key={index} 
                className={styles.favButton}
                onClick={() => handleNavigate(fav.url)}
              >
                {fav.name}
              </button>
            ))}
          </div>
        )}
        
        <div className={styles.browserContent}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingHourglass}></div>
              <div className={styles.loadingText}>
                <div>Opening page...</div>
                <div>Please wait while Constellation connects to</div>
                <div className={styles.loadingUrl}>{url}</div>
              </div>
            </div>
          ) : showError ? (
            getErrorPage()
          ) : url === initialUrl ? (
            getDefaultPage()
          ) : (
            <iframe 
              src={url} 
              className={styles.iframe}
              title="Browser Content"
              sandbox="allow-same-origin allow-scripts"
              onError={() => setShowError(true)}
            />
          )}
        </div>
        <div className={styles.statusBar}>
          <div className={styles.statusText}>
            {isLoading ? 'Opening page...' : showError ? 'Error' : 'Done'}
          </div>
        </div>
      </div>
    </ProjectWindow>
  );
}; 