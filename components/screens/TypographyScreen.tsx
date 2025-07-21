import React, { useState } from 'react';
import { DocumentIcon, SearchIcon } from '../ui/icons';

// Icon components
const TypeIcon = () => (
  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const FileSearchIcon = () => (
  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const FrameIcon = () => (
  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
);

interface TypographyScreenProps {
  onShowNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function TypographyScreen({ onShowNotification }: TypographyScreenProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [textStyles, setTextStyles] = useState<any[]>([]);
  const [textVariables, setTextVariables] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('styles');

  const scanTextStyles = async () => {
    setIsScanning(true);
    try {
      // Send message to plugin code to scan for text styles and variables
      parent.postMessage({
        pluginMessage: {
          type: 'scan-text-styles'
        }
      }, '*');
    } catch (error) {
      setIsScanning(false);
      onShowNotification('Error scanning text styles', 'error');
    }
  };

  const generateTypographyGuide = async () => {
    if (textStyles.length === 0 && textVariables.length === 0) {
      onShowNotification('No text styles or variables found. Please scan first.', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      // Send message to plugin code to generate typography guide
      parent.postMessage({
        pluginMessage: {
          type: 'generate-typography-guide',
          styles: textStyles,
          variables: textVariables
        }
      }, '*');
    } catch (error) {
      setIsGenerating(false);
      onShowNotification('Error generating typography guide', 'error');
    }
  };

  // Listen for plugin messages
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      switch (event.data.pluginMessage?.type) {
        case 'text-styles-scanned':
          const { styles, variables } = event.data.pluginMessage;
          setTextStyles(styles || []);
          setTextVariables(variables || []);
          onShowNotification(`Found ${styles?.length || 0} text styles and ${variables?.length || 0} text variables`, 'success');
          setIsScanning(false);
          break;
        case 'typography-guide-generated':
          onShowNotification('Typography guide generated on canvas!', 'success');
          setIsGenerating(false);
          break;
        case 'typography-guide-error':
          onShowNotification('Error generating typography guide', 'error');
          setIsGenerating(false);
          break;
        case 'error':
          setIsScanning(false);
          setIsGenerating(false);
          onShowNotification(event.data.pluginMessage.message || 'Operation failed', 'error');
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onShowNotification]);

  const renderTextStyles = () => {
    if (textStyles.length === 0) {
      return (
        <div style={{ 
          padding: '16px', 
          textAlign: 'center', 
          color: '#6b7280', 
          fontSize: '12px' 
        }}>
          No text styles found
        </div>
      );
    }

    return (
      <div style={{ padding: '8px 16px 16px' }}>
        {textStyles.map((style, index) => (
          <div key={index} style={{
            padding: '12px',
            backgroundColor: 'var(--muted)',
            borderRadius: '6px',
            marginBottom: '8px',
            border: '1px solid var(--border)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <span style={{ 
                fontWeight: '500', 
                color: 'var(--foreground)',
                fontSize: '12px'
              }}>
                {style.name}
              </span>
              <span style={{
                fontSize: '10px',
                color: 'var(--muted-foreground)',
                backgroundColor: 'var(--muted)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                {style.fontSize}px
              </span>
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--muted-foreground)'
            }}>
              {style.fontName?.family} • {style.fontName?.style}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTextVariables = () => {
    if (textVariables.length === 0) {
      return (
        <div style={{ 
          padding: '16px', 
          textAlign: 'center', 
          color: '#6b7280', 
          fontSize: '12px' 
        }}>
          No text variables found
        </div>
      );
    }

    return (
      <div style={{ padding: '8px 16px 16px' }}>
        {textVariables.map((variable, index) => (
          <div key={index} style={{
            padding: '12px',
            backgroundColor: 'var(--muted)',
            borderRadius: '6px',
            marginBottom: '8px',
            border: '1px solid var(--border)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <span style={{ 
                fontWeight: '500', 
                color: 'var(--foreground)',
                fontSize: '12px'
              }}>
                {variable.name}
              </span>
              <span style={{
                fontSize: '10px',
                color: 'var(--muted-foreground)',
                backgroundColor: 'var(--muted)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                {variable.resolvedType || 'STRING'}
              </span>
            </div>
            {variable.description && (
              <div style={{
                fontSize: '11px',
                color: 'var(--muted-foreground)'
              }}>
                {variable.description}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', gap: '1px', padding: '0' }}>
      {/* Left Panel - Typography Scanner Controls */}
      <div style={{ 
        width: '420px', 
        backgroundColor: 'var(--card)', 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: 0,
        borderRadius: '0',
        flexShrink: 0,
        borderTop: '1px solid var(--border)'
      }}>
        <div style={{ 
          padding: '16px', 
          borderBottom: '1px solid var(--border)', 
          flexShrink: 0, 
          backgroundColor: 'var(--card)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--foreground)', margin: 0 }}>
              Scanner
            </h2>
          </div>
          {/*
            Scan your Figma file for text styles and variables
          </p>*/}
        </div>
        
        <div style={{ 
          flex: 1, 
          padding: '16px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px'
        }}>
          {/* Scan Text Styles Section */}
          <div style={{ 
            border: '1px solid var(--border)', 
            borderRadius: '8px', 
            padding: '16px',
            backgroundColor: 'var(--muted)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <FileSearchIcon />
              <h3 style={{ fontSize: '13px', fontWeight: '500', color: 'var(--foreground)', margin: 0 }}>
                Scan Typography
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '12px' }}>
              Find existing text styles and string variables in your Figma file.
            </p>
            <button 
              onClick={scanTextStyles}
              disabled={isScanning}
              style={{
                width: '100%',
                height: '36px',
                backgroundColor: isScanning ? 'var(--muted)' : 'var(--foreground)',
                color: isScanning ? 'var(--muted-foreground)' : 'var(--background)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: isScanning ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {isScanning ? (
                <>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid currentColor',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Text Styles
                </>
              ) : (
                <>
                  <SearchIcon />
                  Start scan
                </>
              )}
            </button>
          </div>

          {/* Generate Typography Guide Section */}
          {(textStyles.length > 0 || textVariables.length > 0) && (
            <div style={{ 
              border: '1px solid var(--border)', 
              borderRadius: '8px', 
              padding: '16px',
              backgroundColor: 'var(--muted)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FrameIcon />
                <h3 style={{ fontSize: '13px', fontWeight: '500', color: 'var(--foreground)', margin: 0 }}>
                  Generate Typography Guide
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '12px' }}>
                Create a structured typography guide on the canvas showcasing your text styles.
              </p>
              <button 
                onClick={generateTypographyGuide}
                disabled={isGenerating}
                style={{
                  width: '100%',
                  height: '36px',
                  backgroundColor: isGenerating ? 'var(--muted)' : 'var(--foreground)',
                  color: isGenerating ? 'var(--muted-foreground)' : 'var(--background)',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {isGenerating ? (
                  <>
                    <div style={{
                      width: '14px',
                      height: '14px',
                      border: '2px solid currentColor',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Generating Guide...
                  </>
                ) : (
                  <>
                    <FrameIcon />
                    Generate Typography Guide
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Text Styles & Variables */}
      <div style={{ 
        flex: 1, 
        backgroundColor: 'var(--card)', 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: 0,
        borderRadius: '0',
        border: '1px solid var(--border)'
      }}>
        <div style={{ 
          padding: '16px', 
          borderBottom: '1px solid var(--border)', 
          flexShrink: 0, 
          backgroundColor: 'var(--card)' 
        }}>
          <h2 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--foreground)', margin: '0' }}>
            Preview
          </h2>
          {/*<p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0 }}>
            {(textStyles.length > 0 || textVariables.length > 0)
              ? `${textStyles.length} text styles and ${textVariables.length} text variables found`
              : 'Scan to find existing text styles and variables in your file'
            }
          </p>*/}
        </div>
        
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {(textStyles.length > 0 || textVariables.length > 0) ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 16px 0 16px', flexShrink: 0 }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '4px',
                  backgroundColor: 'var(--muted)',
                  borderRadius: '6px',
                  padding: '4px'
                }}>
                  {['styles', 'variables'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        backgroundColor: activeTab === tab ? 'var(--background)' : 'transparent',
                        color: activeTab === tab ? 'var(--foreground)' : 'var(--muted-foreground)',
                        fontWeight: activeTab === tab ? '500' : '400'
                      }}
                    >
                      {tab === 'styles' ? `Text Styles (${textStyles.length})` : `Variables (${textVariables.length})`}
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ flex: 1, overflow: 'auto', marginTop: '8px' }}>
                {activeTab === 'styles' && renderTextStyles()}
                {activeTab === 'variables' && renderTextVariables()}
              </div>
            </div>
          ) : (
            <div style={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '16px' 
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: 'var(--muted)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto'
                }}>
                  <TypeIcon />
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '8px' }}>
                  Nothing yet...
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', maxWidth: '200px' }}>
                  Typography will appear here
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
} 