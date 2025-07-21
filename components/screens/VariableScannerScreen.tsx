import React, { useState, useEffect, useMemo } from 'react';
import { SearchIcon, FrameIcon, PaletteIcon, FileSearchIcon, DocumentIcon } from '../ui/icons';

// === NEW HIERARCHICAL DATA TYPES ===

interface FigmaVariable {
  id: string;
  name: string;
  value: string;
  type: 'color' | 'font' | 'radius' | 'shadow' | 'other';
  displayValue?: string;
  resolvedType: string;
  description?: string;
  variableCollectionId: string;
  modeId: string;
}

interface FigmaMode {
  id: string;
  name: string;
  variables: FigmaVariable[];
}

interface FigmaGroup {
  name: string;
  modes: FigmaMode[];
  totalVariables: number;
}

interface FigmaCollection {
  id: string;
  name: string;
  groups: FigmaGroup[];
  totalVariables: number;
  allModes: { id: string; name: string }[];
}

interface VariableStructure {
  collections: FigmaCollection[];
  totalCollections: number;
  totalVariables: number;
}

interface NavigationState {
  currentCollection: FigmaCollection | null;
  currentGroup: FigmaGroup | null;
  currentMode: FigmaMode | null;
  breadcrumbs: Array<{
    label: string;
    type: 'collections' | 'collection' | 'group' | 'mode';
    data?: any;
  }>;
}

// === ICON COMPONENTS ===

const ArrowLeftIcon = () => (
  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const HomeIcon = () => (
  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);



// === MAIN COMPONENT ===

interface VariableScannerScreenProps {
  onShowNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function VariableScannerScreen({ onShowNotification }: VariableScannerScreenProps) {
  const [variableStructure, setVariableStructure] = useState<VariableStructure | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Navigation state
  const [navigation, setNavigation] = useState<NavigationState>({
    currentCollection: null,
    currentGroup: null,
    currentMode: null,
    breadcrumbs: []
  });

  // Handle hierarchical variable scanning
  const handleScanVariables = () => {
    setIsScanning(true);
    
    const message = {
      pluginMessage: {
        type: 'scan-variables-hierarchical'
      }
    };
    
    parent.postMessage(message, '*');
  };

  // Generate color guide for current collection
  const handleGenerateColorGuide = () => {
    if (!navigation.currentCollection) {
      onShowNotification('Please select a collection first', 'error');
      return;
    }

    setIsGeneratingGuide(true);
    
    parent.postMessage({
      pluginMessage: {
        type: 'generate-collection-color-guide',
        collection: navigation.currentCollection
      }
    }, '*');
  };

  // Generate color guide for current mode
  const handleGenerateModeColorGuide = () => {
    if (!navigation.currentCollection || !navigation.currentGroup || !navigation.currentMode) {
      onShowNotification('No mode selected', 'error');
      return;
    }

    setIsGeneratingGuide(true);
    
    parent.postMessage({
      pluginMessage: {
        type: 'generate-mode-color-guide',
        collection: navigation.currentCollection,
        group: navigation.currentGroup,
        mode: navigation.currentMode
      }
    }, '*');
  };

  // Navigation functions
  const navigateToCollections = () => {
    setNavigation({
      currentCollection: null,
      currentGroup: null,
      currentMode: null,
      breadcrumbs: []
    });
  };

  const navigateToCollection = (collection: FigmaCollection) => {
    setNavigation({
      currentCollection: collection,
      currentGroup: null,
      currentMode: null,
      breadcrumbs: [
        { label: 'Collections', type: 'collections' },
        { label: collection.name, type: 'collection', data: collection }
      ]
    });
  };

  const navigateToGroup = (group: FigmaGroup) => {
    if (!navigation.currentCollection) return;
    
    setNavigation({
      currentCollection: navigation.currentCollection,
      currentGroup: group,
      currentMode: null,
      breadcrumbs: [
        { label: 'Collections', type: 'collections' },
        { label: navigation.currentCollection.name, type: 'collection', data: navigation.currentCollection },
        { label: group.name, type: 'group', data: group }
      ]
    });
  };

  const navigateToMode = (mode: FigmaMode) => {
    if (!navigation.currentCollection || !navigation.currentGroup) return;
    
    setNavigation({
      currentCollection: navigation.currentCollection,
      currentGroup: navigation.currentGroup,
      currentMode: mode,
      breadcrumbs: [
        { label: 'Collections', type: 'collections' },
        { label: navigation.currentCollection.name, type: 'collection', data: navigation.currentCollection },
        { label: navigation.currentGroup.name, type: 'group', data: navigation.currentGroup },
        { label: mode.name, type: 'mode', data: mode }
      ]
    });
  };

  const navigateToBreadcrumb = (index: number) => {
    const breadcrumb = navigation.breadcrumbs[index];
    
    switch (breadcrumb.type) {
      case 'collections':
        navigateToCollections();
        break;
      case 'collection':
        navigateToCollection(breadcrumb.data);
        break;
      case 'group':
        navigateToGroup(breadcrumb.data);
        break;
      case 'mode':
        navigateToMode(breadcrumb.data);
        break;
    }
  };

  // Helper functions for color filtering
  const hasColorVariables = (mode: FigmaMode): boolean => {
    return mode.variables.some(variable => variable.type === 'color');
  };

  const hasColorVariablesInGroup = (group: FigmaGroup): boolean => {
    return group.modes.some(mode => hasColorVariables(mode));
  };

  const hasColorVariablesInCollection = (collection: FigmaCollection): boolean => {
    return collection.groups.some(group => hasColorVariablesInGroup(group));
  };

  const getColorVariableCount = (mode: FigmaMode): number => {
    return mode.variables.filter(variable => variable.type === 'color').length;
  };

  const getColorVariableCountInGroup = (group: FigmaGroup): number => {
    return group.modes.reduce((total, mode) => total + getColorVariableCount(mode), 0);
  };

  const getColorVariableCountInCollection = (collection: FigmaCollection): number => {
    return collection.groups.reduce((total, group) => total + getColorVariableCountInGroup(group), 0);
  };

  // Filter variables based on search query
  const filteredVariables = useMemo(() => {
    if (!navigation.currentMode || !searchQuery.trim()) {
      return navigation.currentMode?.variables.filter(variable => variable.type === 'color') || [];
    }

    const query = searchQuery.toLowerCase();
    return navigation.currentMode.variables.filter(variable => 
      variable.type === 'color' && (
      variable.name.toLowerCase().includes(query) ||
      variable.value.toLowerCase().includes(query) ||
      variable.resolvedType.toLowerCase().includes(query)
      )
    );
  }, [navigation.currentMode, searchQuery]);

  // Listen for plugin messages
  useEffect(() => {
    const handleMessage = (message: any) => {
      switch (message.data.pluginMessage?.type) {
        case 'variables-structure-found':
          setIsScanning(false);
          const structure = message.data.pluginMessage.structure;
          setVariableStructure(structure);
          onShowNotification(
            `Found ${structure.totalVariables} variables in ${structure.totalCollections} collections`, 
            'success'
          );
          break;
        case 'error':
          setIsScanning(false);
          setIsGeneratingGuide(false);
          onShowNotification(message.data.pluginMessage.message || 'Operation failed', 'error');
          break;
        case 'color-guide-generated':
          setIsGeneratingGuide(false);
          onShowNotification('Color guide created successfully!', 'success');
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onShowNotification]);

  // === RENDER FUNCTIONS ===

  const renderVariableItem = (variable: FigmaVariable) => {
    const getVariableIcon = (type: string) => {
      switch (type) {
        case 'color': return <PaletteIcon />;
        case 'font': return <DocumentIcon />;
        default: return <DocumentIcon />;
      }
    };

    const getColorPreview = (value: string) => {
      // Simple color detection and preview
      if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) {
        return (
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '3px',
            backgroundColor: value,
            border: '1px solid var(--border)',
            flexShrink: 0
          }} />
        );
      }
      return null;
    };

    return (
      <div key={variable.id} style={{
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
          marginBottom: '4px',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
            {getVariableIcon(variable.type)}
            <span style={{ 
              fontWeight: '500', 
              color: 'var(--foreground)',
              fontSize: '12px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {variable.name}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {getColorPreview(variable.value)}
            <span style={{
              fontSize: '10px',
              color: 'var(--muted-foreground)',
              backgroundColor: 'var(--muted)',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              {variable.resolvedType}
            </span>
          </div>
        </div>
        <div style={{
          fontSize: '11px',
          color: 'var(--muted-foreground)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {variable.value}
        </div>
        {variable.description && (
          <div style={{
            fontSize: '10px',
            color: 'var(--muted-foreground)',
            marginTop: '4px',
            fontStyle: 'italic'
          }}>
            {variable.description}
          </div>
        )}
      </div>
    );
  };

  const renderCollectionsList = () => {
    const colorCollections = variableStructure?.collections.filter(hasColorVariablesInCollection) || [];
    
    if (!variableStructure || colorCollections.length === 0) {
      return (
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
              margin: '0 auto 12px auto',
              fontSize: '20px',
              color: 'var(--muted-foreground)'
            }}>
              🎨
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '8px' }}>
              Nothing yet...
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', maxWidth: '200px' }}>
              Collections & variables will appear.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div style={{ padding: '8px 16px 16px' }}>
        {colorCollections.map((collection) => {
          const colorCount = getColorVariableCountInCollection(collection);
          const colorGroups = collection.groups.filter(hasColorVariablesInGroup);
          
          return (
          <button
            key={collection.id}
            onClick={() => navigateToCollection(collection)}
            style={{
              width: '100%',
              padding: '16px',
                backgroundColor: 'var(--muted)',
              borderRadius: '6px',
              marginBottom: '8px',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--muted)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--muted)';
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  fontWeight: '500', 
                  color: 'var(--foreground)',
                  fontSize: '13px'
                }}>
                  {collection.name}
                </span>
              </div>
              <span style={{
                fontSize: '11px',
                color: 'var(--muted-foreground)',
                backgroundColor: 'var(--muted)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                  {colorCount} colors
              </span>
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--muted-foreground)'
            }}>
                {colorGroups.length} color groups • {collection.allModes.length} modes
            </div>
          </button>
          );
        })}
      </div>
    );
  };

  const renderGroupsList = () => {
    if (!navigation.currentCollection) return null;

    const colorGroups = navigation.currentCollection.groups.filter(hasColorVariablesInGroup);

    if (colorGroups.length === 0) {
      return (
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
              margin: '0 auto 12px auto',
              fontSize: '20px',
              color: 'var(--muted-foreground)'
            }}>
              🎨
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '8px' }}>
              No color groups found
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', maxWidth: '200px' }}>
              This collection contains no color variables.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div style={{ padding: '8px 16px 16px' }}>
        {colorGroups.map((group, index) => {
          const colorCount = getColorVariableCountInGroup(group);
          const colorModes = group.modes.filter(hasColorVariables);
          
          return (
          <button
            key={index}
            onClick={() => navigateToGroup(group)}
            style={{
              width: '100%',
              padding: '16px',
                backgroundColor: 'var(--muted)',
              borderRadius: '6px',
              marginBottom: '8px',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--muted)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--muted)';
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  fontWeight: '500', 
                  color: 'var(--foreground)',
                  fontSize: '13px'
                }}>
                  {group.name}
                </span>
              </div>
              <span style={{
                fontSize: '11px',
                color: 'var(--muted-foreground)',
                backgroundColor: 'var(--muted)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                  {colorCount} colors
              </span>
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--muted-foreground)'
            }}>
                {colorModes.length} color modes
            </div>
          </button>
          );
        })}
      </div>
    );
  };

  const renderModesList = () => {
    if (!navigation.currentGroup) return null;

    const colorModes = navigation.currentGroup.modes.filter(hasColorVariables);

    if (colorModes.length === 0) {
      return (
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
              margin: '0 auto 12px auto',
              fontSize: '20px',
              color: 'var(--muted-foreground)'
            }}>
              🎨
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '8px' }}>
              No color modes found
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', maxWidth: '200px' }}>
              This group contains no color variables.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div style={{ padding: '8px 16px 16px' }}>
        {colorModes.map((mode) => {
          const colorCount = getColorVariableCount(mode);
          
          return (
          <button
            key={mode.id}
            onClick={() => navigateToMode(mode)}
            style={{
              width: '100%',
              padding: '16px',
                backgroundColor: 'var(--muted)',
              borderRadius: '6px',
              marginBottom: '8px',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--muted)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--muted)';
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  fontWeight: '500', 
                  color: 'var(--foreground)',
                  fontSize: '13px'
                }}>
                  {mode.name}
                </span>
              </div>
              <span style={{
                fontSize: '11px',
                color: 'var(--muted-foreground)',
                backgroundColor: 'var(--muted)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                  {colorCount} colors
              </span>
            </div>
          </button>
          );
        })}
      </div>
    );
  };

  const renderVariablesList = () => {
    if (!navigation.currentMode) return null;

    const variables = filteredVariables;

    if (variables.length === 0) {
      return (
        <div style={{ 
          padding: '16px', 
          textAlign: 'center', 
          color: 'var(--muted-foreground)', 
          fontSize: '12px' 
        }}>
          {searchQuery ? 'No variables match your search' : 'No variables in this mode'}
        </div>
      );
    }

    return (
      <div style={{ padding: '8px 16px 16px' }}>
        {variables.map(renderVariableItem)}
      </div>
    );
  };

  const renderBreadcrumbs = () => {
    if (navigation.breadcrumbs.length === 0) return null;

    const truncateText = (text: string, maxLength: number = 6): string => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    };

    return (
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '12px'
      }}>
        <button
          onClick={navigateToCollections}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--muted-foreground)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px'
          }}
        >
          <HomeIcon />
        </button>
        {navigation.breadcrumbs.map((breadcrumb, index) => (
          <React.Fragment key={index}>
            <span style={{ color: 'var(--muted-foreground)' }}>/</span>
            <button
              onClick={() => navigateToBreadcrumb(index)}
              title={breadcrumb.label}
              style={{
                background: 'none',
                border: 'none',
                color: index === navigation.breadcrumbs.length - 1 ? 'var(--foreground)' : 'var(--muted-foreground)',
                cursor: 'pointer',
                textDecoration: index === navigation.breadcrumbs.length - 1 ? 'none' : 'underline',
                padding: '4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '80px'
              }}
            >
              {truncateText(breadcrumb.label)}
            </button>
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderCurrentView = () => {
    if (!navigation.currentCollection) {
      return renderCollectionsList();
    } else if (!navigation.currentGroup) {
      return renderGroupsList();
    } else if (!navigation.currentMode) {
      return renderModesList();
    } else {
      return renderVariablesList();
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', gap: '1px', padding: '0' }}>
      {/* Left Panel - Scanner Controls */}
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
        </div>
        
        <div style={{ 
          flex: 1, 
          padding: '16px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px'
        }}>
          {/* Scan Variables Section */}
          <div style={{ 
            border: '1px solid var(--border)', 
            borderRadius: '8px', 
            padding: '16px',
            backgroundColor: 'var(--muted)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <FileSearchIcon />
              <h3 style={{ fontSize: '13px', fontWeight: '500', color: 'var(--foreground)', margin: 0 }}>
                Scan Variables
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '12px' }}>
              Discover all variable collections, groups, and modes in your Figma file.
            </p>
            <button 
              onClick={handleScanVariables}
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
                  Scanning...
                </>
              ) : (
                <>
                  <SearchIcon />
                  Start Scan
                </>
              )}
            </button>
          </div>

          {/* Generate Collection Color Guide Section */}
          {navigation.currentCollection && !navigation.currentMode && (
            <div style={{ 
              border: '1px solid var(--border)', 
              borderRadius: '8px', 
              padding: '16px',
              backgroundColor: 'var(--muted)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FrameIcon />
                <h3 style={{ fontSize: '13px', fontWeight: '500', color: 'var(--foreground)', margin: 0 }}>
                  Generate Collection Guide
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '12px' }}>
                Create a comprehensive color guide for "{navigation.currentCollection.name}" collection (all groups and modes).
              </p>
              <button 
                onClick={handleGenerateColorGuide}
                disabled={isGeneratingGuide}
                style={{
                  width: '100%',
                  height: '36px',
                  backgroundColor: isGeneratingGuide ? 'var(--muted)' : 'var(--foreground)',
                  color: isGeneratingGuide ? 'var(--muted-foreground)' : 'var(--background)',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: isGeneratingGuide ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {isGeneratingGuide ? (
                  <>
                    <div style={{
                      width: '14px',
                      height: '14px',
                      border: '2px solid currentColor',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Generating...
                  </>
                ) : (
                  <>
                    <FrameIcon />
                    Generate Collection Guide
                  </>
                )}
              </button>
            </div>
          )}

          {/* Generate Mode Color Guide Section */}
          {navigation.currentMode && (
            <div style={{ 
              border: '1px solid var(--border)', 
              borderRadius: '8px', 
              padding: '16px',
              backgroundColor: 'var(--muted)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FrameIcon />
                <h3 style={{ fontSize: '13px', fontWeight: '500', color: 'var(--foreground)', margin: 0 }}>
                  Generate Mode Guide
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '12px' }}>
                Create a color guide for "{navigation.currentMode.name}" mode only.
              </p>
              <button 
                onClick={handleGenerateModeColorGuide}
                disabled={isGeneratingGuide}
                style={{
                  width: '100%',
                  height: '36px',
                  backgroundColor: isGeneratingGuide ? 'var(--muted)' : 'var(--foreground)',
                  color: isGeneratingGuide ? 'var(--muted-foreground)' : 'var(--background)',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: isGeneratingGuide ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {isGeneratingGuide ? (
                  <>
                    <div style={{
                      width: '14px',
                      height: '14px',
                      border: '2px solid currentColor',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Generating...
                  </>
                ) : (
                  <>
                    <FrameIcon />
                    Generate Mode Guide
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Hierarchical Preview */}
      <div style={{ 
        flex: 1, 
        backgroundColor: 'var(--card)', 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: 0,
        borderRadius: '0',
        border: '1px solid var(--border)',
        mask: 'linear-gradient(#000000, black, #0c0b0b3d)'
      }}>
        {/* Header with Search */}
        <div style={{ 
          flexShrink: 0, 
          backgroundColor: 'var(--card)',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ 
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '12px'
          }}>
            <h2 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--foreground)', margin: 0 }}>
              Variable Explorer
            </h2>
          </div>
          {/* Breadcrumbs */}
          {renderBreadcrumbs()}
            {/* Search Bar - Only show when viewing variables */}
            {navigation.currentMode && (
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 2,
                background: 'var(--card)',
                padding: searchOpen ? '12px 16px 8px 16px' : '4px 16px',
                borderTop: '1px solid var(--border)',
                transition: 'padding 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: searchOpen ? 'space-between' : 'flex-end',
                minHeight: '32px',
                cursor: !searchOpen ? 'pointer' : undefined
              }}
              onClick={!searchOpen ? () => setSearchOpen(true) : undefined}
              tabIndex={!searchOpen ? 0 : undefined}
              role={!searchOpen ? 'button' : undefined}
              aria-label={!searchOpen ? 'Expand search' : undefined}
              onKeyDown={!searchOpen ? (e) => { if (e.key === 'Enter' || e.key === ' ') setSearchOpen(true); } : undefined}
            >
              {/* Search Input (collapsible) */}
              {searchOpen && (
                <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type="text"
                  placeholder="Search variables..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                      padding: '8px 28px 8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)'
                  }}
                />
                  {/* Search Icon (left) */}
                                 <div style={{
                   position: 'absolute',
                    right: searchQuery ? '28px' : '8px',
                   top: '50%',
                   transform: 'translateY(-50%)',
                    color: 'var(--muted-foreground)',
                    pointerEvents: 'none'
                 }}>
                   <SearchIcon />
                 </div>
                  {/* Clear (X) Icon */}
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '6px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        margin: 0,
                        cursor: 'pointer',
                        color: 'var(--muted-foreground)',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      tabIndex={-1}
                      aria-label="Clear search"
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="5" x2="15" y2="15" /><line x1="15" y1="5" x2="5" y2="15" /></svg>
                    </button>
                  )}
              </div>
            )}
              {/* Collapsed state: right-aligned chevron only */}
              {!searchOpen && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(0deg)', transition: 'transform 0.2s' }}>
                    <polyline points="6 8 10 12 14 8" />
                  </svg>
          </div>
              )}
              {/* Collapsible Toggle Icon (right) for expanded state */}
              {searchOpen && (
                <button
                  onClick={() => setSearchOpen((open) => !open)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    marginLeft: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--muted-foreground)'
                  }}
                  aria-label={searchOpen ? 'Collapse search' : 'Expand search'}
                >
                  {/* Up chevron when open */}
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(180deg)', transition: 'transform 0.2s' }}>
                    <polyline points="6 8 10 12 14 8" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Content Area */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {renderCurrentView()}
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