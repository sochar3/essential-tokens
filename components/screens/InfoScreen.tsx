import React from 'react';

interface InfoScreenProps {
  onShowNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function InfoScreen({ onShowNotification }: InfoScreenProps) {
  return (
    <div style={{
      height: '100%',
      backgroundColor: 'var(--background)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <style>
        {`
          .info-screen a {
            color: #60a5fa;
            text-decoration: none;
          }
          
          .info-screen a:hover {
            color: #93c5fd;
            text-decoration: underline;
          }
          
          .info-screen a:visited {
            color: #a78bfa;
          }
        `}
      </style>
      
      {/* Scrollable Content */}
      <div style={{
        flex: 1,
        overflow: 'auto'
      }}>
        <div className="info-screen" style={{
          padding: '24px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          {/* Content Cards */}
          <div style={{
            display: 'grid',
            gap: '24px',
            gridTemplateColumns: '1fr'
          }}>
            {/* Creator Card */}
            <div style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: 'var(--foreground)',
                margin: '0 0 16px 0',
                lineHeight: '1.3'
              }}>
                👋 About the Creator
              </h2>
              <div style={{
                color: 'var(--muted-foreground)',
                fontSize: '14px',
                lineHeight: '1.6'
              }}>
                
                <p style={{ margin: '0' }}>
                I am <a href='https://x.com/sochar__' target="_blank" rel="noopener noreferrer">Socrates</a> co-founder of <a href="https://www.quintessential.gr" target="_blank" rel="noopener noreferrer">Quintessential</a> and the Friends of Figma Athens chapter leader. Always curious about the future of software and AI.
                </p>
              </div>
            </div>

            {/* Company Card */}
            <div style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: 'var(--foreground)',
                margin: '0 0 16px 0',
                lineHeight: '1.3'
              }}>
                🏢 About Quintessential
              </h2>
              <div style={{
                color: 'var(--muted-foreground)',
                fontSize: '14px',
                lineHeight: '1.6'
              }}>
                <p style={{ margin: '0' }}>
                  At <a href="https://www.quintessential.gr" target="_blank" rel="noopener noreferrer">Quintessential</a> we collaborate with organizations, startups, and visionaries to create outstanding products.
                  From our base in Athens, we design and build for clients around the world—and for ourselves, too.
                </p>
              </div>
            </div>

            {/* Plugin Info Card */}
            <div style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: 'var(--foreground)',
                margin: '0 0 16px 0',
                lineHeight: '1.3'
              }}>
                🔧 About This Tool
              </h2>
              <div style={{
                color: 'var(--muted-foreground)',
                fontSize: '14px',
                lineHeight: '1.6'
              }}>
                <p style={{ margin: '0 0 12px 0' }}>
                  Essential tokens is made entirely in Figma Make & Cursor. It does a few things.
                </p>
              
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div style={{
        width: '100%',
        padding: '16px',
        textAlign: 'center' as const,
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--background)',
        flexShrink: 0
      }}>
        <p style={{
          fontSize: '12px',
          color: 'var(--muted-foreground)',
          margin: 0,
          lineHeight: '1.4'
        }}>
          Made with care for all. Free forever.
        </p>
      </div>
    </div>
  );
} 