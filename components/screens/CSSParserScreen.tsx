import React, { useState, useRef } from 'react';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { parseCSSVariables, type ParsedTokens, type ParsedToken } from '../css-parser';
import { TokenCategory } from '../TokenDisplay';
import { UploadIcon, CheckIcon, PaletteIcon } from '../ui/icons';

// Icon components are now imported from shared icons file

interface CSSParserScreenProps {
  onShowNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function CSSParserScreen({ onShowNotification }: CSSParserScreenProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cssInput, setCssInput] = useState('');
  const [parsedTokens, setParsedTokens] = useState<ParsedTokens | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('light');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectAll = () => {
    if (textareaRef.current) {
      textareaRef.current.select();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === 'a') {
      e.preventDefault();
      handleSelectAll();
    }
  };

  const handleParseCss = () => {
    if (!cssInput.trim()) {
      // Do nothing if input is empty
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const parsedTokens = parseCSSVariables(cssInput);
      setParsedTokens(parsedTokens);
      setActiveTab('light');
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('CSS parsing error:', err);
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse CSS variables';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateVariables = () => {
    if (!parsedTokens) {
      onShowNotification('No tokens to create', 'error');
      return;
    }

    setIsCreating(true);
    
    parent.postMessage({
      pluginMessage: {
        type: 'create-variables',
        tokens: parsedTokens
      }
    }, '*');
  };

  // Listen for plugin messages
  React.useEffect(() => {
    const handleMessage = (message: any) => {
      switch (message.data.pluginMessage?.type) {
        case 'variables-created':
          setIsCreating(false);
          onShowNotification('Variables created successfully!', 'success');
          break;
        case 'variables-creation-failed':
          setIsCreating(false);
          onShowNotification('Failed to create variables', 'error');
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onShowNotification]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'colors': return <PaletteIcon />;
      default: return <PaletteIcon />;
    }
  };

  const renderTokensForMode = (tokens: ParsedToken[]) => {
    if (tokens.length === 0) {
      return (
        <div style={{ 
          padding: '16px', 
          textAlign: 'center', 
          color: '#6b7280', 
          fontSize: '12px' 
        }}>
          No tokens in this mode
        </div>
      );
    }

    const groupedTokens = tokens.reduce((acc, token) => {
      const category = token.category || 'other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(token);
      return acc;
    }, {} as Record<string, ParsedToken[]>);

    return (
      <div style={{ padding: '8px 16px 16px' }}>
        {Object.entries(groupedTokens).map(([category, categoryTokens]) => (
          <div key={category} style={{ marginBottom: '12px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '8px 12px 4px 12px',
              fontSize: '11px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {getCategoryIcon(category)}
              {category}
            </div>
            <TokenCategory
              category={category}
              tokens={categoryTokens}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', gap: '1px', padding: '0' }}>
      {/* Left Panel - CSS Input */}
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
            <h2 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--foreground)', margin: 0, marginBottom: '0px' }}>
            Paste tweakcn code
            </h2>
          </div>
          {/*<p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '0px' }}>
            Paste your CSS variables & good luck.
          </p>*/}
        </div>
        
        <div style={{ 
          flex: 1, 
          padding: '20px', 
          display: 'flex', 
          paddingBottom: '12px',
          flexDirection: 'column', 
          minHeight: 0 
        }}>
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            <Textarea
              ref={textareaRef}
              placeholder={`Paste your CSS variables here, for example:

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 84% 4.9%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 94.1%;
}`}
              value={cssInput}
              onChange={(e) => setCssInput(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                width: '100%',
                height: '100%',
                resize: 'none',
                fontFamily: "'Geist', Consolas, Monaco, monospace",
                fontSize: '12px',
                lineHeight: '1.5',
                borderRadius: '6px',
                padding: '12px',
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
                mask: 'linear-gradient(#000000, black, #0c0b0b3d)',
                WebkitMask: 'linear-gradient(#000000, black, #0c0b0b3d)',
                outline: 'none',
                border: 'none'
              }}
              className="min-h-[200px] font-mono text-sm resize-none focus:outline-none"
            />
            {/* Bottom blur overlay */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: '40px', // adjust as needed
                pointerEvents: 'none',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, var(--background) 100%)'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <Button 
              onClick={handleParseCss} 
              style={{
                flex: 1,
                height: '32px',
                backgroundColor: 'var(--foreground)',
                color: 'var(--background)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <UploadIcon />
              Parse Tokens
            </Button>
            {parsedTokens && (
              <Button 
                onClick={handleCreateVariables} 
                disabled={isCreating}
                style={{
                  flex: 1,
                  height: '32px',
                  backgroundColor: isCreating ? 'var(--muted)' : 'var(--foreground)',
                  color: isCreating ? 'var(--muted-foreground)' : 'var(--background)',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: isCreating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                {isCreating ? (
                  <>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      border: '2px solid currentColor',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckIcon />
                    Create Variables
                  </>
                )}
              </Button>
            )}
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Token Preview */}
      <div style={{ 
        flex: 1, 
        backgroundColor: 'var(--card)', 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: 0,
        borderRadius: '0',
        border: '1px solid var(--border)',
        mask: 'linear-gradient(#000000, black,rgba(12, 11, 11, 0.1))',
        WebkitMask: 'linear-gradient(#000000, black,rgba(12, 11, 11, 0.1))',
        
      }}>
        <div style={{ 
          padding: '16px', 
          flexShrink: 0, 
          backgroundColor: 'var(--card)',
          borderBottom: '1px solid var(--border)'
        }}>
          <h2 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--foreground)', margin: '0 0 0px 0' }}>
            Preview
          </h2>
         {/* <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0 }}>
            {parsedTokens 
              ? `${parsedTokens.light.length + parsedTokens.dark.length + parsedTokens.global.length} parsed tokens`
              : 'Parse CSS to see tokens here'
            }
          </p> */}
        </div>
        
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {parsedTokens ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 16px 0 16px', flexShrink: 0 }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '4px',
                  backgroundColor: 'var(--muted)',
                  borderRadius: '6px',
                  padding: '4px'
                }}>
                  {['light', 'dark', 'rest'].map((tab) => {
                    const getTabCount = () => {
                      if (tab === 'light') return parsedTokens.light.filter(token => token.type === 'color').length;
                      if (tab === 'dark') return parsedTokens.dark.filter(token => token.type === 'color').length;
                      if (tab === 'rest') {
                        return [
                          ...parsedTokens.light,
                          ...parsedTokens.dark,
                          ...parsedTokens.global
                        ].filter(token => token.type !== 'color').length;
                      }
                    };
                    
                    return (
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
                        {tab.charAt(0).toUpperCase() + tab.slice(1)} ({getTabCount()})
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div style={{ flex: 1, overflow: 'auto', marginTop: '8px' }}>
                {activeTab === 'light' && renderTokensForMode(parsedTokens.light.filter(token => token.type === 'color'))}
                {activeTab === 'dark' && renderTokensForMode(parsedTokens.dark.filter(token => token.type === 'color'))}
                {activeTab === 'rest' && (() => {
                  const allNonColorTokens = [
                    ...parsedTokens.light,
                    ...parsedTokens.dark,
                    ...parsedTokens.global
                  ].filter(token => token.type !== 'color');
                  return renderTokensForMode(allNonColorTokens);
                })()}
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
                  <PaletteIcon />
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '8px' }}>
                  No tokens yet
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', maxWidth: '200px' }}>
                  Parse your CSS to see tokens here.
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