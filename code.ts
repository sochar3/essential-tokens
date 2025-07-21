// TypeScript declarations for Figma plugin API
declare const figma: any;
declare const __html__: string;

// This file runs in the Figma plugin sandbox and has access to the Figma API

// Show the UI using the HTML content from the manifest
figma.showUI(__html__, { 
  width: 960, 
  height: 700,
  themeColors: true
});

interface ParsedToken {
  name: string;
  value: string;
  type: 'color' | 'font' | 'radius' | 'shadow' | 'other';
  displayValue?: string;
  category?: string;
  source?: string;
  collection?: string;
}

interface ParsedTokens {
  light: ParsedToken[];
  dark: ParsedToken[];
  global: ParsedToken[];
}

interface CreateVariablesMessage {
  type: 'create-variables';
  tokens: {
    light: ParsedToken[];
    dark: ParsedToken[];
    global: ParsedToken[];
  };
}

// === NEW HIERARCHICAL VARIABLE SYSTEM ===

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

// === END NEW INTERFACES ===

// Convert oklch to RGB values for Figma
function oklchToRgb(oklchString: string): { r: number; g: number; b: number } | null {
  const match = oklchString.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
  if (!match) return null;
  
  const [, l, c, h] = match.map(Number);
  
  // Better OKLCH to RGB conversion
  // Note: This is still a simplified version. For production, consider using a proper color library like culori
  const lightness = Math.max(0, Math.min(1, l));
  const chroma = Math.max(0, c);
  const hueRad = (h * Math.PI) / 180;
  
  // Convert LCH to Lab
  const a = chroma * Math.cos(hueRad);
  const b = chroma * Math.sin(hueRad);
  
  // Simplified Lab to XYZ conversion (using D65 illuminant approximation)
  const fy = (lightness + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  
  const xyz_to_rgb = (t: number) => {
    return t > 0.206893034 ? t * t * t : (t - 16/116) / 7.787;
  };
  
  let x = xyz_to_rgb(fx) * 0.95047;
  let y = xyz_to_rgb(fy);
  let z = xyz_to_rgb(fz) * 1.08883;
  
  // XYZ to sRGB conversion matrix
  let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  let b_val = x * 0.0557 + y * -0.2040 + z * 1.0570;
  
  // Gamma correction
  const gamma_correct = (c: number) => {
    return c > 0.0031308 ? 1.055 * Math.pow(c, 1/2.4) - 0.055 : 12.92 * c;
  };
  
  r = Math.max(0, Math.min(1, gamma_correct(r)));
  g = Math.max(0, Math.min(1, gamma_correct(g)));
  b_val = Math.max(0, Math.min(1, gamma_correct(b_val)));
  
  return { r, g, b: b_val };
}

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : null;
}

// Convert HSL to RGB - Enhanced to support decimal values and percentages
function hslToRgb(hslString: string): { r: number; g: number; b: number } | null {
  // Support both integer and decimal values, with or without percentages
  const match = hslString.match(/hsla?\(([+-]?[\d.]+)(?:deg)?,?\s*([+-]?[\d.]+)%?,?\s*([+-]?[\d.]+)%?(?:,?\s*([+-]?[\d.]+))?\)/i);
  if (!match) return null;
  
  let h = parseFloat(match[1]);
  let s = parseFloat(match[2]);
  let l = parseFloat(match[3]);
  
  // Normalize hue to 0-1 range
  h = ((h % 360) + 360) % 360 / 360;
  
  // Normalize saturation and lightness
  // If values are > 1, assume they're percentages
  if (s > 1) s = s / 100;
  if (l > 1) l = l / 100;
  
  // Clamp values
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  
  return {
    r: hue2rgb(p, q, h + 1/3),
    g: hue2rgb(p, q, h),
    b: hue2rgb(p, q, h - 1/3)
  };
}

// Convert HSB/HSV to RGB - New function for HSB support
function hsbToRgb(hsbString: string): { r: number; g: number; b: number } | null {
  // Support hsb(), hsv(), and hsba()/hsva() formats
  const match = hsbString.match(/hsb[av]?\(([+-]?[\d.]+)(?:deg)?,?\s*([+-]?[\d.]+)%?,?\s*([+-]?[\d.]+)%?(?:,?\s*([+-]?[\d.]+))?\)/i);
  if (!match) return null;
  
  let h = parseFloat(match[1]);
  let s = parseFloat(match[2]);
  let b = parseFloat(match[3]);
  
  // Normalize hue to 0-1 range
  h = ((h % 360) + 360) % 360 / 360;
  
  // Normalize saturation and brightness
  // If values are > 1, assume they're percentages
  if (s > 1) s = s / 100;
  if (b > 1) b = b / 100;
  
  // Clamp values
  s = Math.max(0, Math.min(1, s));
  b = Math.max(0, Math.min(1, b));
  
  const c = b * s;
  const x = c * (1 - Math.abs((h * 6) % 2 - 1));
  const m = b - c;
  
  let r = 0, g = 0, b_val = 0;
  
  const hSector = h * 6;
  if (hSector >= 0 && hSector < 1) {
    r = c; g = x; b_val = 0;
  } else if (hSector >= 1 && hSector < 2) {
    r = x; g = c; b_val = 0;
  } else if (hSector >= 2 && hSector < 3) {
    r = 0; g = c; b_val = x;
  } else if (hSector >= 3 && hSector < 4) {
    r = 0; g = x; b_val = c;
  } else if (hSector >= 4 && hSector < 5) {
    r = x; g = 0; b_val = c;
  } else {
    r = c; g = 0; b_val = x;
  }
  
  return {
    r: r + m,
    g: g + m,
    b: b_val + m
  };
}

// Enhanced RGB parsing to support decimals, percentages, and rgba
function rgbToRgb(rgbString: string): { r: number; g: number; b: number } | null {
  // Support rgb(), rgba(), and various formats including decimals and percentages
  const match = rgbString.match(/rgba?\(([+-]?[\d.]+)%?,?\s*([+-]?[\d.]+)%?,?\s*([+-]?[\d.]+)%?(?:,?\s*([+-]?[\d.]+))?\)/i);
  if (!match) return null;
  
  let r = parseFloat(match[1]);
  let g = parseFloat(match[2]);
  let b = parseFloat(match[3]);
  
  // Check if values are percentages by looking for % in the original string
  const isPercentage = rgbString.includes('%');
  
  if (isPercentage) {
    // If percentages, normalize to 0-1
    r = Math.max(0, Math.min(100, r)) / 100;
    g = Math.max(0, Math.min(100, g)) / 100;
    b = Math.max(0, Math.min(100, b)) / 100;
  } else {
    // If not percentages, assume 0-255 range if > 1, otherwise 0-1
    if (r > 1 || g > 1 || b > 1) {
      r = Math.max(0, Math.min(255, r)) / 255;
      g = Math.max(0, Math.min(255, g)) / 255;
      b = Math.max(0, Math.min(255, b)) / 255;
    } else {
      r = Math.max(0, Math.min(1, r));
      g = Math.max(0, Math.min(1, g));
      b = Math.max(0, Math.min(1, b));
    }
  }
  
  return { r, g, b };
}

// Convert ShadCN raw HSL format to RGB (e.g., "0 0% 100%" -> RGB)
function shadcnHslToRgb(shadcnHslString: string): { r: number; g: number; b: number } | null {
  // Parse ShadCN format: "h s% l%" (without hsl() wrapper)
  const match = shadcnHslString.trim().match(/^([+-]?[\d.]+)\s+([+-]?[\d.]+)%\s+([+-]?[\d.]+)%$/);
  if (!match) return null;
  
  let h = parseFloat(match[1]);
  let s = parseFloat(match[2]);
  let l = parseFloat(match[3]);
  
  // Normalize hue to 0-1 range
  h = ((h % 360) + 360) % 360 / 360;
  
  // Normalize saturation and lightness (already in percentage format)
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  
  return {
    r: hue2rgb(p, q, h + 1/3),
    g: hue2rgb(p, q, h),
    b: hue2rgb(p, q, h - 1/3)
  };
}

// Parse color value to RGB - Enhanced with comprehensive format support
function parseColorToRgb(colorValue: string): { r: number; g: number; b: number } | null {
  const cleanValue = colorValue.trim();
  
  // Check for ShadCN raw HSL format first (e.g., "0 0% 100%")
  const shadcnHslMatch = cleanValue.match(/^([+-]?[\d.]+)\s+([+-]?[\d.]+)%\s+([+-]?[\d.]+)%$/);
  if (shadcnHslMatch) {
    return shadcnHslToRgb(cleanValue);
  }
  
  if (cleanValue.includes('oklch')) {
    return oklchToRgb(cleanValue);
  } else if (cleanValue.startsWith('#')) {
    return hexToRgb(cleanValue);
  } else if (cleanValue.includes('hsl')) {
    return hslToRgb(cleanValue);
  } else if (cleanValue.includes('hsb') || cleanValue.includes('hsv')) {
    return hsbToRgb(cleanValue);
  } else if (cleanValue.includes('rgb')) {
    return rgbToRgb(cleanValue);
  }
  
  return null;
}

// Debug logger utility for development
const logger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors
    console.error(...args);
  }
};

// Function to find existing shadcn-compatible variable collection (updated for ShadCN patterns)
async function findExistingShadcnCollection() {
  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const variables = await figma.variables.getLocalVariablesAsync();
    
    logger.log('Available collections:', collections.map((c: any) => ({ name: c.name, id: c.id, modes: c.modes.length })));
    
    // Look for ShadCN collections in order of preference
    const shadcnCollectionNames = ['2. Themes', '3. Mode', 'Themes', 'Colors', 'Design Tokens'];
    
    for (const collectionName of shadcnCollectionNames) {
      const targetCollection = collections.find((collection: any) => collection.name === collectionName);
    
    if (targetCollection) {
      const collectionVariables = variables.filter((v: any) => v.variableCollectionId === targetCollection.id);
        logger.log(`Found "${collectionName}" collection with ${collectionVariables.length} variables`);
        logger.log('Variable names sample:', collectionVariables.slice(0, 5).map((v: any) => v.name));
      
        // Check if it has variables with ShadCN naming patterns
        const shadcnPatterns = ['background', 'foreground', 'primary', 'secondary', 'muted', 'accent', 'destructive', 'border', 'input', 'ring', 'card', 'popover'];
        
        // Check for variables in "base/" or "color/" groups
      const baseGroupVariables = collectionVariables.filter((variable: any) => 
          variable.name.toLowerCase().startsWith('base/') ||
          variable.name.toLowerCase().startsWith('color/')
      );
      
        // Check if it has ShadCN variables (with or without prefixes)
        const hasShadcnVariables = collectionVariables.some((variable: any) => {
        const name = variable.name.toLowerCase();
        return shadcnPatterns.some(pattern => name.includes(pattern));
      });
      
        logger.log(`Base/color group variables: ${baseGroupVariables.length}, has shadcn patterns: ${hasShadcnVariables}`);
        
        // More lenient criteria for ShadCN collections
        if (hasShadcnVariables && collectionVariables.length >= 3) {
          logger.log(`Using "${collectionName}" collection as target`);
          return {
            collection: targetCollection,
            variables: collectionVariables,
            hasLightDarkModes: targetCollection.modes.length > 1
          };
        }
      }
    }
    
    // Fallback: look for any collection with a reasonable number of color variables
    for (const collection of collections) {
      const collectionVariables = variables.filter((v: any) => v.variableCollectionId === collection.id);
      
      // Count color variables
      const colorVariables = collectionVariables.filter((variable: any) => variable.resolvedType === 'COLOR');
      
      // Look for collections with significant color variables
      if (colorVariables.length >= 10) { // Lowered threshold for ShadCN compatibility
        logger.log(`Using fallback collection: "${collection.name}" with ${colorVariables.length} color variables`);
        return {
          collection,
          variables: collectionVariables,
          hasLightDarkModes: collection.modes.length > 1
        };
      }
    }
    
    logger.log('No existing ShadCN-compatible collection found');
    return null;
  } catch (error) {
    logger.error('Error finding existing ShadCN collection:', error);
    return null;
  }
}

async function createFigmaVariables(tokens: { light: ParsedToken[]; dark: ParsedToken[]; global: ParsedToken[] }) {
  try {
    // First, check if there's an existing shadcn-compatible collection
    const existingSetup = await findExistingShadcnCollection();
    
    let collection: any;
    let lightModeId: string;
    let darkModeId: string;
    
    if (existingSetup) {
      // Use existing collection and extend it
      collection = existingSetup.collection;
      
      // Check if this is the specific "3. Mode" collection
      const isThemeModeCollection = collection.name === '3. Mode';
      
      console.log('Existing modes:', collection.modes.map((m: any) => m.name));
      
      // Create new custom modes alongside existing ones (don't overwrite)
      lightModeId = collection.addMode('light custom');
      darkModeId = collection.addMode('dark custom');
      
      console.log(`Created new modes: "light custom" and "dark custom"`);
      
      if (isThemeModeCollection) {
        figma.notify(`Adding custom theme modes to "${collection.name}" → base group`);
      } else {
        figma.notify(`Adding custom modes to existing collection: "${collection.name}"`);
      }
    } else {
      // Create a new variable collection for design tokens
      console.log('No existing collection found, creating new "Design Tokens" collection');
      collection = figma.variables.createVariableCollection('Design Tokens');
    
      // Set up modes - first mode is light, add dark mode
      lightModeId = collection.modes[0].modeId;
      collection.renameMode(lightModeId, 'Light');
      darkModeId = collection.addMode('Dark');
      
      figma.notify('Creating new "Design Tokens" collection with Light/Dark modes');
    }
    
    let createdCount = 0;
    
    // Helper function to create or update a variable with both light and dark mode values
    const createOrUpdateVariableWithModes = async (lightToken: ParsedToken, darkToken: ParsedToken | undefined, collection: any, lightModeId: string, darkModeId: string, existingVariables?: any[]) => {
      try {
        let variableType: any;
        let lightValue: any;
        let darkValue: any;
        
        switch (lightToken.type) {
          case 'color':
            variableType = 'COLOR';
            const lightRgb = parseColorToRgb(lightToken.value);
            if (!lightRgb) {
              console.warn(`Could not parse light color: ${lightToken.value}`);
              return;
            }
            lightValue = lightRgb;
            
            if (darkToken) {
              const darkRgb = parseColorToRgb(darkToken.value);
              darkValue = darkRgb || lightRgb; // Fallback to light if dark fails
            } else {
              darkValue = lightRgb;
            }
            break;
            
          case 'radius':
            variableType = 'FLOAT';
            // Extract numeric value from rem, px, etc.
            const lightNumMatch = lightToken.value.match(/([\d.]+)/);
            if (lightNumMatch) {
              lightValue = parseFloat(lightNumMatch[1]);
              // Convert rem to px (assuming 16px = 1rem)
              if (lightToken.value.includes('rem')) {
                lightValue *= 16;
              }
            } else {
              console.warn(`Could not parse radius: ${lightToken.value}`);
              return;
            }
            
            if (darkToken) {
              const darkNumMatch = darkToken.value.match(/([\d.]+)/);
              if (darkNumMatch) {
                darkValue = parseFloat(darkNumMatch[1]);
                if (darkToken.value.includes('rem')) {
                  darkValue *= 16;
                }
              } else {
                darkValue = lightValue;
              }
            } else {
              darkValue = lightValue;
            }
            break;
            
          case 'font':
          default:
            variableType = 'STRING';
            lightValue = lightToken.value;
            darkValue = darkToken ? darkToken.value : lightToken.value;
            break;
        }
        
        // Add "base/" prefix for color variables to group them
        const variableName = lightToken.type === 'color' ? `base/${lightToken.name}` : lightToken.name;
        
        // Check if variable already exists when extending existing collection
        let variable;
        if (existingVariables) {
          variable = existingVariables.find((v: any) => v.name === variableName);
        }
        
        if (variable) {
          // Update existing variable with new custom mode values only
          // Don't touch existing mode values - only add to the new custom modes
          try {
            variable.setValueForMode(lightModeId, lightValue);
            variable.setValueForMode(darkModeId, darkValue);
                                    logger.log(`Updated existing variable "${variableName}" with custom mode values`);
          } catch (error) {
                        logger.warn(`Could not add custom modes to variable ${variableName}:`, error);
          }
        } else {
          // Create new variable and set values only for custom modes
          variable = figma.variables.createVariable(variableName, collection, variableType);
          variable.setValueForMode(lightModeId, lightValue);
          variable.setValueForMode(darkModeId, darkValue);
                      logger.log(`Created new variable "${variableName}" with custom mode values`);
        }
        createdCount++;
        
      } catch (error) {
        logger.error(`Error creating variable ${lightToken.name}:`, error);
      }
    };
    
    // Define custom order for color variables
    const colorVariableOrder = [
      'accent',
      'accent-foreground',
      'background',
      'border',
      'card',
      'card-foreground',
      'destructive',
      'destructive-foreground',
      'foreground',
      'input',
      'muted',
      'muted-foreground',
      'popover',
      'popover-foreground',
      'primary',
      'primary-foreground',
      'ring',
      'ring-offset',
      'secondary',
      'secondary-foreground',
      'chart-1',
      'chart-2',
      'chart-3',
      'chart-4',
      'chart-5',
      'sidebar-primary-foreground',
      'sidebar-primary',
      'sidebar-foreground',
      'sidebar-background',
      'sidebar-accent',
      'sidebar-accent-foreground',
      'sidebar-border',
      'sidebar-ring'
    ];

    // Create variables with values for both light and dark modes
    const allTokenNames = Array.from(new Set([
      ...tokens.light.map(t => t.name),
      ...tokens.dark.map(t => t.name),
      ...tokens.global.map(t => t.name)
         ])).sort((a, b) => {
       // Custom sorting: colors follow the defined order, others alphabetically
       const aLightToken = tokens.light.find(t => t.name === a);
       const aDarkToken = tokens.dark.find(t => t.name === a);
       const aGlobalToken = tokens.global.find(t => t.name === a);
       const aIsColor = (aLightToken && aLightToken.type === 'color') || 
                       (aDarkToken && aDarkToken.type === 'color') ||
                       (aGlobalToken && aGlobalToken.type === 'color');
       
       const bLightToken = tokens.light.find(t => t.name === b);
       const bDarkToken = tokens.dark.find(t => t.name === b);
       const bGlobalToken = tokens.global.find(t => t.name === b);
       const bIsColor = (bLightToken && bLightToken.type === 'color') || 
                       (bDarkToken && bDarkToken.type === 'color') ||
                       (bGlobalToken && bGlobalToken.type === 'color');
      
      if (aIsColor && bIsColor) {
        // Both are colors, use custom order
        const aIndex = colorVariableOrder.indexOf(a);
        const bIndex = colorVariableOrder.indexOf(b);
        
        // If both are in the order list, sort by position
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
    }
        // If only one is in the list, prioritize it
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        // If neither is in the list, sort alphabetically
        return a.localeCompare(b);
      } else if (aIsColor && !bIsColor) {
        // Colors come first
        return -1;
      } else if (!aIsColor && bIsColor) {
        // Non-colors come after colors
        return 1;
      } else {
        // Both are non-colors, sort alphabetically
        return a.localeCompare(b);
      }
    });
    
    for (const tokenName of allTokenNames) {
      const lightToken = tokens.light.find(t => t.name === tokenName) || 
                        tokens.global.find(t => t.name === tokenName);
      const darkToken = tokens.dark.find(t => t.name === tokenName) || lightToken;
      
      if (lightToken) {
        await createOrUpdateVariableWithModes(lightToken, darkToken, collection, lightModeId, darkModeId, existingSetup ? existingSetup.variables : undefined);
      }
    }
    
    return {
      count: createdCount,
      isExtension: !!existingSetup,
      collectionName: collection.name
    };
    
  } catch (error) {
    console.error('Error creating Figma variables:', error);
    throw error;
  }
}

// Function to generate a color guide frame on the canvas
async function generateColorGuide(tokens: ParsedTokens) {
  try {
    // Get all color tokens from all modes
    const allColorTokens = [
      ...tokens.light.filter(t => t.type === 'color'),
      ...tokens.dark.filter(t => t.type === 'color'),
      ...tokens.global.filter(t => t.type === 'color')
    ];
    
    if (allColorTokens.length === 0) {
      throw new Error('No color variables found to generate guide');
    }
    
    // Group tokens by collection
    const tokensByCollection = new Map<string, {
      light: ParsedToken[];
      dark: ParsedToken[];
      global: ParsedToken[];
    }>();
    
    // Initialize collections
    for (const token of allColorTokens) {
      const collectionName = token.collection || 'Unknown Collection';
      if (!tokensByCollection.has(collectionName)) {
        tokensByCollection.set(collectionName, { light: [], dark: [], global: [] });
      }
    }
    
    // Sort tokens into collections by mode
    for (const token of tokens.light.filter(t => t.type === 'color')) {
      const collectionName = token.collection || 'Unknown Collection';
      tokensByCollection.get(collectionName)!.light.push(token);
    }
    for (const token of tokens.dark.filter(t => t.type === 'color')) {
      const collectionName = token.collection || 'Unknown Collection';
      tokensByCollection.get(collectionName)!.dark.push(token);
    }
    for (const token of tokens.global.filter(t => t.type === 'color')) {
      const collectionName = token.collection || 'Unknown Collection';
      tokensByCollection.get(collectionName)!.global.push(token);
    }
    
    // Layout constants
    const swatchSize = 90;
    const swatchGap = 24;
    const nameHeight = 20;
    const valueHeight = 16;
    const verticalGap = 8;
    const totalLabelHeight = nameHeight + valueHeight + verticalGap;
    const bottomPadding = 16;
    const totalItemHeight = swatchSize + totalLabelHeight + bottomPadding;
    const itemsPerRow = 5;
    const sectionGap = 48;
    const titleHeight = 64;
    const padding = 28;
    const frameGap = 100; // Gap between collection frames
    
    // Load fonts
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    
    const createdFrames: any[] = [];
    const viewport = figma.viewport.bounds;
    let frameOffsetX = 0;
    
    // Helper function to truncate text that's too long
    const truncateText = (text: string, maxLength: number): string => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength - 3) + '...';
    };
    
    // Create a frame for each collection
    for (const [collectionName, collectionTokens] of Array.from(tokensByCollection.entries())) {
      const lightColors = collectionTokens.light;
      const darkColors = collectionTokens.dark;
      const globalColors = collectionTokens.global;
      
      // Skip collections with no colors
      if (lightColors.length === 0 && darkColors.length === 0 && globalColors.length === 0) {
        continue;
      }
      
      // Calculate sections for this collection
      const sections = [];
      if (lightColors.length > 0) {
        sections.push({ title: 'Light Mode', colors: lightColors, badgeColor: { r: 0.2, g: 0.6, b: 1.0 } });
      }
      if (darkColors.length > 0) {
        sections.push({ title: 'Dark Mode', colors: darkColors, badgeColor: { r: 0.4, g: 0.2, b: 0.8 } });
      }
      if (globalColors.length > 0) {
        sections.push({ title: 'Global Colors', colors: globalColors, badgeColor: { r: 0.0, g: 0.7, b: 0.4 } });
      }
      
      // Calculate frame dimensions for this collection
      const maxItemsInSection = Math.max(...sections.map(s => s.colors.length));
      const maxRowsInSection = Math.ceil(maxItemsInSection / itemsPerRow);
      const sectionHeight = titleHeight + (maxRowsInSection * totalItemHeight) - (maxRowsInSection > 0 ? swatchGap : 0);
      
      const frameWidth = Math.max(680, itemsPerRow * (swatchSize + swatchGap) - swatchGap + (padding * 2));
      const frameHeight = 100 + (sections.length * (sectionHeight + sectionGap)) - sectionGap + padding;
      
      // Create collection frame
      const frame = figma.createFrame();
      frame.name = `${collectionName} - Color Guide`;
      frame.resize(frameWidth, frameHeight);
      frame.fills = [{
        type: 'SOLID',
        color: { r: 0.99, g: 0.99, b: 1.0 }
      }];
      frame.cornerRadius = 12;
      frame.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.1 },
        offset: { x: 0, y: 4 },
        radius: 12,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL'
      }];
      
      // Position frame
      frame.x = viewport.x + 50 + frameOffsetX;
      frame.y = viewport.y + 50;
      frameOffsetX += frameWidth + frameGap;
      
      // Add collection title
      const titleText = figma.createText();
      titleText.fontName = { family: 'Inter', style: 'Bold' };
      titleText.fontSize = 24;
      titleText.characters = collectionName;
      titleText.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];
      titleText.x = padding;
      titleText.y = 26;
      frame.appendChild(titleText);
      
      // Add subtitle
      const totalColors = lightColors.length + darkColors.length + globalColors.length;
      const subtitleText = figma.createText();
      subtitleText.fontName = { family: 'Inter', style: 'Regular' };
      subtitleText.fontSize = 14;
      subtitleText.characters = `${totalColors} color variables across ${sections.length} mode${sections.length !== 1 ? 's' : ''}`;
      subtitleText.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
      subtitleText.x = padding;
      subtitleText.y = 56;
      frame.appendChild(subtitleText);
      
      let currentY = 110;
      
      // Create sections for each mode within this collection
      for (const section of sections) {
        // Section title with colored badge
        const sectionTitle = figma.createText();
        sectionTitle.fontName = { family: 'Inter', style: 'Semi Bold' };
        sectionTitle.fontSize = 18;
        sectionTitle.characters = section.title;
        sectionTitle.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];
        sectionTitle.x = padding + 36;
        sectionTitle.y = currentY;
        frame.appendChild(sectionTitle);
        
        // Colored badge
        const badge = figma.createEllipse();
        badge.resize(20, 20);
        badge.x = padding;
        badge.y = currentY + 2;
        badge.fills = [{ type: 'SOLID', color: section.badgeColor }];
        frame.appendChild(badge);
        
        // Section count
        const countText = figma.createText();
        countText.fontName = { family: 'Inter', style: 'Regular' };
        countText.fontSize = 13;
        countText.characters = `${section.colors.length} variables`;
        countText.fills = [{ type: 'SOLID', color: { r: 0.6, g: 0.6, b: 0.6 } }];
        countText.x = padding + 36 + sectionTitle.width + 12;
        countText.y = currentY + 3;
        frame.appendChild(countText);
        
        currentY += titleHeight;
        
        // Create color swatches for this section
        for (let i = 0; i < section.colors.length; i++) {
          const token = section.colors[i];
          const row = Math.floor(i / itemsPerRow);
          const col = i % itemsPerRow;
          
          const x = padding + col * (swatchSize + swatchGap);
          const y = currentY + row * totalItemHeight;
          
          // Create swatch rectangle
          const swatch = figma.createRectangle();
          swatch.name = `${section.title.toLowerCase()}-${token.name}`;
          swatch.resize(swatchSize, swatchSize);
          swatch.x = x;
          swatch.y = y;
          swatch.cornerRadius = 8;
          
          // Parse color and set fill
          let rgb = parseColorToRgb(token.value);
          if (rgb) {
            swatch.fills = [{
              type: 'SOLID',
              color: { r: rgb.r, g: rgb.g, b: rgb.b }
            }];
          } else {
            // Fallback for unparseable colors
            swatch.fills = [{
              type: 'SOLID',
              color: { r: 0.9, g: 0.9, b: 0.9 }
            }];
          }
          
          // Add subtle border
          swatch.strokes = [{
            type: 'SOLID',
            color: { r: 0.9, g: 0.9, b: 0.9 }
          }];
          swatch.strokeWeight = 1;
          
          frame.appendChild(swatch);
          
          // Create variable name label with truncation
          const nameLabel = figma.createText();
          nameLabel.fontName = { family: 'Inter', style: 'Medium' };
          nameLabel.fontSize = 12;
          nameLabel.characters = truncateText(token.name, 20);
          nameLabel.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];
          nameLabel.x = x;
          nameLabel.y = y + swatchSize + 10;
          nameLabel.textAlignHorizontal = 'LEFT';
          nameLabel.resize(swatchSize, nameHeight);
          nameLabel.textAutoResize = 'NONE';
          frame.appendChild(nameLabel);
          
          // Create value label with better formatting
          const valueLabel = figma.createText();
          valueLabel.fontName = { family: 'Inter', style: 'Regular' };
          valueLabel.fontSize = 10;
          
          // Show original format if it's concise, otherwise convert to hex
          let displayValue = token.value;
          
          // If the original value is too long or complex, convert to hex for readability
          if (token.value.length > 22 || token.value.includes('oklch')) {
            if (rgb) {
              const hex = '#' + [rgb.r, rgb.g, rgb.b].map(c => 
                Math.round(c * 255).toString(16).padStart(2, '0')
              ).join('').toUpperCase();
              displayValue = hex;
            }
          } else {
            // Keep original format for HSL, HSB, RGB if they're concise
            displayValue = token.value;
          }
          
          // Truncate value if still too long
          displayValue = truncateText(displayValue, 18);
          
          valueLabel.characters = displayValue;
          valueLabel.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
          valueLabel.x = x;
          valueLabel.y = y + swatchSize + 10 + nameHeight + verticalGap;
          valueLabel.textAlignHorizontal = 'LEFT';
          valueLabel.resize(swatchSize, valueHeight);
          valueLabel.textAutoResize = 'NONE';
          frame.appendChild(valueLabel);
        }
        
        // Move to next section
        const rowsUsed = Math.ceil(section.colors.length / itemsPerRow);
        currentY += (rowsUsed * totalItemHeight) + sectionGap;
      }
      
      createdFrames.push(frame);
    }
    
    // Select all created frames and focus on them
    if (createdFrames.length > 0) {
      figma.currentPage.selection = createdFrames;
      figma.viewport.scrollAndZoomIntoView(createdFrames);
    }
    
    // Return total count of color variables processed
    return allColorTokens.length;
    
  } catch (error) {
    console.error('Error generating color guide:', error);
    throw error;
  }
}

// Enhanced function to scan existing Figma variables and styles comprehensively
async function scanExistingVariablesEnhanced() {
  try {
    logger.log('=== ENHANCED SCANNING STARTED ===');
    
    const tokens = {
      light: [] as ParsedToken[],
      dark: [] as ParsedToken[],
      global: [] as ParsedToken[]
    };

    // 1. Scan Local Variables
    await scanLocalVariables(tokens);
    
    // 2. Scan Paint Styles 
    await scanPaintStyles(tokens);
    
    // 3. Scan Published Library Variables (if available)
    await scanPublishedLibraryVariables(tokens);
    
    logger.log('=== ENHANCED SCAN COMPLETE ===');
    logger.log(`Total found - Light: ${tokens.light.length}, Dark: ${tokens.dark.length}, Global: ${tokens.global.length}`);
    
    return tokens;
    
  } catch (error) {
    logger.error('Error in enhanced scanning:', error);
    throw error;
  }
}

// Helper function to detect if a value represents a color
function isColorValue(value: any, variableName?: string): boolean {
  try {
    // Direct RGB object
    if (value && typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value) {
      return true;
    }
    
    // String color formats
    if (typeof value === 'string') {
      const trimmed = value.trim().toLowerCase();
      
      // Common color formats
      if (trimmed.startsWith('#') || 
          trimmed.includes('rgb') || 
          trimmed.includes('hsl') || 
          trimmed.includes('oklch') ||
          trimmed.includes('hsb') ||
          trimmed.includes('hsv')) {
        return true;
      }
      
      // ShadCN raw HSL format (e.g., "0 0% 100%")
      if (trimmed.match(/^([+-]?[\d.]+)\s+([+-]?[\d.]+)%\s+([+-]?[\d.]+)%$/)) {
        return true;
      }
      
      // Named colors
      const namedColors = ['transparent', 'inherit', 'currentcolor', 'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'gray', 'grey'];
      if (namedColors.includes(trimmed)) {
        return true;
      }
    }
    
    // Variable name analysis (fallback)
    if (variableName) {
      const nameLower = variableName.toLowerCase();
      const colorKeywords = [
        'color', 'background', 'foreground', 'bg', 'fg', 'text', 'border', 'shadow',
        'primary', 'secondary', 'accent', 'success', 'error', 'warning', 'info',
        'muted', 'destructive', 'ring', 'card', 'popover', 'input', 'surface',
        'brand', 'neutral', 'slate', 'gray', 'zinc', 'stone', 'red', 'orange',
        'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky',
        'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'
      ];
      
      return colorKeywords.some(keyword => nameLower.includes(keyword));
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

// Enhanced color value extraction with better format support and alias resolution
async function extractColorValueEnhanced(value: any, variableName: string, allVariables?: any[], visitedAliases?: Set<string>): Promise<string | null> {
  try {
    // Initialize visited aliases to prevent infinite loops
    if (!visitedAliases) {
      visitedAliases = new Set<string>();
    }
    
    // Handle direct color objects
    if (value && typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value) {
      const { r, g, b, a } = value;
      if (typeof r === 'number' && typeof g === 'number' && typeof b === 'number' && 
          !isNaN(r) && !isNaN(g) && !isNaN(b)) {
        if (a !== undefined && a < 1) {
          return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
        }
        return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
      }
    }
    
    // Handle variable aliases/references with actual resolution
    if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS' && 'id' in value) {
      const aliasId = value.id as string;
      
      // Prevent infinite loops
      if (visitedAliases.has(aliasId)) {
        logger.warn(`Circular reference detected for variable ${variableName}, stopping resolution`);
        return null;
      }
      
      visitedAliases.add(aliasId);
      logger.log(`Variable ${variableName} is an alias to ${aliasId}, attempting to resolve...`);
      
      try {
        // Try to get all variables if not provided
        if (!allVariables) {
          allVariables = await figma.variables.getLocalVariablesAsync();
        }
        
        // Find the referenced variable
        const referencedVar = allVariables && allVariables.find((v: any) => v.id === aliasId);
        if (!referencedVar) {
          // Try the Figma API to get the variable directly
          try {
            const directVar = await figma.variables.getVariableByIdAsync(aliasId);
            if (directVar) {
              // Get the first available mode value from the referenced variable
              const modeIds = Object.keys(directVar.valuesByMode);
              if (modeIds.length > 0) {
                const referencedValue = directVar.valuesByMode[modeIds[0]];
                logger.log(`Resolved alias ${aliasId} to value:`, referencedValue);
                // Recursively resolve in case the referenced variable is also an alias
                return await extractColorValueEnhanced(referencedValue, directVar.name, allVariables, visitedAliases);
              }
            }
          } catch (apiError) {
            logger.warn(`Could not resolve variable ${aliasId} via API:`, apiError);
          }
          
          logger.warn(`Referenced variable ${aliasId} not found`);
          return null;
        }
        
        // Get the first available mode value from the referenced variable
        const modeIds = Object.keys(referencedVar.valuesByMode);
        if (modeIds.length > 0) {
          const referencedValue = referencedVar.valuesByMode[modeIds[0]];
          logger.log(`Resolved alias ${aliasId} (${referencedVar.name}) to value:`, referencedValue);
          // Recursively resolve in case the referenced variable is also an alias
          return await extractColorValueEnhanced(referencedValue, referencedVar.name, allVariables, visitedAliases);
        } else {
          logger.warn(`Referenced variable ${aliasId} has no mode values`);
          return null;
        }
        
      } catch (error) {
        logger.error(`Error resolving alias ${aliasId}:`, error);
        return null;
      }
    }
    
    // Handle string values
    if (typeof value === 'string') {
      const trimmed = value.trim();
      
      // ShadCN HSL format conversion
      const hslMatch = trimmed.match(/^([+-]?[\d.]+)\s+([+-]?[\d.]+)%\s+([+-]?[\d.]+)%$/);
      if (hslMatch) {
        const [, h, s, l] = hslMatch;
        return `hsl(${h}, ${s}%, ${l}%)`;
      }
      
      // Return other string formats as-is
      return trimmed;
    }
    
    return null;
    
  } catch (error) {
    logger.error(`Error extracting color value for ${variableName}:`, error);
    return null;
  }
}

// Synchronous version for backward compatibility
function extractColorValueEnhancedSync(value: any, variableName: string): string | null {
  try {
    // Handle direct color objects
    if (value && typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value) {
      const { r, g, b, a } = value;
      if (typeof r === 'number' && typeof g === 'number' && typeof b === 'number' && 
          !isNaN(r) && !isNaN(g) && !isNaN(b)) {
        if (a !== undefined && a < 1) {
          return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
        }
        return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
      }
    }
    
    // Handle variable aliases/references - mark for later resolution
    if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
      logger.log(`Variable ${variableName} is an alias, will need async resolution`);
      return `var(--${variableName.replace(/[^a-zA-Z0-9-_]/g, '-')})`;
    }
    
    // Handle string values
    if (typeof value === 'string') {
      const trimmed = value.trim();
      
      // ShadCN HSL format conversion
      const hslMatch = trimmed.match(/^([+-]?[\d.]+)\s+([+-]?[\d.]+)%\s+([+-]?[\d.]+)%$/);
      if (hslMatch) {
        const [, h, s, l] = hslMatch;
        return `hsl(${h}, ${s}%, ${l}%)`;
      }
      
      // Return other string formats as-is
      return trimmed;
    }
    
    return null;
    
  } catch (error) {
    logger.error(`Error extracting color value for ${variableName}:`, error);
    return null;
  }
}

// Scan local variables with improved detection
async function scanLocalVariables(tokens: ParsedTokens) {
  try {
    logger.log('Scanning local variables...');
    
    const variables = await figma.variables.getLocalVariablesAsync();
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    
    logger.log(`Found ${variables.length} local variables across ${collections.length} collections`);
    
    for (const variable of variables) {
      try {
        const collection = collections.find((c: any) => c.id === variable.variableCollectionId);
        if (!collection) continue;
        
        // Determine if this variable is color-related
        const isColor = variable.resolvedType === 'COLOR' || 
                       isColorValue(Object.values(variable.valuesByMode)[0], variable.name);
        
        if (!isColor) continue; // Skip non-color variables for color scanning
        
        logger.log(`Processing color variable: ${variable.name} in collection: ${collection.name}`);
        
        // Enhanced mode detection
        const modes = collection.modes;
        const lightMode = modes.find((m: any) => 
          m.name.toLowerCase().includes('light') || 
          m.name.toLowerCase().includes('default') ||
          m.name.toLowerCase().includes('day') ||
          modes.length === 1
        );
        
        const darkMode = modes.find((m: any) => 
          m.name.toLowerCase().includes('dark') ||
          m.name.toLowerCase().includes('night')
        );
        
        // Clean variable name - remove common prefixes flexibly
        let cleanName = variable.name;
        const prefixes = ['base/', 'color/', 'colors/', 'semantic/', 'primitive/', 'sys/', 'ref/'];
        for (const prefix of prefixes) {
          if (cleanName.startsWith(prefix)) {
            cleanName = cleanName.substring(prefix.length);
            break;
          }
        }
        
        // Process modes
        for (const mode of modes) {
          const value = variable.valuesByMode[mode.modeId];
          if (value === undefined) continue;
          
          const displayValue = await extractColorValueEnhanced(value, variable.name, variables);
          if (!displayValue || displayValue === 'Invalid Color') continue;
          
          const token: ParsedToken = {
            name: cleanName,
            value: displayValue,
            type: 'color',
            displayValue: displayValue,
            category: 'Colors',
            source: `Variable Collection: ${collection.name}`,
            collection: collection.name
          };
          
          // Categorize by mode
          if (lightMode && mode.modeId === lightMode.modeId) {
            tokens.light.push(token);
            logger.log(`✓ Added light variable: ${cleanName} = ${displayValue}`);
          } else if (darkMode && mode.modeId === darkMode.modeId) {
            tokens.dark.push(token);
            logger.log(`✓ Added dark variable: ${cleanName} = ${displayValue}`);
          } else {
            tokens.global.push(token);
            logger.log(`✓ Added global variable: ${cleanName} = ${displayValue}`);
          }
        }
        
      } catch (error) {
        logger.error(`Error processing variable ${variable.name}:`, error);
      }
    }
    
  } catch (error) {
    logger.error('Error scanning local variables:', error);
  }
}

// Scan paint styles
async function scanPaintStyles(tokens: ParsedTokens) {
  try {
    logger.log('Scanning paint styles...');
    
    const paintStyles = await figma.getLocalPaintStylesAsync();
    logger.log(`Found ${paintStyles.length} local paint styles`);
    
    for (const style of paintStyles) {
      try {
        // Check if style has color paints
        if (!style.paints || style.paints.length === 0) continue;
        
        for (let i = 0; i < style.paints.length; i++) {
          const paint = style.paints[i];
          
          // Only process solid color paints for now
          if (paint.type !== 'SOLID') continue;
          
          const colorValue = extractColorValueEnhancedSync(paint.color, style.name);
          if (!colorValue) continue;
          
          // Clean style name
          let cleanName = style.name;
          // Remove common style prefixes/suffixes
          cleanName = cleanName.replace(/^(style|color|paint)[-_\s]*|[-_\s]*(style|color|paint)$/gi, '');
          cleanName = cleanName.trim() || style.name;
          
          // Add index if multiple paints
          const displayName = style.paints.length > 1 ? `${cleanName}-${i + 1}` : cleanName;
          
          const token: ParsedToken = {
            name: displayName,
            value: colorValue,
            type: 'color',
            displayValue: colorValue,
            category: 'Colors',
            source: `Paint Style: ${style.name}`,
            collection: 'Paint Styles'
          };
          
          // Determine category based on style name
          const nameLower = style.name.toLowerCase();
          if (nameLower.includes('dark') || nameLower.includes('night')) {
            tokens.dark.push(token);
            logger.log(`✓ Added dark style: ${displayName} = ${colorValue}`);
          } else if (nameLower.includes('light') || nameLower.includes('day')) {
            tokens.light.push(token);
            logger.log(`✓ Added light style: ${displayName} = ${colorValue}`);
          } else {
            tokens.global.push(token);
            logger.log(`✓ Added global style: ${displayName} = ${colorValue}`);
          }
        }
        
      } catch (error) {
        logger.error(`Error processing paint style ${style.name}:`, error);
      }
    }
    
  } catch (error) {
    logger.error('Error scanning paint styles:', error);
  }
}

// Scan published library variables
async function scanPublishedLibraryVariables(tokens: ParsedTokens) {
  try {
    logger.log('Scanning for published library variables...');
    
    // Get all variable collections (including imported ones)
    // Note: This is a simplified approach - in practice, we'd need to know
    // specific library keys or iterate through known published collections
    
    // For now, we can look for variable aliases that reference external variables
    // and attempt to resolve them
    
    const variables = await figma.variables.getLocalVariablesAsync();
    const externalAliases = new Set<string>();
    
         // Find all external variable references
     for (const variable of variables) {
       for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
         if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS' && 'id' in value) {
           try {
             // Try to resolve the alias to see if it's external
             const aliasId = value.id as string;
             const referencedVar = await figma.variables.getVariableByIdAsync(aliasId);
             if (!referencedVar) {
               // This might be an external variable
               externalAliases.add(aliasId);
               logger.log(`Found potential external variable reference: ${aliasId}`);
             }
           } catch (error) {
             // Variable not found locally, likely external
             const aliasId = value.id as string;
             externalAliases.add(aliasId);
           }
         }
       }
     }
    
    logger.log(`Found ${externalAliases.size} potential external variable references`);
    
         // Attempt to import and process external variables
     const aliasArray = Array.from(externalAliases);
     for (const aliasId of aliasArray) {
       try {
         // Note: This requires the importVariableByKeyAsync method
         // which needs the variable key, not ID
         logger.log(`Attempting to resolve external variable: ${aliasId}`);
         // This is a placeholder - actual implementation would depend on
         // having the proper variable keys from the team library
       } catch (error) {
         logger.warn(`Could not resolve external variable ${aliasId}:`, error);
       }
     }
    
     } catch (error) {
     logger.error('Error scanning published library variables:', error);
   }
 }

// Fallback basic scanning function (original implementation)
async function scanExistingVariablesBasic() {
  try {
    const variables = await figma.variables.getLocalVariablesAsync();
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    
    logger.log('=== BASIC SCANNING (FALLBACK) ===');
    logger.log(`Found ${variables.length} variables across ${collections.length} collections`);
    
    const tokens = {
      light: [] as ParsedToken[],
      dark: [] as ParsedToken[],
      global: [] as ParsedToken[]
    };
    
    // Process each variable with basic logic
    for (const variable of variables) {
      try {
      const collection = collections.find((c: any) => c.id === variable.variableCollectionId);
      if (!collection) continue;
      
        // Only process COLOR type variables in basic mode
        if (variable.resolvedType !== 'COLOR') continue;
        
        logger.log(`Processing variable: ${variable.name} (${variable.resolvedType}) in collection: ${collection.name}`);
        
        // Find light and dark modes
        const lightMode = collection.modes.find((m: any) => 
          m.name.toLowerCase().includes('light') || 
          m.name.toLowerCase().includes('default') ||
          collection.modes.length === 1
        );
        
        const darkMode = collection.modes.find((m: any) => 
          m.name.toLowerCase().includes('dark') ||
          m.name.toLowerCase().includes('night')
        );
        
        // Clean variable name
        let cleanName = variable.name;
        if (cleanName.startsWith('base/')) {
          cleanName = cleanName.substring(5);
        }
        if (cleanName.startsWith('color/')) {
          cleanName = cleanName.substring(6);
      }
      
              // Process light mode values
        if (lightMode && variable.valuesByMode[lightMode.modeId] !== undefined) {
        const lightValue = variable.valuesByMode[lightMode.modeId];
          const displayValue = extractColorValueEnhancedSync(lightValue, variable.name);
          
          if (displayValue && displayValue !== 'Invalid Color') {
          tokens.light.push({
            name: cleanName,
            value: displayValue,
              type: 'color',
            displayValue: displayValue,
              category: 'Colors'
          });
            logger.log(`✓ Added light mode: ${cleanName} = ${displayValue}`);
        }
      }
      
      // Process dark mode values
        if (darkMode && variable.valuesByMode[darkMode.modeId] !== undefined) {
        const darkValue = variable.valuesByMode[darkMode.modeId];
          const displayValue = extractColorValueEnhancedSync(darkValue, variable.name);
          
          if (displayValue && displayValue !== 'Invalid Color') {
          tokens.dark.push({
            name: cleanName,
            value: displayValue,
              type: 'color',
            displayValue: displayValue,
              category: 'Colors'
          });
            logger.log(`✓ Added dark mode: ${cleanName} = ${displayValue}`);
        }
      }
      
      // If no specific light/dark mode, treat as global
      if (!lightMode && !darkMode && collection.modes.length > 0) {
        const firstMode = collection.modes[0];
        const value = variable.valuesByMode[firstMode.modeId];
        
        if (value !== undefined) {
            const displayValue = extractColorValueEnhancedSync(value, variable.name);
            
            if (displayValue && displayValue !== 'Invalid Color') {
          tokens.global.push({
            name: cleanName,
            value: displayValue,
                type: 'color',
            displayValue: displayValue,
                category: 'Colors'
              });
              logger.log(`✓ Added global: ${cleanName} = ${displayValue}`);
            }
          }
        }
        
      } catch (error) {
        logger.error(`Error processing variable ${variable.name}:`, error);
      }
    }
    
    logger.log('=== BASIC SCAN COMPLETE ===');
    logger.log(`Light tokens: ${tokens.light.length}`);
    logger.log(`Dark tokens: ${tokens.dark.length}`);
    logger.log(`Global tokens: ${tokens.global.length}`);
    
    return tokens;
    
  } catch (error) {
    logger.error('Error in basic scanning:', error);
    throw error;
  }
}

// Function to scan text styles from the current file
async function scanTextStyles() {
  try {
    const textStyles = await figma.getLocalTextStylesAsync();
    const textVariables = await figma.variables.getLocalVariablesAsync();
    
    // Filter for string/text variables
    const stringVariables = textVariables.filter((variable: any) => 
      variable.resolvedType === 'STRING' || 
      variable.name.toLowerCase().includes('font') ||
      variable.name.toLowerCase().includes('text')
    );
    
    const processedStyles = textStyles.map((style: any) => ({
      id: style.id,
      name: style.name,
      fontSize: style.fontSize,
      fontName: style.fontName,
      letterSpacing: style.letterSpacing,
      lineHeight: style.lineHeight,
      textDecoration: style.textDecoration,
      textCase: style.textCase,
      fills: style.fills
    }));
    
    const processedVariables = stringVariables.map((variable: any) => ({
      id: variable.id,
      name: variable.name,
      resolvedType: variable.resolvedType,
      valuesByMode: variable.valuesByMode
    }));
    
    return {
      styles: processedStyles,
      variables: processedVariables
    };
  } catch (error) {
    console.error('Error scanning text styles:', error);
    throw error;
  }
}

// Function to generate typography guide on canvas
async function generateTypographyGuide(styles: any[], variables: any[]) {
  try {
    const currentPage = figma.currentPage;
    
    // Create a frame for the typography guide
    const guideFrame = figma.createFrame();
    guideFrame.name = 'Typography Guide';
    guideFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    
    // Position the frame
    guideFrame.x = 100;
    guideFrame.y = 100;
    guideFrame.resize(800, Math.max(600, (styles.length + variables.length) * 80 + 100));
    
    currentPage.appendChild(guideFrame);
    
    let currentY = 40;
    
    // Helper function to safely load fonts with fallbacks
    const safeLoadFont = async (fontName: { family: string, style: string }): Promise<{ family: string, style: string }> => {
      try {
        await figma.loadFontAsync(fontName);
        return fontName;
      } catch (error) {
        console.warn(`Could not load font ${fontName.family} ${fontName.style}, trying fallbacks...`);
        
        // Try common fallbacks for Inter
        const fallbacks = [
          { family: 'Inter', style: 'Regular' },
          { family: 'Roboto', style: 'Regular' },
          { family: 'Arial', style: 'Regular' },
          { family: 'Helvetica', style: 'Regular' }
        ];
        
        for (const fallback of fallbacks) {
          try {
            await figma.loadFontAsync(fallback);
            return fallback;
          } catch (fallbackError) {
            // Continue to next fallback
          }
        }
        
        // If all else fails, use the default system font
        throw new Error('No suitable fonts available');
      }
    };
    
    // Add title
    const titleText = figma.createText();
    const titleFont = await safeLoadFont({ family: 'Inter', style: 'Bold' });
    titleText.fontName = titleFont;
    titleText.fontSize = 24;
    titleText.characters = 'Typography Guide';
    titleText.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
    titleText.x = 40;
    titleText.y = currentY;
    guideFrame.appendChild(titleText);
    
    currentY += 60;
    
    // Add text styles section
    if (styles.length > 0) {
      const stylesHeader = figma.createText();
      const headerFont = await safeLoadFont({ family: 'Inter', style: 'Semi Bold' });
      stylesHeader.fontName = headerFont;
      stylesHeader.fontSize = 18;
      stylesHeader.characters = `Text Styles (${styles.length})`;
      stylesHeader.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 } }];
      stylesHeader.x = 40;
      stylesHeader.y = currentY;
      guideFrame.appendChild(stylesHeader);
      
      currentY += 40;
      
      // Add each text style
      for (const style of styles) {
        try {
          // Load the font for this style with fallback
          const styleFont = await safeLoadFont(style.fontName);
          
          // Helper function to clean up style name
          const cleanStyleName = (styleName: string) => {
            // Remove font family from style name if it's redundant
            const parts = styleName.split('/');
            return parts.length > 1 ? parts[parts.length - 1] : styleName;
          };
          
          // Helper function to format line height
          const formatLineHeight = (lineHeight: any) => {
            if (!lineHeight || lineHeight === undefined) return 'Auto';
            if (typeof lineHeight === 'object' && lineHeight.unit) {
              if (lineHeight.unit === 'PERCENT') {
                return `${Math.round(lineHeight.value)}%`;
              } else if (lineHeight.unit === 'PIXELS') {
                return `${lineHeight.value}px`;
              }
            }
            if (typeof lineHeight === 'number') {
              return `${Math.round(lineHeight)}%`;
            }
            return 'Auto';
          };
          
          // Helper function to format letter spacing
          const formatLetterSpacing = (letterSpacing: any) => {
            if (!letterSpacing || letterSpacing === undefined) return '0';
            if (typeof letterSpacing === 'object' && letterSpacing.unit) {
              if (letterSpacing.unit === 'PERCENT') {
                return `${letterSpacing.value.toFixed(1)}%`;
              } else if (letterSpacing.unit === 'PIXELS') {
                return `${letterSpacing.value}px`;
              }
            }
            if (typeof letterSpacing === 'number') {
              return `${letterSpacing.toFixed(1)}px`;
            }
            return '0';
          };
          
          // Create clean style name (first row)
          const styleNameText = figma.createText();
          const nameFont = await safeLoadFont({ family: 'Inter', style: 'Semi Bold' });
          styleNameText.fontName = nameFont;
          styleNameText.fontSize = 13;
          styleNameText.characters = cleanStyleName(style.name);
          styleNameText.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];
          styleNameText.x = 40;
          styleNameText.y = currentY;
          guideFrame.appendChild(styleNameText);
          
          currentY += 22; // Space between style name and specs
          
          // Create font specifications (second row)
          const fontSpecs = [
            `${style.fontName.family}`,
            `${style.fontSize}px`,
            `${style.fontName.style}`,
            `LH: ${formatLineHeight(style.lineHeight)}`,
            `LS: ${formatLetterSpacing(style.letterSpacing)}`
          ];
          
          const specsText = figma.createText();
          const specsFont = await safeLoadFont({ family: 'Inter', style: 'Regular' });
          specsText.fontName = specsFont;
          specsText.fontSize = 11;
          specsText.characters = fontSpecs.join(' • ');
          specsText.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
          specsText.x = 40;
          specsText.y = currentY;
          guideFrame.appendChild(specsText);
          
          currentY += 18; // Space between specs and sample text
          
          // Create sample text (second row)
          const sampleText = figma.createText();
          sampleText.fontName = styleFont;
          sampleText.fontSize = style.fontSize || 16;
          
          if (style.letterSpacing !== undefined) {
            sampleText.letterSpacing = style.letterSpacing;
          }
          
          if (style.lineHeight !== undefined) {
            sampleText.lineHeight = style.lineHeight;
          }
          
          if (style.textDecoration) {
            sampleText.textDecoration = style.textDecoration;
          }
          
          if (style.textCase) {
            sampleText.textCase = style.textCase;
          }
          
          if (style.fills && style.fills.length > 0) {
            sampleText.fills = style.fills;
          } else {
            sampleText.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
          }
          
          // Use fallback message if font couldn't be loaded exactly
          const fontMessage = (styleFont.family === style.fontName.family && styleFont.style === style.fontName.style) 
            ? 'The quick brown fox jumps over the lazy dog'
            : `The quick brown fox jumps over the lazy dog (using ${styleFont.family} ${styleFont.style})`;
            
          sampleText.characters = fontMessage;
          sampleText.x = 40;
          sampleText.y = currentY;
          guideFrame.appendChild(sampleText);
          
          // Move to next style with proper spacing
          currentY += Math.max(40, (style.fontSize || 16) + 25);
          
        } catch (fontError) {
          console.warn(`Could not load any font for style ${style.name}:`, fontError);
          
          // Helper function to clean up style name (same as above)
          const cleanStyleName = (styleName: string) => {
            const parts = styleName.split('/');
            return parts.length > 1 ? parts[parts.length - 1] : styleName;
          };
          
          // Create clean style name (first row)
          const styleNameText = figma.createText();
          const nameFont = await safeLoadFont({ family: 'Inter', style: 'Semi Bold' });
          styleNameText.fontName = nameFont;
          styleNameText.fontSize = 13;
          styleNameText.characters = cleanStyleName(style.name);
          styleNameText.fills = [{ type: 'SOLID', color: { r: 0.7, g: 0.3, b: 0.3 } }];
          styleNameText.x = 40;
          styleNameText.y = currentY;
          guideFrame.appendChild(styleNameText);
          
          currentY += 22; // Space between style name and error message
          
          // Add error info (second row)
          const errorText = figma.createText();
          const errorFont = await safeLoadFont({ family: 'Inter', style: 'Regular' });
          errorText.fontName = errorFont;
          errorText.fontSize = 11;
          errorText.characters = `Font not available: ${style.fontName.family} ${style.fontName.style}`;
          errorText.fills = [{ type: 'SOLID', color: { r: 0.7, g: 0.3, b: 0.3 } }];
          errorText.x = 40;
          errorText.y = currentY;
          guideFrame.appendChild(errorText);
          
          currentY += 18; // Space between error and sample text
          
          // Create fallback sample text (third row)
          const fallbackText = figma.createText();
          const fallbackFont = await safeLoadFont({ family: 'Inter', style: 'Regular' });
          fallbackText.fontName = fallbackFont;
          fallbackText.fontSize = style.fontSize || 16;
          fallbackText.characters = 'Font not available - using fallback text';
          fallbackText.fills = [{ type: 'SOLID', color: { r: 0.7, g: 0.3, b: 0.3 } }];
          fallbackText.x = 40;
          fallbackText.y = currentY;
          guideFrame.appendChild(fallbackText);
          
          currentY += Math.max(40, (style.fontSize || 16) + 25);
        }
      }
      
      currentY += 20;
    }
    
    // Add text variables section
    if (variables.length > 0) {
      const variablesHeader = figma.createText();
      const variablesHeaderFont = await safeLoadFont({ family: 'Inter', style: 'Semi Bold' });
      variablesHeader.fontName = variablesHeaderFont;
      variablesHeader.fontSize = 18;
      variablesHeader.characters = `Text Variables (${variables.length})`;
      variablesHeader.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 } }];
      variablesHeader.x = 40;
      variablesHeader.y = currentY;
      guideFrame.appendChild(variablesHeader);
      
      currentY += 40;
      
      // Add each text variable
      for (const variable of variables) {
        try {
          // Get the first mode value
          const firstMode = Object.keys(variable.valuesByMode)[0];
          const value = variable.valuesByMode[firstMode] || 'No value';
          
          const variableText = figma.createText();
          const variableFont = await safeLoadFont({ family: 'Inter', style: 'Regular' });
          variableText.fontName = variableFont;
          variableText.fontSize = 14;
          variableText.characters = `${variable.name}: "${value}"`;
          variableText.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
          variableText.x = 40;
          variableText.y = currentY;
          guideFrame.appendChild(variableText);
          
          // Add type label
          const typeText = figma.createText();
          const typeFont = await safeLoadFont({ family: 'Inter', style: 'Regular' });
          typeText.fontName = typeFont;
          typeText.fontSize = 10;
          typeText.characters = variable.resolvedType || 'STRING';
          typeText.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
          typeText.x = 500;
          typeText.y = currentY + 2;
          guideFrame.appendChild(typeText);
          
          currentY += 30;
          
        } catch (error) {
          console.warn(`Error processing variable ${variable.name}:`, error);
          currentY += 30;
        }
      }
    }
    
    // Adjust frame height to content
    guideFrame.resize(800, currentY + 40);
    
    // Focus on the generated guide
    figma.viewport.scrollAndZoomIntoView([guideFrame]);
    
    return styles.length + variables.length;
    
  } catch (error) {
    console.error('Error generating typography guide:', error);
    throw error;
  }
}

// === NEW HIERARCHICAL VARIABLE SCANNING ===

async function scanVariablesHierarchical(): Promise<VariableStructure> {
  try {
    logger.log('🔍 Starting hierarchical variable scan...');
    
    // Get all variable collections
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const result: VariableStructure = {
      collections: [],
      totalCollections: 0,
      totalVariables: 0
    };
    
    if (!collections || collections.length === 0) {
      logger.log('No variable collections found');
      return result;
    }
    
    logger.log(`Found ${collections.length} variable collections`);
    
    for (const collection of collections) {
      logger.log(`Processing collection: ${collection.name} (${collection.id})`);
      
      const figmaCollection: FigmaCollection = {
        id: collection.id,
        name: collection.name,
        groups: [],
        totalVariables: 0,
        allModes: collection.modes.map((mode: any) => ({ id: mode.modeId, name: mode.name }))
      };
      
      // Get all variables in this collection
      const collectionVariables = await figma.variables.getLocalVariablesAsync();
      const filteredVariables = collectionVariables.filter((variable: any) => 
        variable.variableCollectionId === collection.id
      );
      
      logger.log(`Found ${filteredVariables.length} variables in collection ${collection.name}`);
      
      if (filteredVariables.length === 0) {
        continue;
      }
      
      // Group variables by their base name (everything before the first slash or dot)
      const variablesByGroup = new Map<string, any[]>();
      
      for (const variable of filteredVariables) {
        // Extract group name from variable name
        // Examples: "colors/primary" -> "colors", "typography.heading" -> "typography"
        const groupName = extractGroupName(variable.name);
        
        if (!variablesByGroup.has(groupName)) {
          variablesByGroup.set(groupName, []);
        }
        variablesByGroup.get(groupName)!.push(variable);
      }
      
      logger.log(`Organized into ${variablesByGroup.size} groups:`, Array.from(variablesByGroup.keys()));
      
      // Process each group
      for (const [groupName, groupVariables] of Array.from(variablesByGroup.entries())) {
        const figmaGroup: FigmaGroup = {
          name: groupName,
          modes: [],
          totalVariables: 0
        };
        
        // Organize by modes
        const variablesByMode = new Map<string, any[]>();
        
        for (const variable of groupVariables) {
          for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
            if (!variablesByMode.has(modeId)) {
              variablesByMode.set(modeId, []);
            }
            variablesByMode.get(modeId)!.push({ variable, value, modeId });
          }
        }
        
        // Create mode objects
        for (const [modeId, modeVariableData] of Array.from(variablesByMode.entries())) {
          const mode = collection.modes.find((m: any) => m.modeId === modeId);
          const modeName = mode ? mode.name : modeId;
          
          const figmaMode: FigmaMode = {
            id: modeId,
            name: modeName,
            variables: []
          };
          
          // Process variables for this mode
          for (const { variable, value, modeId } of modeVariableData) {
            try {
              const colorValue = await extractColorValueEnhanced(value, variable.name);
              const variableType = determineVariableType(variable, colorValue);
              
              const figmaVariable: FigmaVariable = {
                id: variable.id,
                name: variable.name,
                value: colorValue || String(value) || 'Unknown',
                type: variableType,
                displayValue: colorValue || String(value) || 'Unknown',
                resolvedType: variable.resolvedType || 'UNKNOWN',
                description: variable.description || undefined,
                variableCollectionId: collection.id,
                modeId: modeId
              };
              
              figmaMode.variables.push(figmaVariable);
              figmaGroup.totalVariables++;
              figmaCollection.totalVariables++;
              result.totalVariables++;
              
            } catch (error) {
              logger.warn(`Error processing variable ${variable.name}:`, error);
            }
          }
          
          if (figmaMode.variables.length > 0) {
            figmaGroup.modes.push(figmaMode);
          }
        }
        
        if (figmaGroup.modes.length > 0) {
          figmaCollection.groups.push(figmaGroup);
        }
      }
      
      if (figmaCollection.groups.length > 0) {
        result.collections.push(figmaCollection);
        result.totalCollections++;
      }
    }
    
    logger.log(`Hierarchical scan complete: ${result.totalCollections} collections, ${result.totalVariables} variables`);
    return result;
    
  } catch (error) {
    logger.error('Error in hierarchical variable scan:', error);
    throw error;
  }
}

function extractGroupName(variableName: string): string {
  // Remove common prefixes and extract meaningful group name
  let name = variableName;
  
  // Remove leading slashes or dots
  name = name.replace(/^[./]+/, '');
  
  // Extract the first part as group name
  const parts = name.split(/[/.]/);
  
  if (parts.length > 1) {
    // If we have multiple parts, use the first meaningful one
    const firstPart = parts[0].toLowerCase();
    
         // Map common patterns to more readable names
     const groupMappings: Record<string, string> = {
       'color': 'Colors',
       'colors': 'Colors',
       'bg': 'Colors',
       'background': 'Colors',
       'foreground': 'Colors',
       'border': 'Colors',
       'primary': 'Colors',
       'secondary': 'Colors',
       'accent': 'Colors',
       'typography': 'Typography',
       'font': 'Typography',
       'heading': 'Typography',
       'body': 'Typography',
       'spacing': 'Spacing',
       'space': 'Spacing',
       'size': 'Spacing',
       'radius': 'Radius',
       'border-radius': 'Radius',
       'shadow': 'Shadows',
       'shadows': 'Shadows',
       'elevation': 'Shadows'
     };
    
    return groupMappings[firstPart] || capitalizeFirst(firstPart);
  }
  
  // Fallback to full name if no clear group structure
  return capitalizeFirst(name);
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function determineVariableType(variable: any, colorValue: string | null): 'color' | 'font' | 'radius' | 'shadow' | 'other' {
  // Use the resolved type if available
  if (variable.resolvedType) {
    switch (variable.resolvedType) {
      case 'COLOR':
        return 'color';
      case 'STRING':
        // Check if it's font-related
        if (variable.name.toLowerCase().includes('font') || 
            variable.name.toLowerCase().includes('typography')) {
          return 'font';
        }
        return 'other';
      case 'FLOAT':
        // Check if it's radius or spacing
        if (variable.name.toLowerCase().includes('radius') || 
            variable.name.toLowerCase().includes('border-radius')) {
          return 'radius';
        }
        return 'other';
      default:
        return 'other';
    }
  }
  
  // Fallback to name-based detection
  const nameLower = variable.name.toLowerCase();
  
  if (colorValue || isColorValue(variable.valuesByMode[Object.keys(variable.valuesByMode)[0]], variable.name)) {
    return 'color';
  }
  
  if (nameLower.includes('font') || nameLower.includes('typography')) {
    return 'font';
  }
  
  if (nameLower.includes('radius') || nameLower.includes('border-radius')) {
    return 'radius';
  }
  
  if (nameLower.includes('shadow') || nameLower.includes('elevation')) {
    return 'shadow';
  }
  
  return 'other';
}

// === COLLECTION AND MODE COLOR GUIDE GENERATION ===

// Helper function to safely load fonts with fallbacks
async function safeLoadFont(fontName: { family: string; style: string }): Promise<{ family: string; style: string }> {
  try {
    await figma.loadFontAsync(fontName);
    return fontName;
  } catch (error) {
    // Try common fallbacks
    const fallbacks = [
      { family: 'Inter', style: 'Regular' },
      { family: 'Roboto', style: 'Regular' },
      { family: 'Arial', style: 'Regular' },
      { family: 'Helvetica', style: 'Regular' },
      { family: 'San Francisco', style: 'Regular' }
    ];
    
    for (const fallback of fallbacks) {
      try {
        await figma.loadFontAsync(fallback);
        return fallback;
      } catch (fallbackError) {
        // Continue to next fallback
      }
    }
    
    // Final fallback - use system default
    return { family: 'Arial', style: 'Regular' };
  }
}

// Generate color guide for a specific mode
async function generateModeColorGuide(collection: FigmaCollection, group: FigmaGroup, mode: FigmaMode): Promise<number> {
  try {
    logger.log(`🎨 Generating mode color guide for: ${collection.name} > ${group.name} > ${mode.name}`);
    
    // Filter color variables only
    const colorVariables = mode.variables.filter(variable => variable.type === 'color');
    
    if (colorVariables.length === 0) {
      throw new Error(`No color variables found in mode "${mode.name}"`);
    }
    
    // Create main frame
    const frame = figma.createFrame();
    frame.name = `${mode.name} - Color Guide`;
    frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    frame.cornerRadius = 8;
    
    // Calculate frame size
    const swatchSize = 80;
    const swatchGap = 16;
    const itemsPerRow = 4;
    const padding = 32;
    const headerHeight = 80;
    
    const rows = Math.ceil(colorVariables.length / itemsPerRow);
    const frameWidth = Math.max(400, itemsPerRow * (swatchSize + swatchGap) - swatchGap + (padding * 2));
    const frameHeight = headerHeight + (rows * (swatchSize + 50)) + padding;
    
    frame.resize(frameWidth, frameHeight);
    
    // Position frame
    frame.x = figma.viewport.bounds.x + 50;
    frame.y = figma.viewport.bounds.y + 50;
    
    // Load fonts
    const boldFont = await safeLoadFont({ family: 'Inter', style: 'Bold' });
    const regularFont = await safeLoadFont({ family: 'Inter', style: 'Regular' });
    const mediumFont = await safeLoadFont({ family: 'Inter', style: 'Medium' });
    
    // Add title
    const titleText = figma.createText();
    titleText.fontName = boldFont;
    titleText.fontSize = 20;
    titleText.characters = `${mode.name} Colors`;
    titleText.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];
    titleText.x = padding;
    titleText.y = padding;
    frame.appendChild(titleText);
    
    // Add subtitle
    const subtitleText = figma.createText();
    subtitleText.fontName = regularFont;
    subtitleText.fontSize = 12;
    subtitleText.characters = `${colorVariables.length} variables from ${collection.name} > ${group.name}`;
    subtitleText.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
    subtitleText.x = padding;
    subtitleText.y = padding + 28;
    frame.appendChild(subtitleText);
    
    // Create color swatches
    for (let i = 0; i < colorVariables.length; i++) {
      const variable = colorVariables[i];
      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;
      
      const x = padding + col * (swatchSize + swatchGap);
      const y = headerHeight + row * (swatchSize + 50);
      
      try {
        // Create swatch
        const swatch = figma.createRectangle();
        swatch.name = variable.name;
        swatch.resize(swatchSize, swatchSize);
        swatch.x = x;
        swatch.y = y;
        swatch.cornerRadius = 6;
        
        // Parse and apply color
        const colorRgb = parseColorToRgb(variable.value);
        if (colorRgb) {
          swatch.fills = [{ type: 'SOLID', color: colorRgb }];
        } else {
          swatch.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
        }
        
        // Add border
        swatch.strokes = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
        swatch.strokeWeight = 1;
        
        frame.appendChild(swatch);
        
        // Add variable name
        const nameText = figma.createText();
        nameText.fontName = mediumFont;
        nameText.fontSize = 11;
        nameText.characters = variable.name.length > 15 ? variable.name.substring(0, 12) + '...' : variable.name;
        nameText.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];
        nameText.x = x;
        nameText.y = y + swatchSize + 8;
        nameText.resize(swatchSize, 14);
        nameText.textAlignHorizontal = 'CENTER';
        frame.appendChild(nameText);
        
        // Add variable value
        const valueText = figma.createText();
        valueText.fontName = regularFont;
        valueText.fontSize = 9;
        let displayValue = variable.value;
        if (displayValue.length > 18) {
          displayValue = displayValue.substring(0, 15) + '...';
        }
        valueText.characters = displayValue;
        valueText.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
        valueText.x = x;
        valueText.y = y + swatchSize + 25;
        valueText.resize(swatchSize, 12);
        valueText.textAlignHorizontal = 'CENTER';
        frame.appendChild(valueText);
        
      } catch (error) {
        logger.warn(`Error creating swatch for ${variable.name}:`, error);
      }
    }
    
    // Focus on the generated guide
    figma.viewport.scrollAndZoomIntoView([frame]);
    
    logger.log(`✅ Mode color guide generated with ${colorVariables.length} color variables`);
    return colorVariables.length;
    
  } catch (error) {
    logger.error('Error generating mode color guide:', error);
    throw error;
  }
}

// Generate color guide for entire collection with proper mode separation
async function generateCollectionColorGuide(collection: FigmaCollection): Promise<number> {
  try {
    logger.log(`🎨 Generating collection color guide for: ${collection.name}`);
    
    // Check if collection has multiple modes
    const hasMultipleModes = collection.allModes.length > 1;
    
    if (!hasMultipleModes) {
      // Single mode - use the existing simple layout
      return await generateSingleModeCollectionGuide(collection);
    }
    
    // Multiple modes - create mode-separated layout using auto-layout
    // First, collect and deduplicate variables by name
    const uniqueVariables = new Map<string, {
      name: string;
      modeValues: Map<string, { value: string; modeName: string; groupName: string }>;
    }>();
    
    for (const group of collection.groups) {
      for (const mode of group.modes) {
        const colorVariables = mode.variables.filter(v => v.type === 'color');
        for (const variable of colorVariables) {
          if (!uniqueVariables.has(variable.name)) {
            uniqueVariables.set(variable.name, {
              name: variable.name,
              modeValues: new Map()
            });
          }
          uniqueVariables.get(variable.name)!.modeValues.set(mode.id, {
            value: variable.value,
            modeName: mode.name,
            groupName: group.name
          });
        }
      }
    }
    
    if (uniqueVariables.size === 0) {
      throw new Error(`No color variables found in collection "${collection.name}"`);
    }
    
    // Load fonts
    const boldFont = await safeLoadFont({ family: 'Inter', style: 'Bold' });
    const regularFont = await safeLoadFont({ family: 'Inter', style: 'Regular' });
    const mediumFont = await safeLoadFont({ family: 'Inter', style: 'Medium' });
    
    // Create main frame with vertical auto-layout
    const mainFrame = figma.createFrame();
    mainFrame.name = `${collection.name} - Color Guide`;
    mainFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    mainFrame.cornerRadius = 8;
    mainFrame.layoutMode = 'VERTICAL';
    mainFrame.paddingTop = 16;
    mainFrame.paddingBottom = 16;
    mainFrame.paddingLeft = 16;
    mainFrame.paddingRight = 16;
    mainFrame.itemSpacing = 12;
    mainFrame.counterAxisSizingMode = 'AUTO';
    mainFrame.primaryAxisSizingMode = 'AUTO';
    
    // Position frame in viewport
    mainFrame.x = figma.viewport.bounds.x + 50;
    mainFrame.y = figma.viewport.bounds.y + 50;
    
    // Create header section
    const headerFrame = figma.createFrame();
    headerFrame.name = "Header";
    headerFrame.layoutMode = 'VERTICAL';
    headerFrame.itemSpacing = 4;
    headerFrame.fills = [];
    headerFrame.counterAxisSizingMode = 'AUTO';
    headerFrame.primaryAxisSizingMode = 'AUTO';
    
    // Add title
    const titleText = figma.createText();
    titleText.fontName = boldFont;
    titleText.fontSize = 18;
    titleText.characters = collection.name;
    titleText.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];
    headerFrame.appendChild(titleText);
    
    // Add subtitle
    const subtitleText = figma.createText();
    subtitleText.fontName = regularFont;
    subtitleText.fontSize = 12;
    subtitleText.characters = `${uniqueVariables.size} unique variables • ${collection.allModes.length} modes`;
    subtitleText.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
    headerFrame.appendChild(subtitleText);
    
    mainFrame.appendChild(headerFrame);
    
    // Create mode headers row using auto-layout
    const modeHeadersFrame = figma.createFrame();
    modeHeadersFrame.name = "Mode Headers";
    modeHeadersFrame.layoutMode = 'HORIZONTAL';
    modeHeadersFrame.itemSpacing = 12; // Match the data row spacing
    modeHeadersFrame.fills = [];
    modeHeadersFrame.counterAxisSizingMode = 'AUTO';
    modeHeadersFrame.primaryAxisSizingMode = 'AUTO';
    
    // Variable name column header (spacer) - match new width
    const nameHeaderFrame = figma.createFrame();
    nameHeaderFrame.name = "Variable Name Header";
    nameHeaderFrame.resize(180, 32); // Match new variable name column width and better height
    nameHeaderFrame.fills = [];
    nameHeaderFrame.layoutMode = 'VERTICAL';
    nameHeaderFrame.counterAxisAlignItems = 'MIN';
    nameHeaderFrame.primaryAxisAlignItems = 'CENTER';
    nameHeaderFrame.paddingLeft = 8;
    nameHeaderFrame.paddingRight = 8;
    
    const nameHeaderText = figma.createText();
    nameHeaderText.fontName = mediumFont;
    nameHeaderText.fontSize = 10;
    nameHeaderText.characters = "Variable";
    nameHeaderText.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];
    nameHeaderFrame.appendChild(nameHeaderText);
    modeHeadersFrame.appendChild(nameHeaderFrame);
    
    // Create mode header columns - match new width
    for (const mode of collection.allModes) {
      const modeHeaderColumn = figma.createFrame();
      modeHeaderColumn.name = `${mode.name} Header`;
      modeHeaderColumn.layoutMode = 'VERTICAL';
      modeHeaderColumn.itemSpacing = 4;
      modeHeaderColumn.resize(110, 32); // Match new mode column width and better height
      modeHeaderColumn.fills = [];
      modeHeaderColumn.counterAxisAlignItems = 'CENTER';
      modeHeaderColumn.primaryAxisAlignItems = 'CENTER';
      modeHeaderColumn.paddingTop = 4;
      modeHeaderColumn.paddingBottom = 4;
      
      // Mode name
      const modeNameText = figma.createText();
      modeNameText.fontName = mediumFont;
      modeNameText.fontSize = 11;
      modeNameText.characters = mode.name;
      modeNameText.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 } }];
      modeNameText.textAlignHorizontal = 'CENTER';
      modeNameText.textAutoResize = 'WIDTH_AND_HEIGHT';
      modeHeaderColumn.appendChild(modeNameText);
      
      // Mode indicator line
      const modeLine = figma.createRectangle();
      modeLine.resize(60, 2);
      modeLine.fills = [{ type: 'SOLID', color: { r: 0.3, g: 0.5, b: 1.0 } }];
      modeHeaderColumn.appendChild(modeLine);
      
      modeHeadersFrame.appendChild(modeHeaderColumn);
    }
    
    mainFrame.appendChild(modeHeadersFrame);
    
    // Create variables grid using auto-layout
    const variablesContainer = figma.createFrame();
    variablesContainer.name = "Variables Container";
    variablesContainer.layoutMode = 'VERTICAL';
    variablesContainer.itemSpacing = 12; // Increased spacing between rows to prevent overlap
    variablesContainer.fills = [];
    variablesContainer.counterAxisSizingMode = 'AUTO';
    variablesContainer.primaryAxisSizingMode = 'AUTO';
    
    // Create each variable row
    for (const [variableName, variableData] of Array.from(uniqueVariables.entries())) {
      const variableRow = figma.createFrame();
      variableRow.name = `Row: ${variableName}`;
      variableRow.layoutMode = 'HORIZONTAL';
      variableRow.itemSpacing = 12; // Increased spacing between columns
      variableRow.fills = [];
      variableRow.counterAxisSizingMode = 'AUTO';
      variableRow.primaryAxisSizingMode = 'AUTO';
      
      // Variable name column - wider and better text handling
      const nameColumn = figma.createFrame();
      nameColumn.name = "Variable Name";
      nameColumn.resize(180, 44); // Wider column and taller to accommodate text properly
      nameColumn.fills = [];
      nameColumn.layoutMode = 'VERTICAL';
      nameColumn.counterAxisAlignItems = 'MIN';
      nameColumn.primaryAxisAlignItems = 'CENTER';
      nameColumn.paddingTop = 4;
      nameColumn.paddingBottom = 4;
      nameColumn.paddingLeft = 8;
      nameColumn.paddingRight = 8;
      
      const nameText = figma.createText();
      nameText.fontName = mediumFont;
      nameText.fontSize = 10; // Slightly smaller font to fit better
      // Better truncation - more conservative to prevent overflow
      const maxWidth = 164; // Account for padding
      let displayName = variableName;
      
      // Smart truncation - check actual text width
      if (variableName.length > 18) {
        displayName = variableName.substring(0, 15) + '...';
      }
      
      nameText.characters = displayName;
      nameText.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];
      nameText.textAutoResize = 'WIDTH_AND_HEIGHT'; // Let text auto-resize
      nameColumn.appendChild(nameText);
      variableRow.appendChild(nameColumn);
      
      // Create mode columns for this variable
      for (const mode of collection.allModes) {
        const modeColumn = figma.createFrame();
        modeColumn.name = `${mode.name} Value`;
        modeColumn.resize(110, 44); // Wider mode columns and same height as name column
        modeColumn.fills = [];
        modeColumn.layoutMode = 'VERTICAL';
        modeColumn.itemSpacing = 6; // Spacing between swatch and text
        modeColumn.counterAxisAlignItems = 'CENTER';
        modeColumn.primaryAxisAlignItems = 'CENTER'; // Center everything
        modeColumn.paddingTop = 4;
        modeColumn.paddingBottom = 4;
        
        const modeData = variableData.modeValues.get(mode.id);
        
        if (modeData) {
          // Create swatch - smaller size as requested
          const swatch = figma.createRectangle();
          swatch.name = `${variableName}-${mode.name}-swatch`;
          swatch.resize(24, 24); // 40% smaller than before (was 40px, now 24px)
          swatch.cornerRadius = 4;
          
          // Parse and apply color
          const colorRgb = parseColorToRgb(modeData.value);
          if (colorRgb) {
            swatch.fills = [{ type: 'SOLID', color: colorRgb }];
          } else {
            swatch.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
          }
          
          // Add border
          swatch.strokes = [{ type: 'SOLID', color: { r: 0.85, g: 0.85, b: 0.85 } }];
          swatch.strokeWeight = 1;
          modeColumn.appendChild(swatch);
          
          // Create value text - FULL VALUE ALWAYS VISIBLE
          const valueText = figma.createText();
          valueText.fontName = regularFont;
          valueText.fontSize = 8;
          valueText.characters = modeData.value; // FULL VALUE, NO TRUNCATION
          valueText.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 } }];
          valueText.textAlignHorizontal = 'CENTER';
          valueText.textAutoResize = 'WIDTH_AND_HEIGHT'; // Auto-resize text
          // Set max width to prevent overflow
          valueText.resize(100, 12); // Max width but allow height to grow
          modeColumn.appendChild(valueText);
          
        } else {
          // No value for this mode - show placeholder
          const placeholder = figma.createRectangle();
          placeholder.resize(24, 24); // Same smaller size
          placeholder.cornerRadius = 4;
          placeholder.fills = [{ type: 'SOLID', color: { r: 0.96, g: 0.96, b: 0.96 } }];
          placeholder.strokes = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
          placeholder.strokeWeight = 1;
          modeColumn.appendChild(placeholder);
          
          // N/A text
          const naText = figma.createText();
          naText.fontName = regularFont;
          naText.fontSize = 8;
          naText.characters = "N/A";
          naText.fills = [{ type: 'SOLID', color: { r: 0.6, g: 0.6, b: 0.6 } }];
          naText.textAlignHorizontal = 'CENTER';
          naText.textAutoResize = 'WIDTH_AND_HEIGHT';
          modeColumn.appendChild(naText);
        }
        
        variableRow.appendChild(modeColumn);
      }
      
      variablesContainer.appendChild(variableRow);
    }
    
    mainFrame.appendChild(variablesContainer);
    
    // Append to page
    figma.currentPage.appendChild(mainFrame);
    
    // Select and zoom to the frame
    figma.currentPage.selection = [mainFrame];
    figma.viewport.scrollAndZoomIntoView([mainFrame]);
    
    logger.log(`✅ Generated collection color guide with ${uniqueVariables.size} variables`);
    return uniqueVariables.size;
    
  } catch (error) {
    logger.error('❌ Error generating collection color guide:', error);
    throw new Error(`Failed to generate collection color guide: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function for single mode collection guides
async function generateSingleModeCollectionGuide(collection: FigmaCollection): Promise<number> {
  try {
    // Collect all color variables from all groups
    const allColorVariables: Array<{ variable: FigmaVariable; groupName: string }> = [];
    
    for (const group of collection.groups) {
      for (const mode of group.modes) {
        const colorVariables = mode.variables.filter(v => v.type === 'color');
        for (const variable of colorVariables) {
          allColorVariables.push({
            variable,
            groupName: group.name
          });
        }
      }
    }
    
    if (allColorVariables.length === 0) {
      throw new Error(`No color variables found in collection "${collection.name}"`);
    }
    
    // Load fonts
    const boldFont = await safeLoadFont({ family: 'Inter', style: 'Bold' });
    const regularFont = await safeLoadFont({ family: 'Inter', style: 'Regular' });
    const mediumFont = await safeLoadFont({ family: 'Inter', style: 'Medium' });
    
    // Create main frame with vertical auto-layout
    const mainFrame = figma.createFrame();
    mainFrame.name = `${collection.name} - Single Mode Color Guide`;
    mainFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    mainFrame.cornerRadius = 8;
    mainFrame.layoutMode = 'VERTICAL';
    mainFrame.paddingTop = 16;
    mainFrame.paddingBottom = 16;
    mainFrame.paddingLeft = 16;
    mainFrame.paddingRight = 16;
    mainFrame.itemSpacing = 12;
    mainFrame.counterAxisSizingMode = 'AUTO';
    mainFrame.primaryAxisSizingMode = 'AUTO';
    
    // Position frame in viewport
    mainFrame.x = figma.viewport.bounds.x + 50;
    mainFrame.y = figma.viewport.bounds.y + 50;
    
    // Create header section
    const headerFrame = figma.createFrame();
    headerFrame.name = "Header";
    headerFrame.layoutMode = 'VERTICAL';
    headerFrame.itemSpacing = 4;
    headerFrame.fills = [];
    headerFrame.counterAxisSizingMode = 'AUTO';
    headerFrame.primaryAxisSizingMode = 'AUTO';
    
    // Add title
    const titleText = figma.createText();
    titleText.fontName = boldFont;
    titleText.fontSize = 18;
    titleText.characters = collection.name;
    titleText.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];
    headerFrame.appendChild(titleText);
    
    // Add subtitle
    const subtitleText = figma.createText();
    subtitleText.fontName = regularFont;
    subtitleText.fontSize = 12;
    subtitleText.characters = `${allColorVariables.length} color variables`;
    subtitleText.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
    headerFrame.appendChild(subtitleText);
    
    mainFrame.appendChild(headerFrame);
    
    // Create variables grid using auto-layout
    const variablesContainer = figma.createFrame();
    variablesContainer.name = "Variables Container";
    variablesContainer.layoutMode = 'VERTICAL';
    variablesContainer.itemSpacing = 12; // Increased spacing to prevent overlap
    variablesContainer.fills = [];
    variablesContainer.counterAxisSizingMode = 'AUTO';
    variablesContainer.primaryAxisSizingMode = 'AUTO';
    
    // Group variables by group name for better organization
    const groupedVariables = new Map<string, Array<{ variable: FigmaVariable; groupName: string }>>();
    for (const item of allColorVariables) {
      if (!groupedVariables.has(item.groupName)) {
        groupedVariables.set(item.groupName, []);
      }
      groupedVariables.get(item.groupName)!.push(item);
    }
    
    // Create variables organized by group
    for (const [groupName, variables] of Array.from(groupedVariables.entries())) {
      // Add group header if there are multiple groups
      if (groupedVariables.size > 1) {
        const groupHeaderFrame = figma.createFrame();
        groupHeaderFrame.name = `Group: ${groupName}`;
        groupHeaderFrame.fills = [];
        groupHeaderFrame.layoutMode = 'VERTICAL';
        groupHeaderFrame.counterAxisSizingMode = 'AUTO';
        groupHeaderFrame.primaryAxisSizingMode = 'AUTO';
        groupHeaderFrame.paddingTop = 8;
        groupHeaderFrame.paddingBottom = 4;
        
        const groupHeaderText = figma.createText();
        groupHeaderText.fontName = mediumFont;
        groupHeaderText.fontSize = 13;
        groupHeaderText.characters = groupName;
        groupHeaderText.fills = [{ type: 'SOLID', color: { r: 0.3, g: 0.3, b: 0.3 } }];
        groupHeaderText.textAutoResize = 'WIDTH_AND_HEIGHT';
        groupHeaderFrame.appendChild(groupHeaderText);
        
        variablesContainer.appendChild(groupHeaderFrame);
      }
      
      // Create each variable row
      for (const { variable } of variables) {
        const variableRow = figma.createFrame();
        variableRow.name = `Row: ${variable.name}`;
        variableRow.layoutMode = 'HORIZONTAL';
        variableRow.itemSpacing = 16; // More space between swatch and text
        variableRow.fills = [];
        variableRow.counterAxisSizingMode = 'AUTO';
        variableRow.primaryAxisSizingMode = 'AUTO';
        variableRow.paddingTop = 6;
        variableRow.paddingBottom = 6;
        
        // Color swatch
        const swatch = figma.createRectangle();
        swatch.name = `${variable.name}-swatch`;
        swatch.resize(32, 32); // Compact but visible
        swatch.cornerRadius = 6;
        
        // Parse and apply color
        const colorRgb = parseColorToRgb(variable.value);
        if (colorRgb) {
          swatch.fills = [{ type: 'SOLID', color: colorRgb }];
        } else {
          swatch.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
        }
        
        // Add border
        swatch.strokes = [{ type: 'SOLID', color: { r: 0.85, g: 0.85, b: 0.85 } }];
        swatch.strokeWeight = 1;
        variableRow.appendChild(swatch);
        
        // Variable info column - better spacing and sizing
        const infoColumn = figma.createFrame();
        infoColumn.name = "Variable Info";
        infoColumn.layoutMode = 'VERTICAL';
        infoColumn.itemSpacing = 4; // Better spacing between name and value
        infoColumn.fills = [];
        infoColumn.counterAxisSizingMode = 'AUTO';
        infoColumn.primaryAxisSizingMode = 'AUTO';
        infoColumn.counterAxisAlignItems = 'MIN';
        
        // Variable name - with proper truncation
        const nameText = figma.createText();
        nameText.fontName = mediumFont;
        nameText.fontSize = 12;
        // Smart truncation for very long names
        let displayName = variable.name;
        if (variable.name.length > 35) {
          displayName = variable.name.substring(0, 32) + '...';
        }
        nameText.characters = displayName;
        nameText.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];
        nameText.textAutoResize = 'WIDTH_AND_HEIGHT';
        infoColumn.appendChild(nameText);
        
        // Variable value - FULL VALUE ALWAYS VISIBLE with better sizing
        const valueText = figma.createText();
        valueText.fontName = regularFont;
        valueText.fontSize = 10;
        valueText.characters = variable.value; // FULL VALUE, NO TRUNCATION
        valueText.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];
        valueText.textAutoResize = 'WIDTH_AND_HEIGHT'; // Let text auto-size
        infoColumn.appendChild(valueText);
        
        variableRow.appendChild(infoColumn);
        variablesContainer.appendChild(variableRow);
      }
    }
    
    mainFrame.appendChild(variablesContainer);
    
    // Append to page
    figma.currentPage.appendChild(mainFrame);
    
    // Select and zoom to the frame
    figma.currentPage.selection = [mainFrame];
    figma.viewport.scrollAndZoomIntoView([mainFrame]);
    
    logger.log(`✅ Generated single mode color guide with ${allColorVariables.length} variables`);
    return allColorVariables.length;
    
  } catch (error) {
    logger.error('❌ Error generating single mode color guide:', error);
    throw new Error(`Failed to generate single mode color guide: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// === END COLLECTION COLOR GUIDE ===

// Handle messages from the UI
figma.ui.onmessage = async (msg: any) => {
  if (msg.type === 'create-variables') {
    try {
      const result = await createFigmaVariables(msg.tokens);
      
      figma.ui.postMessage({
        type: 'variables-created',
        count: result.count,
        isExtension: result.isExtension,
        collectionName: result.collectionName
      });
      
      const actionText = result.isExtension ? 'updated' : 'created';
      figma.notify(`Successfully ${actionText} ${result.count} design token variables in "${result.collectionName}"!`);
      
    } catch (error) {
      console.error('Error:', error);
      figma.ui.postMessage({
        type: 'error',
        message: 'Failed to create variables. Please try again.'
      });
      
      figma.notify('Failed to create variables. Please try again.', { error: true });
    }
  }
  
  if (msg.type === 'scan-existing-variables') {
    logger.log('🔍 Backend: Received scan-existing-variables request (legacy)');
    try {
      logger.log('📊 Backend: Starting variable scan...');
      const existingTokens = await scanExistingVariablesEnhanced();
      const totalCount = existingTokens.light.length + existingTokens.dark.length + existingTokens.global.length;
      
      logger.log('✅ Backend: Scan completed!', {
        total: totalCount,
        light: existingTokens.light.length,
        dark: existingTokens.dark.length,
        global: existingTokens.global.length
      });
      logger.log('🎨 Backend: Sample tokens:', {
        lightSample: existingTokens.light[0],
        darkSample: existingTokens.dark[0],
        globalSample: existingTokens.global[0]
      });
      
      const response = {
        type: 'existing-variables-found',
        variables: existingTokens,
        count: totalCount
      };
      
      logger.log('📤 Backend: Sending response to UI:', response);
      figma.ui.postMessage(response);
      
      figma.notify(`Found ${totalCount} existing variables!`);
      
    } catch (error) {
      logger.error('❌ Backend: Enhanced scan failed, trying fallback...', error);
      
      try {
        // Fallback to basic scanning if enhanced fails
        const basicTokens = await scanExistingVariablesBasic();
        const totalCount = basicTokens.light.length + basicTokens.dark.length + basicTokens.global.length;
        
        figma.ui.postMessage({
          type: 'existing-variables-found',
          variables: basicTokens,
          count: totalCount
        });
        
        figma.notify(`Found ${totalCount} variables (basic scan)!`);
        
      } catch (fallbackError) {
        logger.error('❌ Backend: Both scans failed:', fallbackError);
        
        figma.ui.postMessage({
          type: 'error',
          message: 'Failed to scan existing variables. Please try again.'
        });
        
        figma.notify('Failed to scan existing variables. Please try again.', { error: true });
      }
    }
  }
  
  if (msg.type === 'scan-variables-hierarchical') {
    logger.log('🔍 Backend: Received hierarchical variable scan request');
    try {
      logger.log('📊 Backend: Starting hierarchical variable scan...');
      const variableStructure = await scanVariablesHierarchical();
      
      logger.log('✅ Backend: Hierarchical scan completed!', {
        totalCollections: variableStructure.totalCollections,
        totalVariables: variableStructure.totalVariables,
        collections: variableStructure.collections.map(c => ({
          name: c.name,
          groups: c.groups.length,
          variables: c.totalVariables
        }))
      });
      
      const response = {
        type: 'variables-structure-found',
        structure: variableStructure
      };
      
      logger.log('📤 Backend: Sending hierarchical response to UI:', response);
      figma.ui.postMessage(response);
      
      figma.notify(`Found ${variableStructure.totalVariables} variables in ${variableStructure.totalCollections} collections!`);
      
    } catch (error) {
      logger.error('❌ Backend: Hierarchical scan failed:', error);
      
      figma.ui.postMessage({
        type: 'error',
        message: 'Failed to scan variables hierarchically. Please try again.'
      });
      
      figma.notify('Failed to scan variables. Please try again.', { error: true });
    }
  }
  
  if (msg.type === 'generate-color-guide') {
    try {
      const colorCount = await generateColorGuide(msg.variables);
      
      figma.ui.postMessage({
        type: 'color-guide-generated',
        count: colorCount
      });
      
      figma.notify(`Color guide generated with ${colorCount} variables!`);
      
    } catch (error) {
      console.error('Error generating color guide:', error);
      figma.ui.postMessage({
        type: 'error',
        message: 'Failed to generate color guide. Please try again.'
      });
      
      figma.notify('Failed to generate color guide. Please try again.', { error: true });
    }
  }
  
  if (msg.type === 'generate-collection-color-guide') {
    try {
      const collection = msg.collection as FigmaCollection;
      const colorCount = await generateCollectionColorGuide(collection);
      
      figma.ui.postMessage({
        type: 'color-guide-generated',
        count: colorCount
      });
      
      figma.notify(`Color guide generated for "${collection.name}" with ${colorCount} variables!`);
      
    } catch (error) {
      console.error('Error generating collection color guide:', error);
      figma.ui.postMessage({
        type: 'error',
        message: 'Failed to generate color guide. Please try again.'
      });
      
      figma.notify('Failed to generate collection color guide. Please try again.', { error: true });
    }
  }

  if (msg.type === 'generate-mode-color-guide') {
    try {
      const { collection, group, mode } = msg;
      const colorCount = await generateModeColorGuide(collection, group, mode);
      
      figma.ui.postMessage({
        type: 'color-guide-generated',
        count: colorCount
      });
      
      figma.notify(`Color guide generated for "${mode.name}" mode with ${colorCount} variables!`);
      
    } catch (error) {
      console.error('Error generating mode color guide:', error);
      figma.ui.postMessage({
        type: 'error',
        message: 'Failed to generate color guide. Please try again.'
      });
      
      figma.notify('Failed to generate mode color guide. Please try again.', { error: true });
    }
  }
  
  if (msg.type === 'scan-text-styles') {
    try {
      const result = await scanTextStyles();
      
      figma.ui.postMessage({
        type: 'text-styles-scanned',
        styles: result.styles,
        variables: result.variables
      });
      
      figma.notify(`Found ${result.styles.length} text styles and ${result.variables.length} text variables!`);
      
    } catch (error) {
      console.error('Error scanning text styles:', error);
      figma.ui.postMessage({
        type: 'error',
        message: 'Failed to scan text styles. Please try again.'
      });
      
      figma.notify('Failed to scan text styles. Please try again.', { error: true });
    }
  }
  
  if (msg.type === 'generate-typography-guide') {
    try {
      const itemCount = await generateTypographyGuide(msg.styles, msg.variables);
      
      figma.ui.postMessage({
        type: 'typography-guide-generated',
        count: itemCount
      });
      
      figma.notify(`Typography guide generated with ${itemCount} items!`);
      
    } catch (error) {
      console.error('Error generating typography guide:', error);
      figma.ui.postMessage({
        type: 'typography-guide-error',
        message: 'Failed to generate typography guide. Please try again.'
      });
      
      figma.notify('Failed to generate typography guide. Please try again.', { error: true });
    }
  }
  
  if (msg.type === 'close-plugin') {
    figma.closePlugin();
  }
  
  if (msg.type === 'resize') {
    figma.ui.resize(msg.width, msg.height);
  }
};