// Performance: Import centralized color utilities
import { 
  getColorPreview, 
  parseColorToRgb, 
  rgbToHex,
  type RGBColor
} from './utils/color-utils';

export interface ParsedToken {
  name: string;
  value: string;
  type: 'color' | 'font' | 'radius' | 'shadow' | 'other';
  displayValue?: string;
  category?: string;
  source?: string;
}

export interface ParsedTokens {
  light: ParsedToken[];
  dark: ParsedToken[];
  global: ParsedToken[];
}

// Performance: Remove duplicate color conversion functions - now using centralized utilities

// Convert ShadCN raw HSL to standard HSL for display purposes
export function shadcnHslToHsl(shadcnHsl: string): string {
  const rgb = parseColorToRgb(shadcnHsl);
  if (rgb) {
    return rgbToHex(rgb);
  }
  return shadcnHsl;
}

// Performance: Simplified color preview using centralized utility
export function getColorPreviewOptimized(colorValue: string): string {
  return getColorPreview(colorValue);
}

// Determine token type and category based on name and value
function categorizeToken(name: string, value: string): { type: ParsedToken['type'], category: string } {
  const lowerName = name.toLowerCase();
  const lowerValue = value.toLowerCase();
  
  // Shadow detection (MOVED TO FIRST - before color detection)
  if (
    lowerName.includes('shadow') ||
    lowerValue.includes('box-shadow') ||
    lowerValue.match(/\d+px\s+\d+px/)
  ) {
    return { type: 'shadow', category: 'Effects' };
  }
  
  // Color detection (now runs after shadow detection)
  if (
    lowerValue.includes('oklch') ||
    lowerValue.includes('hsl') ||
    lowerValue.includes('hsb') ||
    lowerValue.includes('hsv') ||
    lowerValue.includes('rgb') ||
    lowerValue.startsWith('#') ||
    lowerName.includes('color') ||
    /^[+-]?[\d.]+\s+[+-]?[\d.]+%\s+[+-]?[\d.]+%$/.test(value.trim())
  ) {
    return { type: 'color', category: 'Colors' };
  }

  // Font detection (unchanged)
  if (
    lowerName.includes('font') ||
    lowerValue.includes('sans-serif') ||
    lowerValue.includes('serif') ||
    lowerValue.includes('monospace') ||
    lowerName.includes('typography') ||
    lowerName.includes('text')
  ) {
    return { type: 'font', category: 'Typography' };
  }

  // Radius/border detection (unchanged)
  if (
    lowerName.includes('radius') ||
    lowerName.includes('rounded') ||
    (lowerValue.includes('rem') && lowerName.includes('border'))
  ) {
    return { type: 'radius', category: 'Spacing' };
  }

  // Spacing/number detection (NEW)
  if (
    lowerName.match(/(padding|margin|gap|space|size|width|height|min|max|offset)/) ||
    lowerValue.match(/^[-+]?\d*\.?\d+(rem|em|px|%|vw|vh|ch|ex|in|cm|mm|pt|pc)$/)
  ) {
    return { type: 'other', category: 'Spacing' };
  }

  // Pure numbers (NEW)
  if (/^[-+]?\d*\.?\d+$/.test(value.trim())) {
    return { type: 'other', category: 'Numbers' };
  }

  return { type: 'other', category: 'Other' };
}

// Parse a single CSS section (e.g., :root or .dark)
function parseSection(content: string): ParsedToken[] {
  const tokens: ParsedToken[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('/*') || trimmedLine.startsWith('//')) {
      continue; // Skip empty lines and comments
    }
    
    const match = trimmedLine.match(/--([^:]+):\s*([^;]+);?/);
    if (!match) continue;
    
    const [, name, value] = match;
    const cleanName = name.trim();
    const cleanValue = value.trim();
    
    if (!cleanName || !cleanValue) continue;
    
    const { type, category } = categorizeToken(cleanName, cleanValue);
    
    // For color tokens, create a browser-compatible preview value using centralized utility
    let displayValue = cleanValue;
    if (type === 'color') {
      displayValue = getColorPreview(cleanValue);
    }
    
    tokens.push({
      name: cleanName,
      value: cleanValue,
      type,
      displayValue,
      category
    });
  }
  
  return tokens;
}

// Performance: Optimized CSS variable parsing with better error handling
export function parseCSSVariables(cssText: string): ParsedTokens {
  const result: ParsedTokens = {
    light: [],
    dark: [],
    global: []
  };

  if (!cssText.trim()) {
    return result;
  }

  try {
    // Performance: More efficient parsing with cleaner regex
    const sections = cssText.split(/(?=:root|\.dark)/);
    
    for (const section of sections) {
      const trimmedSection = section.trim();
      if (!trimmedSection) continue;

      // Extract content between braces
      const braceMatch = trimmedSection.match(/\{([^}]+)\}/s);
      if (!braceMatch) continue;

      const content = braceMatch[1];
      const tokens = parseSection(content);

      if (trimmedSection.startsWith(':root')) {
        result.light.push(...tokens);
      } else if (trimmedSection.includes('.dark')) {
        result.dark.push(...tokens);
      } else {
        result.global.push(...tokens);
      }
    }

    // If no dark tokens found but we have light tokens, create a copy for global
    if (result.dark.length === 0 && result.light.length > 0) {
      result.global = [...result.light];
      result.light = [];
    }

  } catch (error) {
    console.error('Error parsing CSS variables:', error);
    throw new Error('Failed to parse CSS variables. Please check the format.');
  }

  return result;
}

// Performance: Optimized token grouping
export function groupTokensByCategory(tokens: ParsedToken[]): Record<string, ParsedToken[]> {
  const grouped: Record<string, ParsedToken[]> = {};
  
  for (const token of tokens) {
    const category = token.category || 'Other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(token);
  }
  
  return grouped;
}