import React, { memo } from 'react';
import { type ParsedToken, getColorPreviewOptimized } from './css-parser';

interface TokenDisplayProps {
  token: ParsedToken;
}

export const TokenDisplay = memo(({ token }: TokenDisplayProps) => {
  const renderPreview = () => {
    switch (token.type) {
      case 'color':
        // Get the best color value for preview - prioritize displayValue if available
        let colorPreview = token.displayValue || token.value;
        
        // Only try to convert if we don't already have a displayValue
        if (!token.displayValue) {
          try {
            colorPreview = getColorPreviewOptimized(token.value);
          } catch (error) {
            console.warn('Failed to convert color:', token.value, error);
            colorPreview = token.value; // Fallback to original value
          }
        }
        
        const isConvertedColor = token.displayValue && token.displayValue !== token.value;
        
        return (
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              border: '1px solid rgba(0,0,0,0.1)',
              flexShrink: 0,
              backgroundColor: colorPreview,
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
              position: 'relative'
            }}
            title={`Color: ${token.value}${isConvertedColor ? ` (preview: ${token.displayValue})` : ''}`}
          >
            {/* Green dot removed */}
          </div>
        );
      case 'font':
        return (
          <div 
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: 'var(--muted)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: '600',
              color: 'var(--muted-foreground)',
              flexShrink: 0
            }}
            title={`Font: ${token.value}`}
          >
            Aa
          </div>
        );
      case 'radius':
        return (
          <div
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: 'var(--muted)',
              flexShrink: 0,
              border: '1px solid var(--border)',
              borderRadius: token.value
            }}
            title={`Radius: ${token.value}`}
          />
        );
      case 'shadow':
        return (
          <div
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              flexShrink: 0,
              borderRadius: '3px',
              boxShadow: token.value
            }}
            title={`Shadow: ${token.value}`}
          />
        );
      default:
        return (
          <div 
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: 'var(--muted)',
              borderRadius: '4px',
              flexShrink: 0,
              border: '1px solid var(--border)'
            }}
            title={`Value: ${token.value}`}
          />
        );
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 12px',
      borderRadius: '6px',
      transition: 'background-color 0.15s ease',
      cursor: 'default'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = 'var(--accent)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
    }}
    >
      {renderPreview()}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: '500',
          fontSize: '13px',
          color: 'var(--foreground)',
          marginBottom: '2px',
          fontFamily: "'Geist', Consolas, Monaco, monospace"
        }} title={`--${token.name}`}>
          --{token.name}
        </div>
        <div style={{
          fontSize: '11px',
          color: 'var(--muted-foreground)',
          fontFamily: "'Geist', 'Inter', 'Manrope', system-ui, -apple-system, sans-serif"
        }} title={token.value}>
          {token.displayValue || token.value}
        </div>
        {/* Source information */}
        {token.source && (
          <div style={{
            fontSize: '10px',
            color: 'var(--muted-foreground)',
            opacity: 0.7,
            fontFamily: "'Geist', 'Inter', 'Manrope', system-ui, -apple-system, sans-serif",
            marginTop: '1px',
            fontStyle: 'italic'
          }} title={token.source}>
            {token.source}
          </div>
        )}
      </div>
    </div>
  );
});

interface TokenCategoryProps {
  category: string;
  tokens: ParsedToken[];
}

export const TokenCategory = memo(({ category, tokens }: TokenCategoryProps) => {
  if (!tokens || tokens.length === 0) {
    return (
      <div style={{
        fontSize: '12px',
        color: '#9ca3af',
        padding: '12px',
        textAlign: 'center',
        fontStyle: 'italic'
      }}>
        No tokens in this category
      </div>
    );
  }

  return (
    <div style={{ padding: '4px 0' }}>
      {tokens.map((token, index) => (
        <TokenDisplay key={`${token.name}-${index}`} token={token} />
      ))}
    </div>
  );
});