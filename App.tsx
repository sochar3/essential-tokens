import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CSSParserScreen from './components/screens/CSSParserScreen';
import VariableScannerScreen from './components/screens/VariableScannerScreen';
import TypographyScreen from './components/screens/TypographyScreen';
// InfoScreen removed from open source version
import WelcomeScreen from './components/screens/WelcomeScreen';
import ThemeToggle from './components/ui/theme-toggle';
import { DocumentIconLarge, PaletteIconLarge, TypeIconLarge, XIcon } from './components/ui/icons';

// InfoScreen removed from open source version
// For personal version, see: https://github.com/sochar3/essential-tokens-personal

// Navigation items for the sidebar
const navigationItems: NavigationItem[] = [
  {
    id: 'css-parser',
    title: 'Parse CSS',
    description: 'Parse CSS variables from tweakcn and preview tokens',
    icon: DocumentIconLarge
  },
  {
    id: 'variable-scanner',
    title: 'Color guides',
    description: 'Scan existing variables and generate color guides',
    icon: PaletteIconLarge
  },
  {
    id: 'typography',
    title: 'Type guide',
    description: 'Scan text styles and generate typography guides',
    icon: TypeIconLarge
  }
];

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  message: string;
  type: NotificationType;
}

interface NavigationItem {
  id: string;
  title: string;
  description: string;
  icon: () => JSX.Element;
}

// Performance: Extract static style objects to prevent recreation on every render
const STATIC_STYLES = {
  container: {
    display: 'flex' as const,
    height: '100vh',
    width: '100%',
    fontFamily: "'Geist', 'Inter', 'Manrope', system-ui, -apple-system, sans-serif",
    position: 'relative' as const,
    backgroundColor: 'var(--background)',
    color: 'var(--foreground)'
  },
  sidebar: {
    width: '56px',
    height: '100vh',
    backgroundColor: 'var(--card)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '12px 0',
    flexShrink: 0,
    justifyContent: 'space-between'
  },
  sidebarGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px'
  },
  logoButton: {
    borderRadius: '99px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
    border: '1px solid #ffffff45',
    
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    padding: 0
  },
  navButton: {
    width: '40px',
    height: '40px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    position: 'relative' as const
  },
  activeIndicator: {
    position: 'absolute' as const,
    left: '-1px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '3px',
    height: '20px',
    backgroundColor: 'var(--primary)',
    borderRadius: '0 2px 2px 0'
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    backgroundColor: 'var(--card)',
    minHeight: '52px'
  },
  headerContent: {
    flex: 1
  },
  headerTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--foreground)',
    margin: 0,
    lineHeight: '1.25'
  },
  headerDescription: {
    fontSize: '12px',
    color: 'var(--muted-foreground)',
    margin: '2px 0 0 0',
    lineHeight: '1.3'
  },
  main: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: 'var(--background)'
  },
  notificationButton: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    marginLeft: '8px'
  }
} as const;

// Performance: Memoize notification styles to prevent object recreation
const getNotificationStylesConfig = () => ({
  base: {
    position: 'absolute' as const,
    bottom: '16px',
    left: '72px',
    right: '16px',
    zIndex: 50,
    padding: '12px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '12px',
    boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.15)'
  },
  variants: {
    success: {
      backgroundColor: '#10b981',
      color: '#ffffff',
      border: '1px solid #059669'
    },
    error: {
      backgroundColor: '#ef4444',
      color: '#ffffff',
      border: '1px solid #dc2626'
    },
    info: {
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      border: '1px solid #2563eb'
    }
  }
});

export default function App() {
  const [activeScreen, setActiveScreen] = useState('welcome');
  const [showWelcome, setShowWelcome] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = useCallback((message: string, type: NotificationType) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleNavigateFromWelcome = useCallback((screenId: string) => {
    setActiveScreen(screenId);
    setShowWelcome(false);
  }, []);

  const handleSidebarNavigation = useCallback((screenId: string) => {
    setActiveScreen(screenId);
    setShowWelcome(false);
  }, []);

  const handleLogoClick = useCallback(() => {
    setShowWelcome(true);
    setActiveScreen('welcome');
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  // Performance: Memoize notification styles with proper dependency
  const notificationStyle = useMemo(() => {
    if (!notification) return null;
    
    const config = getNotificationStylesConfig();
    const variant = config.variants[notification.type] || {};
    
    return {
      ...config.base,
      ...variant
    };
  }, [notification?.type]);

  // Performance: Optimize mouse event handlers with useCallback
  const createMouseHandlers = useCallback((itemId: string, isActive: boolean) => ({
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isActive) {
        e.currentTarget.style.backgroundColor = 'var(--accent)';
        e.currentTarget.style.color = 'var(--foreground)';
      }
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isActive) {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = 'var(--muted-foreground)';
      }
    }
  }), []);

  const createLogoMouseHandlers = useCallback(() => ({
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.backgroundColor = 'var(--accent)';
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.backgroundColor = 'transparent';
    }
  }), []);

  const renderActiveScreen = useMemo(() => {
    if (showWelcome) {
      return <WelcomeScreen 
        onNavigateToScreen={handleNavigateFromWelcome} 
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />;
    }
    
    switch (activeScreen) {
      case 'css-parser':
        return <CSSParserScreen onShowNotification={showNotification} />;
      case 'variable-scanner':
        return <VariableScannerScreen onShowNotification={showNotification} />;
      case 'typography':
        return <TypographyScreen onShowNotification={showNotification} />;
      case 'info':
        // InfoScreen removed from open source version
        return <CSSParserScreen onShowNotification={showNotification} />;
      default:
        return <CSSParserScreen onShowNotification={showNotification} />;
    }
  }, [activeScreen, showWelcome, showNotification, handleNavigateFromWelcome, isDarkMode, toggleTheme]);

  // Performance: Optimize localStorage effects with better error handling
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('plugin-theme');
      if (savedTheme === 'dark') {
        setIsDarkMode(true);
      }
    } catch (error) {
      console.warn('Cannot access localStorage in this environment:', error);
    }
  }, []);

  useEffect(() => {
    try {
      document.documentElement.classList.toggle('dark', isDarkMode);
      localStorage.setItem('plugin-theme', isDarkMode ? 'dark' : 'light');
    } catch (error) {
      console.warn('Cannot update theme:', error);
    }
  }, [isDarkMode]);

  useEffect(() => {
    try {
      const hasUsedBefore = localStorage.getItem('plugin-has-used');
      if (hasUsedBefore) {
        setShowWelcome(false);
        setActiveScreen('css-parser');
      }
    } catch (error) {
      console.warn('Cannot check plugin usage history:', error);
    }
  }, []);

  useEffect(() => {
    if (!showWelcome) {
      try {
        localStorage.setItem('plugin-has-used', 'true');
      } catch (error) {
        console.warn('Cannot save plugin usage:', error);
      }
    }
  }, [showWelcome]);

  // Performance: Single message listener with proper cleanup
  useEffect(() => {
    const handleMessage = (message: MessageEvent) => {
      // Handle any global plugin messages here if needed
      switch (message.data?.pluginMessage?.type) {
        // Add any global message handlers here if needed
        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div style={STATIC_STYLES.container}>
      {/* Sidebar - Hide on welcome screen */}
      {!showWelcome && (
        <div style={STATIC_STYLES.sidebar}>
          <div style={STATIC_STYLES.sidebarGroup}>
            {/* Logo/Brand - Clickable to return to welcome */}
            <button
              onClick={handleLogoClick}
              title="Return to welcome screen"
              style={{
                ...STATIC_STYLES.logoButton,
                border: isDarkMode ? '1px solid #ffffff45' : 'none'
              }}
              {...createLogoMouseHandlers()}
            >
              <svg style={{ width: '32px', height: '32px' }} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_4_11)">
                  <rect width="128" height="128" rx="64" fill="black"/>
                  <g filter="url(#filter0_f_4_11)">
                    <ellipse cx="61.5" cy="130" rx="66.5" ry="50" fill="#D9D9D9"/>
                  </g>
                  <path d="M84 91.5V97H68.5V64V31L97 69.5L84 91.5Z" fill="white"/>
                  <path d="M44 91.5V97H59.5V31L31 69.5L44 91.5Z" fill="white"/>
                </g>
                <defs>
                  <filter id="filter0_f_4_11" x="-84.9" y="0.0999985" width="292.8" height="259.8" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                    <feGaussianBlur stdDeviation="39.95" result="effect1_foregroundBlur_4_11"/>
                  </filter>
                  <clipPath id="clip0_4_11">
                    <rect width="128" height="128" rx="64" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
            </button>

            {/* Navigation Items */}
            {navigationItems.map((item) => {
              const isActive = activeScreen === item.id;
              const handlers = createMouseHandlers(item.id, isActive);
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleSidebarNavigation(item.id)}
                  title={item.title}
                  style={{
                    ...STATIC_STYLES.navButton,
                    backgroundColor: isActive ? 'var(--accent)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--muted-foreground)'
                  }}
                  {...handlers}
                >
                  <item.icon />
                  {isActive && <div style={STATIC_STYLES.activeIndicator} />}
                </button>
              );
            })}
          </div>

          {/* Theme Toggle at Bottom */}
          <div style={STATIC_STYLES.sidebarGroup}>
            {/* Info Icon removed in open source version */}
            
            {/* Theme Toggle */}
            <ThemeToggle isDark={isDarkMode} onToggle={toggleTheme} />
          </div>
        </div>
      )}

      <div style={STATIC_STYLES.mainContent}>
        {/* Header - Hide on welcome screen */}
        {!showWelcome && (
          <header style={STATIC_STYLES.header}>
            <div style={STATIC_STYLES.headerContent}>
              <h2 style={STATIC_STYLES.headerTitle}>
                {navigationItems.find(item => item.id === activeScreen)?.title || 'Parse CSS'}
              </h2>
              <p style={STATIC_STYLES.headerDescription}>
                {navigationItems.find(item => item.id === activeScreen)?.description || 'Parse CSS variables from tweakcn and preview tokens'}
              </p>
            </div>
          </header>
        )}
        
        <main style={STATIC_STYLES.main}>
          {renderActiveScreen}
        </main>
      </div>

      {/* Notification - Show only when not on welcome screen */}
      {notification && !showWelcome && notificationStyle && (
        <div style={notificationStyle}>
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            style={STATIC_STYLES.notificationButton}
          >
            <XIcon />
          </button>
        </div>
      )}
    </div>
  );
} 