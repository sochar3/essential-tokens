import React from 'react';
import { DocumentIconLarge, PaletteIconLarge, TypeIconLarge } from '../ui/icons';
import ThemeToggle from '../ui/theme-toggle';

interface WelcomeScreenProps {
  onNavigateToScreen: (screenId: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export default function WelcomeScreen({ onNavigateToScreen, isDarkMode, onToggleTheme }: WelcomeScreenProps) {
  const featureTiles = [
    {
      id: 'css-parser',
      title: 'Parse tweakcn CSS',
      description: 'Paste your code to create Figma variables',
      icon: DocumentIconLarge,
      color: 'var(--primary)'
    },
    {
      id: 'variable-scanner',
      title: 'Color guide',
      description: 'Scan variables and create color documentation',
      icon: PaletteIconLarge,
      color: '#10b981'
    },
    {
      id: 'typography',
      title: 'Type guide',
      description: 'Scan text styles and create typography guides',
      icon: TypeIconLarge,
      color: '#8b5cf6'
    }
  ];

  return (
    <div style={{
      height: '100%',
      background: isDarkMode 
        ? 'linear-gradient(to bottom, #000000, #2f2f2f)' 
        : 'linear-gradient(to bottom, white, rgb(214 214 214))',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      overflow: 'hidden',
      padding: '8px'
    }}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .feature-tile {
            animation: slideUp 0.8s ease-out;
            animation-fill-mode: both;
          }
          
          .feature-tile:nth-child(1) { animation-delay: 0.2s; }
          .feature-tile:nth-child(2) { animation-delay: 0.4s; }
          .feature-tile:nth-child(3) { animation-delay: 0.6s; }
        `}
      </style>

      {/* Main Content Area with Rounded Bottom Corners */}
      <div style={{
        flex: 1,
        backgroundColor: isDarkMode ? '#000000' : 'white',
        borderBottomLeftRadius: '16px',
        borderBottomRightRadius: '16px',
        position: 'relative',
        boxShadow: isDarkMode ? 'rgb(0 0 0 / 84%) 0px 10px 14px -15px' : '0 10px 14px -15px rgba(0, 0, 0, 0.24)',
        overflow: 'hidden',
        marginBottom: '2px',
        border: isDarkMode ? '1px solid #000000' : '1px solid white'
      }}>
        <div style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px 16px',
          paddingTop: '64px',
          gap: '0px',
          animation: 'fadeIn 0.6s ease-out',
          overflow: 'auto',
          minHeight: 0
        }}>

        {/* Logo Section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0
        }}>
          <div style={{
           
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            border: isDarkMode ? '1px solid #ffffff45' : 'none'
          }}>
            <svg style={{ width: '42px', height: '42px' }} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_4_11_welcome)">
                <rect width="128" height="128" rx="64" fill="black"/>
                <g filter="url(#filter0_f_4_11_welcome)">
                  <ellipse cx="61.5" cy="130" rx="66.5" ry="50" fill="#D9D9D9"/>
                </g>
                <path d="M84 91.5V97H68.5V64V31L97 69.5L84 91.5Z" fill="white"/>
                <path d="M44 91.5V97H59.5V31L31 69.5L44 91.5Z" fill="white"/>
              </g>
              <defs>
                <filter id="filter0_f_4_11_welcome" x="-84.9" y="0.0999985" width="292.8" height="259.8" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                  <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                  <feGaussianBlur stdDeviation="39.95" result="effect1_foregroundBlur_4_11_welcome"/>
                </filter>
                <clipPath id="clip0_4_11_welcome">
                  <rect width="128" height="128" rx="64" fill="white"/>
                </clipPath>
              </defs>
            </svg>
          </div>
          
          <div style={{ textAlign: 'center', paddingBottom: '32px' }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '500',
              color: 'var(--foreground)',
              margin: '0 0 6px 0',
              lineHeight: '1.2'
            }}>
              Essential Tokens
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'var(--muted-foreground)',
              margin: 0,
              lineHeight: '1.4'
            }}>
              
            </p>
          </div>
        </div>

        {/* Feature Tiles - Stack vertically for better fit */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          maxWidth: '420px',
          flex: 1,
          minHeight: 0
        }}>
          {featureTiles.map((tile, index) => (
            <button
              key={tile.id}
              className="feature-tile"
              onClick={() => onNavigateToScreen(tile.id)}
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '18px 20px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                width: '100%',
                boxShadow: 'none',
                position: 'relative',
                overflow: 'hidden',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = tile.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--muted)',
                color: tile.color,
                flexShrink: 0,
                transition: 'all 0.2s ease'
              }}>
                <tile.icon />
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'var(--foreground)',
                  margin: '0 0 4px 0',
                  lineHeight: '1.3'
                }}>
                  {tile.title}
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: 'var(--muted-foreground)',
                  margin: 0,
                  lineHeight: '1.4',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {tile.description}
                </p>
              </div>

              {/* Hover indicator */}
              <div style={{
                fontSize: '16px',
                color: 'var(--muted-foreground)',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}>
                →
              </div>
            </button>
          ))}
        </div>
        </div>
        
        {/* Theme Toggle - Bottom Left */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          zIndex: 10
        }}>
          <ThemeToggle isDark={isDarkMode} onToggle={onToggleTheme} />
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        height: '48px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px',
        gap: '8px',
        flexShrink: 0
      }}>
        {/* Branding Text - Center */}
        <div style={{
          fontSize: '12px',
          fontFamily: "'Geist', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace",
          color: isDarkMode ? '#aaa' : '#666',
          fontWeight: '400',
          letterSpacing: '0.5px'
        }}>
          Made by Quintessential
        </div>
      </footer>
    </div>
  );
} 