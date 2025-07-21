import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App';
import '../styles/globals.css';

// Type definitions for the Figma plugin interface
declare global {
  interface Window {
    figmaPlugin: {
      postMessage: (message: any) => void;
      onMessage: (callback: (message: any) => void) => void;
      closePlugin: () => void;
      resize: (width: number, height: number) => void;
    };
  }
}

// Initialize the React app
function initializeApp() {
  if (process.env.NODE_ENV !== 'production') {
  console.log('Looking for react-page container...');
  }
  const container = document.getElementById('react-page');
  if (!container) {
    throw new Error('Failed to find the root element with id "react-page"');
  }
  if (process.env.NODE_ENV !== 'production') {
  console.log('Container found:', container);
  console.log('Creating React root...');
  }

  const root = createRoot(container);
  
  if (process.env.NODE_ENV !== 'production') {
  console.log('Rendering App component...');
  }
  try {
    root.render(<App />);
    if (process.env.NODE_ENV !== 'production') {
    console.log('App component rendered successfully!');
    }
  } catch (error) {
    console.error('Error rendering App component:', error);
    throw error;
  }
}

// Set up Figma plugin communication interface
function initializeFigmaPlugin() {
  if (typeof window === 'undefined') return;

  window.figmaPlugin = {
    postMessage: (message: any) => {
      try {
        parent.postMessage({ pluginMessage: message }, '*');
      } catch (error) {
        console.error('Failed to send message to Figma:', error);
      }
    },
    
    onMessage: (callback: (message: any) => void) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data.pluginMessage) {
          try {
            callback(event.data.pluginMessage);
          } catch (error) {
            console.error('Error handling message:', error);
          }
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Return cleanup function
      return () => {
        window.removeEventListener('message', handleMessage);
      };
    },
    
    closePlugin: () => {
      try {
        parent.postMessage({ pluginMessage: { type: 'close-plugin' } }, '*');
      } catch (error) {
        console.error('Failed to close plugin:', error);
      }
    },
    
    resize: (width: number, height: number) => {
      try {
        parent.postMessage({ 
          pluginMessage: { type: 'resize', width, height } 
        }, '*');
      } catch (error) {
        console.error('Failed to resize plugin:', error);
      }
    }
  };
}

// Initialize everything when DOM is ready
if (process.env.NODE_ENV !== 'production') {
console.log('🚀 UI Script loaded with HOT RELOAD - starting initialization...');
console.log('📏 Plugin configured for 800px width x 600px height');
}

try {
  if (process.env.NODE_ENV !== 'production') {
  console.log('Setting up Figma plugin interface...');
  }
  initializeFigmaPlugin();
  
  if (process.env.NODE_ENV !== 'production') {
  console.log('Initializing React app...');
  }
  initializeApp();
  
  if (process.env.NODE_ENV !== 'production') {
  console.log('Plugin initialized successfully!');
  }
} catch (error) {
  console.error('Failed to initialize plugin:', error);
  
  // Show error message to user
  const container = document.getElementById('react-page');
  if (container) {
    container.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #e74c3c;">
        <h3>Failed to Load Plugin</h3>
                        <p>There was an error initializing Essential Tokens.</p>
        <p style="font-size: 12px; color: #666; font-family: monospace;">${(error as Error).message}</p>
        <p style="font-size: 10px; color: #999; margin-top: 10px;">Check the console for more details.</p>
      </div>
    `;
  }
}