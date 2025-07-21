// Color conversion utilities with performance optimizations
// Centralized to reduce duplication between frontend and backend

// Performance: Simple memoization cache for expensive color conversions
const colorConversionCache = new Map<string, any>();

// Performance: Constants for color conversion
const COLOR_CONSTANTS = {
  OKLCH_XYZ_FACTORS: {
    X_FACTOR: 0.95047,
    Z_FACTOR: 1.08883,
    FY_OFFSET: 16,
    FY_DIVISOR: 116,
    A_DIVISOR: 500,
    B_DIVISOR: 200,
    CUBE_ROOT_THRESHOLD: 0.206893034,
    XYZ_OFFSET: 16 / 116,
    XYZ_SCALE: 7.787
  },
  SRGB_MATRIX: {
    R: [3.2406, -1.5372, -0.4986],
    G: [-0.9689, 1.8758, 0.0415],
    B: [0.0557, -0.2040, 1.0570]
  },
  GAMMA: {
    THRESHOLD: 0.0031308,
    SCALE: 1.055,
    POWER: 1 / 2.4,
    OFFSET: 0.055,
    LINEAR_SCALE: 12.92
  }
} as const;

// RGB color interface for consistency
export interface RGBColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

// Performance: Memoized color conversion wrapper
function memoizedColorConversion<T>(
  key: string, 
  converter: () => T
): T {
  if (colorConversionCache.has(key)) {
    return colorConversionCache.get(key) as T;
  }
  
  const result = converter();
  
  // Limit cache size to prevent memory issues
  if (colorConversionCache.size > 1000) {
    const firstKey = colorConversionCache.keys().next().value;
    if (firstKey) {
      colorConversionCache.delete(firstKey);
    }
  }
  
  colorConversionCache.set(key, result);
  return result;
}

// Performance: Optimized OKLCH to RGB conversion
export function oklchToRgb(oklchString: string): RGBColor | null {
  return memoizedColorConversion(`oklch:${oklchString}`, () => {
    const match = oklchString.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
    if (!match) return null;
    
    const [, l, c, h] = match.map(Number);
    const { OKLCH_XYZ_FACTORS: factors, SRGB_MATRIX: matrix, GAMMA } = COLOR_CONSTANTS;
    
    // Normalize and convert LCH to Lab
    const lightness = Math.max(0, Math.min(1, l));
    const chroma = Math.max(0, c);
    const hueRad = (h * Math.PI) / 180;
    
    const a = chroma * Math.cos(hueRad);
    const b = chroma * Math.sin(hueRad);
    
    // Lab to XYZ conversion
    const fy = (lightness + factors.FY_OFFSET) / factors.FY_DIVISOR;
    const fx = a / factors.A_DIVISOR + fy;
    const fz = fy - b / factors.B_DIVISOR;
    
    const xyzToRgb = (t: number) => {
      return t > factors.CUBE_ROOT_THRESHOLD 
        ? t * t * t 
        : (t - factors.XYZ_OFFSET) / factors.XYZ_SCALE;
    };
    
    const x = xyzToRgb(fx) * factors.X_FACTOR;
    const y = xyzToRgb(fy);
    const z = xyzToRgb(fz) * factors.Z_FACTOR;
    
    // XYZ to sRGB conversion
    const srgbR = x * matrix.R[0] + y * matrix.R[1] + z * matrix.R[2];
    const srgbG = x * matrix.G[0] + y * matrix.G[1] + z * matrix.G[2];
    const srgbB = x * matrix.B[0] + y * matrix.B[1] + z * matrix.B[2];
    
    // Gamma correction
    const gammaCorrect = (c: number) => {
      return c > GAMMA.THRESHOLD 
        ? GAMMA.SCALE * Math.pow(c, GAMMA.POWER) - GAMMA.OFFSET 
        : GAMMA.LINEAR_SCALE * c;
    };
    
    return {
      r: Math.max(0, Math.min(1, gammaCorrect(srgbR))),
      g: Math.max(0, Math.min(1, gammaCorrect(srgbG))),
      b: Math.max(0, Math.min(1, gammaCorrect(srgbB)))
    };
  });
}

// Performance: Optimized hex to RGB conversion
export function hexToRgb(hex: string): RGBColor | null {
  return memoizedColorConversion(`hex:${hex}`, () => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : null;
  });
}

// Performance: Optimized HSL to RGB conversion
export function hslToRgb(hslString: string): RGBColor | null {
  return memoizedColorConversion(`hsl:${hslString}`, () => {
    const match = hslString.match(/hsla?\(([+-]?[\d.]+)(?:deg)?,?\s*([+-]?[\d.]+)%?,?\s*([+-]?[\d.]+)%?(?:,?\s*([+-]?[\d.]+))?\)/i);
    if (!match) return null;

    let h = parseFloat(match[1]);
    let s = parseFloat(match[2]);
    let l = parseFloat(match[3]);
    const a = match[4] ? parseFloat(match[4]) : undefined;

    // Normalize values
    h = ((h % 360) + 360) % 360 / 360;
    s = s > 1 ? s / 100 : s;
    l = l > 1 ? l / 100 : l;
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

    const result: RGBColor = {
      r: hue2rgb(p, q, h + 1/3),
      g: hue2rgb(p, q, h),
      b: hue2rgb(p, q, h - 1/3)
    };

    if (a !== undefined) {
      result.a = a;
    }

    return result;
  });
}

// Performance: Optimized HSB/HSV to RGB conversion
export function hsbToRgb(hsbString: string): RGBColor | null {
  return memoizedColorConversion(`hsb:${hsbString}`, () => {
    const match = hsbString.match(/hsb[av]?\(([+-]?[\d.]+)(?:deg)?,?\s*([+-]?[\d.]+)%?,?\s*([+-]?[\d.]+)%?(?:,?\s*([+-]?[\d.]+))?\)/i);
    if (!match) return null;

    let h = parseFloat(match[1]);
    let s = parseFloat(match[2]);
    let b = parseFloat(match[3]);
    const a = match[4] ? parseFloat(match[4]) : undefined;

    // Normalize values
    h = ((h % 360) + 360) % 360 / 360;
    s = s > 1 ? s / 100 : s;
    b = b > 1 ? b / 100 : b;
    s = Math.max(0, Math.min(1, s));
    b = Math.max(0, Math.min(1, b));

    const c = b * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = b - c;

    let r = 0, g = 0, bVal = 0;
    const hSector = h * 6;
    
    if (hSector >= 0 && hSector < 1) {
      r = c; g = x; bVal = 0;
    } else if (hSector >= 1 && hSector < 2) {
      r = x; g = c; bVal = 0;
    } else if (hSector >= 2 && hSector < 3) {
      r = 0; g = c; bVal = x;
    } else if (hSector >= 3 && hSector < 4) {
      r = 0; g = x; bVal = c;
    } else if (hSector >= 4 && hSector < 5) {
      r = x; g = 0; bVal = c;
    } else {
      r = c; g = 0; bVal = x;
    }

    const result: RGBColor = {
      r: r + m,
      g: g + m,
      b: bVal + m
    };

    if (a !== undefined) {
      result.a = a;
    }

    return result;
  });
}

// Performance: Optimized RGB parsing
export function rgbToRgb(rgbString: string): RGBColor | null {
  return memoizedColorConversion(`rgb:${rgbString}`, () => {
    const match = rgbString.match(/rgba?\(([+-]?[\d.]+)%?,?\s*([+-]?[\d.]+)%?,?\s*([+-]?[\d.]+)%?(?:,?\s*([+-]?[\d.]+))?\)/i);
    if (!match) return null;

    let r = parseFloat(match[1]);
    let g = parseFloat(match[2]);
    let b = parseFloat(match[3]);
    const a = match[4] ? parseFloat(match[4]) : undefined;

    const isPercentage = rgbString.includes('%');

    if (isPercentage) {
      r = Math.max(0, Math.min(100, r)) / 100;
      g = Math.max(0, Math.min(100, g)) / 100;
      b = Math.max(0, Math.min(100, b)) / 100;
    } else {
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

    const result: RGBColor = { r, g, b };
    if (a !== undefined) {
      result.a = a;
    }

    return result;
  });
}

// Performance: Optimized ShadCN HSL to RGB conversion
export function shadcnHslToRgb(shadcnHslString: string): RGBColor | null {
  return memoizedColorConversion(`shadcn:${shadcnHslString}`, () => {
    const match = shadcnHslString.trim().match(/^([+-]?[\d.]+)\s+([+-]?[\d.]+)%\s+([+-]?[\d.]+)%$/);
    if (!match) return null;

    let h = parseFloat(match[1]);
    let s = parseFloat(match[2]);
    let l = parseFloat(match[3]);

    // Normalize values
    h = ((h % 360) + 360) % 360 / 360;
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
  });
}

// Comprehensive color parser with automatic format detection
export function parseColorToRgb(colorValue: string): RGBColor | null {
  const cleanValue = colorValue.trim();
  
  // Check for ShadCN raw HSL format first
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

// Utility: Convert RGB to hex string
export function rgbToHex(rgb: RGBColor): string {
  const toHex = (val: number) => Math.round(val * 255).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

// Utility: Convert RGB to CSS rgb/rgba string
export function rgbToCss(rgb: RGBColor): string {
  const r = Math.round(rgb.r * 255);
  const g = Math.round(rgb.g * 255);
  const b = Math.round(rgb.b * 255);
  
  if (rgb.a !== undefined && rgb.a < 1) {
    return `rgba(${r}, ${g}, ${b}, ${rgb.a})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

// Utility: Convert any color format to preview-ready format
export function getColorPreview(colorValue: string): string {
  const rgb = parseColorToRgb(colorValue);
  if (rgb) {
    return rgbToHex(rgb);
  }
  
  // Return original value if parsing fails (for named colors, etc.)
  return colorValue;
}

// Utility: Clear color conversion cache (for memory management)
export function clearColorCache(): void {
  colorConversionCache.clear();
}

// Utility: Get cache statistics (for debugging)
export function getColorCacheStats(): { size: number; maxSize: number } {
  return {
    size: colorConversionCache.size,
    maxSize: 1000
  };
} 