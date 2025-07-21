/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/*!*****************!*\
  !*** ./code.ts ***!
  \*****************/

// This file runs in the Figma plugin sandbox and has access to the Figma API
// Show the UI using the HTML content from the manifest
figma.showUI(__html__, {
    width: 960,
    height: 700,
    themeColors: true
});
// === END NEW INTERFACES ===
// Convert oklch to RGB values for Figma
function oklchToRgb(oklchString) {
    const match = oklchString.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
    if (!match)
        return null;
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
    const xyz_to_rgb = (t) => {
        return t > 0.206893034 ? t * t * t : (t - 16 / 116) / 7.787;
    };
    let x = xyz_to_rgb(fx) * 0.95047;
    let y = xyz_to_rgb(fy);
    let z = xyz_to_rgb(fz) * 1.08883;
    // XYZ to sRGB conversion matrix
    let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    let b_val = x * 0.0557 + y * -0.2040 + z * 1.0570;
    // Gamma correction
    const gamma_correct = (c) => {
        return c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c;
    };
    r = Math.max(0, Math.min(1, gamma_correct(r)));
    g = Math.max(0, Math.min(1, gamma_correct(g)));
    b_val = Math.max(0, Math.min(1, gamma_correct(b_val)));
    return { r, g, b: b_val };
}
// Convert hex to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : null;
}
// Convert HSL to RGB - Enhanced to support decimal values and percentages
function hslToRgb(hslString) {
    // Support both integer and decimal values, with or without percentages
    const match = hslString.match(/hsla?\(([+-]?[\d.]+)(?:deg)?,?\s*([+-]?[\d.]+)%?,?\s*([+-]?[\d.]+)%?(?:,?\s*([+-]?[\d.]+))?\)/i);
    if (!match)
        return null;
    let h = parseFloat(match[1]);
    let s = parseFloat(match[2]);
    let l = parseFloat(match[3]);
    // Normalize hue to 0-1 range
    h = ((h % 360) + 360) % 360 / 360;
    // Normalize saturation and lightness
    // If values are > 1, assume they're percentages
    if (s > 1)
        s = s / 100;
    if (l > 1)
        l = l / 100;
    // Clamp values
    s = Math.max(0, Math.min(1, s));
    l = Math.max(0, Math.min(1, l));
    const hue2rgb = (p, q, t) => {
        if (t < 0)
            t += 1;
        if (t > 1)
            t -= 1;
        if (t < 1 / 6)
            return p + (q - p) * 6 * t;
        if (t < 1 / 2)
            return q;
        if (t < 2 / 3)
            return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return {
        r: hue2rgb(p, q, h + 1 / 3),
        g: hue2rgb(p, q, h),
        b: hue2rgb(p, q, h - 1 / 3)
    };
}
// Convert HSB/HSV to RGB - New function for HSB support
function hsbToRgb(hsbString) {
    // Support hsb(), hsv(), and hsba()/hsva() formats
    const match = hsbString.match(/hsb[av]?\(([+-]?[\d.]+)(?:deg)?,?\s*([+-]?[\d.]+)%?,?\s*([+-]?[\d.]+)%?(?:,?\s*([+-]?[\d.]+))?\)/i);
    if (!match)
        return null;
    let h = parseFloat(match[1]);
    let s = parseFloat(match[2]);
    let b = parseFloat(match[3]);
    // Normalize hue to 0-1 range
    h = ((h % 360) + 360) % 360 / 360;
    // Normalize saturation and brightness
    // If values are > 1, assume they're percentages
    if (s > 1)
        s = s / 100;
    if (b > 1)
        b = b / 100;
    // Clamp values
    s = Math.max(0, Math.min(1, s));
    b = Math.max(0, Math.min(1, b));
    const c = b * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = b - c;
    let r = 0, g = 0, b_val = 0;
    const hSector = h * 6;
    if (hSector >= 0 && hSector < 1) {
        r = c;
        g = x;
        b_val = 0;
    }
    else if (hSector >= 1 && hSector < 2) {
        r = x;
        g = c;
        b_val = 0;
    }
    else if (hSector >= 2 && hSector < 3) {
        r = 0;
        g = c;
        b_val = x;
    }
    else if (hSector >= 3 && hSector < 4) {
        r = 0;
        g = x;
        b_val = c;
    }
    else if (hSector >= 4 && hSector < 5) {
        r = x;
        g = 0;
        b_val = c;
    }
    else {
        r = c;
        g = 0;
        b_val = x;
    }
    return {
        r: r + m,
        g: g + m,
        b: b_val + m
    };
}
// Enhanced RGB parsing to support decimals, percentages, and rgba
function rgbToRgb(rgbString) {
    // Support rgb(), rgba(), and various formats including decimals and percentages
    const match = rgbString.match(/rgba?\(([+-]?[\d.]+)%?,?\s*([+-]?[\d.]+)%?,?\s*([+-]?[\d.]+)%?(?:,?\s*([+-]?[\d.]+))?\)/i);
    if (!match)
        return null;
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
    }
    else {
        // If not percentages, assume 0-255 range if > 1, otherwise 0-1
        if (r > 1 || g > 1 || b > 1) {
            r = Math.max(0, Math.min(255, r)) / 255;
            g = Math.max(0, Math.min(255, g)) / 255;
            b = Math.max(0, Math.min(255, b)) / 255;
        }
        else {
            r = Math.max(0, Math.min(1, r));
            g = Math.max(0, Math.min(1, g));
            b = Math.max(0, Math.min(1, b));
        }
    }
    return { r, g, b };
}
// Convert ShadCN raw HSL format to RGB (e.g., "0 0% 100%" -> RGB)
function shadcnHslToRgb(shadcnHslString) {
    // Parse ShadCN format: "h s% l%" (without hsl() wrapper)
    const match = shadcnHslString.trim().match(/^([+-]?[\d.]+)\s+([+-]?[\d.]+)%\s+([+-]?[\d.]+)%$/);
    if (!match)
        return null;
    let h = parseFloat(match[1]);
    let s = parseFloat(match[2]);
    let l = parseFloat(match[3]);
    // Normalize hue to 0-1 range
    h = ((h % 360) + 360) % 360 / 360;
    // Normalize saturation and lightness (already in percentage format)
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;
    const hue2rgb = (p, q, t) => {
        if (t < 0)
            t += 1;
        if (t > 1)
            t -= 1;
        if (t < 1 / 6)
            return p + (q - p) * 6 * t;
        if (t < 1 / 2)
            return q;
        if (t < 2 / 3)
            return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return {
        r: hue2rgb(p, q, h + 1 / 3),
        g: hue2rgb(p, q, h),
        b: hue2rgb(p, q, h - 1 / 3)
    };
}
// Parse color value to RGB - Enhanced with comprehensive format support
function parseColorToRgb(colorValue) {
    const cleanValue = colorValue.trim();
    // Check for ShadCN raw HSL format first (e.g., "0 0% 100%")
    const shadcnHslMatch = cleanValue.match(/^([+-]?[\d.]+)\s+([+-]?[\d.]+)%\s+([+-]?[\d.]+)%$/);
    if (shadcnHslMatch) {
        return shadcnHslToRgb(cleanValue);
    }
    if (cleanValue.includes('oklch')) {
        return oklchToRgb(cleanValue);
    }
    else if (cleanValue.startsWith('#')) {
        return hexToRgb(cleanValue);
    }
    else if (cleanValue.includes('hsl')) {
        return hslToRgb(cleanValue);
    }
    else if (cleanValue.includes('hsb') || cleanValue.includes('hsv')) {
        return hsbToRgb(cleanValue);
    }
    else if (cleanValue.includes('rgb')) {
        return rgbToRgb(cleanValue);
    }
    return null;
}
// Debug logger utility for development
const logger = {
    log: (...args) => {
        if (true) {
            console.log(...args);
        }
    },
    warn: (...args) => {
        if (true) {
            console.warn(...args);
        }
    },
    error: (...args) => {
        // Always log errors
        console.error(...args);
    }
};
// Function to find existing shadcn-compatible variable collection (updated for ShadCN patterns)
async function findExistingShadcnCollection() {
    try {
        const collections = await figma.variables.getLocalVariableCollectionsAsync();
        const variables = await figma.variables.getLocalVariablesAsync();
        logger.log('Available collections:', collections.map((c) => ({ name: c.name, id: c.id, modes: c.modes.length })));
        // Look for ShadCN collections in order of preference
        const shadcnCollectionNames = ['2. Themes', '3. Mode', 'Themes', 'Colors', 'Design Tokens'];
        for (const collectionName of shadcnCollectionNames) {
            const targetCollection = collections.find((collection) => collection.name === collectionName);
            if (targetCollection) {
                const collectionVariables = variables.filter((v) => v.variableCollectionId === targetCollection.id);
                logger.log(`Found "${collectionName}" collection with ${collectionVariables.length} variables`);
                logger.log('Variable names sample:', collectionVariables.slice(0, 5).map((v) => v.name));
                // Check if it has variables with ShadCN naming patterns
                const shadcnPatterns = ['background', 'foreground', 'primary', 'secondary', 'muted', 'accent', 'destructive', 'border', 'input', 'ring', 'card', 'popover'];
                // Check for variables in "base/" or "color/" groups
                const baseGroupVariables = collectionVariables.filter((variable) => variable.name.toLowerCase().startsWith('base/') ||
                    variable.name.toLowerCase().startsWith('color/'));
                // Check if it has ShadCN variables (with or without prefixes)
                const hasShadcnVariables = collectionVariables.some((variable) => {
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
            const collectionVariables = variables.filter((v) => v.variableCollectionId === collection.id);
            // Count color variables
            const colorVariables = collectionVariables.filter((variable) => variable.resolvedType === 'COLOR');
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
    }
    catch (error) {
        logger.error('Error finding existing ShadCN collection:', error);
        return null;
    }
}
async function createFigmaVariables(tokens) {
    try {
        // First, check if there's an existing shadcn-compatible collection
        const existingSetup = await findExistingShadcnCollection();
        let collection;
        let lightModeId;
        let darkModeId;
        if (existingSetup) {
            // Use existing collection and extend it
            collection = existingSetup.collection;
            // Check if this is the specific "3. Mode" collection
            const isThemeModeCollection = collection.name === '3. Mode';
            console.log('Existing modes:', collection.modes.map((m) => m.name));
            // Create new custom modes alongside existing ones (don't overwrite)
            lightModeId = collection.addMode('light custom');
            darkModeId = collection.addMode('dark custom');
            console.log(`Created new modes: "light custom" and "dark custom"`);
            if (isThemeModeCollection) {
                figma.notify(`Adding custom theme modes to "${collection.name}" → base group`);
            }
            else {
                figma.notify(`Adding custom modes to existing collection: "${collection.name}"`);
            }
        }
        else {
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
        const createOrUpdateVariableWithModes = async (lightToken, darkToken, collection, lightModeId, darkModeId, existingVariables) => {
            try {
                let variableType;
                let lightValue;
                let darkValue;
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
                        }
                        else {
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
                        }
                        else {
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
                            }
                            else {
                                darkValue = lightValue;
                            }
                        }
                        else {
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
                    variable = existingVariables.find((v) => v.name === variableName);
                }
                if (variable) {
                    // Update existing variable with new custom mode values only
                    // Don't touch existing mode values - only add to the new custom modes
                    try {
                        variable.setValueForMode(lightModeId, lightValue);
                        variable.setValueForMode(darkModeId, darkValue);
                        logger.log(`Updated existing variable "${variableName}" with custom mode values`);
                    }
                    catch (error) {
                        logger.warn(`Could not add custom modes to variable ${variableName}:`, error);
                    }
                }
                else {
                    // Create new variable and set values only for custom modes
                    variable = figma.variables.createVariable(variableName, collection, variableType);
                    variable.setValueForMode(lightModeId, lightValue);
                    variable.setValueForMode(darkModeId, darkValue);
                    logger.log(`Created new variable "${variableName}" with custom mode values`);
                }
                createdCount++;
            }
            catch (error) {
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
                if (aIndex !== -1)
                    return -1;
                if (bIndex !== -1)
                    return 1;
                // If neither is in the list, sort alphabetically
                return a.localeCompare(b);
            }
            else if (aIsColor && !bIsColor) {
                // Colors come first
                return -1;
            }
            else if (!aIsColor && bIsColor) {
                // Non-colors come after colors
                return 1;
            }
            else {
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
    }
    catch (error) {
        console.error('Error creating Figma variables:', error);
        throw error;
    }
}
// Function to generate a color guide frame on the canvas
async function generateColorGuide(tokens) {
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
        const tokensByCollection = new Map();
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
            tokensByCollection.get(collectionName).light.push(token);
        }
        for (const token of tokens.dark.filter(t => t.type === 'color')) {
            const collectionName = token.collection || 'Unknown Collection';
            tokensByCollection.get(collectionName).dark.push(token);
        }
        for (const token of tokens.global.filter(t => t.type === 'color')) {
            const collectionName = token.collection || 'Unknown Collection';
            tokensByCollection.get(collectionName).global.push(token);
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
        const createdFrames = [];
        const viewport = figma.viewport.bounds;
        let frameOffsetX = 0;
        // Helper function to truncate text that's too long
        const truncateText = (text, maxLength) => {
            if (text.length <= maxLength)
                return text;
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
                    }
                    else {
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
                            const hex = '#' + [rgb.r, rgb.g, rgb.b].map(c => Math.round(c * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
                            displayValue = hex;
                        }
                    }
                    else {
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
    }
    catch (error) {
        console.error('Error generating color guide:', error);
        throw error;
    }
}
// Enhanced function to scan existing Figma variables and styles comprehensively
async function scanExistingVariablesEnhanced() {
    try {
        logger.log('=== ENHANCED SCANNING STARTED ===');
        const tokens = {
            light: [],
            dark: [],
            global: []
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
    }
    catch (error) {
        logger.error('Error in enhanced scanning:', error);
        throw error;
    }
}
// Helper function to detect if a value represents a color
function isColorValue(value, variableName) {
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
    }
    catch (error) {
        return false;
    }
}
// Enhanced color value extraction with better format support and alias resolution
async function extractColorValueEnhanced(value, variableName, allVariables, visitedAliases) {
    try {
        // Initialize visited aliases to prevent infinite loops
        if (!visitedAliases) {
            visitedAliases = new Set();
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
            const aliasId = value.id;
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
                const referencedVar = allVariables && allVariables.find((v) => v.id === aliasId);
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
                    }
                    catch (apiError) {
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
                }
                else {
                    logger.warn(`Referenced variable ${aliasId} has no mode values`);
                    return null;
                }
            }
            catch (error) {
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
    }
    catch (error) {
        logger.error(`Error extracting color value for ${variableName}:`, error);
        return null;
    }
}
// Synchronous version for backward compatibility
function extractColorValueEnhancedSync(value, variableName) {
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
    }
    catch (error) {
        logger.error(`Error extracting color value for ${variableName}:`, error);
        return null;
    }
}
// Scan local variables with improved detection
async function scanLocalVariables(tokens) {
    try {
        logger.log('Scanning local variables...');
        const variables = await figma.variables.getLocalVariablesAsync();
        const collections = await figma.variables.getLocalVariableCollectionsAsync();
        logger.log(`Found ${variables.length} local variables across ${collections.length} collections`);
        for (const variable of variables) {
            try {
                const collection = collections.find((c) => c.id === variable.variableCollectionId);
                if (!collection)
                    continue;
                // Determine if this variable is color-related
                const isColor = variable.resolvedType === 'COLOR' ||
                    isColorValue(Object.values(variable.valuesByMode)[0], variable.name);
                if (!isColor)
                    continue; // Skip non-color variables for color scanning
                logger.log(`Processing color variable: ${variable.name} in collection: ${collection.name}`);
                // Enhanced mode detection
                const modes = collection.modes;
                const lightMode = modes.find((m) => m.name.toLowerCase().includes('light') ||
                    m.name.toLowerCase().includes('default') ||
                    m.name.toLowerCase().includes('day') ||
                    modes.length === 1);
                const darkMode = modes.find((m) => m.name.toLowerCase().includes('dark') ||
                    m.name.toLowerCase().includes('night'));
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
                    if (value === undefined)
                        continue;
                    const displayValue = await extractColorValueEnhanced(value, variable.name, variables);
                    if (!displayValue || displayValue === 'Invalid Color')
                        continue;
                    const token = {
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
                    }
                    else if (darkMode && mode.modeId === darkMode.modeId) {
                        tokens.dark.push(token);
                        logger.log(`✓ Added dark variable: ${cleanName} = ${displayValue}`);
                    }
                    else {
                        tokens.global.push(token);
                        logger.log(`✓ Added global variable: ${cleanName} = ${displayValue}`);
                    }
                }
            }
            catch (error) {
                logger.error(`Error processing variable ${variable.name}:`, error);
            }
        }
    }
    catch (error) {
        logger.error('Error scanning local variables:', error);
    }
}
// Scan paint styles
async function scanPaintStyles(tokens) {
    try {
        logger.log('Scanning paint styles...');
        const paintStyles = await figma.getLocalPaintStylesAsync();
        logger.log(`Found ${paintStyles.length} local paint styles`);
        for (const style of paintStyles) {
            try {
                // Check if style has color paints
                if (!style.paints || style.paints.length === 0)
                    continue;
                for (let i = 0; i < style.paints.length; i++) {
                    const paint = style.paints[i];
                    // Only process solid color paints for now
                    if (paint.type !== 'SOLID')
                        continue;
                    const colorValue = extractColorValueEnhancedSync(paint.color, style.name);
                    if (!colorValue)
                        continue;
                    // Clean style name
                    let cleanName = style.name;
                    // Remove common style prefixes/suffixes
                    cleanName = cleanName.replace(/^(style|color|paint)[-_\s]*|[-_\s]*(style|color|paint)$/gi, '');
                    cleanName = cleanName.trim() || style.name;
                    // Add index if multiple paints
                    const displayName = style.paints.length > 1 ? `${cleanName}-${i + 1}` : cleanName;
                    const token = {
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
                    }
                    else if (nameLower.includes('light') || nameLower.includes('day')) {
                        tokens.light.push(token);
                        logger.log(`✓ Added light style: ${displayName} = ${colorValue}`);
                    }
                    else {
                        tokens.global.push(token);
                        logger.log(`✓ Added global style: ${displayName} = ${colorValue}`);
                    }
                }
            }
            catch (error) {
                logger.error(`Error processing paint style ${style.name}:`, error);
            }
        }
    }
    catch (error) {
        logger.error('Error scanning paint styles:', error);
    }
}
// Scan published library variables
async function scanPublishedLibraryVariables(tokens) {
    try {
        logger.log('Scanning for published library variables...');
        // Get all variable collections (including imported ones)
        // Note: This is a simplified approach - in practice, we'd need to know
        // specific library keys or iterate through known published collections
        // For now, we can look for variable aliases that reference external variables
        // and attempt to resolve them
        const variables = await figma.variables.getLocalVariablesAsync();
        const externalAliases = new Set();
        // Find all external variable references
        for (const variable of variables) {
            for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
                if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS' && 'id' in value) {
                    try {
                        // Try to resolve the alias to see if it's external
                        const aliasId = value.id;
                        const referencedVar = await figma.variables.getVariableByIdAsync(aliasId);
                        if (!referencedVar) {
                            // This might be an external variable
                            externalAliases.add(aliasId);
                            logger.log(`Found potential external variable reference: ${aliasId}`);
                        }
                    }
                    catch (error) {
                        // Variable not found locally, likely external
                        const aliasId = value.id;
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
            }
            catch (error) {
                logger.warn(`Could not resolve external variable ${aliasId}:`, error);
            }
        }
    }
    catch (error) {
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
            light: [],
            dark: [],
            global: []
        };
        // Process each variable with basic logic
        for (const variable of variables) {
            try {
                const collection = collections.find((c) => c.id === variable.variableCollectionId);
                if (!collection)
                    continue;
                // Only process COLOR type variables in basic mode
                if (variable.resolvedType !== 'COLOR')
                    continue;
                logger.log(`Processing variable: ${variable.name} (${variable.resolvedType}) in collection: ${collection.name}`);
                // Find light and dark modes
                const lightMode = collection.modes.find((m) => m.name.toLowerCase().includes('light') ||
                    m.name.toLowerCase().includes('default') ||
                    collection.modes.length === 1);
                const darkMode = collection.modes.find((m) => m.name.toLowerCase().includes('dark') ||
                    m.name.toLowerCase().includes('night'));
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
            }
            catch (error) {
                logger.error(`Error processing variable ${variable.name}:`, error);
            }
        }
        logger.log('=== BASIC SCAN COMPLETE ===');
        logger.log(`Light tokens: ${tokens.light.length}`);
        logger.log(`Dark tokens: ${tokens.dark.length}`);
        logger.log(`Global tokens: ${tokens.global.length}`);
        return tokens;
    }
    catch (error) {
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
        const stringVariables = textVariables.filter((variable) => variable.resolvedType === 'STRING' ||
            variable.name.toLowerCase().includes('font') ||
            variable.name.toLowerCase().includes('text'));
        const processedStyles = textStyles.map((style) => ({
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
        const processedVariables = stringVariables.map((variable) => ({
            id: variable.id,
            name: variable.name,
            resolvedType: variable.resolvedType,
            valuesByMode: variable.valuesByMode
        }));
        return {
            styles: processedStyles,
            variables: processedVariables
        };
    }
    catch (error) {
        console.error('Error scanning text styles:', error);
        throw error;
    }
}
// Function to generate typography guide on canvas
async function generateTypographyGuide(styles, variables) {
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
        const safeLoadFont = async (fontName) => {
            try {
                await figma.loadFontAsync(fontName);
                return fontName;
            }
            catch (error) {
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
                    }
                    catch (fallbackError) {
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
                    const cleanStyleName = (styleName) => {
                        // Remove font family from style name if it's redundant
                        const parts = styleName.split('/');
                        return parts.length > 1 ? parts[parts.length - 1] : styleName;
                    };
                    // Helper function to format line height
                    const formatLineHeight = (lineHeight) => {
                        if (!lineHeight || lineHeight === undefined)
                            return 'Auto';
                        if (typeof lineHeight === 'object' && lineHeight.unit) {
                            if (lineHeight.unit === 'PERCENT') {
                                return `${Math.round(lineHeight.value)}%`;
                            }
                            else if (lineHeight.unit === 'PIXELS') {
                                return `${lineHeight.value}px`;
                            }
                        }
                        if (typeof lineHeight === 'number') {
                            return `${Math.round(lineHeight)}%`;
                        }
                        return 'Auto';
                    };
                    // Helper function to format letter spacing
                    const formatLetterSpacing = (letterSpacing) => {
                        if (!letterSpacing || letterSpacing === undefined)
                            return '0';
                        if (typeof letterSpacing === 'object' && letterSpacing.unit) {
                            if (letterSpacing.unit === 'PERCENT') {
                                return `${letterSpacing.value.toFixed(1)}%`;
                            }
                            else if (letterSpacing.unit === 'PIXELS') {
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
                    }
                    else {
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
                }
                catch (fontError) {
                    console.warn(`Could not load any font for style ${style.name}:`, fontError);
                    // Helper function to clean up style name (same as above)
                    const cleanStyleName = (styleName) => {
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
                }
                catch (error) {
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
    }
    catch (error) {
        console.error('Error generating typography guide:', error);
        throw error;
    }
}
// === NEW HIERARCHICAL VARIABLE SCANNING ===
async function scanVariablesHierarchical() {
    try {
        logger.log('🔍 Starting hierarchical variable scan...');
        // Get all variable collections
        const collections = await figma.variables.getLocalVariableCollectionsAsync();
        const result = {
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
            const figmaCollection = {
                id: collection.id,
                name: collection.name,
                groups: [],
                totalVariables: 0,
                allModes: collection.modes.map((mode) => ({ id: mode.modeId, name: mode.name }))
            };
            // Get all variables in this collection
            const collectionVariables = await figma.variables.getLocalVariablesAsync();
            const filteredVariables = collectionVariables.filter((variable) => variable.variableCollectionId === collection.id);
            logger.log(`Found ${filteredVariables.length} variables in collection ${collection.name}`);
            if (filteredVariables.length === 0) {
                continue;
            }
            // Group variables by their base name (everything before the first slash or dot)
            const variablesByGroup = new Map();
            for (const variable of filteredVariables) {
                // Extract group name from variable name
                // Examples: "colors/primary" -> "colors", "typography.heading" -> "typography"
                const groupName = extractGroupName(variable.name);
                if (!variablesByGroup.has(groupName)) {
                    variablesByGroup.set(groupName, []);
                }
                variablesByGroup.get(groupName).push(variable);
            }
            logger.log(`Organized into ${variablesByGroup.size} groups:`, Array.from(variablesByGroup.keys()));
            // Process each group
            for (const [groupName, groupVariables] of Array.from(variablesByGroup.entries())) {
                const figmaGroup = {
                    name: groupName,
                    modes: [],
                    totalVariables: 0
                };
                // Organize by modes
                const variablesByMode = new Map();
                for (const variable of groupVariables) {
                    for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
                        if (!variablesByMode.has(modeId)) {
                            variablesByMode.set(modeId, []);
                        }
                        variablesByMode.get(modeId).push({ variable, value, modeId });
                    }
                }
                // Create mode objects
                for (const [modeId, modeVariableData] of Array.from(variablesByMode.entries())) {
                    const mode = collection.modes.find((m) => m.modeId === modeId);
                    const modeName = mode ? mode.name : modeId;
                    const figmaMode = {
                        id: modeId,
                        name: modeName,
                        variables: []
                    };
                    // Process variables for this mode
                    for (const { variable, value, modeId } of modeVariableData) {
                        try {
                            const colorValue = await extractColorValueEnhanced(value, variable.name);
                            const variableType = determineVariableType(variable, colorValue);
                            const figmaVariable = {
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
                        }
                        catch (error) {
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
    }
    catch (error) {
        logger.error('Error in hierarchical variable scan:', error);
        throw error;
    }
}
function extractGroupName(variableName) {
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
        const groupMappings = {
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
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function determineVariableType(variable, colorValue) {
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
async function safeLoadFont(fontName) {
    try {
        await figma.loadFontAsync(fontName);
        return fontName;
    }
    catch (error) {
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
            }
            catch (fallbackError) {
                // Continue to next fallback
            }
        }
        // Final fallback - use system default
        return { family: 'Arial', style: 'Regular' };
    }
}
// Generate color guide for a specific mode
async function generateModeColorGuide(collection, group, mode) {
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
                }
                else {
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
            }
            catch (error) {
                logger.warn(`Error creating swatch for ${variable.name}:`, error);
            }
        }
        // Focus on the generated guide
        figma.viewport.scrollAndZoomIntoView([frame]);
        logger.log(`✅ Mode color guide generated with ${colorVariables.length} color variables`);
        return colorVariables.length;
    }
    catch (error) {
        logger.error('Error generating mode color guide:', error);
        throw error;
    }
}
// Generate color guide for entire collection with proper mode separation
async function generateCollectionColorGuide(collection) {
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
        const uniqueVariables = new Map();
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
                    uniqueVariables.get(variable.name).modeValues.set(mode.id, {
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
                    }
                    else {
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
                }
                else {
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
    }
    catch (error) {
        logger.error('❌ Error generating collection color guide:', error);
        throw new Error(`Failed to generate collection color guide: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
// Helper function for single mode collection guides
async function generateSingleModeCollectionGuide(collection) {
    try {
        // Collect all color variables from all groups
        const allColorVariables = [];
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
        const groupedVariables = new Map();
        for (const item of allColorVariables) {
            if (!groupedVariables.has(item.groupName)) {
                groupedVariables.set(item.groupName, []);
            }
            groupedVariables.get(item.groupName).push(item);
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
                }
                else {
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
    }
    catch (error) {
        logger.error('❌ Error generating single mode color guide:', error);
        throw new Error(`Failed to generate single mode color guide: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
// === END COLLECTION COLOR GUIDE ===
// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
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
        }
        catch (error) {
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
        }
        catch (error) {
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
            }
            catch (fallbackError) {
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
        }
        catch (error) {
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
        }
        catch (error) {
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
            const collection = msg.collection;
            const colorCount = await generateCollectionColorGuide(collection);
            figma.ui.postMessage({
                type: 'color-guide-generated',
                count: colorCount
            });
            figma.notify(`Color guide generated for "${collection.name}" with ${colorCount} variables!`);
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
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

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLDBFQUEwRSxhQUFhO0FBQ3ZGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsdURBQXVELFlBQVk7QUFDbkU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLGdGQUFnRixhQUFhO0FBQzdGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYix1REFBdUQsZ0JBQWdCLFNBQVMsWUFBWTtBQUM1RjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsMkZBQTJGLGFBQWE7QUFDeEc7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsMEJBQTBCO0FBQzlDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLHVEQUF1RCxVQUFVLGNBQWMsWUFBWTtBQUMzRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IscUZBQXFGLGFBQWE7QUFDbEc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLGtDQUFrQyxzQkFBc0Isa0JBQWtCLHlCQUF5QjtBQUNuRztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsNEVBQTRFLGFBQWE7QUFDekY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYiw0REFBNEQsV0FBVztBQUN2RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IscUZBQXFGLGFBQWE7QUFDbEc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZXNzZW50aWFsLXRva2Vucy8uL2NvZGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG4vLyBUaGlzIGZpbGUgcnVucyBpbiB0aGUgRmlnbWEgcGx1Z2luIHNhbmRib3ggYW5kIGhhcyBhY2Nlc3MgdG8gdGhlIEZpZ21hIEFQSVxuLy8gU2hvdyB0aGUgVUkgdXNpbmcgdGhlIEhUTUwgY29udGVudCBmcm9tIHRoZSBtYW5pZmVzdFxuZmlnbWEuc2hvd1VJKF9faHRtbF9fLCB7XG4gICAgd2lkdGg6IDk2MCxcbiAgICBoZWlnaHQ6IDcwMCxcbiAgICB0aGVtZUNvbG9yczogdHJ1ZVxufSk7XG4vLyA9PT0gRU5EIE5FVyBJTlRFUkZBQ0VTID09PVxuLy8gQ29udmVydCBva2xjaCB0byBSR0IgdmFsdWVzIGZvciBGaWdtYVxuZnVuY3Rpb24gb2tsY2hUb1JnYihva2xjaFN0cmluZykge1xuICAgIGNvbnN0IG1hdGNoID0gb2tsY2hTdHJpbmcubWF0Y2goL29rbGNoXFwoKFtcXGQuXSspXFxzKyhbXFxkLl0rKVxccysoW1xcZC5dKylcXCkvKTtcbiAgICBpZiAoIW1hdGNoKVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICBjb25zdCBbLCBsLCBjLCBoXSA9IG1hdGNoLm1hcChOdW1iZXIpO1xuICAgIC8vIEJldHRlciBPS0xDSCB0byBSR0IgY29udmVyc2lvblxuICAgIC8vIE5vdGU6IFRoaXMgaXMgc3RpbGwgYSBzaW1wbGlmaWVkIHZlcnNpb24uIEZvciBwcm9kdWN0aW9uLCBjb25zaWRlciB1c2luZyBhIHByb3BlciBjb2xvciBsaWJyYXJ5IGxpa2UgY3Vsb3JpXG4gICAgY29uc3QgbGlnaHRuZXNzID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgbCkpO1xuICAgIGNvbnN0IGNocm9tYSA9IE1hdGgubWF4KDAsIGMpO1xuICAgIGNvbnN0IGh1ZVJhZCA9IChoICogTWF0aC5QSSkgLyAxODA7XG4gICAgLy8gQ29udmVydCBMQ0ggdG8gTGFiXG4gICAgY29uc3QgYSA9IGNocm9tYSAqIE1hdGguY29zKGh1ZVJhZCk7XG4gICAgY29uc3QgYiA9IGNocm9tYSAqIE1hdGguc2luKGh1ZVJhZCk7XG4gICAgLy8gU2ltcGxpZmllZCBMYWIgdG8gWFlaIGNvbnZlcnNpb24gKHVzaW5nIEQ2NSBpbGx1bWluYW50IGFwcHJveGltYXRpb24pXG4gICAgY29uc3QgZnkgPSAobGlnaHRuZXNzICsgMTYpIC8gMTE2O1xuICAgIGNvbnN0IGZ4ID0gYSAvIDUwMCArIGZ5O1xuICAgIGNvbnN0IGZ6ID0gZnkgLSBiIC8gMjAwO1xuICAgIGNvbnN0IHh5el90b19yZ2IgPSAodCkgPT4ge1xuICAgICAgICByZXR1cm4gdCA+IDAuMjA2ODkzMDM0ID8gdCAqIHQgKiB0IDogKHQgLSAxNiAvIDExNikgLyA3Ljc4NztcbiAgICB9O1xuICAgIGxldCB4ID0geHl6X3RvX3JnYihmeCkgKiAwLjk1MDQ3O1xuICAgIGxldCB5ID0geHl6X3RvX3JnYihmeSk7XG4gICAgbGV0IHogPSB4eXpfdG9fcmdiKGZ6KSAqIDEuMDg4ODM7XG4gICAgLy8gWFlaIHRvIHNSR0IgY29udmVyc2lvbiBtYXRyaXhcbiAgICBsZXQgciA9IHggKiAzLjI0MDYgKyB5ICogLTEuNTM3MiArIHogKiAtMC40OTg2O1xuICAgIGxldCBnID0geCAqIC0wLjk2ODkgKyB5ICogMS44NzU4ICsgeiAqIDAuMDQxNTtcbiAgICBsZXQgYl92YWwgPSB4ICogMC4wNTU3ICsgeSAqIC0wLjIwNDAgKyB6ICogMS4wNTcwO1xuICAgIC8vIEdhbW1hIGNvcnJlY3Rpb25cbiAgICBjb25zdCBnYW1tYV9jb3JyZWN0ID0gKGMpID0+IHtcbiAgICAgICAgcmV0dXJuIGMgPiAwLjAwMzEzMDggPyAxLjA1NSAqIE1hdGgucG93KGMsIDEgLyAyLjQpIC0gMC4wNTUgOiAxMi45MiAqIGM7XG4gICAgfTtcbiAgICByID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgZ2FtbWFfY29ycmVjdChyKSkpO1xuICAgIGcgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBnYW1tYV9jb3JyZWN0KGcpKSk7XG4gICAgYl92YWwgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBnYW1tYV9jb3JyZWN0KGJfdmFsKSkpO1xuICAgIHJldHVybiB7IHIsIGcsIGI6IGJfdmFsIH07XG59XG4vLyBDb252ZXJ0IGhleCB0byBSR0JcbmZ1bmN0aW9uIGhleFRvUmdiKGhleCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IC9eIz8oW2EtZlxcZF17Mn0pKFthLWZcXGRdezJ9KShbYS1mXFxkXXsyfSkkL2kuZXhlYyhoZXgpO1xuICAgIHJldHVybiByZXN1bHQgPyB7XG4gICAgICAgIHI6IHBhcnNlSW50KHJlc3VsdFsxXSwgMTYpIC8gMjU1LFxuICAgICAgICBnOiBwYXJzZUludChyZXN1bHRbMl0sIDE2KSAvIDI1NSxcbiAgICAgICAgYjogcGFyc2VJbnQocmVzdWx0WzNdLCAxNikgLyAyNTVcbiAgICB9IDogbnVsbDtcbn1cbi8vIENvbnZlcnQgSFNMIHRvIFJHQiAtIEVuaGFuY2VkIHRvIHN1cHBvcnQgZGVjaW1hbCB2YWx1ZXMgYW5kIHBlcmNlbnRhZ2VzXG5mdW5jdGlvbiBoc2xUb1JnYihoc2xTdHJpbmcpIHtcbiAgICAvLyBTdXBwb3J0IGJvdGggaW50ZWdlciBhbmQgZGVjaW1hbCB2YWx1ZXMsIHdpdGggb3Igd2l0aG91dCBwZXJjZW50YWdlc1xuICAgIGNvbnN0IG1hdGNoID0gaHNsU3RyaW5nLm1hdGNoKC9oc2xhP1xcKChbKy1dP1tcXGQuXSspKD86ZGVnKT8sP1xccyooWystXT9bXFxkLl0rKSU/LD9cXHMqKFsrLV0/W1xcZC5dKyklPyg/Oiw/XFxzKihbKy1dP1tcXGQuXSspKT9cXCkvaSk7XG4gICAgaWYgKCFtYXRjaClcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgbGV0IGggPSBwYXJzZUZsb2F0KG1hdGNoWzFdKTtcbiAgICBsZXQgcyA9IHBhcnNlRmxvYXQobWF0Y2hbMl0pO1xuICAgIGxldCBsID0gcGFyc2VGbG9hdChtYXRjaFszXSk7XG4gICAgLy8gTm9ybWFsaXplIGh1ZSB0byAwLTEgcmFuZ2VcbiAgICBoID0gKChoICUgMzYwKSArIDM2MCkgJSAzNjAgLyAzNjA7XG4gICAgLy8gTm9ybWFsaXplIHNhdHVyYXRpb24gYW5kIGxpZ2h0bmVzc1xuICAgIC8vIElmIHZhbHVlcyBhcmUgPiAxLCBhc3N1bWUgdGhleSdyZSBwZXJjZW50YWdlc1xuICAgIGlmIChzID4gMSlcbiAgICAgICAgcyA9IHMgLyAxMDA7XG4gICAgaWYgKGwgPiAxKVxuICAgICAgICBsID0gbCAvIDEwMDtcbiAgICAvLyBDbGFtcCB2YWx1ZXNcbiAgICBzID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgcykpO1xuICAgIGwgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBsKSk7XG4gICAgY29uc3QgaHVlMnJnYiA9IChwLCBxLCB0KSA9PiB7XG4gICAgICAgIGlmICh0IDwgMClcbiAgICAgICAgICAgIHQgKz0gMTtcbiAgICAgICAgaWYgKHQgPiAxKVxuICAgICAgICAgICAgdCAtPSAxO1xuICAgICAgICBpZiAodCA8IDEgLyA2KVxuICAgICAgICAgICAgcmV0dXJuIHAgKyAocSAtIHApICogNiAqIHQ7XG4gICAgICAgIGlmICh0IDwgMSAvIDIpXG4gICAgICAgICAgICByZXR1cm4gcTtcbiAgICAgICAgaWYgKHQgPCAyIC8gMylcbiAgICAgICAgICAgIHJldHVybiBwICsgKHEgLSBwKSAqICgyIC8gMyAtIHQpICogNjtcbiAgICAgICAgcmV0dXJuIHA7XG4gICAgfTtcbiAgICBjb25zdCBxID0gbCA8IDAuNSA/IGwgKiAoMSArIHMpIDogbCArIHMgLSBsICogcztcbiAgICBjb25zdCBwID0gMiAqIGwgLSBxO1xuICAgIHJldHVybiB7XG4gICAgICAgIHI6IGh1ZTJyZ2IocCwgcSwgaCArIDEgLyAzKSxcbiAgICAgICAgZzogaHVlMnJnYihwLCBxLCBoKSxcbiAgICAgICAgYjogaHVlMnJnYihwLCBxLCBoIC0gMSAvIDMpXG4gICAgfTtcbn1cbi8vIENvbnZlcnQgSFNCL0hTViB0byBSR0IgLSBOZXcgZnVuY3Rpb24gZm9yIEhTQiBzdXBwb3J0XG5mdW5jdGlvbiBoc2JUb1JnYihoc2JTdHJpbmcpIHtcbiAgICAvLyBTdXBwb3J0IGhzYigpLCBoc3YoKSwgYW5kIGhzYmEoKS9oc3ZhKCkgZm9ybWF0c1xuICAgIGNvbnN0IG1hdGNoID0gaHNiU3RyaW5nLm1hdGNoKC9oc2JbYXZdP1xcKChbKy1dP1tcXGQuXSspKD86ZGVnKT8sP1xccyooWystXT9bXFxkLl0rKSU/LD9cXHMqKFsrLV0/W1xcZC5dKyklPyg/Oiw/XFxzKihbKy1dP1tcXGQuXSspKT9cXCkvaSk7XG4gICAgaWYgKCFtYXRjaClcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgbGV0IGggPSBwYXJzZUZsb2F0KG1hdGNoWzFdKTtcbiAgICBsZXQgcyA9IHBhcnNlRmxvYXQobWF0Y2hbMl0pO1xuICAgIGxldCBiID0gcGFyc2VGbG9hdChtYXRjaFszXSk7XG4gICAgLy8gTm9ybWFsaXplIGh1ZSB0byAwLTEgcmFuZ2VcbiAgICBoID0gKChoICUgMzYwKSArIDM2MCkgJSAzNjAgLyAzNjA7XG4gICAgLy8gTm9ybWFsaXplIHNhdHVyYXRpb24gYW5kIGJyaWdodG5lc3NcbiAgICAvLyBJZiB2YWx1ZXMgYXJlID4gMSwgYXNzdW1lIHRoZXkncmUgcGVyY2VudGFnZXNcbiAgICBpZiAocyA+IDEpXG4gICAgICAgIHMgPSBzIC8gMTAwO1xuICAgIGlmIChiID4gMSlcbiAgICAgICAgYiA9IGIgLyAxMDA7XG4gICAgLy8gQ2xhbXAgdmFsdWVzXG4gICAgcyA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEsIHMpKTtcbiAgICBiID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgYikpO1xuICAgIGNvbnN0IGMgPSBiICogcztcbiAgICBjb25zdCB4ID0gYyAqICgxIC0gTWF0aC5hYnMoKGggKiA2KSAlIDIgLSAxKSk7XG4gICAgY29uc3QgbSA9IGIgLSBjO1xuICAgIGxldCByID0gMCwgZyA9IDAsIGJfdmFsID0gMDtcbiAgICBjb25zdCBoU2VjdG9yID0gaCAqIDY7XG4gICAgaWYgKGhTZWN0b3IgPj0gMCAmJiBoU2VjdG9yIDwgMSkge1xuICAgICAgICByID0gYztcbiAgICAgICAgZyA9IHg7XG4gICAgICAgIGJfdmFsID0gMDtcbiAgICB9XG4gICAgZWxzZSBpZiAoaFNlY3RvciA+PSAxICYmIGhTZWN0b3IgPCAyKSB7XG4gICAgICAgIHIgPSB4O1xuICAgICAgICBnID0gYztcbiAgICAgICAgYl92YWwgPSAwO1xuICAgIH1cbiAgICBlbHNlIGlmIChoU2VjdG9yID49IDIgJiYgaFNlY3RvciA8IDMpIHtcbiAgICAgICAgciA9IDA7XG4gICAgICAgIGcgPSBjO1xuICAgICAgICBiX3ZhbCA9IHg7XG4gICAgfVxuICAgIGVsc2UgaWYgKGhTZWN0b3IgPj0gMyAmJiBoU2VjdG9yIDwgNCkge1xuICAgICAgICByID0gMDtcbiAgICAgICAgZyA9IHg7XG4gICAgICAgIGJfdmFsID0gYztcbiAgICB9XG4gICAgZWxzZSBpZiAoaFNlY3RvciA+PSA0ICYmIGhTZWN0b3IgPCA1KSB7XG4gICAgICAgIHIgPSB4O1xuICAgICAgICBnID0gMDtcbiAgICAgICAgYl92YWwgPSBjO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgciA9IGM7XG4gICAgICAgIGcgPSAwO1xuICAgICAgICBiX3ZhbCA9IHg7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHI6IHIgKyBtLFxuICAgICAgICBnOiBnICsgbSxcbiAgICAgICAgYjogYl92YWwgKyBtXG4gICAgfTtcbn1cbi8vIEVuaGFuY2VkIFJHQiBwYXJzaW5nIHRvIHN1cHBvcnQgZGVjaW1hbHMsIHBlcmNlbnRhZ2VzLCBhbmQgcmdiYVxuZnVuY3Rpb24gcmdiVG9SZ2IocmdiU3RyaW5nKSB7XG4gICAgLy8gU3VwcG9ydCByZ2IoKSwgcmdiYSgpLCBhbmQgdmFyaW91cyBmb3JtYXRzIGluY2x1ZGluZyBkZWNpbWFscyBhbmQgcGVyY2VudGFnZXNcbiAgICBjb25zdCBtYXRjaCA9IHJnYlN0cmluZy5tYXRjaCgvcmdiYT9cXCgoWystXT9bXFxkLl0rKSU/LD9cXHMqKFsrLV0/W1xcZC5dKyklPyw/XFxzKihbKy1dP1tcXGQuXSspJT8oPzosP1xccyooWystXT9bXFxkLl0rKSk/XFwpL2kpO1xuICAgIGlmICghbWF0Y2gpXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIGxldCByID0gcGFyc2VGbG9hdChtYXRjaFsxXSk7XG4gICAgbGV0IGcgPSBwYXJzZUZsb2F0KG1hdGNoWzJdKTtcbiAgICBsZXQgYiA9IHBhcnNlRmxvYXQobWF0Y2hbM10pO1xuICAgIC8vIENoZWNrIGlmIHZhbHVlcyBhcmUgcGVyY2VudGFnZXMgYnkgbG9va2luZyBmb3IgJSBpbiB0aGUgb3JpZ2luYWwgc3RyaW5nXG4gICAgY29uc3QgaXNQZXJjZW50YWdlID0gcmdiU3RyaW5nLmluY2x1ZGVzKCclJyk7XG4gICAgaWYgKGlzUGVyY2VudGFnZSkge1xuICAgICAgICAvLyBJZiBwZXJjZW50YWdlcywgbm9ybWFsaXplIHRvIDAtMVxuICAgICAgICByID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMTAwLCByKSkgLyAxMDA7XG4gICAgICAgIGcgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxMDAsIGcpKSAvIDEwMDtcbiAgICAgICAgYiA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEwMCwgYikpIC8gMTAwO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgLy8gSWYgbm90IHBlcmNlbnRhZ2VzLCBhc3N1bWUgMC0yNTUgcmFuZ2UgaWYgPiAxLCBvdGhlcndpc2UgMC0xXG4gICAgICAgIGlmIChyID4gMSB8fCBnID4gMSB8fCBiID4gMSkge1xuICAgICAgICAgICAgciA9IE1hdGgubWF4KDAsIE1hdGgubWluKDI1NSwgcikpIC8gMjU1O1xuICAgICAgICAgICAgZyA9IE1hdGgubWF4KDAsIE1hdGgubWluKDI1NSwgZykpIC8gMjU1O1xuICAgICAgICAgICAgYiA9IE1hdGgubWF4KDAsIE1hdGgubWluKDI1NSwgYikpIC8gMjU1O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgciA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEsIHIpKTtcbiAgICAgICAgICAgIGcgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBnKSk7XG4gICAgICAgICAgICBiID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgYikpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7IHIsIGcsIGIgfTtcbn1cbi8vIENvbnZlcnQgU2hhZENOIHJhdyBIU0wgZm9ybWF0IHRvIFJHQiAoZS5nLiwgXCIwIDAlIDEwMCVcIiAtPiBSR0IpXG5mdW5jdGlvbiBzaGFkY25Ic2xUb1JnYihzaGFkY25Ic2xTdHJpbmcpIHtcbiAgICAvLyBQYXJzZSBTaGFkQ04gZm9ybWF0OiBcImggcyUgbCVcIiAod2l0aG91dCBoc2woKSB3cmFwcGVyKVxuICAgIGNvbnN0IG1hdGNoID0gc2hhZGNuSHNsU3RyaW5nLnRyaW0oKS5tYXRjaCgvXihbKy1dP1tcXGQuXSspXFxzKyhbKy1dP1tcXGQuXSspJVxccysoWystXT9bXFxkLl0rKSUkLyk7XG4gICAgaWYgKCFtYXRjaClcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgbGV0IGggPSBwYXJzZUZsb2F0KG1hdGNoWzFdKTtcbiAgICBsZXQgcyA9IHBhcnNlRmxvYXQobWF0Y2hbMl0pO1xuICAgIGxldCBsID0gcGFyc2VGbG9hdChtYXRjaFszXSk7XG4gICAgLy8gTm9ybWFsaXplIGh1ZSB0byAwLTEgcmFuZ2VcbiAgICBoID0gKChoICUgMzYwKSArIDM2MCkgJSAzNjAgLyAzNjA7XG4gICAgLy8gTm9ybWFsaXplIHNhdHVyYXRpb24gYW5kIGxpZ2h0bmVzcyAoYWxyZWFkeSBpbiBwZXJjZW50YWdlIGZvcm1hdClcbiAgICBzID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMTAwLCBzKSkgLyAxMDA7XG4gICAgbCA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEwMCwgbCkpIC8gMTAwO1xuICAgIGNvbnN0IGh1ZTJyZ2IgPSAocCwgcSwgdCkgPT4ge1xuICAgICAgICBpZiAodCA8IDApXG4gICAgICAgICAgICB0ICs9IDE7XG4gICAgICAgIGlmICh0ID4gMSlcbiAgICAgICAgICAgIHQgLT0gMTtcbiAgICAgICAgaWYgKHQgPCAxIC8gNilcbiAgICAgICAgICAgIHJldHVybiBwICsgKHEgLSBwKSAqIDYgKiB0O1xuICAgICAgICBpZiAodCA8IDEgLyAyKVxuICAgICAgICAgICAgcmV0dXJuIHE7XG4gICAgICAgIGlmICh0IDwgMiAvIDMpXG4gICAgICAgICAgICByZXR1cm4gcCArIChxIC0gcCkgKiAoMiAvIDMgLSB0KSAqIDY7XG4gICAgICAgIHJldHVybiBwO1xuICAgIH07XG4gICAgY29uc3QgcSA9IGwgPCAwLjUgPyBsICogKDEgKyBzKSA6IGwgKyBzIC0gbCAqIHM7XG4gICAgY29uc3QgcCA9IDIgKiBsIC0gcTtcbiAgICByZXR1cm4ge1xuICAgICAgICByOiBodWUycmdiKHAsIHEsIGggKyAxIC8gMyksXG4gICAgICAgIGc6IGh1ZTJyZ2IocCwgcSwgaCksXG4gICAgICAgIGI6IGh1ZTJyZ2IocCwgcSwgaCAtIDEgLyAzKVxuICAgIH07XG59XG4vLyBQYXJzZSBjb2xvciB2YWx1ZSB0byBSR0IgLSBFbmhhbmNlZCB3aXRoIGNvbXByZWhlbnNpdmUgZm9ybWF0IHN1cHBvcnRcbmZ1bmN0aW9uIHBhcnNlQ29sb3JUb1JnYihjb2xvclZhbHVlKSB7XG4gICAgY29uc3QgY2xlYW5WYWx1ZSA9IGNvbG9yVmFsdWUudHJpbSgpO1xuICAgIC8vIENoZWNrIGZvciBTaGFkQ04gcmF3IEhTTCBmb3JtYXQgZmlyc3QgKGUuZy4sIFwiMCAwJSAxMDAlXCIpXG4gICAgY29uc3Qgc2hhZGNuSHNsTWF0Y2ggPSBjbGVhblZhbHVlLm1hdGNoKC9eKFsrLV0/W1xcZC5dKylcXHMrKFsrLV0/W1xcZC5dKyklXFxzKyhbKy1dP1tcXGQuXSspJSQvKTtcbiAgICBpZiAoc2hhZGNuSHNsTWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIHNoYWRjbkhzbFRvUmdiKGNsZWFuVmFsdWUpO1xuICAgIH1cbiAgICBpZiAoY2xlYW5WYWx1ZS5pbmNsdWRlcygnb2tsY2gnKSkge1xuICAgICAgICByZXR1cm4gb2tsY2hUb1JnYihjbGVhblZhbHVlKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoY2xlYW5WYWx1ZS5zdGFydHNXaXRoKCcjJykpIHtcbiAgICAgICAgcmV0dXJuIGhleFRvUmdiKGNsZWFuVmFsdWUpO1xuICAgIH1cbiAgICBlbHNlIGlmIChjbGVhblZhbHVlLmluY2x1ZGVzKCdoc2wnKSkge1xuICAgICAgICByZXR1cm4gaHNsVG9SZ2IoY2xlYW5WYWx1ZSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGNsZWFuVmFsdWUuaW5jbHVkZXMoJ2hzYicpIHx8IGNsZWFuVmFsdWUuaW5jbHVkZXMoJ2hzdicpKSB7XG4gICAgICAgIHJldHVybiBoc2JUb1JnYihjbGVhblZhbHVlKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoY2xlYW5WYWx1ZS5pbmNsdWRlcygncmdiJykpIHtcbiAgICAgICAgcmV0dXJuIHJnYlRvUmdiKGNsZWFuVmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cbi8vIERlYnVnIGxvZ2dlciB1dGlsaXR5IGZvciBkZXZlbG9wbWVudFxuY29uc3QgbG9nZ2VyID0ge1xuICAgIGxvZzogKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKC4uLmFyZ3MpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICB3YXJuOiAoLi4uYXJncykgPT4ge1xuICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKC4uLmFyZ3MpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBlcnJvcjogKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgLy8gQWx3YXlzIGxvZyBlcnJvcnNcbiAgICAgICAgY29uc29sZS5lcnJvciguLi5hcmdzKTtcbiAgICB9XG59O1xuLy8gRnVuY3Rpb24gdG8gZmluZCBleGlzdGluZyBzaGFkY24tY29tcGF0aWJsZSB2YXJpYWJsZSBjb2xsZWN0aW9uICh1cGRhdGVkIGZvciBTaGFkQ04gcGF0dGVybnMpXG5hc3luYyBmdW5jdGlvbiBmaW5kRXhpc3RpbmdTaGFkY25Db2xsZWN0aW9uKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb25zID0gYXdhaXQgZmlnbWEudmFyaWFibGVzLmdldExvY2FsVmFyaWFibGVDb2xsZWN0aW9uc0FzeW5jKCk7XG4gICAgICAgIGNvbnN0IHZhcmlhYmxlcyA9IGF3YWl0IGZpZ21hLnZhcmlhYmxlcy5nZXRMb2NhbFZhcmlhYmxlc0FzeW5jKCk7XG4gICAgICAgIGxvZ2dlci5sb2coJ0F2YWlsYWJsZSBjb2xsZWN0aW9uczonLCBjb2xsZWN0aW9ucy5tYXAoKGMpID0+ICh7IG5hbWU6IGMubmFtZSwgaWQ6IGMuaWQsIG1vZGVzOiBjLm1vZGVzLmxlbmd0aCB9KSkpO1xuICAgICAgICAvLyBMb29rIGZvciBTaGFkQ04gY29sbGVjdGlvbnMgaW4gb3JkZXIgb2YgcHJlZmVyZW5jZVxuICAgICAgICBjb25zdCBzaGFkY25Db2xsZWN0aW9uTmFtZXMgPSBbJzIuIFRoZW1lcycsICczLiBNb2RlJywgJ1RoZW1lcycsICdDb2xvcnMnLCAnRGVzaWduIFRva2VucyddO1xuICAgICAgICBmb3IgKGNvbnN0IGNvbGxlY3Rpb25OYW1lIG9mIHNoYWRjbkNvbGxlY3Rpb25OYW1lcykge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0Q29sbGVjdGlvbiA9IGNvbGxlY3Rpb25zLmZpbmQoKGNvbGxlY3Rpb24pID0+IGNvbGxlY3Rpb24ubmFtZSA9PT0gY29sbGVjdGlvbk5hbWUpO1xuICAgICAgICAgICAgaWYgKHRhcmdldENvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uVmFyaWFibGVzID0gdmFyaWFibGVzLmZpbHRlcigodikgPT4gdi52YXJpYWJsZUNvbGxlY3Rpb25JZCA9PT0gdGFyZ2V0Q29sbGVjdGlvbi5pZCk7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmxvZyhgRm91bmQgXCIke2NvbGxlY3Rpb25OYW1lfVwiIGNvbGxlY3Rpb24gd2l0aCAke2NvbGxlY3Rpb25WYXJpYWJsZXMubGVuZ3RofSB2YXJpYWJsZXNgKTtcbiAgICAgICAgICAgICAgICBsb2dnZXIubG9nKCdWYXJpYWJsZSBuYW1lcyBzYW1wbGU6JywgY29sbGVjdGlvblZhcmlhYmxlcy5zbGljZSgwLCA1KS5tYXAoKHYpID0+IHYubmFtZSkpO1xuICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIGl0IGhhcyB2YXJpYWJsZXMgd2l0aCBTaGFkQ04gbmFtaW5nIHBhdHRlcm5zXG4gICAgICAgICAgICAgICAgY29uc3Qgc2hhZGNuUGF0dGVybnMgPSBbJ2JhY2tncm91bmQnLCAnZm9yZWdyb3VuZCcsICdwcmltYXJ5JywgJ3NlY29uZGFyeScsICdtdXRlZCcsICdhY2NlbnQnLCAnZGVzdHJ1Y3RpdmUnLCAnYm9yZGVyJywgJ2lucHV0JywgJ3JpbmcnLCAnY2FyZCcsICdwb3BvdmVyJ107XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIHZhcmlhYmxlcyBpbiBcImJhc2UvXCIgb3IgXCJjb2xvci9cIiBncm91cHNcbiAgICAgICAgICAgICAgICBjb25zdCBiYXNlR3JvdXBWYXJpYWJsZXMgPSBjb2xsZWN0aW9uVmFyaWFibGVzLmZpbHRlcigodmFyaWFibGUpID0+IHZhcmlhYmxlLm5hbWUudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdiYXNlLycpIHx8XG4gICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlLm5hbWUudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdjb2xvci8nKSk7XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgaXQgaGFzIFNoYWRDTiB2YXJpYWJsZXMgKHdpdGggb3Igd2l0aG91dCBwcmVmaXhlcylcbiAgICAgICAgICAgICAgICBjb25zdCBoYXNTaGFkY25WYXJpYWJsZXMgPSBjb2xsZWN0aW9uVmFyaWFibGVzLnNvbWUoKHZhcmlhYmxlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSB2YXJpYWJsZS5uYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzaGFkY25QYXR0ZXJucy5zb21lKHBhdHRlcm4gPT4gbmFtZS5pbmNsdWRlcyhwYXR0ZXJuKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmxvZyhgQmFzZS9jb2xvciBncm91cCB2YXJpYWJsZXM6ICR7YmFzZUdyb3VwVmFyaWFibGVzLmxlbmd0aH0sIGhhcyBzaGFkY24gcGF0dGVybnM6ICR7aGFzU2hhZGNuVmFyaWFibGVzfWApO1xuICAgICAgICAgICAgICAgIC8vIE1vcmUgbGVuaWVudCBjcml0ZXJpYSBmb3IgU2hhZENOIGNvbGxlY3Rpb25zXG4gICAgICAgICAgICAgICAgaWYgKGhhc1NoYWRjblZhcmlhYmxlcyAmJiBjb2xsZWN0aW9uVmFyaWFibGVzLmxlbmd0aCA+PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci5sb2coYFVzaW5nIFwiJHtjb2xsZWN0aW9uTmFtZX1cIiBjb2xsZWN0aW9uIGFzIHRhcmdldGApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbjogdGFyZ2V0Q29sbGVjdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlczogY29sbGVjdGlvblZhcmlhYmxlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhc0xpZ2h0RGFya01vZGVzOiB0YXJnZXRDb2xsZWN0aW9uLm1vZGVzLmxlbmd0aCA+IDFcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gRmFsbGJhY2s6IGxvb2sgZm9yIGFueSBjb2xsZWN0aW9uIHdpdGggYSByZWFzb25hYmxlIG51bWJlciBvZiBjb2xvciB2YXJpYWJsZXNcbiAgICAgICAgZm9yIChjb25zdCBjb2xsZWN0aW9uIG9mIGNvbGxlY3Rpb25zKSB7XG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uVmFyaWFibGVzID0gdmFyaWFibGVzLmZpbHRlcigodikgPT4gdi52YXJpYWJsZUNvbGxlY3Rpb25JZCA9PT0gY29sbGVjdGlvbi5pZCk7XG4gICAgICAgICAgICAvLyBDb3VudCBjb2xvciB2YXJpYWJsZXNcbiAgICAgICAgICAgIGNvbnN0IGNvbG9yVmFyaWFibGVzID0gY29sbGVjdGlvblZhcmlhYmxlcy5maWx0ZXIoKHZhcmlhYmxlKSA9PiB2YXJpYWJsZS5yZXNvbHZlZFR5cGUgPT09ICdDT0xPUicpO1xuICAgICAgICAgICAgLy8gTG9vayBmb3IgY29sbGVjdGlvbnMgd2l0aCBzaWduaWZpY2FudCBjb2xvciB2YXJpYWJsZXNcbiAgICAgICAgICAgIGlmIChjb2xvclZhcmlhYmxlcy5sZW5ndGggPj0gMTApIHsgLy8gTG93ZXJlZCB0aHJlc2hvbGQgZm9yIFNoYWRDTiBjb21wYXRpYmlsaXR5XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmxvZyhgVXNpbmcgZmFsbGJhY2sgY29sbGVjdGlvbjogXCIke2NvbGxlY3Rpb24ubmFtZX1cIiB3aXRoICR7Y29sb3JWYXJpYWJsZXMubGVuZ3RofSBjb2xvciB2YXJpYWJsZXNgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uLFxuICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IGNvbGxlY3Rpb25WYXJpYWJsZXMsXG4gICAgICAgICAgICAgICAgICAgIGhhc0xpZ2h0RGFya01vZGVzOiBjb2xsZWN0aW9uLm1vZGVzLmxlbmd0aCA+IDFcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxvZ2dlci5sb2coJ05vIGV4aXN0aW5nIFNoYWRDTi1jb21wYXRpYmxlIGNvbGxlY3Rpb24gZm91bmQnKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIGZpbmRpbmcgZXhpc3RpbmcgU2hhZENOIGNvbGxlY3Rpb246JywgZXJyb3IpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5hc3luYyBmdW5jdGlvbiBjcmVhdGVGaWdtYVZhcmlhYmxlcyh0b2tlbnMpIHtcbiAgICB0cnkge1xuICAgICAgICAvLyBGaXJzdCwgY2hlY2sgaWYgdGhlcmUncyBhbiBleGlzdGluZyBzaGFkY24tY29tcGF0aWJsZSBjb2xsZWN0aW9uXG4gICAgICAgIGNvbnN0IGV4aXN0aW5nU2V0dXAgPSBhd2FpdCBmaW5kRXhpc3RpbmdTaGFkY25Db2xsZWN0aW9uKCk7XG4gICAgICAgIGxldCBjb2xsZWN0aW9uO1xuICAgICAgICBsZXQgbGlnaHRNb2RlSWQ7XG4gICAgICAgIGxldCBkYXJrTW9kZUlkO1xuICAgICAgICBpZiAoZXhpc3RpbmdTZXR1cCkge1xuICAgICAgICAgICAgLy8gVXNlIGV4aXN0aW5nIGNvbGxlY3Rpb24gYW5kIGV4dGVuZCBpdFxuICAgICAgICAgICAgY29sbGVjdGlvbiA9IGV4aXN0aW5nU2V0dXAuY29sbGVjdGlvbjtcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoaXMgaXMgdGhlIHNwZWNpZmljIFwiMy4gTW9kZVwiIGNvbGxlY3Rpb25cbiAgICAgICAgICAgIGNvbnN0IGlzVGhlbWVNb2RlQ29sbGVjdGlvbiA9IGNvbGxlY3Rpb24ubmFtZSA9PT0gJzMuIE1vZGUnO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0V4aXN0aW5nIG1vZGVzOicsIGNvbGxlY3Rpb24ubW9kZXMubWFwKChtKSA9PiBtLm5hbWUpKTtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBuZXcgY3VzdG9tIG1vZGVzIGFsb25nc2lkZSBleGlzdGluZyBvbmVzIChkb24ndCBvdmVyd3JpdGUpXG4gICAgICAgICAgICBsaWdodE1vZGVJZCA9IGNvbGxlY3Rpb24uYWRkTW9kZSgnbGlnaHQgY3VzdG9tJyk7XG4gICAgICAgICAgICBkYXJrTW9kZUlkID0gY29sbGVjdGlvbi5hZGRNb2RlKCdkYXJrIGN1c3RvbScpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYENyZWF0ZWQgbmV3IG1vZGVzOiBcImxpZ2h0IGN1c3RvbVwiIGFuZCBcImRhcmsgY3VzdG9tXCJgKTtcbiAgICAgICAgICAgIGlmIChpc1RoZW1lTW9kZUNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBmaWdtYS5ub3RpZnkoYEFkZGluZyBjdXN0b20gdGhlbWUgbW9kZXMgdG8gXCIke2NvbGxlY3Rpb24ubmFtZX1cIiDihpIgYmFzZSBncm91cGApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZmlnbWEubm90aWZ5KGBBZGRpbmcgY3VzdG9tIG1vZGVzIHRvIGV4aXN0aW5nIGNvbGxlY3Rpb246IFwiJHtjb2xsZWN0aW9uLm5hbWV9XCJgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBhIG5ldyB2YXJpYWJsZSBjb2xsZWN0aW9uIGZvciBkZXNpZ24gdG9rZW5zXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnTm8gZXhpc3RpbmcgY29sbGVjdGlvbiBmb3VuZCwgY3JlYXRpbmcgbmV3IFwiRGVzaWduIFRva2Vuc1wiIGNvbGxlY3Rpb24nKTtcbiAgICAgICAgICAgIGNvbGxlY3Rpb24gPSBmaWdtYS52YXJpYWJsZXMuY3JlYXRlVmFyaWFibGVDb2xsZWN0aW9uKCdEZXNpZ24gVG9rZW5zJyk7XG4gICAgICAgICAgICAvLyBTZXQgdXAgbW9kZXMgLSBmaXJzdCBtb2RlIGlzIGxpZ2h0LCBhZGQgZGFyayBtb2RlXG4gICAgICAgICAgICBsaWdodE1vZGVJZCA9IGNvbGxlY3Rpb24ubW9kZXNbMF0ubW9kZUlkO1xuICAgICAgICAgICAgY29sbGVjdGlvbi5yZW5hbWVNb2RlKGxpZ2h0TW9kZUlkLCAnTGlnaHQnKTtcbiAgICAgICAgICAgIGRhcmtNb2RlSWQgPSBjb2xsZWN0aW9uLmFkZE1vZGUoJ0RhcmsnKTtcbiAgICAgICAgICAgIGZpZ21hLm5vdGlmeSgnQ3JlYXRpbmcgbmV3IFwiRGVzaWduIFRva2Vuc1wiIGNvbGxlY3Rpb24gd2l0aCBMaWdodC9EYXJrIG1vZGVzJyk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGNyZWF0ZWRDb3VudCA9IDA7XG4gICAgICAgIC8vIEhlbHBlciBmdW5jdGlvbiB0byBjcmVhdGUgb3IgdXBkYXRlIGEgdmFyaWFibGUgd2l0aCBib3RoIGxpZ2h0IGFuZCBkYXJrIG1vZGUgdmFsdWVzXG4gICAgICAgIGNvbnN0IGNyZWF0ZU9yVXBkYXRlVmFyaWFibGVXaXRoTW9kZXMgPSBhc3luYyAobGlnaHRUb2tlbiwgZGFya1Rva2VuLCBjb2xsZWN0aW9uLCBsaWdodE1vZGVJZCwgZGFya01vZGVJZCwgZXhpc3RpbmdWYXJpYWJsZXMpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgbGV0IHZhcmlhYmxlVHlwZTtcbiAgICAgICAgICAgICAgICBsZXQgbGlnaHRWYWx1ZTtcbiAgICAgICAgICAgICAgICBsZXQgZGFya1ZhbHVlO1xuICAgICAgICAgICAgICAgIHN3aXRjaCAobGlnaHRUb2tlbi50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NvbG9yJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlVHlwZSA9ICdDT0xPUic7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsaWdodFJnYiA9IHBhcnNlQ29sb3JUb1JnYihsaWdodFRva2VuLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbGlnaHRSZ2IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYENvdWxkIG5vdCBwYXJzZSBsaWdodCBjb2xvcjogJHtsaWdodFRva2VuLnZhbHVlfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxpZ2h0VmFsdWUgPSBsaWdodFJnYjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXJrVG9rZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXJrUmdiID0gcGFyc2VDb2xvclRvUmdiKGRhcmtUb2tlbi52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGFya1ZhbHVlID0gZGFya1JnYiB8fCBsaWdodFJnYjsgLy8gRmFsbGJhY2sgdG8gbGlnaHQgaWYgZGFyayBmYWlsc1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGFya1ZhbHVlID0gbGlnaHRSZ2I7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAncmFkaXVzJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlVHlwZSA9ICdGTE9BVCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBFeHRyYWN0IG51bWVyaWMgdmFsdWUgZnJvbSByZW0sIHB4LCBldGMuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsaWdodE51bU1hdGNoID0gbGlnaHRUb2tlbi52YWx1ZS5tYXRjaCgvKFtcXGQuXSspLyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGlnaHROdW1NYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpZ2h0VmFsdWUgPSBwYXJzZUZsb2F0KGxpZ2h0TnVtTWF0Y2hbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENvbnZlcnQgcmVtIHRvIHB4IChhc3N1bWluZyAxNnB4ID0gMXJlbSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobGlnaHRUb2tlbi52YWx1ZS5pbmNsdWRlcygncmVtJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlnaHRWYWx1ZSAqPSAxNjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYENvdWxkIG5vdCBwYXJzZSByYWRpdXM6ICR7bGlnaHRUb2tlbi52YWx1ZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGFya1Rva2VuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGFya051bU1hdGNoID0gZGFya1Rva2VuLnZhbHVlLm1hdGNoKC8oW1xcZC5dKykvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGFya051bU1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhcmtWYWx1ZSA9IHBhcnNlRmxvYXQoZGFya051bU1hdGNoWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhcmtUb2tlbi52YWx1ZS5pbmNsdWRlcygncmVtJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhcmtWYWx1ZSAqPSAxNjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGFya1ZhbHVlID0gbGlnaHRWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXJrVmFsdWUgPSBsaWdodFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2ZvbnQnOlxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyaWFibGVUeXBlID0gJ1NUUklORyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaWdodFZhbHVlID0gbGlnaHRUb2tlbi52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhcmtWYWx1ZSA9IGRhcmtUb2tlbiA/IGRhcmtUb2tlbi52YWx1ZSA6IGxpZ2h0VG9rZW4udmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gQWRkIFwiYmFzZS9cIiBwcmVmaXggZm9yIGNvbG9yIHZhcmlhYmxlcyB0byBncm91cCB0aGVtXG4gICAgICAgICAgICAgICAgY29uc3QgdmFyaWFibGVOYW1lID0gbGlnaHRUb2tlbi50eXBlID09PSAnY29sb3InID8gYGJhc2UvJHtsaWdodFRva2VuLm5hbWV9YCA6IGxpZ2h0VG9rZW4ubmFtZTtcbiAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiB2YXJpYWJsZSBhbHJlYWR5IGV4aXN0cyB3aGVuIGV4dGVuZGluZyBleGlzdGluZyBjb2xsZWN0aW9uXG4gICAgICAgICAgICAgICAgbGV0IHZhcmlhYmxlO1xuICAgICAgICAgICAgICAgIGlmIChleGlzdGluZ1ZhcmlhYmxlcykge1xuICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZSA9IGV4aXN0aW5nVmFyaWFibGVzLmZpbmQoKHYpID0+IHYubmFtZSA9PT0gdmFyaWFibGVOYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHZhcmlhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSBleGlzdGluZyB2YXJpYWJsZSB3aXRoIG5ldyBjdXN0b20gbW9kZSB2YWx1ZXMgb25seVxuICAgICAgICAgICAgICAgICAgICAvLyBEb24ndCB0b3VjaCBleGlzdGluZyBtb2RlIHZhbHVlcyAtIG9ubHkgYWRkIHRvIHRoZSBuZXcgY3VzdG9tIG1vZGVzXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZS5zZXRWYWx1ZUZvck1vZGUobGlnaHRNb2RlSWQsIGxpZ2h0VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyaWFibGUuc2V0VmFsdWVGb3JNb2RlKGRhcmtNb2RlSWQsIGRhcmtWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIubG9nKGBVcGRhdGVkIGV4aXN0aW5nIHZhcmlhYmxlIFwiJHt2YXJpYWJsZU5hbWV9XCIgd2l0aCBjdXN0b20gbW9kZSB2YWx1ZXNgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKGBDb3VsZCBub3QgYWRkIGN1c3RvbSBtb2RlcyB0byB2YXJpYWJsZSAke3ZhcmlhYmxlTmFtZX06YCwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUgbmV3IHZhcmlhYmxlIGFuZCBzZXQgdmFsdWVzIG9ubHkgZm9yIGN1c3RvbSBtb2Rlc1xuICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZSA9IGZpZ21hLnZhcmlhYmxlcy5jcmVhdGVWYXJpYWJsZSh2YXJpYWJsZU5hbWUsIGNvbGxlY3Rpb24sIHZhcmlhYmxlVHlwZSk7XG4gICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlLnNldFZhbHVlRm9yTW9kZShsaWdodE1vZGVJZCwgbGlnaHRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlLnNldFZhbHVlRm9yTW9kZShkYXJrTW9kZUlkLCBkYXJrVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIubG9nKGBDcmVhdGVkIG5ldyB2YXJpYWJsZSBcIiR7dmFyaWFibGVOYW1lfVwiIHdpdGggY3VzdG9tIG1vZGUgdmFsdWVzYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNyZWF0ZWRDb3VudCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKGBFcnJvciBjcmVhdGluZyB2YXJpYWJsZSAke2xpZ2h0VG9rZW4ubmFtZX06YCwgZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvLyBEZWZpbmUgY3VzdG9tIG9yZGVyIGZvciBjb2xvciB2YXJpYWJsZXNcbiAgICAgICAgY29uc3QgY29sb3JWYXJpYWJsZU9yZGVyID0gW1xuICAgICAgICAgICAgJ2FjY2VudCcsXG4gICAgICAgICAgICAnYWNjZW50LWZvcmVncm91bmQnLFxuICAgICAgICAgICAgJ2JhY2tncm91bmQnLFxuICAgICAgICAgICAgJ2JvcmRlcicsXG4gICAgICAgICAgICAnY2FyZCcsXG4gICAgICAgICAgICAnY2FyZC1mb3JlZ3JvdW5kJyxcbiAgICAgICAgICAgICdkZXN0cnVjdGl2ZScsXG4gICAgICAgICAgICAnZGVzdHJ1Y3RpdmUtZm9yZWdyb3VuZCcsXG4gICAgICAgICAgICAnZm9yZWdyb3VuZCcsXG4gICAgICAgICAgICAnaW5wdXQnLFxuICAgICAgICAgICAgJ211dGVkJyxcbiAgICAgICAgICAgICdtdXRlZC1mb3JlZ3JvdW5kJyxcbiAgICAgICAgICAgICdwb3BvdmVyJyxcbiAgICAgICAgICAgICdwb3BvdmVyLWZvcmVncm91bmQnLFxuICAgICAgICAgICAgJ3ByaW1hcnknLFxuICAgICAgICAgICAgJ3ByaW1hcnktZm9yZWdyb3VuZCcsXG4gICAgICAgICAgICAncmluZycsXG4gICAgICAgICAgICAncmluZy1vZmZzZXQnLFxuICAgICAgICAgICAgJ3NlY29uZGFyeScsXG4gICAgICAgICAgICAnc2Vjb25kYXJ5LWZvcmVncm91bmQnLFxuICAgICAgICAgICAgJ2NoYXJ0LTEnLFxuICAgICAgICAgICAgJ2NoYXJ0LTInLFxuICAgICAgICAgICAgJ2NoYXJ0LTMnLFxuICAgICAgICAgICAgJ2NoYXJ0LTQnLFxuICAgICAgICAgICAgJ2NoYXJ0LTUnLFxuICAgICAgICAgICAgJ3NpZGViYXItcHJpbWFyeS1mb3JlZ3JvdW5kJyxcbiAgICAgICAgICAgICdzaWRlYmFyLXByaW1hcnknLFxuICAgICAgICAgICAgJ3NpZGViYXItZm9yZWdyb3VuZCcsXG4gICAgICAgICAgICAnc2lkZWJhci1iYWNrZ3JvdW5kJyxcbiAgICAgICAgICAgICdzaWRlYmFyLWFjY2VudCcsXG4gICAgICAgICAgICAnc2lkZWJhci1hY2NlbnQtZm9yZWdyb3VuZCcsXG4gICAgICAgICAgICAnc2lkZWJhci1ib3JkZXInLFxuICAgICAgICAgICAgJ3NpZGViYXItcmluZydcbiAgICAgICAgXTtcbiAgICAgICAgLy8gQ3JlYXRlIHZhcmlhYmxlcyB3aXRoIHZhbHVlcyBmb3IgYm90aCBsaWdodCBhbmQgZGFyayBtb2Rlc1xuICAgICAgICBjb25zdCBhbGxUb2tlbk5hbWVzID0gQXJyYXkuZnJvbShuZXcgU2V0KFtcbiAgICAgICAgICAgIC4uLnRva2Vucy5saWdodC5tYXAodCA9PiB0Lm5hbWUpLFxuICAgICAgICAgICAgLi4udG9rZW5zLmRhcmsubWFwKHQgPT4gdC5uYW1lKSxcbiAgICAgICAgICAgIC4uLnRva2Vucy5nbG9iYWwubWFwKHQgPT4gdC5uYW1lKVxuICAgICAgICBdKSkuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgLy8gQ3VzdG9tIHNvcnRpbmc6IGNvbG9ycyBmb2xsb3cgdGhlIGRlZmluZWQgb3JkZXIsIG90aGVycyBhbHBoYWJldGljYWxseVxuICAgICAgICAgICAgY29uc3QgYUxpZ2h0VG9rZW4gPSB0b2tlbnMubGlnaHQuZmluZCh0ID0+IHQubmFtZSA9PT0gYSk7XG4gICAgICAgICAgICBjb25zdCBhRGFya1Rva2VuID0gdG9rZW5zLmRhcmsuZmluZCh0ID0+IHQubmFtZSA9PT0gYSk7XG4gICAgICAgICAgICBjb25zdCBhR2xvYmFsVG9rZW4gPSB0b2tlbnMuZ2xvYmFsLmZpbmQodCA9PiB0Lm5hbWUgPT09IGEpO1xuICAgICAgICAgICAgY29uc3QgYUlzQ29sb3IgPSAoYUxpZ2h0VG9rZW4gJiYgYUxpZ2h0VG9rZW4udHlwZSA9PT0gJ2NvbG9yJykgfHxcbiAgICAgICAgICAgICAgICAoYURhcmtUb2tlbiAmJiBhRGFya1Rva2VuLnR5cGUgPT09ICdjb2xvcicpIHx8XG4gICAgICAgICAgICAgICAgKGFHbG9iYWxUb2tlbiAmJiBhR2xvYmFsVG9rZW4udHlwZSA9PT0gJ2NvbG9yJyk7XG4gICAgICAgICAgICBjb25zdCBiTGlnaHRUb2tlbiA9IHRva2Vucy5saWdodC5maW5kKHQgPT4gdC5uYW1lID09PSBiKTtcbiAgICAgICAgICAgIGNvbnN0IGJEYXJrVG9rZW4gPSB0b2tlbnMuZGFyay5maW5kKHQgPT4gdC5uYW1lID09PSBiKTtcbiAgICAgICAgICAgIGNvbnN0IGJHbG9iYWxUb2tlbiA9IHRva2Vucy5nbG9iYWwuZmluZCh0ID0+IHQubmFtZSA9PT0gYik7XG4gICAgICAgICAgICBjb25zdCBiSXNDb2xvciA9IChiTGlnaHRUb2tlbiAmJiBiTGlnaHRUb2tlbi50eXBlID09PSAnY29sb3InKSB8fFxuICAgICAgICAgICAgICAgIChiRGFya1Rva2VuICYmIGJEYXJrVG9rZW4udHlwZSA9PT0gJ2NvbG9yJykgfHxcbiAgICAgICAgICAgICAgICAoYkdsb2JhbFRva2VuICYmIGJHbG9iYWxUb2tlbi50eXBlID09PSAnY29sb3InKTtcbiAgICAgICAgICAgIGlmIChhSXNDb2xvciAmJiBiSXNDb2xvcikge1xuICAgICAgICAgICAgICAgIC8vIEJvdGggYXJlIGNvbG9ycywgdXNlIGN1c3RvbSBvcmRlclxuICAgICAgICAgICAgICAgIGNvbnN0IGFJbmRleCA9IGNvbG9yVmFyaWFibGVPcmRlci5pbmRleE9mKGEpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGJJbmRleCA9IGNvbG9yVmFyaWFibGVPcmRlci5pbmRleE9mKGIpO1xuICAgICAgICAgICAgICAgIC8vIElmIGJvdGggYXJlIGluIHRoZSBvcmRlciBsaXN0LCBzb3J0IGJ5IHBvc2l0aW9uXG4gICAgICAgICAgICAgICAgaWYgKGFJbmRleCAhPT0gLTEgJiYgYkluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYUluZGV4IC0gYkluZGV4O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBJZiBvbmx5IG9uZSBpcyBpbiB0aGUgbGlzdCwgcHJpb3JpdGl6ZSBpdFxuICAgICAgICAgICAgICAgIGlmIChhSW5kZXggIT09IC0xKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgaWYgKGJJbmRleCAhPT0gLTEpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgICAgIC8vIElmIG5laXRoZXIgaXMgaW4gdGhlIGxpc3QsIHNvcnQgYWxwaGFiZXRpY2FsbHlcbiAgICAgICAgICAgICAgICByZXR1cm4gYS5sb2NhbGVDb21wYXJlKGIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoYUlzQ29sb3IgJiYgIWJJc0NvbG9yKSB7XG4gICAgICAgICAgICAgICAgLy8gQ29sb3JzIGNvbWUgZmlyc3RcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICghYUlzQ29sb3IgJiYgYklzQ29sb3IpIHtcbiAgICAgICAgICAgICAgICAvLyBOb24tY29sb3JzIGNvbWUgYWZ0ZXIgY29sb3JzXG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBCb3RoIGFyZSBub24tY29sb3JzLCBzb3J0IGFscGhhYmV0aWNhbGx5XG4gICAgICAgICAgICAgICAgcmV0dXJuIGEubG9jYWxlQ29tcGFyZShiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGZvciAoY29uc3QgdG9rZW5OYW1lIG9mIGFsbFRva2VuTmFtZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IGxpZ2h0VG9rZW4gPSB0b2tlbnMubGlnaHQuZmluZCh0ID0+IHQubmFtZSA9PT0gdG9rZW5OYW1lKSB8fFxuICAgICAgICAgICAgICAgIHRva2Vucy5nbG9iYWwuZmluZCh0ID0+IHQubmFtZSA9PT0gdG9rZW5OYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IGRhcmtUb2tlbiA9IHRva2Vucy5kYXJrLmZpbmQodCA9PiB0Lm5hbWUgPT09IHRva2VuTmFtZSkgfHwgbGlnaHRUb2tlbjtcbiAgICAgICAgICAgIGlmIChsaWdodFRva2VuKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgY3JlYXRlT3JVcGRhdGVWYXJpYWJsZVdpdGhNb2RlcyhsaWdodFRva2VuLCBkYXJrVG9rZW4sIGNvbGxlY3Rpb24sIGxpZ2h0TW9kZUlkLCBkYXJrTW9kZUlkLCBleGlzdGluZ1NldHVwID8gZXhpc3RpbmdTZXR1cC52YXJpYWJsZXMgOiB1bmRlZmluZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb3VudDogY3JlYXRlZENvdW50LFxuICAgICAgICAgICAgaXNFeHRlbnNpb246ICEhZXhpc3RpbmdTZXR1cCxcbiAgICAgICAgICAgIGNvbGxlY3Rpb25OYW1lOiBjb2xsZWN0aW9uLm5hbWVcbiAgICAgICAgfTtcbiAgICB9XG4gICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGNyZWF0aW5nIEZpZ21hIHZhcmlhYmxlczonLCBlcnJvcik7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbn1cbi8vIEZ1bmN0aW9uIHRvIGdlbmVyYXRlIGEgY29sb3IgZ3VpZGUgZnJhbWUgb24gdGhlIGNhbnZhc1xuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVDb2xvckd1aWRlKHRva2Vucykge1xuICAgIHRyeSB7XG4gICAgICAgIC8vIEdldCBhbGwgY29sb3IgdG9rZW5zIGZyb20gYWxsIG1vZGVzXG4gICAgICAgIGNvbnN0IGFsbENvbG9yVG9rZW5zID0gW1xuICAgICAgICAgICAgLi4udG9rZW5zLmxpZ2h0LmZpbHRlcih0ID0+IHQudHlwZSA9PT0gJ2NvbG9yJyksXG4gICAgICAgICAgICAuLi50b2tlbnMuZGFyay5maWx0ZXIodCA9PiB0LnR5cGUgPT09ICdjb2xvcicpLFxuICAgICAgICAgICAgLi4udG9rZW5zLmdsb2JhbC5maWx0ZXIodCA9PiB0LnR5cGUgPT09ICdjb2xvcicpXG4gICAgICAgIF07XG4gICAgICAgIGlmIChhbGxDb2xvclRva2Vucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gY29sb3IgdmFyaWFibGVzIGZvdW5kIHRvIGdlbmVyYXRlIGd1aWRlJyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gR3JvdXAgdG9rZW5zIGJ5IGNvbGxlY3Rpb25cbiAgICAgICAgY29uc3QgdG9rZW5zQnlDb2xsZWN0aW9uID0gbmV3IE1hcCgpO1xuICAgICAgICAvLyBJbml0aWFsaXplIGNvbGxlY3Rpb25zXG4gICAgICAgIGZvciAoY29uc3QgdG9rZW4gb2YgYWxsQ29sb3JUb2tlbnMpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxlY3Rpb25OYW1lID0gdG9rZW4uY29sbGVjdGlvbiB8fCAnVW5rbm93biBDb2xsZWN0aW9uJztcbiAgICAgICAgICAgIGlmICghdG9rZW5zQnlDb2xsZWN0aW9uLmhhcyhjb2xsZWN0aW9uTmFtZSkpIHtcbiAgICAgICAgICAgICAgICB0b2tlbnNCeUNvbGxlY3Rpb24uc2V0KGNvbGxlY3Rpb25OYW1lLCB7IGxpZ2h0OiBbXSwgZGFyazogW10sIGdsb2JhbDogW10gfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gU29ydCB0b2tlbnMgaW50byBjb2xsZWN0aW9ucyBieSBtb2RlXG4gICAgICAgIGZvciAoY29uc3QgdG9rZW4gb2YgdG9rZW5zLmxpZ2h0LmZpbHRlcih0ID0+IHQudHlwZSA9PT0gJ2NvbG9yJykpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxlY3Rpb25OYW1lID0gdG9rZW4uY29sbGVjdGlvbiB8fCAnVW5rbm93biBDb2xsZWN0aW9uJztcbiAgICAgICAgICAgIHRva2Vuc0J5Q29sbGVjdGlvbi5nZXQoY29sbGVjdGlvbk5hbWUpLmxpZ2h0LnB1c2godG9rZW4pO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgdG9rZW4gb2YgdG9rZW5zLmRhcmsuZmlsdGVyKHQgPT4gdC50eXBlID09PSAnY29sb3InKSkge1xuICAgICAgICAgICAgY29uc3QgY29sbGVjdGlvbk5hbWUgPSB0b2tlbi5jb2xsZWN0aW9uIHx8ICdVbmtub3duIENvbGxlY3Rpb24nO1xuICAgICAgICAgICAgdG9rZW5zQnlDb2xsZWN0aW9uLmdldChjb2xsZWN0aW9uTmFtZSkuZGFyay5wdXNoKHRva2VuKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IHRva2VuIG9mIHRva2Vucy5nbG9iYWwuZmlsdGVyKHQgPT4gdC50eXBlID09PSAnY29sb3InKSkge1xuICAgICAgICAgICAgY29uc3QgY29sbGVjdGlvbk5hbWUgPSB0b2tlbi5jb2xsZWN0aW9uIHx8ICdVbmtub3duIENvbGxlY3Rpb24nO1xuICAgICAgICAgICAgdG9rZW5zQnlDb2xsZWN0aW9uLmdldChjb2xsZWN0aW9uTmFtZSkuZ2xvYmFsLnB1c2godG9rZW4pO1xuICAgICAgICB9XG4gICAgICAgIC8vIExheW91dCBjb25zdGFudHNcbiAgICAgICAgY29uc3Qgc3dhdGNoU2l6ZSA9IDkwO1xuICAgICAgICBjb25zdCBzd2F0Y2hHYXAgPSAyNDtcbiAgICAgICAgY29uc3QgbmFtZUhlaWdodCA9IDIwO1xuICAgICAgICBjb25zdCB2YWx1ZUhlaWdodCA9IDE2O1xuICAgICAgICBjb25zdCB2ZXJ0aWNhbEdhcCA9IDg7XG4gICAgICAgIGNvbnN0IHRvdGFsTGFiZWxIZWlnaHQgPSBuYW1lSGVpZ2h0ICsgdmFsdWVIZWlnaHQgKyB2ZXJ0aWNhbEdhcDtcbiAgICAgICAgY29uc3QgYm90dG9tUGFkZGluZyA9IDE2O1xuICAgICAgICBjb25zdCB0b3RhbEl0ZW1IZWlnaHQgPSBzd2F0Y2hTaXplICsgdG90YWxMYWJlbEhlaWdodCArIGJvdHRvbVBhZGRpbmc7XG4gICAgICAgIGNvbnN0IGl0ZW1zUGVyUm93ID0gNTtcbiAgICAgICAgY29uc3Qgc2VjdGlvbkdhcCA9IDQ4O1xuICAgICAgICBjb25zdCB0aXRsZUhlaWdodCA9IDY0O1xuICAgICAgICBjb25zdCBwYWRkaW5nID0gMjg7XG4gICAgICAgIGNvbnN0IGZyYW1lR2FwID0gMTAwOyAvLyBHYXAgYmV0d2VlbiBjb2xsZWN0aW9uIGZyYW1lc1xuICAgICAgICAvLyBMb2FkIGZvbnRzXG4gICAgICAgIGF3YWl0IGZpZ21hLmxvYWRGb250QXN5bmMoeyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnQm9sZCcgfSk7XG4gICAgICAgIGF3YWl0IGZpZ21hLmxvYWRGb250QXN5bmMoeyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnU2VtaSBCb2xkJyB9KTtcbiAgICAgICAgYXdhaXQgZmlnbWEubG9hZEZvbnRBc3luYyh7IGZhbWlseTogJ0ludGVyJywgc3R5bGU6ICdNZWRpdW0nIH0pO1xuICAgICAgICBhd2FpdCBmaWdtYS5sb2FkRm9udEFzeW5jKHsgZmFtaWx5OiAnSW50ZXInLCBzdHlsZTogJ1JlZ3VsYXInIH0pO1xuICAgICAgICBjb25zdCBjcmVhdGVkRnJhbWVzID0gW107XG4gICAgICAgIGNvbnN0IHZpZXdwb3J0ID0gZmlnbWEudmlld3BvcnQuYm91bmRzO1xuICAgICAgICBsZXQgZnJhbWVPZmZzZXRYID0gMDtcbiAgICAgICAgLy8gSGVscGVyIGZ1bmN0aW9uIHRvIHRydW5jYXRlIHRleHQgdGhhdCdzIHRvbyBsb25nXG4gICAgICAgIGNvbnN0IHRydW5jYXRlVGV4dCA9ICh0ZXh0LCBtYXhMZW5ndGgpID0+IHtcbiAgICAgICAgICAgIGlmICh0ZXh0Lmxlbmd0aCA8PSBtYXhMZW5ndGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRleHQ7XG4gICAgICAgICAgICByZXR1cm4gdGV4dC5zdWJzdHJpbmcoMCwgbWF4TGVuZ3RoIC0gMykgKyAnLi4uJztcbiAgICAgICAgfTtcbiAgICAgICAgLy8gQ3JlYXRlIGEgZnJhbWUgZm9yIGVhY2ggY29sbGVjdGlvblxuICAgICAgICBmb3IgKGNvbnN0IFtjb2xsZWN0aW9uTmFtZSwgY29sbGVjdGlvblRva2Vuc10gb2YgQXJyYXkuZnJvbSh0b2tlbnNCeUNvbGxlY3Rpb24uZW50cmllcygpKSkge1xuICAgICAgICAgICAgY29uc3QgbGlnaHRDb2xvcnMgPSBjb2xsZWN0aW9uVG9rZW5zLmxpZ2h0O1xuICAgICAgICAgICAgY29uc3QgZGFya0NvbG9ycyA9IGNvbGxlY3Rpb25Ub2tlbnMuZGFyaztcbiAgICAgICAgICAgIGNvbnN0IGdsb2JhbENvbG9ycyA9IGNvbGxlY3Rpb25Ub2tlbnMuZ2xvYmFsO1xuICAgICAgICAgICAgLy8gU2tpcCBjb2xsZWN0aW9ucyB3aXRoIG5vIGNvbG9yc1xuICAgICAgICAgICAgaWYgKGxpZ2h0Q29sb3JzLmxlbmd0aCA9PT0gMCAmJiBkYXJrQ29sb3JzLmxlbmd0aCA9PT0gMCAmJiBnbG9iYWxDb2xvcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBDYWxjdWxhdGUgc2VjdGlvbnMgZm9yIHRoaXMgY29sbGVjdGlvblxuICAgICAgICAgICAgY29uc3Qgc2VjdGlvbnMgPSBbXTtcbiAgICAgICAgICAgIGlmIChsaWdodENvbG9ycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgc2VjdGlvbnMucHVzaCh7IHRpdGxlOiAnTGlnaHQgTW9kZScsIGNvbG9yczogbGlnaHRDb2xvcnMsIGJhZGdlQ29sb3I6IHsgcjogMC4yLCBnOiAwLjYsIGI6IDEuMCB9IH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGRhcmtDb2xvcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHNlY3Rpb25zLnB1c2goeyB0aXRsZTogJ0RhcmsgTW9kZScsIGNvbG9yczogZGFya0NvbG9ycywgYmFkZ2VDb2xvcjogeyByOiAwLjQsIGc6IDAuMiwgYjogMC44IH0gfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZ2xvYmFsQ29sb3JzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBzZWN0aW9ucy5wdXNoKHsgdGl0bGU6ICdHbG9iYWwgQ29sb3JzJywgY29sb3JzOiBnbG9iYWxDb2xvcnMsIGJhZGdlQ29sb3I6IHsgcjogMC4wLCBnOiAwLjcsIGI6IDAuNCB9IH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIGZyYW1lIGRpbWVuc2lvbnMgZm9yIHRoaXMgY29sbGVjdGlvblxuICAgICAgICAgICAgY29uc3QgbWF4SXRlbXNJblNlY3Rpb24gPSBNYXRoLm1heCguLi5zZWN0aW9ucy5tYXAocyA9PiBzLmNvbG9ycy5sZW5ndGgpKTtcbiAgICAgICAgICAgIGNvbnN0IG1heFJvd3NJblNlY3Rpb24gPSBNYXRoLmNlaWwobWF4SXRlbXNJblNlY3Rpb24gLyBpdGVtc1BlclJvdyk7XG4gICAgICAgICAgICBjb25zdCBzZWN0aW9uSGVpZ2h0ID0gdGl0bGVIZWlnaHQgKyAobWF4Um93c0luU2VjdGlvbiAqIHRvdGFsSXRlbUhlaWdodCkgLSAobWF4Um93c0luU2VjdGlvbiA+IDAgPyBzd2F0Y2hHYXAgOiAwKTtcbiAgICAgICAgICAgIGNvbnN0IGZyYW1lV2lkdGggPSBNYXRoLm1heCg2ODAsIGl0ZW1zUGVyUm93ICogKHN3YXRjaFNpemUgKyBzd2F0Y2hHYXApIC0gc3dhdGNoR2FwICsgKHBhZGRpbmcgKiAyKSk7XG4gICAgICAgICAgICBjb25zdCBmcmFtZUhlaWdodCA9IDEwMCArIChzZWN0aW9ucy5sZW5ndGggKiAoc2VjdGlvbkhlaWdodCArIHNlY3Rpb25HYXApKSAtIHNlY3Rpb25HYXAgKyBwYWRkaW5nO1xuICAgICAgICAgICAgLy8gQ3JlYXRlIGNvbGxlY3Rpb24gZnJhbWVcbiAgICAgICAgICAgIGNvbnN0IGZyYW1lID0gZmlnbWEuY3JlYXRlRnJhbWUoKTtcbiAgICAgICAgICAgIGZyYW1lLm5hbWUgPSBgJHtjb2xsZWN0aW9uTmFtZX0gLSBDb2xvciBHdWlkZWA7XG4gICAgICAgICAgICBmcmFtZS5yZXNpemUoZnJhbWVXaWR0aCwgZnJhbWVIZWlnaHQpO1xuICAgICAgICAgICAgZnJhbWUuZmlsbHMgPSBbe1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnU09MSUQnLFxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogeyByOiAwLjk5LCBnOiAwLjk5LCBiOiAxLjAgfVxuICAgICAgICAgICAgICAgIH1dO1xuICAgICAgICAgICAgZnJhbWUuY29ybmVyUmFkaXVzID0gMTI7XG4gICAgICAgICAgICBmcmFtZS5lZmZlY3RzID0gW3tcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ0RST1BfU0hBRE9XJyxcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IHsgcjogMCwgZzogMCwgYjogMCwgYTogMC4xIH0sXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogeyB4OiAwLCB5OiA0IH0sXG4gICAgICAgICAgICAgICAgICAgIHJhZGl1czogMTIsXG4gICAgICAgICAgICAgICAgICAgIHNwcmVhZDogMCxcbiAgICAgICAgICAgICAgICAgICAgdmlzaWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgYmxlbmRNb2RlOiAnTk9STUFMJ1xuICAgICAgICAgICAgICAgIH1dO1xuICAgICAgICAgICAgLy8gUG9zaXRpb24gZnJhbWVcbiAgICAgICAgICAgIGZyYW1lLnggPSB2aWV3cG9ydC54ICsgNTAgKyBmcmFtZU9mZnNldFg7XG4gICAgICAgICAgICBmcmFtZS55ID0gdmlld3BvcnQueSArIDUwO1xuICAgICAgICAgICAgZnJhbWVPZmZzZXRYICs9IGZyYW1lV2lkdGggKyBmcmFtZUdhcDtcbiAgICAgICAgICAgIC8vIEFkZCBjb2xsZWN0aW9uIHRpdGxlXG4gICAgICAgICAgICBjb25zdCB0aXRsZVRleHQgPSBmaWdtYS5jcmVhdGVUZXh0KCk7XG4gICAgICAgICAgICB0aXRsZVRleHQuZm9udE5hbWUgPSB7IGZhbWlseTogJ0ludGVyJywgc3R5bGU6ICdCb2xkJyB9O1xuICAgICAgICAgICAgdGl0bGVUZXh0LmZvbnRTaXplID0gMjQ7XG4gICAgICAgICAgICB0aXRsZVRleHQuY2hhcmFjdGVycyA9IGNvbGxlY3Rpb25OYW1lO1xuICAgICAgICAgICAgdGl0bGVUZXh0LmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC4xLCBnOiAwLjEsIGI6IDAuMSB9IH1dO1xuICAgICAgICAgICAgdGl0bGVUZXh0LnggPSBwYWRkaW5nO1xuICAgICAgICAgICAgdGl0bGVUZXh0LnkgPSAyNjtcbiAgICAgICAgICAgIGZyYW1lLmFwcGVuZENoaWxkKHRpdGxlVGV4dCk7XG4gICAgICAgICAgICAvLyBBZGQgc3VidGl0bGVcbiAgICAgICAgICAgIGNvbnN0IHRvdGFsQ29sb3JzID0gbGlnaHRDb2xvcnMubGVuZ3RoICsgZGFya0NvbG9ycy5sZW5ndGggKyBnbG9iYWxDb2xvcnMubGVuZ3RoO1xuICAgICAgICAgICAgY29uc3Qgc3VidGl0bGVUZXh0ID0gZmlnbWEuY3JlYXRlVGV4dCgpO1xuICAgICAgICAgICAgc3VidGl0bGVUZXh0LmZvbnROYW1lID0geyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnUmVndWxhcicgfTtcbiAgICAgICAgICAgIHN1YnRpdGxlVGV4dC5mb250U2l6ZSA9IDE0O1xuICAgICAgICAgICAgc3VidGl0bGVUZXh0LmNoYXJhY3RlcnMgPSBgJHt0b3RhbENvbG9yc30gY29sb3IgdmFyaWFibGVzIGFjcm9zcyAke3NlY3Rpb25zLmxlbmd0aH0gbW9kZSR7c2VjdGlvbnMubGVuZ3RoICE9PSAxID8gJ3MnIDogJyd9YDtcbiAgICAgICAgICAgIHN1YnRpdGxlVGV4dC5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuNSwgZzogMC41LCBiOiAwLjUgfSB9XTtcbiAgICAgICAgICAgIHN1YnRpdGxlVGV4dC54ID0gcGFkZGluZztcbiAgICAgICAgICAgIHN1YnRpdGxlVGV4dC55ID0gNTY7XG4gICAgICAgICAgICBmcmFtZS5hcHBlbmRDaGlsZChzdWJ0aXRsZVRleHQpO1xuICAgICAgICAgICAgbGV0IGN1cnJlbnRZID0gMTEwO1xuICAgICAgICAgICAgLy8gQ3JlYXRlIHNlY3Rpb25zIGZvciBlYWNoIG1vZGUgd2l0aGluIHRoaXMgY29sbGVjdGlvblxuICAgICAgICAgICAgZm9yIChjb25zdCBzZWN0aW9uIG9mIHNlY3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgLy8gU2VjdGlvbiB0aXRsZSB3aXRoIGNvbG9yZWQgYmFkZ2VcbiAgICAgICAgICAgICAgICBjb25zdCBzZWN0aW9uVGl0bGUgPSBmaWdtYS5jcmVhdGVUZXh0KCk7XG4gICAgICAgICAgICAgICAgc2VjdGlvblRpdGxlLmZvbnROYW1lID0geyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnU2VtaSBCb2xkJyB9O1xuICAgICAgICAgICAgICAgIHNlY3Rpb25UaXRsZS5mb250U2l6ZSA9IDE4O1xuICAgICAgICAgICAgICAgIHNlY3Rpb25UaXRsZS5jaGFyYWN0ZXJzID0gc2VjdGlvbi50aXRsZTtcbiAgICAgICAgICAgICAgICBzZWN0aW9uVGl0bGUuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLjEsIGc6IDAuMSwgYjogMC4xIH0gfV07XG4gICAgICAgICAgICAgICAgc2VjdGlvblRpdGxlLnggPSBwYWRkaW5nICsgMzY7XG4gICAgICAgICAgICAgICAgc2VjdGlvblRpdGxlLnkgPSBjdXJyZW50WTtcbiAgICAgICAgICAgICAgICBmcmFtZS5hcHBlbmRDaGlsZChzZWN0aW9uVGl0bGUpO1xuICAgICAgICAgICAgICAgIC8vIENvbG9yZWQgYmFkZ2VcbiAgICAgICAgICAgICAgICBjb25zdCBiYWRnZSA9IGZpZ21hLmNyZWF0ZUVsbGlwc2UoKTtcbiAgICAgICAgICAgICAgICBiYWRnZS5yZXNpemUoMjAsIDIwKTtcbiAgICAgICAgICAgICAgICBiYWRnZS54ID0gcGFkZGluZztcbiAgICAgICAgICAgICAgICBiYWRnZS55ID0gY3VycmVudFkgKyAyO1xuICAgICAgICAgICAgICAgIGJhZGdlLmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHNlY3Rpb24uYmFkZ2VDb2xvciB9XTtcbiAgICAgICAgICAgICAgICBmcmFtZS5hcHBlbmRDaGlsZChiYWRnZSk7XG4gICAgICAgICAgICAgICAgLy8gU2VjdGlvbiBjb3VudFxuICAgICAgICAgICAgICAgIGNvbnN0IGNvdW50VGV4dCA9IGZpZ21hLmNyZWF0ZVRleHQoKTtcbiAgICAgICAgICAgICAgICBjb3VudFRleHQuZm9udE5hbWUgPSB7IGZhbWlseTogJ0ludGVyJywgc3R5bGU6ICdSZWd1bGFyJyB9O1xuICAgICAgICAgICAgICAgIGNvdW50VGV4dC5mb250U2l6ZSA9IDEzO1xuICAgICAgICAgICAgICAgIGNvdW50VGV4dC5jaGFyYWN0ZXJzID0gYCR7c2VjdGlvbi5jb2xvcnMubGVuZ3RofSB2YXJpYWJsZXNgO1xuICAgICAgICAgICAgICAgIGNvdW50VGV4dC5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuNiwgZzogMC42LCBiOiAwLjYgfSB9XTtcbiAgICAgICAgICAgICAgICBjb3VudFRleHQueCA9IHBhZGRpbmcgKyAzNiArIHNlY3Rpb25UaXRsZS53aWR0aCArIDEyO1xuICAgICAgICAgICAgICAgIGNvdW50VGV4dC55ID0gY3VycmVudFkgKyAzO1xuICAgICAgICAgICAgICAgIGZyYW1lLmFwcGVuZENoaWxkKGNvdW50VGV4dCk7XG4gICAgICAgICAgICAgICAgY3VycmVudFkgKz0gdGl0bGVIZWlnaHQ7XG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGNvbG9yIHN3YXRjaGVzIGZvciB0aGlzIHNlY3Rpb25cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlY3Rpb24uY29sb3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRva2VuID0gc2VjdGlvbi5jb2xvcnNbaV07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvdyA9IE1hdGguZmxvb3IoaSAvIGl0ZW1zUGVyUm93KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29sID0gaSAlIGl0ZW1zUGVyUm93O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB4ID0gcGFkZGluZyArIGNvbCAqIChzd2F0Y2hTaXplICsgc3dhdGNoR2FwKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeSA9IGN1cnJlbnRZICsgcm93ICogdG90YWxJdGVtSGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUgc3dhdGNoIHJlY3RhbmdsZVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzd2F0Y2ggPSBmaWdtYS5jcmVhdGVSZWN0YW5nbGUoKTtcbiAgICAgICAgICAgICAgICAgICAgc3dhdGNoLm5hbWUgPSBgJHtzZWN0aW9uLnRpdGxlLnRvTG93ZXJDYXNlKCl9LSR7dG9rZW4ubmFtZX1gO1xuICAgICAgICAgICAgICAgICAgICBzd2F0Y2gucmVzaXplKHN3YXRjaFNpemUsIHN3YXRjaFNpemUpO1xuICAgICAgICAgICAgICAgICAgICBzd2F0Y2gueCA9IHg7XG4gICAgICAgICAgICAgICAgICAgIHN3YXRjaC55ID0geTtcbiAgICAgICAgICAgICAgICAgICAgc3dhdGNoLmNvcm5lclJhZGl1cyA9IDg7XG4gICAgICAgICAgICAgICAgICAgIC8vIFBhcnNlIGNvbG9yIGFuZCBzZXQgZmlsbFxuICAgICAgICAgICAgICAgICAgICBsZXQgcmdiID0gcGFyc2VDb2xvclRvUmdiKHRva2VuLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJnYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3dhdGNoLmZpbGxzID0gW3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ1NPTElEJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IHsgcjogcmdiLnIsIGc6IHJnYi5nLCBiOiByZ2IuYiB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGYWxsYmFjayBmb3IgdW5wYXJzZWFibGUgY29sb3JzXG4gICAgICAgICAgICAgICAgICAgICAgICBzd2F0Y2guZmlsbHMgPSBbe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnU09MSUQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogeyByOiAwLjksIGc6IDAuOSwgYjogMC45IH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBBZGQgc3VidGxlIGJvcmRlclxuICAgICAgICAgICAgICAgICAgICBzd2F0Y2guc3Ryb2tlcyA9IFt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ1NPTElEJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogeyByOiAwLjksIGc6IDAuOSwgYjogMC45IH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1dO1xuICAgICAgICAgICAgICAgICAgICBzd2F0Y2guc3Ryb2tlV2VpZ2h0ID0gMTtcbiAgICAgICAgICAgICAgICAgICAgZnJhbWUuYXBwZW5kQ2hpbGQoc3dhdGNoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHZhcmlhYmxlIG5hbWUgbGFiZWwgd2l0aCB0cnVuY2F0aW9uXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5hbWVMYWJlbCA9IGZpZ21hLmNyZWF0ZVRleHQoKTtcbiAgICAgICAgICAgICAgICAgICAgbmFtZUxhYmVsLmZvbnROYW1lID0geyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnTWVkaXVtJyB9O1xuICAgICAgICAgICAgICAgICAgICBuYW1lTGFiZWwuZm9udFNpemUgPSAxMjtcbiAgICAgICAgICAgICAgICAgICAgbmFtZUxhYmVsLmNoYXJhY3RlcnMgPSB0cnVuY2F0ZVRleHQodG9rZW4ubmFtZSwgMjApO1xuICAgICAgICAgICAgICAgICAgICBuYW1lTGFiZWwuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLjEsIGc6IDAuMSwgYjogMC4xIH0gfV07XG4gICAgICAgICAgICAgICAgICAgIG5hbWVMYWJlbC54ID0geDtcbiAgICAgICAgICAgICAgICAgICAgbmFtZUxhYmVsLnkgPSB5ICsgc3dhdGNoU2l6ZSArIDEwO1xuICAgICAgICAgICAgICAgICAgICBuYW1lTGFiZWwudGV4dEFsaWduSG9yaXpvbnRhbCA9ICdMRUZUJztcbiAgICAgICAgICAgICAgICAgICAgbmFtZUxhYmVsLnJlc2l6ZShzd2F0Y2hTaXplLCBuYW1lSGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgbmFtZUxhYmVsLnRleHRBdXRvUmVzaXplID0gJ05PTkUnO1xuICAgICAgICAgICAgICAgICAgICBmcmFtZS5hcHBlbmRDaGlsZChuYW1lTGFiZWwpO1xuICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUgdmFsdWUgbGFiZWwgd2l0aCBiZXR0ZXIgZm9ybWF0dGluZ1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZUxhYmVsID0gZmlnbWEuY3JlYXRlVGV4dCgpO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZUxhYmVsLmZvbnROYW1lID0geyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnUmVndWxhcicgfTtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVMYWJlbC5mb250U2l6ZSA9IDEwO1xuICAgICAgICAgICAgICAgICAgICAvLyBTaG93IG9yaWdpbmFsIGZvcm1hdCBpZiBpdCdzIGNvbmNpc2UsIG90aGVyd2lzZSBjb252ZXJ0IHRvIGhleFxuICAgICAgICAgICAgICAgICAgICBsZXQgZGlzcGxheVZhbHVlID0gdG9rZW4udmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBvcmlnaW5hbCB2YWx1ZSBpcyB0b28gbG9uZyBvciBjb21wbGV4LCBjb252ZXJ0IHRvIGhleCBmb3IgcmVhZGFiaWxpdHlcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRva2VuLnZhbHVlLmxlbmd0aCA+IDIyIHx8IHRva2VuLnZhbHVlLmluY2x1ZGVzKCdva2xjaCcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmdiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaGV4ID0gJyMnICsgW3JnYi5yLCByZ2IuZywgcmdiLmJdLm1hcChjID0+IE1hdGgucm91bmQoYyAqIDI1NSkudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsICcwJykpLmpvaW4oJycpLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheVZhbHVlID0gaGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gS2VlcCBvcmlnaW5hbCBmb3JtYXQgZm9yIEhTTCwgSFNCLCBSR0IgaWYgdGhleSdyZSBjb25jaXNlXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5VmFsdWUgPSB0b2tlbi52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBUcnVuY2F0ZSB2YWx1ZSBpZiBzdGlsbCB0b28gbG9uZ1xuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5VmFsdWUgPSB0cnVuY2F0ZVRleHQoZGlzcGxheVZhbHVlLCAxOCk7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlTGFiZWwuY2hhcmFjdGVycyA9IGRpc3BsYXlWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVMYWJlbC5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuNSwgZzogMC41LCBiOiAwLjUgfSB9XTtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVMYWJlbC54ID0geDtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVMYWJlbC55ID0geSArIHN3YXRjaFNpemUgKyAxMCArIG5hbWVIZWlnaHQgKyB2ZXJ0aWNhbEdhcDtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVMYWJlbC50ZXh0QWxpZ25Ib3Jpem9udGFsID0gJ0xFRlQnO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZUxhYmVsLnJlc2l6ZShzd2F0Y2hTaXplLCB2YWx1ZUhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlTGFiZWwudGV4dEF1dG9SZXNpemUgPSAnTk9ORSc7XG4gICAgICAgICAgICAgICAgICAgIGZyYW1lLmFwcGVuZENoaWxkKHZhbHVlTGFiZWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBNb3ZlIHRvIG5leHQgc2VjdGlvblxuICAgICAgICAgICAgICAgIGNvbnN0IHJvd3NVc2VkID0gTWF0aC5jZWlsKHNlY3Rpb24uY29sb3JzLmxlbmd0aCAvIGl0ZW1zUGVyUm93KTtcbiAgICAgICAgICAgICAgICBjdXJyZW50WSArPSAocm93c1VzZWQgKiB0b3RhbEl0ZW1IZWlnaHQpICsgc2VjdGlvbkdhcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNyZWF0ZWRGcmFtZXMucHVzaChmcmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gU2VsZWN0IGFsbCBjcmVhdGVkIGZyYW1lcyBhbmQgZm9jdXMgb24gdGhlbVxuICAgICAgICBpZiAoY3JlYXRlZEZyYW1lcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb24gPSBjcmVhdGVkRnJhbWVzO1xuICAgICAgICAgICAgZmlnbWEudmlld3BvcnQuc2Nyb2xsQW5kWm9vbUludG9WaWV3KGNyZWF0ZWRGcmFtZXMpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFJldHVybiB0b3RhbCBjb3VudCBvZiBjb2xvciB2YXJpYWJsZXMgcHJvY2Vzc2VkXG4gICAgICAgIHJldHVybiBhbGxDb2xvclRva2Vucy5sZW5ndGg7XG4gICAgfVxuICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBnZW5lcmF0aW5nIGNvbG9yIGd1aWRlOicsIGVycm9yKTtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxufVxuLy8gRW5oYW5jZWQgZnVuY3Rpb24gdG8gc2NhbiBleGlzdGluZyBGaWdtYSB2YXJpYWJsZXMgYW5kIHN0eWxlcyBjb21wcmVoZW5zaXZlbHlcbmFzeW5jIGZ1bmN0aW9uIHNjYW5FeGlzdGluZ1ZhcmlhYmxlc0VuaGFuY2VkKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGxvZ2dlci5sb2coJz09PSBFTkhBTkNFRCBTQ0FOTklORyBTVEFSVEVEID09PScpO1xuICAgICAgICBjb25zdCB0b2tlbnMgPSB7XG4gICAgICAgICAgICBsaWdodDogW10sXG4gICAgICAgICAgICBkYXJrOiBbXSxcbiAgICAgICAgICAgIGdsb2JhbDogW11cbiAgICAgICAgfTtcbiAgICAgICAgLy8gMS4gU2NhbiBMb2NhbCBWYXJpYWJsZXNcbiAgICAgICAgYXdhaXQgc2NhbkxvY2FsVmFyaWFibGVzKHRva2Vucyk7XG4gICAgICAgIC8vIDIuIFNjYW4gUGFpbnQgU3R5bGVzIFxuICAgICAgICBhd2FpdCBzY2FuUGFpbnRTdHlsZXModG9rZW5zKTtcbiAgICAgICAgLy8gMy4gU2NhbiBQdWJsaXNoZWQgTGlicmFyeSBWYXJpYWJsZXMgKGlmIGF2YWlsYWJsZSlcbiAgICAgICAgYXdhaXQgc2NhblB1Ymxpc2hlZExpYnJhcnlWYXJpYWJsZXModG9rZW5zKTtcbiAgICAgICAgbG9nZ2VyLmxvZygnPT09IEVOSEFOQ0VEIFNDQU4gQ09NUExFVEUgPT09Jyk7XG4gICAgICAgIGxvZ2dlci5sb2coYFRvdGFsIGZvdW5kIC0gTGlnaHQ6ICR7dG9rZW5zLmxpZ2h0Lmxlbmd0aH0sIERhcms6ICR7dG9rZW5zLmRhcmsubGVuZ3RofSwgR2xvYmFsOiAke3Rva2Vucy5nbG9iYWwubGVuZ3RofWApO1xuICAgICAgICByZXR1cm4gdG9rZW5zO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBpbiBlbmhhbmNlZCBzY2FubmluZzonLCBlcnJvcik7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbn1cbi8vIEhlbHBlciBmdW5jdGlvbiB0byBkZXRlY3QgaWYgYSB2YWx1ZSByZXByZXNlbnRzIGEgY29sb3JcbmZ1bmN0aW9uIGlzQ29sb3JWYWx1ZSh2YWx1ZSwgdmFyaWFibGVOYW1lKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gRGlyZWN0IFJHQiBvYmplY3RcbiAgICAgICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgJ3InIGluIHZhbHVlICYmICdnJyBpbiB2YWx1ZSAmJiAnYicgaW4gdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIC8vIFN0cmluZyBjb2xvciBmb3JtYXRzXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBjb25zdCB0cmltbWVkID0gdmFsdWUudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAvLyBDb21tb24gY29sb3IgZm9ybWF0c1xuICAgICAgICAgICAgaWYgKHRyaW1tZWQuc3RhcnRzV2l0aCgnIycpIHx8XG4gICAgICAgICAgICAgICAgdHJpbW1lZC5pbmNsdWRlcygncmdiJykgfHxcbiAgICAgICAgICAgICAgICB0cmltbWVkLmluY2x1ZGVzKCdoc2wnKSB8fFxuICAgICAgICAgICAgICAgIHRyaW1tZWQuaW5jbHVkZXMoJ29rbGNoJykgfHxcbiAgICAgICAgICAgICAgICB0cmltbWVkLmluY2x1ZGVzKCdoc2InKSB8fFxuICAgICAgICAgICAgICAgIHRyaW1tZWQuaW5jbHVkZXMoJ2hzdicpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBTaGFkQ04gcmF3IEhTTCBmb3JtYXQgKGUuZy4sIFwiMCAwJSAxMDAlXCIpXG4gICAgICAgICAgICBpZiAodHJpbW1lZC5tYXRjaCgvXihbKy1dP1tcXGQuXSspXFxzKyhbKy1dP1tcXGQuXSspJVxccysoWystXT9bXFxkLl0rKSUkLykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE5hbWVkIGNvbG9yc1xuICAgICAgICAgICAgY29uc3QgbmFtZWRDb2xvcnMgPSBbJ3RyYW5zcGFyZW50JywgJ2luaGVyaXQnLCAnY3VycmVudGNvbG9yJywgJ2JsYWNrJywgJ3doaXRlJywgJ3JlZCcsICdncmVlbicsICdibHVlJywgJ3llbGxvdycsICdvcmFuZ2UnLCAncHVycGxlJywgJ3BpbmsnLCAnZ3JheScsICdncmV5J107XG4gICAgICAgICAgICBpZiAobmFtZWRDb2xvcnMuaW5jbHVkZXModHJpbW1lZCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBWYXJpYWJsZSBuYW1lIGFuYWx5c2lzIChmYWxsYmFjaylcbiAgICAgICAgaWYgKHZhcmlhYmxlTmFtZSkge1xuICAgICAgICAgICAgY29uc3QgbmFtZUxvd2VyID0gdmFyaWFibGVOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBjb25zdCBjb2xvcktleXdvcmRzID0gW1xuICAgICAgICAgICAgICAgICdjb2xvcicsICdiYWNrZ3JvdW5kJywgJ2ZvcmVncm91bmQnLCAnYmcnLCAnZmcnLCAndGV4dCcsICdib3JkZXInLCAnc2hhZG93JyxcbiAgICAgICAgICAgICAgICAncHJpbWFyeScsICdzZWNvbmRhcnknLCAnYWNjZW50JywgJ3N1Y2Nlc3MnLCAnZXJyb3InLCAnd2FybmluZycsICdpbmZvJyxcbiAgICAgICAgICAgICAgICAnbXV0ZWQnLCAnZGVzdHJ1Y3RpdmUnLCAncmluZycsICdjYXJkJywgJ3BvcG92ZXInLCAnaW5wdXQnLCAnc3VyZmFjZScsXG4gICAgICAgICAgICAgICAgJ2JyYW5kJywgJ25ldXRyYWwnLCAnc2xhdGUnLCAnZ3JheScsICd6aW5jJywgJ3N0b25lJywgJ3JlZCcsICdvcmFuZ2UnLFxuICAgICAgICAgICAgICAgICdhbWJlcicsICd5ZWxsb3cnLCAnbGltZScsICdncmVlbicsICdlbWVyYWxkJywgJ3RlYWwnLCAnY3lhbicsICdza3knLFxuICAgICAgICAgICAgICAgICdibHVlJywgJ2luZGlnbycsICd2aW9sZXQnLCAncHVycGxlJywgJ2Z1Y2hzaWEnLCAncGluaycsICdyb3NlJ1xuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIHJldHVybiBjb2xvcktleXdvcmRzLnNvbWUoa2V5d29yZCA9PiBuYW1lTG93ZXIuaW5jbHVkZXMoa2V5d29yZCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG4vLyBFbmhhbmNlZCBjb2xvciB2YWx1ZSBleHRyYWN0aW9uIHdpdGggYmV0dGVyIGZvcm1hdCBzdXBwb3J0IGFuZCBhbGlhcyByZXNvbHV0aW9uXG5hc3luYyBmdW5jdGlvbiBleHRyYWN0Q29sb3JWYWx1ZUVuaGFuY2VkKHZhbHVlLCB2YXJpYWJsZU5hbWUsIGFsbFZhcmlhYmxlcywgdmlzaXRlZEFsaWFzZXMpIHtcbiAgICB0cnkge1xuICAgICAgICAvLyBJbml0aWFsaXplIHZpc2l0ZWQgYWxpYXNlcyB0byBwcmV2ZW50IGluZmluaXRlIGxvb3BzXG4gICAgICAgIGlmICghdmlzaXRlZEFsaWFzZXMpIHtcbiAgICAgICAgICAgIHZpc2l0ZWRBbGlhc2VzID0gbmV3IFNldCgpO1xuICAgICAgICB9XG4gICAgICAgIC8vIEhhbmRsZSBkaXJlY3QgY29sb3Igb2JqZWN0c1xuICAgICAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiAncicgaW4gdmFsdWUgJiYgJ2cnIGluIHZhbHVlICYmICdiJyBpbiB2YWx1ZSkge1xuICAgICAgICAgICAgY29uc3QgeyByLCBnLCBiLCBhIH0gPSB2YWx1ZTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgciA9PT0gJ251bWJlcicgJiYgdHlwZW9mIGcgPT09ICdudW1iZXInICYmIHR5cGVvZiBiID09PSAnbnVtYmVyJyAmJlxuICAgICAgICAgICAgICAgICFpc05hTihyKSAmJiAhaXNOYU4oZykgJiYgIWlzTmFOKGIpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGEgIT09IHVuZGVmaW5lZCAmJiBhIDwgMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYHJnYmEoJHtNYXRoLnJvdW5kKHIgKiAyNTUpfSwgJHtNYXRoLnJvdW5kKGcgKiAyNTUpfSwgJHtNYXRoLnJvdW5kKGIgKiAyNTUpfSwgJHthfSlgO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYHJnYigke01hdGgucm91bmQociAqIDI1NSl9LCAke01hdGgucm91bmQoZyAqIDI1NSl9LCAke01hdGgucm91bmQoYiAqIDI1NSl9KWA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gSGFuZGxlIHZhcmlhYmxlIGFsaWFzZXMvcmVmZXJlbmNlcyB3aXRoIGFjdHVhbCByZXNvbHV0aW9uXG4gICAgICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmICd0eXBlJyBpbiB2YWx1ZSAmJiB2YWx1ZS50eXBlID09PSAnVkFSSUFCTEVfQUxJQVMnICYmICdpZCcgaW4gdmFsdWUpIHtcbiAgICAgICAgICAgIGNvbnN0IGFsaWFzSWQgPSB2YWx1ZS5pZDtcbiAgICAgICAgICAgIC8vIFByZXZlbnQgaW5maW5pdGUgbG9vcHNcbiAgICAgICAgICAgIGlmICh2aXNpdGVkQWxpYXNlcy5oYXMoYWxpYXNJZCkpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIud2FybihgQ2lyY3VsYXIgcmVmZXJlbmNlIGRldGVjdGVkIGZvciB2YXJpYWJsZSAke3ZhcmlhYmxlTmFtZX0sIHN0b3BwaW5nIHJlc29sdXRpb25gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZpc2l0ZWRBbGlhc2VzLmFkZChhbGlhc0lkKTtcbiAgICAgICAgICAgIGxvZ2dlci5sb2coYFZhcmlhYmxlICR7dmFyaWFibGVOYW1lfSBpcyBhbiBhbGlhcyB0byAke2FsaWFzSWR9LCBhdHRlbXB0aW5nIHRvIHJlc29sdmUuLi5gKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gVHJ5IHRvIGdldCBhbGwgdmFyaWFibGVzIGlmIG5vdCBwcm92aWRlZFxuICAgICAgICAgICAgICAgIGlmICghYWxsVmFyaWFibGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGFsbFZhcmlhYmxlcyA9IGF3YWl0IGZpZ21hLnZhcmlhYmxlcy5nZXRMb2NhbFZhcmlhYmxlc0FzeW5jKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEZpbmQgdGhlIHJlZmVyZW5jZWQgdmFyaWFibGVcbiAgICAgICAgICAgICAgICBjb25zdCByZWZlcmVuY2VkVmFyID0gYWxsVmFyaWFibGVzICYmIGFsbFZhcmlhYmxlcy5maW5kKCh2KSA9PiB2LmlkID09PSBhbGlhc0lkKTtcbiAgICAgICAgICAgICAgICBpZiAoIXJlZmVyZW5jZWRWYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVHJ5IHRoZSBGaWdtYSBBUEkgdG8gZ2V0IHRoZSB2YXJpYWJsZSBkaXJlY3RseVxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlyZWN0VmFyID0gYXdhaXQgZmlnbWEudmFyaWFibGVzLmdldFZhcmlhYmxlQnlJZEFzeW5jKGFsaWFzSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRpcmVjdFZhcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgZmlyc3QgYXZhaWxhYmxlIG1vZGUgdmFsdWUgZnJvbSB0aGUgcmVmZXJlbmNlZCB2YXJpYWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vZGVJZHMgPSBPYmplY3Qua2V5cyhkaXJlY3RWYXIudmFsdWVzQnlNb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobW9kZUlkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlZmVyZW5jZWRWYWx1ZSA9IGRpcmVjdFZhci52YWx1ZXNCeU1vZGVbbW9kZUlkc1swXV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci5sb2coYFJlc29sdmVkIGFsaWFzICR7YWxpYXNJZH0gdG8gdmFsdWU6YCwgcmVmZXJlbmNlZFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVjdXJzaXZlbHkgcmVzb2x2ZSBpbiBjYXNlIHRoZSByZWZlcmVuY2VkIHZhcmlhYmxlIGlzIGFsc28gYW4gYWxpYXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGV4dHJhY3RDb2xvclZhbHVlRW5oYW5jZWQocmVmZXJlbmNlZFZhbHVlLCBkaXJlY3RWYXIubmFtZSwgYWxsVmFyaWFibGVzLCB2aXNpdGVkQWxpYXNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChhcGlFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oYENvdWxkIG5vdCByZXNvbHZlIHZhcmlhYmxlICR7YWxpYXNJZH0gdmlhIEFQSTpgLCBhcGlFcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oYFJlZmVyZW5jZWQgdmFyaWFibGUgJHthbGlhc0lkfSBub3QgZm91bmRgKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgZmlyc3QgYXZhaWxhYmxlIG1vZGUgdmFsdWUgZnJvbSB0aGUgcmVmZXJlbmNlZCB2YXJpYWJsZVxuICAgICAgICAgICAgICAgIGNvbnN0IG1vZGVJZHMgPSBPYmplY3Qua2V5cyhyZWZlcmVuY2VkVmFyLnZhbHVlc0J5TW9kZSk7XG4gICAgICAgICAgICAgICAgaWYgKG1vZGVJZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZWZlcmVuY2VkVmFsdWUgPSByZWZlcmVuY2VkVmFyLnZhbHVlc0J5TW9kZVttb2RlSWRzWzBdXTtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmxvZyhgUmVzb2x2ZWQgYWxpYXMgJHthbGlhc0lkfSAoJHtyZWZlcmVuY2VkVmFyLm5hbWV9KSB0byB2YWx1ZTpgLCByZWZlcmVuY2VkVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAvLyBSZWN1cnNpdmVseSByZXNvbHZlIGluIGNhc2UgdGhlIHJlZmVyZW5jZWQgdmFyaWFibGUgaXMgYWxzbyBhbiBhbGlhc1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgZXh0cmFjdENvbG9yVmFsdWVFbmhhbmNlZChyZWZlcmVuY2VkVmFsdWUsIHJlZmVyZW5jZWRWYXIubmFtZSwgYWxsVmFyaWFibGVzLCB2aXNpdGVkQWxpYXNlcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIud2FybihgUmVmZXJlbmNlZCB2YXJpYWJsZSAke2FsaWFzSWR9IGhhcyBubyBtb2RlIHZhbHVlc2ApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoYEVycm9yIHJlc29sdmluZyBhbGlhcyAke2FsaWFzSWR9OmAsIGVycm9yKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBIYW5kbGUgc3RyaW5nIHZhbHVlc1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY29uc3QgdHJpbW1lZCA9IHZhbHVlLnRyaW0oKTtcbiAgICAgICAgICAgIC8vIFNoYWRDTiBIU0wgZm9ybWF0IGNvbnZlcnNpb25cbiAgICAgICAgICAgIGNvbnN0IGhzbE1hdGNoID0gdHJpbW1lZC5tYXRjaCgvXihbKy1dP1tcXGQuXSspXFxzKyhbKy1dP1tcXGQuXSspJVxccysoWystXT9bXFxkLl0rKSUkLyk7XG4gICAgICAgICAgICBpZiAoaHNsTWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBbLCBoLCBzLCBsXSA9IGhzbE1hdGNoO1xuICAgICAgICAgICAgICAgIHJldHVybiBgaHNsKCR7aH0sICR7c30lLCAke2x9JSlgO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gUmV0dXJuIG90aGVyIHN0cmluZyBmb3JtYXRzIGFzLWlzXG4gICAgICAgICAgICByZXR1cm4gdHJpbW1lZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGxvZ2dlci5lcnJvcihgRXJyb3IgZXh0cmFjdGluZyBjb2xvciB2YWx1ZSBmb3IgJHt2YXJpYWJsZU5hbWV9OmAsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuLy8gU3luY2hyb25vdXMgdmVyc2lvbiBmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eVxuZnVuY3Rpb24gZXh0cmFjdENvbG9yVmFsdWVFbmhhbmNlZFN5bmModmFsdWUsIHZhcmlhYmxlTmFtZSkge1xuICAgIHRyeSB7XG4gICAgICAgIC8vIEhhbmRsZSBkaXJlY3QgY29sb3Igb2JqZWN0c1xuICAgICAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiAncicgaW4gdmFsdWUgJiYgJ2cnIGluIHZhbHVlICYmICdiJyBpbiB2YWx1ZSkge1xuICAgICAgICAgICAgY29uc3QgeyByLCBnLCBiLCBhIH0gPSB2YWx1ZTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgciA9PT0gJ251bWJlcicgJiYgdHlwZW9mIGcgPT09ICdudW1iZXInICYmIHR5cGVvZiBiID09PSAnbnVtYmVyJyAmJlxuICAgICAgICAgICAgICAgICFpc05hTihyKSAmJiAhaXNOYU4oZykgJiYgIWlzTmFOKGIpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGEgIT09IHVuZGVmaW5lZCAmJiBhIDwgMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYHJnYmEoJHtNYXRoLnJvdW5kKHIgKiAyNTUpfSwgJHtNYXRoLnJvdW5kKGcgKiAyNTUpfSwgJHtNYXRoLnJvdW5kKGIgKiAyNTUpfSwgJHthfSlgO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYHJnYigke01hdGgucm91bmQociAqIDI1NSl9LCAke01hdGgucm91bmQoZyAqIDI1NSl9LCAke01hdGgucm91bmQoYiAqIDI1NSl9KWA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gSGFuZGxlIHZhcmlhYmxlIGFsaWFzZXMvcmVmZXJlbmNlcyAtIG1hcmsgZm9yIGxhdGVyIHJlc29sdXRpb25cbiAgICAgICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgJ3R5cGUnIGluIHZhbHVlICYmIHZhbHVlLnR5cGUgPT09ICdWQVJJQUJMRV9BTElBUycpIHtcbiAgICAgICAgICAgIGxvZ2dlci5sb2coYFZhcmlhYmxlICR7dmFyaWFibGVOYW1lfSBpcyBhbiBhbGlhcywgd2lsbCBuZWVkIGFzeW5jIHJlc29sdXRpb25gKTtcbiAgICAgICAgICAgIHJldHVybiBgdmFyKC0tJHt2YXJpYWJsZU5hbWUucmVwbGFjZSgvW15hLXpBLVowLTktX10vZywgJy0nKX0pYDtcbiAgICAgICAgfVxuICAgICAgICAvLyBIYW5kbGUgc3RyaW5nIHZhbHVlc1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY29uc3QgdHJpbW1lZCA9IHZhbHVlLnRyaW0oKTtcbiAgICAgICAgICAgIC8vIFNoYWRDTiBIU0wgZm9ybWF0IGNvbnZlcnNpb25cbiAgICAgICAgICAgIGNvbnN0IGhzbE1hdGNoID0gdHJpbW1lZC5tYXRjaCgvXihbKy1dP1tcXGQuXSspXFxzKyhbKy1dP1tcXGQuXSspJVxccysoWystXT9bXFxkLl0rKSUkLyk7XG4gICAgICAgICAgICBpZiAoaHNsTWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBbLCBoLCBzLCBsXSA9IGhzbE1hdGNoO1xuICAgICAgICAgICAgICAgIHJldHVybiBgaHNsKCR7aH0sICR7c30lLCAke2x9JSlgO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gUmV0dXJuIG90aGVyIHN0cmluZyBmb3JtYXRzIGFzLWlzXG4gICAgICAgICAgICByZXR1cm4gdHJpbW1lZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGxvZ2dlci5lcnJvcihgRXJyb3IgZXh0cmFjdGluZyBjb2xvciB2YWx1ZSBmb3IgJHt2YXJpYWJsZU5hbWV9OmAsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuLy8gU2NhbiBsb2NhbCB2YXJpYWJsZXMgd2l0aCBpbXByb3ZlZCBkZXRlY3Rpb25cbmFzeW5jIGZ1bmN0aW9uIHNjYW5Mb2NhbFZhcmlhYmxlcyh0b2tlbnMpIHtcbiAgICB0cnkge1xuICAgICAgICBsb2dnZXIubG9nKCdTY2FubmluZyBsb2NhbCB2YXJpYWJsZXMuLi4nKTtcbiAgICAgICAgY29uc3QgdmFyaWFibGVzID0gYXdhaXQgZmlnbWEudmFyaWFibGVzLmdldExvY2FsVmFyaWFibGVzQXN5bmMoKTtcbiAgICAgICAgY29uc3QgY29sbGVjdGlvbnMgPSBhd2FpdCBmaWdtYS52YXJpYWJsZXMuZ2V0TG9jYWxWYXJpYWJsZUNvbGxlY3Rpb25zQXN5bmMoKTtcbiAgICAgICAgbG9nZ2VyLmxvZyhgRm91bmQgJHt2YXJpYWJsZXMubGVuZ3RofSBsb2NhbCB2YXJpYWJsZXMgYWNyb3NzICR7Y29sbGVjdGlvbnMubGVuZ3RofSBjb2xsZWN0aW9uc2ApO1xuICAgICAgICBmb3IgKGNvbnN0IHZhcmlhYmxlIG9mIHZhcmlhYmxlcykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uID0gY29sbGVjdGlvbnMuZmluZCgoYykgPT4gYy5pZCA9PT0gdmFyaWFibGUudmFyaWFibGVDb2xsZWN0aW9uSWQpO1xuICAgICAgICAgICAgICAgIGlmICghY29sbGVjdGlvbilcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgLy8gRGV0ZXJtaW5lIGlmIHRoaXMgdmFyaWFibGUgaXMgY29sb3ItcmVsYXRlZFxuICAgICAgICAgICAgICAgIGNvbnN0IGlzQ29sb3IgPSB2YXJpYWJsZS5yZXNvbHZlZFR5cGUgPT09ICdDT0xPUicgfHxcbiAgICAgICAgICAgICAgICAgICAgaXNDb2xvclZhbHVlKE9iamVjdC52YWx1ZXModmFyaWFibGUudmFsdWVzQnlNb2RlKVswXSwgdmFyaWFibGUubmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc0NvbG9yKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTsgLy8gU2tpcCBub24tY29sb3IgdmFyaWFibGVzIGZvciBjb2xvciBzY2FubmluZ1xuICAgICAgICAgICAgICAgIGxvZ2dlci5sb2coYFByb2Nlc3NpbmcgY29sb3IgdmFyaWFibGU6ICR7dmFyaWFibGUubmFtZX0gaW4gY29sbGVjdGlvbjogJHtjb2xsZWN0aW9uLm5hbWV9YCk7XG4gICAgICAgICAgICAgICAgLy8gRW5oYW5jZWQgbW9kZSBkZXRlY3Rpb25cbiAgICAgICAgICAgICAgICBjb25zdCBtb2RlcyA9IGNvbGxlY3Rpb24ubW9kZXM7XG4gICAgICAgICAgICAgICAgY29uc3QgbGlnaHRNb2RlID0gbW9kZXMuZmluZCgobSkgPT4gbS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2xpZ2h0JykgfHxcbiAgICAgICAgICAgICAgICAgICAgbS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2RlZmF1bHQnKSB8fFxuICAgICAgICAgICAgICAgICAgICBtLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnZGF5JykgfHxcbiAgICAgICAgICAgICAgICAgICAgbW9kZXMubGVuZ3RoID09PSAxKTtcbiAgICAgICAgICAgICAgICBjb25zdCBkYXJrTW9kZSA9IG1vZGVzLmZpbmQoKG0pID0+IG0ubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdkYXJrJykgfHxcbiAgICAgICAgICAgICAgICAgICAgbS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ25pZ2h0JykpO1xuICAgICAgICAgICAgICAgIC8vIENsZWFuIHZhcmlhYmxlIG5hbWUgLSByZW1vdmUgY29tbW9uIHByZWZpeGVzIGZsZXhpYmx5XG4gICAgICAgICAgICAgICAgbGV0IGNsZWFuTmFtZSA9IHZhcmlhYmxlLm5hbWU7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJlZml4ZXMgPSBbJ2Jhc2UvJywgJ2NvbG9yLycsICdjb2xvcnMvJywgJ3NlbWFudGljLycsICdwcmltaXRpdmUvJywgJ3N5cy8nLCAncmVmLyddO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcHJlZml4IG9mIHByZWZpeGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjbGVhbk5hbWUuc3RhcnRzV2l0aChwcmVmaXgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhbk5hbWUgPSBjbGVhbk5hbWUuc3Vic3RyaW5nKHByZWZpeC5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gUHJvY2VzcyBtb2Rlc1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgbW9kZSBvZiBtb2Rlcykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHZhcmlhYmxlLnZhbHVlc0J5TW9kZVttb2RlLm1vZGVJZF07XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpc3BsYXlWYWx1ZSA9IGF3YWl0IGV4dHJhY3RDb2xvclZhbHVlRW5oYW5jZWQodmFsdWUsIHZhcmlhYmxlLm5hbWUsIHZhcmlhYmxlcyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZGlzcGxheVZhbHVlIHx8IGRpc3BsYXlWYWx1ZSA9PT0gJ0ludmFsaWQgQ29sb3InKVxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRva2VuID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogY2xlYW5OYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGRpc3BsYXlWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdjb2xvcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5VmFsdWU6IGRpc3BsYXlWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiAnQ29sb3JzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogYFZhcmlhYmxlIENvbGxlY3Rpb246ICR7Y29sbGVjdGlvbi5uYW1lfWAsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2F0ZWdvcml6ZSBieSBtb2RlXG4gICAgICAgICAgICAgICAgICAgIGlmIChsaWdodE1vZGUgJiYgbW9kZS5tb2RlSWQgPT09IGxpZ2h0TW9kZS5tb2RlSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vucy5saWdodC5wdXNoKHRva2VuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci5sb2coYOKckyBBZGRlZCBsaWdodCB2YXJpYWJsZTogJHtjbGVhbk5hbWV9ID0gJHtkaXNwbGF5VmFsdWV9YCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoZGFya01vZGUgJiYgbW9kZS5tb2RlSWQgPT09IGRhcmtNb2RlLm1vZGVJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zLmRhcmsucHVzaCh0b2tlbik7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIubG9nKGDinJMgQWRkZWQgZGFyayB2YXJpYWJsZTogJHtjbGVhbk5hbWV9ID0gJHtkaXNwbGF5VmFsdWV9YCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnMuZ2xvYmFsLnB1c2godG9rZW4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmxvZyhg4pyTIEFkZGVkIGdsb2JhbCB2YXJpYWJsZTogJHtjbGVhbk5hbWV9ID0gJHtkaXNwbGF5VmFsdWV9YCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoYEVycm9yIHByb2Nlc3NpbmcgdmFyaWFibGUgJHt2YXJpYWJsZS5uYW1lfTpgLCBlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3Igc2Nhbm5pbmcgbG9jYWwgdmFyaWFibGVzOicsIGVycm9yKTtcbiAgICB9XG59XG4vLyBTY2FuIHBhaW50IHN0eWxlc1xuYXN5bmMgZnVuY3Rpb24gc2NhblBhaW50U3R5bGVzKHRva2Vucykge1xuICAgIHRyeSB7XG4gICAgICAgIGxvZ2dlci5sb2coJ1NjYW5uaW5nIHBhaW50IHN0eWxlcy4uLicpO1xuICAgICAgICBjb25zdCBwYWludFN0eWxlcyA9IGF3YWl0IGZpZ21hLmdldExvY2FsUGFpbnRTdHlsZXNBc3luYygpO1xuICAgICAgICBsb2dnZXIubG9nKGBGb3VuZCAke3BhaW50U3R5bGVzLmxlbmd0aH0gbG9jYWwgcGFpbnQgc3R5bGVzYCk7XG4gICAgICAgIGZvciAoY29uc3Qgc3R5bGUgb2YgcGFpbnRTdHlsZXMpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgc3R5bGUgaGFzIGNvbG9yIHBhaW50c1xuICAgICAgICAgICAgICAgIGlmICghc3R5bGUucGFpbnRzIHx8IHN0eWxlLnBhaW50cy5sZW5ndGggPT09IDApXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3R5bGUucGFpbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhaW50ID0gc3R5bGUucGFpbnRzW2ldO1xuICAgICAgICAgICAgICAgICAgICAvLyBPbmx5IHByb2Nlc3Mgc29saWQgY29sb3IgcGFpbnRzIGZvciBub3dcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhaW50LnR5cGUgIT09ICdTT0xJRCcpXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29sb3JWYWx1ZSA9IGV4dHJhY3RDb2xvclZhbHVlRW5oYW5jZWRTeW5jKHBhaW50LmNvbG9yLCBzdHlsZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjb2xvclZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIENsZWFuIHN0eWxlIG5hbWVcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNsZWFuTmFtZSA9IHN0eWxlLm5hbWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBjb21tb24gc3R5bGUgcHJlZml4ZXMvc3VmZml4ZXNcbiAgICAgICAgICAgICAgICAgICAgY2xlYW5OYW1lID0gY2xlYW5OYW1lLnJlcGxhY2UoL14oc3R5bGV8Y29sb3J8cGFpbnQpWy1fXFxzXSp8Wy1fXFxzXSooc3R5bGV8Y29sb3J8cGFpbnQpJC9naSwgJycpO1xuICAgICAgICAgICAgICAgICAgICBjbGVhbk5hbWUgPSBjbGVhbk5hbWUudHJpbSgpIHx8IHN0eWxlLm5hbWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFkZCBpbmRleCBpZiBtdWx0aXBsZSBwYWludHNcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzcGxheU5hbWUgPSBzdHlsZS5wYWludHMubGVuZ3RoID4gMSA/IGAke2NsZWFuTmFtZX0tJHtpICsgMX1gIDogY2xlYW5OYW1lO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0b2tlbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGRpc3BsYXlOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGNvbG9yVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY29sb3InLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheVZhbHVlOiBjb2xvclZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnk6ICdDb2xvcnMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiBgUGFpbnQgU3R5bGU6ICR7c3R5bGUubmFtZX1gLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbjogJ1BhaW50IFN0eWxlcydcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgLy8gRGV0ZXJtaW5lIGNhdGVnb3J5IGJhc2VkIG9uIHN0eWxlIG5hbWVcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZUxvd2VyID0gc3R5bGUubmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobmFtZUxvd2VyLmluY2x1ZGVzKCdkYXJrJykgfHwgbmFtZUxvd2VyLmluY2x1ZGVzKCduaWdodCcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnMuZGFyay5wdXNoKHRva2VuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci5sb2coYOKckyBBZGRlZCBkYXJrIHN0eWxlOiAke2Rpc3BsYXlOYW1lfSA9ICR7Y29sb3JWYWx1ZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChuYW1lTG93ZXIuaW5jbHVkZXMoJ2xpZ2h0JykgfHwgbmFtZUxvd2VyLmluY2x1ZGVzKCdkYXknKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zLmxpZ2h0LnB1c2godG9rZW4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmxvZyhg4pyTIEFkZGVkIGxpZ2h0IHN0eWxlOiAke2Rpc3BsYXlOYW1lfSA9ICR7Y29sb3JWYWx1ZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vucy5nbG9iYWwucHVzaCh0b2tlbik7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIubG9nKGDinJMgQWRkZWQgZ2xvYmFsIHN0eWxlOiAke2Rpc3BsYXlOYW1lfSA9ICR7Y29sb3JWYWx1ZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcihgRXJyb3IgcHJvY2Vzc2luZyBwYWludCBzdHlsZSAke3N0eWxlLm5hbWV9OmAsIGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBzY2FubmluZyBwYWludCBzdHlsZXM6JywgZXJyb3IpO1xuICAgIH1cbn1cbi8vIFNjYW4gcHVibGlzaGVkIGxpYnJhcnkgdmFyaWFibGVzXG5hc3luYyBmdW5jdGlvbiBzY2FuUHVibGlzaGVkTGlicmFyeVZhcmlhYmxlcyh0b2tlbnMpIHtcbiAgICB0cnkge1xuICAgICAgICBsb2dnZXIubG9nKCdTY2FubmluZyBmb3IgcHVibGlzaGVkIGxpYnJhcnkgdmFyaWFibGVzLi4uJyk7XG4gICAgICAgIC8vIEdldCBhbGwgdmFyaWFibGUgY29sbGVjdGlvbnMgKGluY2x1ZGluZyBpbXBvcnRlZCBvbmVzKVxuICAgICAgICAvLyBOb3RlOiBUaGlzIGlzIGEgc2ltcGxpZmllZCBhcHByb2FjaCAtIGluIHByYWN0aWNlLCB3ZSdkIG5lZWQgdG8ga25vd1xuICAgICAgICAvLyBzcGVjaWZpYyBsaWJyYXJ5IGtleXMgb3IgaXRlcmF0ZSB0aHJvdWdoIGtub3duIHB1Ymxpc2hlZCBjb2xsZWN0aW9uc1xuICAgICAgICAvLyBGb3Igbm93LCB3ZSBjYW4gbG9vayBmb3IgdmFyaWFibGUgYWxpYXNlcyB0aGF0IHJlZmVyZW5jZSBleHRlcm5hbCB2YXJpYWJsZXNcbiAgICAgICAgLy8gYW5kIGF0dGVtcHQgdG8gcmVzb2x2ZSB0aGVtXG4gICAgICAgIGNvbnN0IHZhcmlhYmxlcyA9IGF3YWl0IGZpZ21hLnZhcmlhYmxlcy5nZXRMb2NhbFZhcmlhYmxlc0FzeW5jKCk7XG4gICAgICAgIGNvbnN0IGV4dGVybmFsQWxpYXNlcyA9IG5ldyBTZXQoKTtcbiAgICAgICAgLy8gRmluZCBhbGwgZXh0ZXJuYWwgdmFyaWFibGUgcmVmZXJlbmNlc1xuICAgICAgICBmb3IgKGNvbnN0IHZhcmlhYmxlIG9mIHZhcmlhYmxlcykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBbbW9kZUlkLCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXModmFyaWFibGUudmFsdWVzQnlNb2RlKSkge1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmICd0eXBlJyBpbiB2YWx1ZSAmJiB2YWx1ZS50eXBlID09PSAnVkFSSUFCTEVfQUxJQVMnICYmICdpZCcgaW4gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRyeSB0byByZXNvbHZlIHRoZSBhbGlhcyB0byBzZWUgaWYgaXQncyBleHRlcm5hbFxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWxpYXNJZCA9IHZhbHVlLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVmZXJlbmNlZFZhciA9IGF3YWl0IGZpZ21hLnZhcmlhYmxlcy5nZXRWYXJpYWJsZUJ5SWRBc3luYyhhbGlhc0lkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVmZXJlbmNlZFZhcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgbWlnaHQgYmUgYW4gZXh0ZXJuYWwgdmFyaWFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRlcm5hbEFsaWFzZXMuYWRkKGFsaWFzSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci5sb2coYEZvdW5kIHBvdGVudGlhbCBleHRlcm5hbCB2YXJpYWJsZSByZWZlcmVuY2U6ICR7YWxpYXNJZH1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFZhcmlhYmxlIG5vdCBmb3VuZCBsb2NhbGx5LCBsaWtlbHkgZXh0ZXJuYWxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFsaWFzSWQgPSB2YWx1ZS5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dGVybmFsQWxpYXNlcy5hZGQoYWxpYXNJZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbG9nZ2VyLmxvZyhgRm91bmQgJHtleHRlcm5hbEFsaWFzZXMuc2l6ZX0gcG90ZW50aWFsIGV4dGVybmFsIHZhcmlhYmxlIHJlZmVyZW5jZXNgKTtcbiAgICAgICAgLy8gQXR0ZW1wdCB0byBpbXBvcnQgYW5kIHByb2Nlc3MgZXh0ZXJuYWwgdmFyaWFibGVzXG4gICAgICAgIGNvbnN0IGFsaWFzQXJyYXkgPSBBcnJheS5mcm9tKGV4dGVybmFsQWxpYXNlcyk7XG4gICAgICAgIGZvciAoY29uc3QgYWxpYXNJZCBvZiBhbGlhc0FycmF5KSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIE5vdGU6IFRoaXMgcmVxdWlyZXMgdGhlIGltcG9ydFZhcmlhYmxlQnlLZXlBc3luYyBtZXRob2RcbiAgICAgICAgICAgICAgICAvLyB3aGljaCBuZWVkcyB0aGUgdmFyaWFibGUga2V5LCBub3QgSURcbiAgICAgICAgICAgICAgICBsb2dnZXIubG9nKGBBdHRlbXB0aW5nIHRvIHJlc29sdmUgZXh0ZXJuYWwgdmFyaWFibGU6ICR7YWxpYXNJZH1gKTtcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGEgcGxhY2Vob2xkZXIgLSBhY3R1YWwgaW1wbGVtZW50YXRpb24gd291bGQgZGVwZW5kIG9uXG4gICAgICAgICAgICAgICAgLy8gaGF2aW5nIHRoZSBwcm9wZXIgdmFyaWFibGUga2V5cyBmcm9tIHRoZSB0ZWFtIGxpYnJhcnlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKGBDb3VsZCBub3QgcmVzb2x2ZSBleHRlcm5hbCB2YXJpYWJsZSAke2FsaWFzSWR9OmAsIGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBzY2FubmluZyBwdWJsaXNoZWQgbGlicmFyeSB2YXJpYWJsZXM6JywgZXJyb3IpO1xuICAgIH1cbn1cbi8vIEZhbGxiYWNrIGJhc2ljIHNjYW5uaW5nIGZ1bmN0aW9uIChvcmlnaW5hbCBpbXBsZW1lbnRhdGlvbilcbmFzeW5jIGZ1bmN0aW9uIHNjYW5FeGlzdGluZ1ZhcmlhYmxlc0Jhc2ljKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHZhcmlhYmxlcyA9IGF3YWl0IGZpZ21hLnZhcmlhYmxlcy5nZXRMb2NhbFZhcmlhYmxlc0FzeW5jKCk7XG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb25zID0gYXdhaXQgZmlnbWEudmFyaWFibGVzLmdldExvY2FsVmFyaWFibGVDb2xsZWN0aW9uc0FzeW5jKCk7XG4gICAgICAgIGxvZ2dlci5sb2coJz09PSBCQVNJQyBTQ0FOTklORyAoRkFMTEJBQ0spID09PScpO1xuICAgICAgICBsb2dnZXIubG9nKGBGb3VuZCAke3ZhcmlhYmxlcy5sZW5ndGh9IHZhcmlhYmxlcyBhY3Jvc3MgJHtjb2xsZWN0aW9ucy5sZW5ndGh9IGNvbGxlY3Rpb25zYCk7XG4gICAgICAgIGNvbnN0IHRva2VucyA9IHtcbiAgICAgICAgICAgIGxpZ2h0OiBbXSxcbiAgICAgICAgICAgIGRhcms6IFtdLFxuICAgICAgICAgICAgZ2xvYmFsOiBbXVxuICAgICAgICB9O1xuICAgICAgICAvLyBQcm9jZXNzIGVhY2ggdmFyaWFibGUgd2l0aCBiYXNpYyBsb2dpY1xuICAgICAgICBmb3IgKGNvbnN0IHZhcmlhYmxlIG9mIHZhcmlhYmxlcykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uID0gY29sbGVjdGlvbnMuZmluZCgoYykgPT4gYy5pZCA9PT0gdmFyaWFibGUudmFyaWFibGVDb2xsZWN0aW9uSWQpO1xuICAgICAgICAgICAgICAgIGlmICghY29sbGVjdGlvbilcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgLy8gT25seSBwcm9jZXNzIENPTE9SIHR5cGUgdmFyaWFibGVzIGluIGJhc2ljIG1vZGVcbiAgICAgICAgICAgICAgICBpZiAodmFyaWFibGUucmVzb2x2ZWRUeXBlICE9PSAnQ09MT1InKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBsb2dnZXIubG9nKGBQcm9jZXNzaW5nIHZhcmlhYmxlOiAke3ZhcmlhYmxlLm5hbWV9ICgke3ZhcmlhYmxlLnJlc29sdmVkVHlwZX0pIGluIGNvbGxlY3Rpb246ICR7Y29sbGVjdGlvbi5uYW1lfWApO1xuICAgICAgICAgICAgICAgIC8vIEZpbmQgbGlnaHQgYW5kIGRhcmsgbW9kZXNcbiAgICAgICAgICAgICAgICBjb25zdCBsaWdodE1vZGUgPSBjb2xsZWN0aW9uLm1vZGVzLmZpbmQoKG0pID0+IG0ubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdsaWdodCcpIHx8XG4gICAgICAgICAgICAgICAgICAgIG0ubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdkZWZhdWx0JykgfHxcbiAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbi5tb2Rlcy5sZW5ndGggPT09IDEpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhcmtNb2RlID0gY29sbGVjdGlvbi5tb2Rlcy5maW5kKChtKSA9PiBtLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnZGFyaycpIHx8XG4gICAgICAgICAgICAgICAgICAgIG0ubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCduaWdodCcpKTtcbiAgICAgICAgICAgICAgICAvLyBDbGVhbiB2YXJpYWJsZSBuYW1lXG4gICAgICAgICAgICAgICAgbGV0IGNsZWFuTmFtZSA9IHZhcmlhYmxlLm5hbWU7XG4gICAgICAgICAgICAgICAgaWYgKGNsZWFuTmFtZS5zdGFydHNXaXRoKCdiYXNlLycpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFuTmFtZSA9IGNsZWFuTmFtZS5zdWJzdHJpbmcoNSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChjbGVhbk5hbWUuc3RhcnRzV2l0aCgnY29sb3IvJykpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYW5OYW1lID0gY2xlYW5OYW1lLnN1YnN0cmluZyg2KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gUHJvY2VzcyBsaWdodCBtb2RlIHZhbHVlc1xuICAgICAgICAgICAgICAgIGlmIChsaWdodE1vZGUgJiYgdmFyaWFibGUudmFsdWVzQnlNb2RlW2xpZ2h0TW9kZS5tb2RlSWRdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbGlnaHRWYWx1ZSA9IHZhcmlhYmxlLnZhbHVlc0J5TW9kZVtsaWdodE1vZGUubW9kZUlkXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzcGxheVZhbHVlID0gZXh0cmFjdENvbG9yVmFsdWVFbmhhbmNlZFN5bmMobGlnaHRWYWx1ZSwgdmFyaWFibGUubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXNwbGF5VmFsdWUgJiYgZGlzcGxheVZhbHVlICE9PSAnSW52YWxpZCBDb2xvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vucy5saWdodC5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBjbGVhbk5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGRpc3BsYXlWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY29sb3InLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXlWYWx1ZTogZGlzcGxheVZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiAnQ29sb3JzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIubG9nKGDinJMgQWRkZWQgbGlnaHQgbW9kZTogJHtjbGVhbk5hbWV9ID0gJHtkaXNwbGF5VmFsdWV9YCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gUHJvY2VzcyBkYXJrIG1vZGUgdmFsdWVzXG4gICAgICAgICAgICAgICAgaWYgKGRhcmtNb2RlICYmIHZhcmlhYmxlLnZhbHVlc0J5TW9kZVtkYXJrTW9kZS5tb2RlSWRdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGFya1ZhbHVlID0gdmFyaWFibGUudmFsdWVzQnlNb2RlW2RhcmtNb2RlLm1vZGVJZF07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpc3BsYXlWYWx1ZSA9IGV4dHJhY3RDb2xvclZhbHVlRW5oYW5jZWRTeW5jKGRhcmtWYWx1ZSwgdmFyaWFibGUubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXNwbGF5VmFsdWUgJiYgZGlzcGxheVZhbHVlICE9PSAnSW52YWxpZCBDb2xvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vucy5kYXJrLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGNsZWFuTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZGlzcGxheVZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdjb2xvcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheVZhbHVlOiBkaXNwbGF5VmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnk6ICdDb2xvcnMnXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci5sb2coYOKckyBBZGRlZCBkYXJrIG1vZGU6ICR7Y2xlYW5OYW1lfSA9ICR7ZGlzcGxheVZhbHVlfWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIElmIG5vIHNwZWNpZmljIGxpZ2h0L2RhcmsgbW9kZSwgdHJlYXQgYXMgZ2xvYmFsXG4gICAgICAgICAgICAgICAgaWYgKCFsaWdodE1vZGUgJiYgIWRhcmtNb2RlICYmIGNvbGxlY3Rpb24ubW9kZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaXJzdE1vZGUgPSBjb2xsZWN0aW9uLm1vZGVzWzBdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHZhcmlhYmxlLnZhbHVlc0J5TW9kZVtmaXJzdE1vZGUubW9kZUlkXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpc3BsYXlWYWx1ZSA9IGV4dHJhY3RDb2xvclZhbHVlRW5oYW5jZWRTeW5jKHZhbHVlLCB2YXJpYWJsZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkaXNwbGF5VmFsdWUgJiYgZGlzcGxheVZhbHVlICE9PSAnSW52YWxpZCBDb2xvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnMuZ2xvYmFsLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBjbGVhbk5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBkaXNwbGF5VmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdjb2xvcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXlWYWx1ZTogZGlzcGxheVZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogJ0NvbG9ycydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIubG9nKGDinJMgQWRkZWQgZ2xvYmFsOiAke2NsZWFuTmFtZX0gPSAke2Rpc3BsYXlWYWx1ZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcihgRXJyb3IgcHJvY2Vzc2luZyB2YXJpYWJsZSAke3ZhcmlhYmxlLm5hbWV9OmAsIGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsb2dnZXIubG9nKCc9PT0gQkFTSUMgU0NBTiBDT01QTEVURSA9PT0nKTtcbiAgICAgICAgbG9nZ2VyLmxvZyhgTGlnaHQgdG9rZW5zOiAke3Rva2Vucy5saWdodC5sZW5ndGh9YCk7XG4gICAgICAgIGxvZ2dlci5sb2coYERhcmsgdG9rZW5zOiAke3Rva2Vucy5kYXJrLmxlbmd0aH1gKTtcbiAgICAgICAgbG9nZ2VyLmxvZyhgR2xvYmFsIHRva2VuczogJHt0b2tlbnMuZ2xvYmFsLmxlbmd0aH1gKTtcbiAgICAgICAgcmV0dXJuIHRva2VucztcbiAgICB9XG4gICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3IgaW4gYmFzaWMgc2Nhbm5pbmc6JywgZXJyb3IpO1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG59XG4vLyBGdW5jdGlvbiB0byBzY2FuIHRleHQgc3R5bGVzIGZyb20gdGhlIGN1cnJlbnQgZmlsZVxuYXN5bmMgZnVuY3Rpb24gc2NhblRleHRTdHlsZXMoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdGV4dFN0eWxlcyA9IGF3YWl0IGZpZ21hLmdldExvY2FsVGV4dFN0eWxlc0FzeW5jKCk7XG4gICAgICAgIGNvbnN0IHRleHRWYXJpYWJsZXMgPSBhd2FpdCBmaWdtYS52YXJpYWJsZXMuZ2V0TG9jYWxWYXJpYWJsZXNBc3luYygpO1xuICAgICAgICAvLyBGaWx0ZXIgZm9yIHN0cmluZy90ZXh0IHZhcmlhYmxlc1xuICAgICAgICBjb25zdCBzdHJpbmdWYXJpYWJsZXMgPSB0ZXh0VmFyaWFibGVzLmZpbHRlcigodmFyaWFibGUpID0+IHZhcmlhYmxlLnJlc29sdmVkVHlwZSA9PT0gJ1NUUklORycgfHxcbiAgICAgICAgICAgIHZhcmlhYmxlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnZm9udCcpIHx8XG4gICAgICAgICAgICB2YXJpYWJsZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ3RleHQnKSk7XG4gICAgICAgIGNvbnN0IHByb2Nlc3NlZFN0eWxlcyA9IHRleHRTdHlsZXMubWFwKChzdHlsZSkgPT4gKHtcbiAgICAgICAgICAgIGlkOiBzdHlsZS5pZCxcbiAgICAgICAgICAgIG5hbWU6IHN0eWxlLm5hbWUsXG4gICAgICAgICAgICBmb250U2l6ZTogc3R5bGUuZm9udFNpemUsXG4gICAgICAgICAgICBmb250TmFtZTogc3R5bGUuZm9udE5hbWUsXG4gICAgICAgICAgICBsZXR0ZXJTcGFjaW5nOiBzdHlsZS5sZXR0ZXJTcGFjaW5nLFxuICAgICAgICAgICAgbGluZUhlaWdodDogc3R5bGUubGluZUhlaWdodCxcbiAgICAgICAgICAgIHRleHREZWNvcmF0aW9uOiBzdHlsZS50ZXh0RGVjb3JhdGlvbixcbiAgICAgICAgICAgIHRleHRDYXNlOiBzdHlsZS50ZXh0Q2FzZSxcbiAgICAgICAgICAgIGZpbGxzOiBzdHlsZS5maWxsc1xuICAgICAgICB9KSk7XG4gICAgICAgIGNvbnN0IHByb2Nlc3NlZFZhcmlhYmxlcyA9IHN0cmluZ1ZhcmlhYmxlcy5tYXAoKHZhcmlhYmxlKSA9PiAoe1xuICAgICAgICAgICAgaWQ6IHZhcmlhYmxlLmlkLFxuICAgICAgICAgICAgbmFtZTogdmFyaWFibGUubmFtZSxcbiAgICAgICAgICAgIHJlc29sdmVkVHlwZTogdmFyaWFibGUucmVzb2x2ZWRUeXBlLFxuICAgICAgICAgICAgdmFsdWVzQnlNb2RlOiB2YXJpYWJsZS52YWx1ZXNCeU1vZGVcbiAgICAgICAgfSkpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3R5bGVzOiBwcm9jZXNzZWRTdHlsZXMsXG4gICAgICAgICAgICB2YXJpYWJsZXM6IHByb2Nlc3NlZFZhcmlhYmxlc1xuICAgICAgICB9O1xuICAgIH1cbiAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc2Nhbm5pbmcgdGV4dCBzdHlsZXM6JywgZXJyb3IpO1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG59XG4vLyBGdW5jdGlvbiB0byBnZW5lcmF0ZSB0eXBvZ3JhcGh5IGd1aWRlIG9uIGNhbnZhc1xuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVUeXBvZ3JhcGh5R3VpZGUoc3R5bGVzLCB2YXJpYWJsZXMpIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBjdXJyZW50UGFnZSA9IGZpZ21hLmN1cnJlbnRQYWdlO1xuICAgICAgICAvLyBDcmVhdGUgYSBmcmFtZSBmb3IgdGhlIHR5cG9ncmFwaHkgZ3VpZGVcbiAgICAgICAgY29uc3QgZ3VpZGVGcmFtZSA9IGZpZ21hLmNyZWF0ZUZyYW1lKCk7XG4gICAgICAgIGd1aWRlRnJhbWUubmFtZSA9ICdUeXBvZ3JhcGh5IEd1aWRlJztcbiAgICAgICAgZ3VpZGVGcmFtZS5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDEsIGc6IDEsIGI6IDEgfSB9XTtcbiAgICAgICAgLy8gUG9zaXRpb24gdGhlIGZyYW1lXG4gICAgICAgIGd1aWRlRnJhbWUueCA9IDEwMDtcbiAgICAgICAgZ3VpZGVGcmFtZS55ID0gMTAwO1xuICAgICAgICBndWlkZUZyYW1lLnJlc2l6ZSg4MDAsIE1hdGgubWF4KDYwMCwgKHN0eWxlcy5sZW5ndGggKyB2YXJpYWJsZXMubGVuZ3RoKSAqIDgwICsgMTAwKSk7XG4gICAgICAgIGN1cnJlbnRQYWdlLmFwcGVuZENoaWxkKGd1aWRlRnJhbWUpO1xuICAgICAgICBsZXQgY3VycmVudFkgPSA0MDtcbiAgICAgICAgLy8gSGVscGVyIGZ1bmN0aW9uIHRvIHNhZmVseSBsb2FkIGZvbnRzIHdpdGggZmFsbGJhY2tzXG4gICAgICAgIGNvbnN0IHNhZmVMb2FkRm9udCA9IGFzeW5jIChmb250TmFtZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBmaWdtYS5sb2FkRm9udEFzeW5jKGZvbnROYW1lKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm9udE5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYENvdWxkIG5vdCBsb2FkIGZvbnQgJHtmb250TmFtZS5mYW1pbHl9ICR7Zm9udE5hbWUuc3R5bGV9LCB0cnlpbmcgZmFsbGJhY2tzLi4uYCk7XG4gICAgICAgICAgICAgICAgLy8gVHJ5IGNvbW1vbiBmYWxsYmFja3MgZm9yIEludGVyXG4gICAgICAgICAgICAgICAgY29uc3QgZmFsbGJhY2tzID0gW1xuICAgICAgICAgICAgICAgICAgICB7IGZhbWlseTogJ0ludGVyJywgc3R5bGU6ICdSZWd1bGFyJyB9LFxuICAgICAgICAgICAgICAgICAgICB7IGZhbWlseTogJ1JvYm90bycsIHN0eWxlOiAnUmVndWxhcicgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBmYW1pbHk6ICdBcmlhbCcsIHN0eWxlOiAnUmVndWxhcicgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBmYW1pbHk6ICdIZWx2ZXRpY2EnLCBzdHlsZTogJ1JlZ3VsYXInIH1cbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZmFsbGJhY2sgb2YgZmFsbGJhY2tzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBmaWdtYS5sb2FkRm9udEFzeW5jKGZhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxsYmFjaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZmFsbGJhY2tFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29udGludWUgdG8gbmV4dCBmYWxsYmFja1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIElmIGFsbCBlbHNlIGZhaWxzLCB1c2UgdGhlIGRlZmF1bHQgc3lzdGVtIGZvbnRcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHN1aXRhYmxlIGZvbnRzIGF2YWlsYWJsZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvLyBBZGQgdGl0bGVcbiAgICAgICAgY29uc3QgdGl0bGVUZXh0ID0gZmlnbWEuY3JlYXRlVGV4dCgpO1xuICAgICAgICBjb25zdCB0aXRsZUZvbnQgPSBhd2FpdCBzYWZlTG9hZEZvbnQoeyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnQm9sZCcgfSk7XG4gICAgICAgIHRpdGxlVGV4dC5mb250TmFtZSA9IHRpdGxlRm9udDtcbiAgICAgICAgdGl0bGVUZXh0LmZvbnRTaXplID0gMjQ7XG4gICAgICAgIHRpdGxlVGV4dC5jaGFyYWN0ZXJzID0gJ1R5cG9ncmFwaHkgR3VpZGUnO1xuICAgICAgICB0aXRsZVRleHQuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLCBnOiAwLCBiOiAwIH0gfV07XG4gICAgICAgIHRpdGxlVGV4dC54ID0gNDA7XG4gICAgICAgIHRpdGxlVGV4dC55ID0gY3VycmVudFk7XG4gICAgICAgIGd1aWRlRnJhbWUuYXBwZW5kQ2hpbGQodGl0bGVUZXh0KTtcbiAgICAgICAgY3VycmVudFkgKz0gNjA7XG4gICAgICAgIC8vIEFkZCB0ZXh0IHN0eWxlcyBzZWN0aW9uXG4gICAgICAgIGlmIChzdHlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3Qgc3R5bGVzSGVhZGVyID0gZmlnbWEuY3JlYXRlVGV4dCgpO1xuICAgICAgICAgICAgY29uc3QgaGVhZGVyRm9udCA9IGF3YWl0IHNhZmVMb2FkRm9udCh7IGZhbWlseTogJ0ludGVyJywgc3R5bGU6ICdTZW1pIEJvbGQnIH0pO1xuICAgICAgICAgICAgc3R5bGVzSGVhZGVyLmZvbnROYW1lID0gaGVhZGVyRm9udDtcbiAgICAgICAgICAgIHN0eWxlc0hlYWRlci5mb250U2l6ZSA9IDE4O1xuICAgICAgICAgICAgc3R5bGVzSGVhZGVyLmNoYXJhY3RlcnMgPSBgVGV4dCBTdHlsZXMgKCR7c3R5bGVzLmxlbmd0aH0pYDtcbiAgICAgICAgICAgIHN0eWxlc0hlYWRlci5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuMiwgZzogMC4yLCBiOiAwLjIgfSB9XTtcbiAgICAgICAgICAgIHN0eWxlc0hlYWRlci54ID0gNDA7XG4gICAgICAgICAgICBzdHlsZXNIZWFkZXIueSA9IGN1cnJlbnRZO1xuICAgICAgICAgICAgZ3VpZGVGcmFtZS5hcHBlbmRDaGlsZChzdHlsZXNIZWFkZXIpO1xuICAgICAgICAgICAgY3VycmVudFkgKz0gNDA7XG4gICAgICAgICAgICAvLyBBZGQgZWFjaCB0ZXh0IHN0eWxlXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHN0eWxlIG9mIHN0eWxlcykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIExvYWQgdGhlIGZvbnQgZm9yIHRoaXMgc3R5bGUgd2l0aCBmYWxsYmFja1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdHlsZUZvbnQgPSBhd2FpdCBzYWZlTG9hZEZvbnQoc3R5bGUuZm9udE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAvLyBIZWxwZXIgZnVuY3Rpb24gdG8gY2xlYW4gdXAgc3R5bGUgbmFtZVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjbGVhblN0eWxlTmFtZSA9IChzdHlsZU5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBmb250IGZhbWlseSBmcm9tIHN0eWxlIG5hbWUgaWYgaXQncyByZWR1bmRhbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnRzID0gc3R5bGVOYW1lLnNwbGl0KCcvJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFydHMubGVuZ3RoID4gMSA/IHBhcnRzW3BhcnRzLmxlbmd0aCAtIDFdIDogc3R5bGVOYW1lO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBIZWxwZXIgZnVuY3Rpb24gdG8gZm9ybWF0IGxpbmUgaGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1hdExpbmVIZWlnaHQgPSAobGluZUhlaWdodCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFsaW5lSGVpZ2h0IHx8IGxpbmVIZWlnaHQgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ0F1dG8nO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBsaW5lSGVpZ2h0ID09PSAnb2JqZWN0JyAmJiBsaW5lSGVpZ2h0LnVuaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobGluZUhlaWdodC51bml0ID09PSAnUEVSQ0VOVCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGAke01hdGgucm91bmQobGluZUhlaWdodC52YWx1ZSl9JWA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGxpbmVIZWlnaHQudW5pdCA9PT0gJ1BJWEVMUycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGAke2xpbmVIZWlnaHQudmFsdWV9cHhgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbGluZUhlaWdodCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYCR7TWF0aC5yb3VuZChsaW5lSGVpZ2h0KX0lYDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnQXV0byc7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIC8vIEhlbHBlciBmdW5jdGlvbiB0byBmb3JtYXQgbGV0dGVyIHNwYWNpbmdcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZm9ybWF0TGV0dGVyU3BhY2luZyA9IChsZXR0ZXJTcGFjaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWxldHRlclNwYWNpbmcgfHwgbGV0dGVyU3BhY2luZyA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnMCc7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGxldHRlclNwYWNpbmcgPT09ICdvYmplY3QnICYmIGxldHRlclNwYWNpbmcudW5pdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsZXR0ZXJTcGFjaW5nLnVuaXQgPT09ICdQRVJDRU5UJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYCR7bGV0dGVyU3BhY2luZy52YWx1ZS50b0ZpeGVkKDEpfSVgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChsZXR0ZXJTcGFjaW5nLnVuaXQgPT09ICdQSVhFTFMnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBgJHtsZXR0ZXJTcGFjaW5nLnZhbHVlfXB4YDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGxldHRlclNwYWNpbmcgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGAke2xldHRlclNwYWNpbmcudG9GaXhlZCgxKX1weGA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJzAnO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUgY2xlYW4gc3R5bGUgbmFtZSAoZmlyc3Qgcm93KVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdHlsZU5hbWVUZXh0ID0gZmlnbWEuY3JlYXRlVGV4dCgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuYW1lRm9udCA9IGF3YWl0IHNhZmVMb2FkRm9udCh7IGZhbWlseTogJ0ludGVyJywgc3R5bGU6ICdTZW1pIEJvbGQnIH0pO1xuICAgICAgICAgICAgICAgICAgICBzdHlsZU5hbWVUZXh0LmZvbnROYW1lID0gbmFtZUZvbnQ7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlTmFtZVRleHQuZm9udFNpemUgPSAxMztcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVOYW1lVGV4dC5jaGFyYWN0ZXJzID0gY2xlYW5TdHlsZU5hbWUoc3R5bGUubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlTmFtZVRleHQuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLjEsIGc6IDAuMSwgYjogMC4xIH0gfV07XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlTmFtZVRleHQueCA9IDQwO1xuICAgICAgICAgICAgICAgICAgICBzdHlsZU5hbWVUZXh0LnkgPSBjdXJyZW50WTtcbiAgICAgICAgICAgICAgICAgICAgZ3VpZGVGcmFtZS5hcHBlbmRDaGlsZChzdHlsZU5hbWVUZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFkgKz0gMjI7IC8vIFNwYWNlIGJldHdlZW4gc3R5bGUgbmFtZSBhbmQgc3BlY3NcbiAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGZvbnQgc3BlY2lmaWNhdGlvbnMgKHNlY29uZCByb3cpXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvbnRTcGVjcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIGAke3N0eWxlLmZvbnROYW1lLmZhbWlseX1gLFxuICAgICAgICAgICAgICAgICAgICAgICAgYCR7c3R5bGUuZm9udFNpemV9cHhgLFxuICAgICAgICAgICAgICAgICAgICAgICAgYCR7c3R5bGUuZm9udE5hbWUuc3R5bGV9YCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGBMSDogJHtmb3JtYXRMaW5lSGVpZ2h0KHN0eWxlLmxpbmVIZWlnaHQpfWAsXG4gICAgICAgICAgICAgICAgICAgICAgICBgTFM6ICR7Zm9ybWF0TGV0dGVyU3BhY2luZyhzdHlsZS5sZXR0ZXJTcGFjaW5nKX1gXG4gICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNwZWNzVGV4dCA9IGZpZ21hLmNyZWF0ZVRleHQoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3BlY3NGb250ID0gYXdhaXQgc2FmZUxvYWRGb250KHsgZmFtaWx5OiAnSW50ZXInLCBzdHlsZTogJ1JlZ3VsYXInIH0pO1xuICAgICAgICAgICAgICAgICAgICBzcGVjc1RleHQuZm9udE5hbWUgPSBzcGVjc0ZvbnQ7XG4gICAgICAgICAgICAgICAgICAgIHNwZWNzVGV4dC5mb250U2l6ZSA9IDExO1xuICAgICAgICAgICAgICAgICAgICBzcGVjc1RleHQuY2hhcmFjdGVycyA9IGZvbnRTcGVjcy5qb2luKCcg4oCiICcpO1xuICAgICAgICAgICAgICAgICAgICBzcGVjc1RleHQuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLjUsIGc6IDAuNSwgYjogMC41IH0gfV07XG4gICAgICAgICAgICAgICAgICAgIHNwZWNzVGV4dC54ID0gNDA7XG4gICAgICAgICAgICAgICAgICAgIHNwZWNzVGV4dC55ID0gY3VycmVudFk7XG4gICAgICAgICAgICAgICAgICAgIGd1aWRlRnJhbWUuYXBwZW5kQ2hpbGQoc3BlY3NUZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFkgKz0gMTg7IC8vIFNwYWNlIGJldHdlZW4gc3BlY3MgYW5kIHNhbXBsZSB0ZXh0XG4gICAgICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBzYW1wbGUgdGV4dCAoc2Vjb25kIHJvdylcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2FtcGxlVGV4dCA9IGZpZ21hLmNyZWF0ZVRleHQoKTtcbiAgICAgICAgICAgICAgICAgICAgc2FtcGxlVGV4dC5mb250TmFtZSA9IHN0eWxlRm9udDtcbiAgICAgICAgICAgICAgICAgICAgc2FtcGxlVGV4dC5mb250U2l6ZSA9IHN0eWxlLmZvbnRTaXplIHx8IDE2O1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3R5bGUubGV0dGVyU3BhY2luZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzYW1wbGVUZXh0LmxldHRlclNwYWNpbmcgPSBzdHlsZS5sZXR0ZXJTcGFjaW5nO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdHlsZS5saW5lSGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhbXBsZVRleHQubGluZUhlaWdodCA9IHN0eWxlLmxpbmVIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0eWxlLnRleHREZWNvcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzYW1wbGVUZXh0LnRleHREZWNvcmF0aW9uID0gc3R5bGUudGV4dERlY29yYXRpb247XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0eWxlLnRleHRDYXNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzYW1wbGVUZXh0LnRleHRDYXNlID0gc3R5bGUudGV4dENhc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0eWxlLmZpbGxzICYmIHN0eWxlLmZpbGxzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhbXBsZVRleHQuZmlsbHMgPSBzdHlsZS5maWxscztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhbXBsZVRleHQuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLCBnOiAwLCBiOiAwIH0gfV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gVXNlIGZhbGxiYWNrIG1lc3NhZ2UgaWYgZm9udCBjb3VsZG4ndCBiZSBsb2FkZWQgZXhhY3RseVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmb250TWVzc2FnZSA9IChzdHlsZUZvbnQuZmFtaWx5ID09PSBzdHlsZS5mb250TmFtZS5mYW1pbHkgJiYgc3R5bGVGb250LnN0eWxlID09PSBzdHlsZS5mb250TmFtZS5zdHlsZSlcbiAgICAgICAgICAgICAgICAgICAgICAgID8gJ1RoZSBxdWljayBicm93biBmb3gganVtcHMgb3ZlciB0aGUgbGF6eSBkb2cnXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGBUaGUgcXVpY2sgYnJvd24gZm94IGp1bXBzIG92ZXIgdGhlIGxhenkgZG9nICh1c2luZyAke3N0eWxlRm9udC5mYW1pbHl9ICR7c3R5bGVGb250LnN0eWxlfSlgO1xuICAgICAgICAgICAgICAgICAgICBzYW1wbGVUZXh0LmNoYXJhY3RlcnMgPSBmb250TWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgc2FtcGxlVGV4dC54ID0gNDA7XG4gICAgICAgICAgICAgICAgICAgIHNhbXBsZVRleHQueSA9IGN1cnJlbnRZO1xuICAgICAgICAgICAgICAgICAgICBndWlkZUZyYW1lLmFwcGVuZENoaWxkKHNhbXBsZVRleHQpO1xuICAgICAgICAgICAgICAgICAgICAvLyBNb3ZlIHRvIG5leHQgc3R5bGUgd2l0aCBwcm9wZXIgc3BhY2luZ1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50WSArPSBNYXRoLm1heCg0MCwgKHN0eWxlLmZvbnRTaXplIHx8IDE2KSArIDI1KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGZvbnRFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYENvdWxkIG5vdCBsb2FkIGFueSBmb250IGZvciBzdHlsZSAke3N0eWxlLm5hbWV9OmAsIGZvbnRFcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIC8vIEhlbHBlciBmdW5jdGlvbiB0byBjbGVhbiB1cCBzdHlsZSBuYW1lIChzYW1lIGFzIGFib3ZlKVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjbGVhblN0eWxlTmFtZSA9IChzdHlsZU5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnRzID0gc3R5bGVOYW1lLnNwbGl0KCcvJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFydHMubGVuZ3RoID4gMSA/IHBhcnRzW3BhcnRzLmxlbmd0aCAtIDFdIDogc3R5bGVOYW1lO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUgY2xlYW4gc3R5bGUgbmFtZSAoZmlyc3Qgcm93KVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdHlsZU5hbWVUZXh0ID0gZmlnbWEuY3JlYXRlVGV4dCgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuYW1lRm9udCA9IGF3YWl0IHNhZmVMb2FkRm9udCh7IGZhbWlseTogJ0ludGVyJywgc3R5bGU6ICdTZW1pIEJvbGQnIH0pO1xuICAgICAgICAgICAgICAgICAgICBzdHlsZU5hbWVUZXh0LmZvbnROYW1lID0gbmFtZUZvbnQ7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlTmFtZVRleHQuZm9udFNpemUgPSAxMztcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVOYW1lVGV4dC5jaGFyYWN0ZXJzID0gY2xlYW5TdHlsZU5hbWUoc3R5bGUubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlTmFtZVRleHQuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLjcsIGc6IDAuMywgYjogMC4zIH0gfV07XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlTmFtZVRleHQueCA9IDQwO1xuICAgICAgICAgICAgICAgICAgICBzdHlsZU5hbWVUZXh0LnkgPSBjdXJyZW50WTtcbiAgICAgICAgICAgICAgICAgICAgZ3VpZGVGcmFtZS5hcHBlbmRDaGlsZChzdHlsZU5hbWVUZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFkgKz0gMjI7IC8vIFNwYWNlIGJldHdlZW4gc3R5bGUgbmFtZSBhbmQgZXJyb3IgbWVzc2FnZVxuICAgICAgICAgICAgICAgICAgICAvLyBBZGQgZXJyb3IgaW5mbyAoc2Vjb25kIHJvdylcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyb3JUZXh0ID0gZmlnbWEuY3JlYXRlVGV4dCgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnJvckZvbnQgPSBhd2FpdCBzYWZlTG9hZEZvbnQoeyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnUmVndWxhcicgfSk7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yVGV4dC5mb250TmFtZSA9IGVycm9yRm9udDtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JUZXh0LmZvbnRTaXplID0gMTE7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yVGV4dC5jaGFyYWN0ZXJzID0gYEZvbnQgbm90IGF2YWlsYWJsZTogJHtzdHlsZS5mb250TmFtZS5mYW1pbHl9ICR7c3R5bGUuZm9udE5hbWUuc3R5bGV9YDtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JUZXh0LmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC43LCBnOiAwLjMsIGI6IDAuMyB9IH1dO1xuICAgICAgICAgICAgICAgICAgICBlcnJvclRleHQueCA9IDQwO1xuICAgICAgICAgICAgICAgICAgICBlcnJvclRleHQueSA9IGN1cnJlbnRZO1xuICAgICAgICAgICAgICAgICAgICBndWlkZUZyYW1lLmFwcGVuZENoaWxkKGVycm9yVGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRZICs9IDE4OyAvLyBTcGFjZSBiZXR3ZWVuIGVycm9yIGFuZCBzYW1wbGUgdGV4dFxuICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUgZmFsbGJhY2sgc2FtcGxlIHRleHQgKHRoaXJkIHJvdylcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmFsbGJhY2tUZXh0ID0gZmlnbWEuY3JlYXRlVGV4dCgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmYWxsYmFja0ZvbnQgPSBhd2FpdCBzYWZlTG9hZEZvbnQoeyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnUmVndWxhcicgfSk7XG4gICAgICAgICAgICAgICAgICAgIGZhbGxiYWNrVGV4dC5mb250TmFtZSA9IGZhbGxiYWNrRm9udDtcbiAgICAgICAgICAgICAgICAgICAgZmFsbGJhY2tUZXh0LmZvbnRTaXplID0gc3R5bGUuZm9udFNpemUgfHwgMTY7XG4gICAgICAgICAgICAgICAgICAgIGZhbGxiYWNrVGV4dC5jaGFyYWN0ZXJzID0gJ0ZvbnQgbm90IGF2YWlsYWJsZSAtIHVzaW5nIGZhbGxiYWNrIHRleHQnO1xuICAgICAgICAgICAgICAgICAgICBmYWxsYmFja1RleHQuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLjcsIGc6IDAuMywgYjogMC4zIH0gfV07XG4gICAgICAgICAgICAgICAgICAgIGZhbGxiYWNrVGV4dC54ID0gNDA7XG4gICAgICAgICAgICAgICAgICAgIGZhbGxiYWNrVGV4dC55ID0gY3VycmVudFk7XG4gICAgICAgICAgICAgICAgICAgIGd1aWRlRnJhbWUuYXBwZW5kQ2hpbGQoZmFsbGJhY2tUZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFkgKz0gTWF0aC5tYXgoNDAsIChzdHlsZS5mb250U2l6ZSB8fCAxNikgKyAyNSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3VycmVudFkgKz0gMjA7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQWRkIHRleHQgdmFyaWFibGVzIHNlY3Rpb25cbiAgICAgICAgaWYgKHZhcmlhYmxlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCB2YXJpYWJsZXNIZWFkZXIgPSBmaWdtYS5jcmVhdGVUZXh0KCk7XG4gICAgICAgICAgICBjb25zdCB2YXJpYWJsZXNIZWFkZXJGb250ID0gYXdhaXQgc2FmZUxvYWRGb250KHsgZmFtaWx5OiAnSW50ZXInLCBzdHlsZTogJ1NlbWkgQm9sZCcgfSk7XG4gICAgICAgICAgICB2YXJpYWJsZXNIZWFkZXIuZm9udE5hbWUgPSB2YXJpYWJsZXNIZWFkZXJGb250O1xuICAgICAgICAgICAgdmFyaWFibGVzSGVhZGVyLmZvbnRTaXplID0gMTg7XG4gICAgICAgICAgICB2YXJpYWJsZXNIZWFkZXIuY2hhcmFjdGVycyA9IGBUZXh0IFZhcmlhYmxlcyAoJHt2YXJpYWJsZXMubGVuZ3RofSlgO1xuICAgICAgICAgICAgdmFyaWFibGVzSGVhZGVyLmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC4yLCBnOiAwLjIsIGI6IDAuMiB9IH1dO1xuICAgICAgICAgICAgdmFyaWFibGVzSGVhZGVyLnggPSA0MDtcbiAgICAgICAgICAgIHZhcmlhYmxlc0hlYWRlci55ID0gY3VycmVudFk7XG4gICAgICAgICAgICBndWlkZUZyYW1lLmFwcGVuZENoaWxkKHZhcmlhYmxlc0hlYWRlcik7XG4gICAgICAgICAgICBjdXJyZW50WSArPSA0MDtcbiAgICAgICAgICAgIC8vIEFkZCBlYWNoIHRleHQgdmFyaWFibGVcbiAgICAgICAgICAgIGZvciAoY29uc3QgdmFyaWFibGUgb2YgdmFyaWFibGVzKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gR2V0IHRoZSBmaXJzdCBtb2RlIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpcnN0TW9kZSA9IE9iamVjdC5rZXlzKHZhcmlhYmxlLnZhbHVlc0J5TW9kZSlbMF07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gdmFyaWFibGUudmFsdWVzQnlNb2RlW2ZpcnN0TW9kZV0gfHwgJ05vIHZhbHVlJztcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFyaWFibGVUZXh0ID0gZmlnbWEuY3JlYXRlVGV4dCgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YXJpYWJsZUZvbnQgPSBhd2FpdCBzYWZlTG9hZEZvbnQoeyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnUmVndWxhcicgfSk7XG4gICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlVGV4dC5mb250TmFtZSA9IHZhcmlhYmxlRm9udDtcbiAgICAgICAgICAgICAgICAgICAgdmFyaWFibGVUZXh0LmZvbnRTaXplID0gMTQ7XG4gICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlVGV4dC5jaGFyYWN0ZXJzID0gYCR7dmFyaWFibGUubmFtZX06IFwiJHt2YWx1ZX1cImA7XG4gICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlVGV4dC5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAsIGc6IDAsIGI6IDAgfSB9XTtcbiAgICAgICAgICAgICAgICAgICAgdmFyaWFibGVUZXh0LnggPSA0MDtcbiAgICAgICAgICAgICAgICAgICAgdmFyaWFibGVUZXh0LnkgPSBjdXJyZW50WTtcbiAgICAgICAgICAgICAgICAgICAgZ3VpZGVGcmFtZS5hcHBlbmRDaGlsZCh2YXJpYWJsZVRleHQpO1xuICAgICAgICAgICAgICAgICAgICAvLyBBZGQgdHlwZSBsYWJlbFxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0eXBlVGV4dCA9IGZpZ21hLmNyZWF0ZVRleHQoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdHlwZUZvbnQgPSBhd2FpdCBzYWZlTG9hZEZvbnQoeyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnUmVndWxhcicgfSk7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVUZXh0LmZvbnROYW1lID0gdHlwZUZvbnQ7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVUZXh0LmZvbnRTaXplID0gMTA7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVUZXh0LmNoYXJhY3RlcnMgPSB2YXJpYWJsZS5yZXNvbHZlZFR5cGUgfHwgJ1NUUklORyc7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVUZXh0LmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC41LCBnOiAwLjUsIGI6IDAuNSB9IH1dO1xuICAgICAgICAgICAgICAgICAgICB0eXBlVGV4dC54ID0gNTAwO1xuICAgICAgICAgICAgICAgICAgICB0eXBlVGV4dC55ID0gY3VycmVudFkgKyAyO1xuICAgICAgICAgICAgICAgICAgICBndWlkZUZyYW1lLmFwcGVuZENoaWxkKHR5cGVUZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFkgKz0gMzA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYEVycm9yIHByb2Nlc3NpbmcgdmFyaWFibGUgJHt2YXJpYWJsZS5uYW1lfTpgLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRZICs9IDMwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBBZGp1c3QgZnJhbWUgaGVpZ2h0IHRvIGNvbnRlbnRcbiAgICAgICAgZ3VpZGVGcmFtZS5yZXNpemUoODAwLCBjdXJyZW50WSArIDQwKTtcbiAgICAgICAgLy8gRm9jdXMgb24gdGhlIGdlbmVyYXRlZCBndWlkZVxuICAgICAgICBmaWdtYS52aWV3cG9ydC5zY3JvbGxBbmRab29tSW50b1ZpZXcoW2d1aWRlRnJhbWVdKTtcbiAgICAgICAgcmV0dXJuIHN0eWxlcy5sZW5ndGggKyB2YXJpYWJsZXMubGVuZ3RoO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZ2VuZXJhdGluZyB0eXBvZ3JhcGh5IGd1aWRlOicsIGVycm9yKTtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxufVxuLy8gPT09IE5FVyBISUVSQVJDSElDQUwgVkFSSUFCTEUgU0NBTk5JTkcgPT09XG5hc3luYyBmdW5jdGlvbiBzY2FuVmFyaWFibGVzSGllcmFyY2hpY2FsKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGxvZ2dlci5sb2coJ/CflI0gU3RhcnRpbmcgaGllcmFyY2hpY2FsIHZhcmlhYmxlIHNjYW4uLi4nKTtcbiAgICAgICAgLy8gR2V0IGFsbCB2YXJpYWJsZSBjb2xsZWN0aW9uc1xuICAgICAgICBjb25zdCBjb2xsZWN0aW9ucyA9IGF3YWl0IGZpZ21hLnZhcmlhYmxlcy5nZXRMb2NhbFZhcmlhYmxlQ29sbGVjdGlvbnNBc3luYygpO1xuICAgICAgICBjb25zdCByZXN1bHQgPSB7XG4gICAgICAgICAgICBjb2xsZWN0aW9uczogW10sXG4gICAgICAgICAgICB0b3RhbENvbGxlY3Rpb25zOiAwLFxuICAgICAgICAgICAgdG90YWxWYXJpYWJsZXM6IDBcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKCFjb2xsZWN0aW9ucyB8fCBjb2xsZWN0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGxvZ2dlci5sb2coJ05vIHZhcmlhYmxlIGNvbGxlY3Rpb25zIGZvdW5kJyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIGxvZ2dlci5sb2coYEZvdW5kICR7Y29sbGVjdGlvbnMubGVuZ3RofSB2YXJpYWJsZSBjb2xsZWN0aW9uc2ApO1xuICAgICAgICBmb3IgKGNvbnN0IGNvbGxlY3Rpb24gb2YgY29sbGVjdGlvbnMpIHtcbiAgICAgICAgICAgIGxvZ2dlci5sb2coYFByb2Nlc3NpbmcgY29sbGVjdGlvbjogJHtjb2xsZWN0aW9uLm5hbWV9ICgke2NvbGxlY3Rpb24uaWR9KWApO1xuICAgICAgICAgICAgY29uc3QgZmlnbWFDb2xsZWN0aW9uID0ge1xuICAgICAgICAgICAgICAgIGlkOiBjb2xsZWN0aW9uLmlkLFxuICAgICAgICAgICAgICAgIG5hbWU6IGNvbGxlY3Rpb24ubmFtZSxcbiAgICAgICAgICAgICAgICBncm91cHM6IFtdLFxuICAgICAgICAgICAgICAgIHRvdGFsVmFyaWFibGVzOiAwLFxuICAgICAgICAgICAgICAgIGFsbE1vZGVzOiBjb2xsZWN0aW9uLm1vZGVzLm1hcCgobW9kZSkgPT4gKHsgaWQ6IG1vZGUubW9kZUlkLCBuYW1lOiBtb2RlLm5hbWUgfSkpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLy8gR2V0IGFsbCB2YXJpYWJsZXMgaW4gdGhpcyBjb2xsZWN0aW9uXG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uVmFyaWFibGVzID0gYXdhaXQgZmlnbWEudmFyaWFibGVzLmdldExvY2FsVmFyaWFibGVzQXN5bmMoKTtcbiAgICAgICAgICAgIGNvbnN0IGZpbHRlcmVkVmFyaWFibGVzID0gY29sbGVjdGlvblZhcmlhYmxlcy5maWx0ZXIoKHZhcmlhYmxlKSA9PiB2YXJpYWJsZS52YXJpYWJsZUNvbGxlY3Rpb25JZCA9PT0gY29sbGVjdGlvbi5pZCk7XG4gICAgICAgICAgICBsb2dnZXIubG9nKGBGb3VuZCAke2ZpbHRlcmVkVmFyaWFibGVzLmxlbmd0aH0gdmFyaWFibGVzIGluIGNvbGxlY3Rpb24gJHtjb2xsZWN0aW9uLm5hbWV9YCk7XG4gICAgICAgICAgICBpZiAoZmlsdGVyZWRWYXJpYWJsZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBHcm91cCB2YXJpYWJsZXMgYnkgdGhlaXIgYmFzZSBuYW1lIChldmVyeXRoaW5nIGJlZm9yZSB0aGUgZmlyc3Qgc2xhc2ggb3IgZG90KVxuICAgICAgICAgICAgY29uc3QgdmFyaWFibGVzQnlHcm91cCA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgdmFyaWFibGUgb2YgZmlsdGVyZWRWYXJpYWJsZXMpIHtcbiAgICAgICAgICAgICAgICAvLyBFeHRyYWN0IGdyb3VwIG5hbWUgZnJvbSB2YXJpYWJsZSBuYW1lXG4gICAgICAgICAgICAgICAgLy8gRXhhbXBsZXM6IFwiY29sb3JzL3ByaW1hcnlcIiAtPiBcImNvbG9yc1wiLCBcInR5cG9ncmFwaHkuaGVhZGluZ1wiIC0+IFwidHlwb2dyYXBoeVwiXG4gICAgICAgICAgICAgICAgY29uc3QgZ3JvdXBOYW1lID0gZXh0cmFjdEdyb3VwTmFtZSh2YXJpYWJsZS5uYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAoIXZhcmlhYmxlc0J5R3JvdXAuaGFzKGdyb3VwTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyaWFibGVzQnlHcm91cC5zZXQoZ3JvdXBOYW1lLCBbXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhcmlhYmxlc0J5R3JvdXAuZ2V0KGdyb3VwTmFtZSkucHVzaCh2YXJpYWJsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsb2dnZXIubG9nKGBPcmdhbml6ZWQgaW50byAke3ZhcmlhYmxlc0J5R3JvdXAuc2l6ZX0gZ3JvdXBzOmAsIEFycmF5LmZyb20odmFyaWFibGVzQnlHcm91cC5rZXlzKCkpKTtcbiAgICAgICAgICAgIC8vIFByb2Nlc3MgZWFjaCBncm91cFxuICAgICAgICAgICAgZm9yIChjb25zdCBbZ3JvdXBOYW1lLCBncm91cFZhcmlhYmxlc10gb2YgQXJyYXkuZnJvbSh2YXJpYWJsZXNCeUdyb3VwLmVudHJpZXMoKSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWdtYUdyb3VwID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBncm91cE5hbWUsXG4gICAgICAgICAgICAgICAgICAgIG1vZGVzOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgdG90YWxWYXJpYWJsZXM6IDBcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIC8vIE9yZ2FuaXplIGJ5IG1vZGVzXG4gICAgICAgICAgICAgICAgY29uc3QgdmFyaWFibGVzQnlNb2RlID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgdmFyaWFibGUgb2YgZ3JvdXBWYXJpYWJsZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBbbW9kZUlkLCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXModmFyaWFibGUudmFsdWVzQnlNb2RlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF2YXJpYWJsZXNCeU1vZGUuaGFzKG1vZGVJZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZXNCeU1vZGUuc2V0KG1vZGVJZCwgW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyaWFibGVzQnlNb2RlLmdldChtb2RlSWQpLnB1c2goeyB2YXJpYWJsZSwgdmFsdWUsIG1vZGVJZCB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgbW9kZSBvYmplY3RzXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBbbW9kZUlkLCBtb2RlVmFyaWFibGVEYXRhXSBvZiBBcnJheS5mcm9tKHZhcmlhYmxlc0J5TW9kZS5lbnRyaWVzKCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vZGUgPSBjb2xsZWN0aW9uLm1vZGVzLmZpbmQoKG0pID0+IG0ubW9kZUlkID09PSBtb2RlSWQpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtb2RlTmFtZSA9IG1vZGUgPyBtb2RlLm5hbWUgOiBtb2RlSWQ7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpZ21hTW9kZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBtb2RlSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBtb2RlTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlczogW11cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgLy8gUHJvY2VzcyB2YXJpYWJsZXMgZm9yIHRoaXMgbW9kZVxuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHsgdmFyaWFibGUsIHZhbHVlLCBtb2RlSWQgfSBvZiBtb2RlVmFyaWFibGVEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbG9yVmFsdWUgPSBhd2FpdCBleHRyYWN0Q29sb3JWYWx1ZUVuaGFuY2VkKHZhbHVlLCB2YXJpYWJsZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2YXJpYWJsZVR5cGUgPSBkZXRlcm1pbmVWYXJpYWJsZVR5cGUodmFyaWFibGUsIGNvbG9yVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpZ21hVmFyaWFibGUgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiB2YXJpYWJsZS5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdmFyaWFibGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGNvbG9yVmFsdWUgfHwgU3RyaW5nKHZhbHVlKSB8fCAnVW5rbm93bicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHZhcmlhYmxlVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheVZhbHVlOiBjb2xvclZhbHVlIHx8IFN0cmluZyh2YWx1ZSkgfHwgJ1Vua25vd24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlZFR5cGU6IHZhcmlhYmxlLnJlc29sdmVkVHlwZSB8fCAnVU5LTk9XTicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiB2YXJpYWJsZS5kZXNjcmlwdGlvbiB8fCB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlQ29sbGVjdGlvbklkOiBjb2xsZWN0aW9uLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RlSWQ6IG1vZGVJZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlnbWFNb2RlLnZhcmlhYmxlcy5wdXNoKGZpZ21hVmFyaWFibGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZ21hR3JvdXAudG90YWxWYXJpYWJsZXMrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWdtYUNvbGxlY3Rpb24udG90YWxWYXJpYWJsZXMrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQudG90YWxWYXJpYWJsZXMrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKGBFcnJvciBwcm9jZXNzaW5nIHZhcmlhYmxlICR7dmFyaWFibGUubmFtZX06YCwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWdtYU1vZGUudmFyaWFibGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpZ21hR3JvdXAubW9kZXMucHVzaChmaWdtYU1vZGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChmaWdtYUdyb3VwLm1vZGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgZmlnbWFDb2xsZWN0aW9uLmdyb3Vwcy5wdXNoKGZpZ21hR3JvdXApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmaWdtYUNvbGxlY3Rpb24uZ3JvdXBzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICByZXN1bHQuY29sbGVjdGlvbnMucHVzaChmaWdtYUNvbGxlY3Rpb24pO1xuICAgICAgICAgICAgICAgIHJlc3VsdC50b3RhbENvbGxlY3Rpb25zKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbG9nZ2VyLmxvZyhgSGllcmFyY2hpY2FsIHNjYW4gY29tcGxldGU6ICR7cmVzdWx0LnRvdGFsQ29sbGVjdGlvbnN9IGNvbGxlY3Rpb25zLCAke3Jlc3VsdC50b3RhbFZhcmlhYmxlc30gdmFyaWFibGVzYCk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIGluIGhpZXJhcmNoaWNhbCB2YXJpYWJsZSBzY2FuOicsIGVycm9yKTtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxufVxuZnVuY3Rpb24gZXh0cmFjdEdyb3VwTmFtZSh2YXJpYWJsZU5hbWUpIHtcbiAgICAvLyBSZW1vdmUgY29tbW9uIHByZWZpeGVzIGFuZCBleHRyYWN0IG1lYW5pbmdmdWwgZ3JvdXAgbmFtZVxuICAgIGxldCBuYW1lID0gdmFyaWFibGVOYW1lO1xuICAgIC8vIFJlbW92ZSBsZWFkaW5nIHNsYXNoZXMgb3IgZG90c1xuICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoL15bLi9dKy8sICcnKTtcbiAgICAvLyBFeHRyYWN0IHRoZSBmaXJzdCBwYXJ0IGFzIGdyb3VwIG5hbWVcbiAgICBjb25zdCBwYXJ0cyA9IG5hbWUuc3BsaXQoL1svLl0vKTtcbiAgICBpZiAocGFydHMubGVuZ3RoID4gMSkge1xuICAgICAgICAvLyBJZiB3ZSBoYXZlIG11bHRpcGxlIHBhcnRzLCB1c2UgdGhlIGZpcnN0IG1lYW5pbmdmdWwgb25lXG4gICAgICAgIGNvbnN0IGZpcnN0UGFydCA9IHBhcnRzWzBdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIC8vIE1hcCBjb21tb24gcGF0dGVybnMgdG8gbW9yZSByZWFkYWJsZSBuYW1lc1xuICAgICAgICBjb25zdCBncm91cE1hcHBpbmdzID0ge1xuICAgICAgICAgICAgJ2NvbG9yJzogJ0NvbG9ycycsXG4gICAgICAgICAgICAnY29sb3JzJzogJ0NvbG9ycycsXG4gICAgICAgICAgICAnYmcnOiAnQ29sb3JzJyxcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kJzogJ0NvbG9ycycsXG4gICAgICAgICAgICAnZm9yZWdyb3VuZCc6ICdDb2xvcnMnLFxuICAgICAgICAgICAgJ2JvcmRlcic6ICdDb2xvcnMnLFxuICAgICAgICAgICAgJ3ByaW1hcnknOiAnQ29sb3JzJyxcbiAgICAgICAgICAgICdzZWNvbmRhcnknOiAnQ29sb3JzJyxcbiAgICAgICAgICAgICdhY2NlbnQnOiAnQ29sb3JzJyxcbiAgICAgICAgICAgICd0eXBvZ3JhcGh5JzogJ1R5cG9ncmFwaHknLFxuICAgICAgICAgICAgJ2ZvbnQnOiAnVHlwb2dyYXBoeScsXG4gICAgICAgICAgICAnaGVhZGluZyc6ICdUeXBvZ3JhcGh5JyxcbiAgICAgICAgICAgICdib2R5JzogJ1R5cG9ncmFwaHknLFxuICAgICAgICAgICAgJ3NwYWNpbmcnOiAnU3BhY2luZycsXG4gICAgICAgICAgICAnc3BhY2UnOiAnU3BhY2luZycsXG4gICAgICAgICAgICAnc2l6ZSc6ICdTcGFjaW5nJyxcbiAgICAgICAgICAgICdyYWRpdXMnOiAnUmFkaXVzJyxcbiAgICAgICAgICAgICdib3JkZXItcmFkaXVzJzogJ1JhZGl1cycsXG4gICAgICAgICAgICAnc2hhZG93JzogJ1NoYWRvd3MnLFxuICAgICAgICAgICAgJ3NoYWRvd3MnOiAnU2hhZG93cycsXG4gICAgICAgICAgICAnZWxldmF0aW9uJzogJ1NoYWRvd3MnXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBncm91cE1hcHBpbmdzW2ZpcnN0UGFydF0gfHwgY2FwaXRhbGl6ZUZpcnN0KGZpcnN0UGFydCk7XG4gICAgfVxuICAgIC8vIEZhbGxiYWNrIHRvIGZ1bGwgbmFtZSBpZiBubyBjbGVhciBncm91cCBzdHJ1Y3R1cmVcbiAgICByZXR1cm4gY2FwaXRhbGl6ZUZpcnN0KG5hbWUpO1xufVxuZnVuY3Rpb24gY2FwaXRhbGl6ZUZpcnN0KHN0cikge1xuICAgIHJldHVybiBzdHIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHIuc2xpY2UoMSk7XG59XG5mdW5jdGlvbiBkZXRlcm1pbmVWYXJpYWJsZVR5cGUodmFyaWFibGUsIGNvbG9yVmFsdWUpIHtcbiAgICAvLyBVc2UgdGhlIHJlc29sdmVkIHR5cGUgaWYgYXZhaWxhYmxlXG4gICAgaWYgKHZhcmlhYmxlLnJlc29sdmVkVHlwZSkge1xuICAgICAgICBzd2l0Y2ggKHZhcmlhYmxlLnJlc29sdmVkVHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnQ09MT1InOlxuICAgICAgICAgICAgICAgIHJldHVybiAnY29sb3InO1xuICAgICAgICAgICAgY2FzZSAnU1RSSU5HJzpcbiAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiBpdCdzIGZvbnQtcmVsYXRlZFxuICAgICAgICAgICAgICAgIGlmICh2YXJpYWJsZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2ZvbnQnKSB8fFxuICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ3R5cG9ncmFwaHknKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ2ZvbnQnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gJ290aGVyJztcbiAgICAgICAgICAgIGNhc2UgJ0ZMT0FUJzpcbiAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiBpdCdzIHJhZGl1cyBvciBzcGFjaW5nXG4gICAgICAgICAgICAgICAgaWYgKHZhcmlhYmxlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygncmFkaXVzJykgfHxcbiAgICAgICAgICAgICAgICAgICAgdmFyaWFibGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdib3JkZXItcmFkaXVzJykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdyYWRpdXMnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gJ290aGVyJztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdvdGhlcic7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gRmFsbGJhY2sgdG8gbmFtZS1iYXNlZCBkZXRlY3Rpb25cbiAgICBjb25zdCBuYW1lTG93ZXIgPSB2YXJpYWJsZS5uYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKGNvbG9yVmFsdWUgfHwgaXNDb2xvclZhbHVlKHZhcmlhYmxlLnZhbHVlc0J5TW9kZVtPYmplY3Qua2V5cyh2YXJpYWJsZS52YWx1ZXNCeU1vZGUpWzBdXSwgdmFyaWFibGUubmFtZSkpIHtcbiAgICAgICAgcmV0dXJuICdjb2xvcic7XG4gICAgfVxuICAgIGlmIChuYW1lTG93ZXIuaW5jbHVkZXMoJ2ZvbnQnKSB8fCBuYW1lTG93ZXIuaW5jbHVkZXMoJ3R5cG9ncmFwaHknKSkge1xuICAgICAgICByZXR1cm4gJ2ZvbnQnO1xuICAgIH1cbiAgICBpZiAobmFtZUxvd2VyLmluY2x1ZGVzKCdyYWRpdXMnKSB8fCBuYW1lTG93ZXIuaW5jbHVkZXMoJ2JvcmRlci1yYWRpdXMnKSkge1xuICAgICAgICByZXR1cm4gJ3JhZGl1cyc7XG4gICAgfVxuICAgIGlmIChuYW1lTG93ZXIuaW5jbHVkZXMoJ3NoYWRvdycpIHx8IG5hbWVMb3dlci5pbmNsdWRlcygnZWxldmF0aW9uJykpIHtcbiAgICAgICAgcmV0dXJuICdzaGFkb3cnO1xuICAgIH1cbiAgICByZXR1cm4gJ290aGVyJztcbn1cbi8vID09PSBDT0xMRUNUSU9OIEFORCBNT0RFIENPTE9SIEdVSURFIEdFTkVSQVRJT04gPT09XG4vLyBIZWxwZXIgZnVuY3Rpb24gdG8gc2FmZWx5IGxvYWQgZm9udHMgd2l0aCBmYWxsYmFja3NcbmFzeW5jIGZ1bmN0aW9uIHNhZmVMb2FkRm9udChmb250TmFtZSkge1xuICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGZpZ21hLmxvYWRGb250QXN5bmMoZm9udE5hbWUpO1xuICAgICAgICByZXR1cm4gZm9udE5hbWU7XG4gICAgfVxuICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAvLyBUcnkgY29tbW9uIGZhbGxiYWNrc1xuICAgICAgICBjb25zdCBmYWxsYmFja3MgPSBbXG4gICAgICAgICAgICB7IGZhbWlseTogJ0ludGVyJywgc3R5bGU6ICdSZWd1bGFyJyB9LFxuICAgICAgICAgICAgeyBmYW1pbHk6ICdSb2JvdG8nLCBzdHlsZTogJ1JlZ3VsYXInIH0sXG4gICAgICAgICAgICB7IGZhbWlseTogJ0FyaWFsJywgc3R5bGU6ICdSZWd1bGFyJyB9LFxuICAgICAgICAgICAgeyBmYW1pbHk6ICdIZWx2ZXRpY2EnLCBzdHlsZTogJ1JlZ3VsYXInIH0sXG4gICAgICAgICAgICB7IGZhbWlseTogJ1NhbiBGcmFuY2lzY28nLCBzdHlsZTogJ1JlZ3VsYXInIH1cbiAgICAgICAgXTtcbiAgICAgICAgZm9yIChjb25zdCBmYWxsYmFjayBvZiBmYWxsYmFja3MpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZmlnbWEubG9hZEZvbnRBc3luYyhmYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbGxiYWNrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGZhbGxiYWNrRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAvLyBDb250aW51ZSB0byBuZXh0IGZhbGxiYWNrXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gRmluYWwgZmFsbGJhY2sgLSB1c2Ugc3lzdGVtIGRlZmF1bHRcbiAgICAgICAgcmV0dXJuIHsgZmFtaWx5OiAnQXJpYWwnLCBzdHlsZTogJ1JlZ3VsYXInIH07XG4gICAgfVxufVxuLy8gR2VuZXJhdGUgY29sb3IgZ3VpZGUgZm9yIGEgc3BlY2lmaWMgbW9kZVxuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVNb2RlQ29sb3JHdWlkZShjb2xsZWN0aW9uLCBncm91cCwgbW9kZSkge1xuICAgIHRyeSB7XG4gICAgICAgIGxvZ2dlci5sb2coYPCfjqggR2VuZXJhdGluZyBtb2RlIGNvbG9yIGd1aWRlIGZvcjogJHtjb2xsZWN0aW9uLm5hbWV9ID4gJHtncm91cC5uYW1lfSA+ICR7bW9kZS5uYW1lfWApO1xuICAgICAgICAvLyBGaWx0ZXIgY29sb3IgdmFyaWFibGVzIG9ubHlcbiAgICAgICAgY29uc3QgY29sb3JWYXJpYWJsZXMgPSBtb2RlLnZhcmlhYmxlcy5maWx0ZXIodmFyaWFibGUgPT4gdmFyaWFibGUudHlwZSA9PT0gJ2NvbG9yJyk7XG4gICAgICAgIGlmIChjb2xvclZhcmlhYmxlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gY29sb3IgdmFyaWFibGVzIGZvdW5kIGluIG1vZGUgXCIke21vZGUubmFtZX1cImApO1xuICAgICAgICB9XG4gICAgICAgIC8vIENyZWF0ZSBtYWluIGZyYW1lXG4gICAgICAgIGNvbnN0IGZyYW1lID0gZmlnbWEuY3JlYXRlRnJhbWUoKTtcbiAgICAgICAgZnJhbWUubmFtZSA9IGAke21vZGUubmFtZX0gLSBDb2xvciBHdWlkZWA7XG4gICAgICAgIGZyYW1lLmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMSwgZzogMSwgYjogMSB9IH1dO1xuICAgICAgICBmcmFtZS5jb3JuZXJSYWRpdXMgPSA4O1xuICAgICAgICAvLyBDYWxjdWxhdGUgZnJhbWUgc2l6ZVxuICAgICAgICBjb25zdCBzd2F0Y2hTaXplID0gODA7XG4gICAgICAgIGNvbnN0IHN3YXRjaEdhcCA9IDE2O1xuICAgICAgICBjb25zdCBpdGVtc1BlclJvdyA9IDQ7XG4gICAgICAgIGNvbnN0IHBhZGRpbmcgPSAzMjtcbiAgICAgICAgY29uc3QgaGVhZGVySGVpZ2h0ID0gODA7XG4gICAgICAgIGNvbnN0IHJvd3MgPSBNYXRoLmNlaWwoY29sb3JWYXJpYWJsZXMubGVuZ3RoIC8gaXRlbXNQZXJSb3cpO1xuICAgICAgICBjb25zdCBmcmFtZVdpZHRoID0gTWF0aC5tYXgoNDAwLCBpdGVtc1BlclJvdyAqIChzd2F0Y2hTaXplICsgc3dhdGNoR2FwKSAtIHN3YXRjaEdhcCArIChwYWRkaW5nICogMikpO1xuICAgICAgICBjb25zdCBmcmFtZUhlaWdodCA9IGhlYWRlckhlaWdodCArIChyb3dzICogKHN3YXRjaFNpemUgKyA1MCkpICsgcGFkZGluZztcbiAgICAgICAgZnJhbWUucmVzaXplKGZyYW1lV2lkdGgsIGZyYW1lSGVpZ2h0KTtcbiAgICAgICAgLy8gUG9zaXRpb24gZnJhbWVcbiAgICAgICAgZnJhbWUueCA9IGZpZ21hLnZpZXdwb3J0LmJvdW5kcy54ICsgNTA7XG4gICAgICAgIGZyYW1lLnkgPSBmaWdtYS52aWV3cG9ydC5ib3VuZHMueSArIDUwO1xuICAgICAgICAvLyBMb2FkIGZvbnRzXG4gICAgICAgIGNvbnN0IGJvbGRGb250ID0gYXdhaXQgc2FmZUxvYWRGb250KHsgZmFtaWx5OiAnSW50ZXInLCBzdHlsZTogJ0JvbGQnIH0pO1xuICAgICAgICBjb25zdCByZWd1bGFyRm9udCA9IGF3YWl0IHNhZmVMb2FkRm9udCh7IGZhbWlseTogJ0ludGVyJywgc3R5bGU6ICdSZWd1bGFyJyB9KTtcbiAgICAgICAgY29uc3QgbWVkaXVtRm9udCA9IGF3YWl0IHNhZmVMb2FkRm9udCh7IGZhbWlseTogJ0ludGVyJywgc3R5bGU6ICdNZWRpdW0nIH0pO1xuICAgICAgICAvLyBBZGQgdGl0bGVcbiAgICAgICAgY29uc3QgdGl0bGVUZXh0ID0gZmlnbWEuY3JlYXRlVGV4dCgpO1xuICAgICAgICB0aXRsZVRleHQuZm9udE5hbWUgPSBib2xkRm9udDtcbiAgICAgICAgdGl0bGVUZXh0LmZvbnRTaXplID0gMjA7XG4gICAgICAgIHRpdGxlVGV4dC5jaGFyYWN0ZXJzID0gYCR7bW9kZS5uYW1lfSBDb2xvcnNgO1xuICAgICAgICB0aXRsZVRleHQuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLjEsIGc6IDAuMSwgYjogMC4xIH0gfV07XG4gICAgICAgIHRpdGxlVGV4dC54ID0gcGFkZGluZztcbiAgICAgICAgdGl0bGVUZXh0LnkgPSBwYWRkaW5nO1xuICAgICAgICBmcmFtZS5hcHBlbmRDaGlsZCh0aXRsZVRleHQpO1xuICAgICAgICAvLyBBZGQgc3VidGl0bGVcbiAgICAgICAgY29uc3Qgc3VidGl0bGVUZXh0ID0gZmlnbWEuY3JlYXRlVGV4dCgpO1xuICAgICAgICBzdWJ0aXRsZVRleHQuZm9udE5hbWUgPSByZWd1bGFyRm9udDtcbiAgICAgICAgc3VidGl0bGVUZXh0LmZvbnRTaXplID0gMTI7XG4gICAgICAgIHN1YnRpdGxlVGV4dC5jaGFyYWN0ZXJzID0gYCR7Y29sb3JWYXJpYWJsZXMubGVuZ3RofSB2YXJpYWJsZXMgZnJvbSAke2NvbGxlY3Rpb24ubmFtZX0gPiAke2dyb3VwLm5hbWV9YDtcbiAgICAgICAgc3VidGl0bGVUZXh0LmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC41LCBnOiAwLjUsIGI6IDAuNSB9IH1dO1xuICAgICAgICBzdWJ0aXRsZVRleHQueCA9IHBhZGRpbmc7XG4gICAgICAgIHN1YnRpdGxlVGV4dC55ID0gcGFkZGluZyArIDI4O1xuICAgICAgICBmcmFtZS5hcHBlbmRDaGlsZChzdWJ0aXRsZVRleHQpO1xuICAgICAgICAvLyBDcmVhdGUgY29sb3Igc3dhdGNoZXNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb2xvclZhcmlhYmxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgdmFyaWFibGUgPSBjb2xvclZhcmlhYmxlc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IHJvdyA9IE1hdGguZmxvb3IoaSAvIGl0ZW1zUGVyUm93KTtcbiAgICAgICAgICAgIGNvbnN0IGNvbCA9IGkgJSBpdGVtc1BlclJvdztcbiAgICAgICAgICAgIGNvbnN0IHggPSBwYWRkaW5nICsgY29sICogKHN3YXRjaFNpemUgKyBzd2F0Y2hHYXApO1xuICAgICAgICAgICAgY29uc3QgeSA9IGhlYWRlckhlaWdodCArIHJvdyAqIChzd2F0Y2hTaXplICsgNTApO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgc3dhdGNoXG4gICAgICAgICAgICAgICAgY29uc3Qgc3dhdGNoID0gZmlnbWEuY3JlYXRlUmVjdGFuZ2xlKCk7XG4gICAgICAgICAgICAgICAgc3dhdGNoLm5hbWUgPSB2YXJpYWJsZS5uYW1lO1xuICAgICAgICAgICAgICAgIHN3YXRjaC5yZXNpemUoc3dhdGNoU2l6ZSwgc3dhdGNoU2l6ZSk7XG4gICAgICAgICAgICAgICAgc3dhdGNoLnggPSB4O1xuICAgICAgICAgICAgICAgIHN3YXRjaC55ID0geTtcbiAgICAgICAgICAgICAgICBzd2F0Y2guY29ybmVyUmFkaXVzID0gNjtcbiAgICAgICAgICAgICAgICAvLyBQYXJzZSBhbmQgYXBwbHkgY29sb3JcbiAgICAgICAgICAgICAgICBjb25zdCBjb2xvclJnYiA9IHBhcnNlQ29sb3JUb1JnYih2YXJpYWJsZS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKGNvbG9yUmdiKSB7XG4gICAgICAgICAgICAgICAgICAgIHN3YXRjaC5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiBjb2xvclJnYiB9XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHN3YXRjaC5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuOSwgZzogMC45LCBiOiAwLjkgfSB9XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gQWRkIGJvcmRlclxuICAgICAgICAgICAgICAgIHN3YXRjaC5zdHJva2VzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC45LCBnOiAwLjksIGI6IDAuOSB9IH1dO1xuICAgICAgICAgICAgICAgIHN3YXRjaC5zdHJva2VXZWlnaHQgPSAxO1xuICAgICAgICAgICAgICAgIGZyYW1lLmFwcGVuZENoaWxkKHN3YXRjaCk7XG4gICAgICAgICAgICAgICAgLy8gQWRkIHZhcmlhYmxlIG5hbWVcbiAgICAgICAgICAgICAgICBjb25zdCBuYW1lVGV4dCA9IGZpZ21hLmNyZWF0ZVRleHQoKTtcbiAgICAgICAgICAgICAgICBuYW1lVGV4dC5mb250TmFtZSA9IG1lZGl1bUZvbnQ7XG4gICAgICAgICAgICAgICAgbmFtZVRleHQuZm9udFNpemUgPSAxMTtcbiAgICAgICAgICAgICAgICBuYW1lVGV4dC5jaGFyYWN0ZXJzID0gdmFyaWFibGUubmFtZS5sZW5ndGggPiAxNSA/IHZhcmlhYmxlLm5hbWUuc3Vic3RyaW5nKDAsIDEyKSArICcuLi4nIDogdmFyaWFibGUubmFtZTtcbiAgICAgICAgICAgICAgICBuYW1lVGV4dC5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuMSwgZzogMC4xLCBiOiAwLjEgfSB9XTtcbiAgICAgICAgICAgICAgICBuYW1lVGV4dC54ID0geDtcbiAgICAgICAgICAgICAgICBuYW1lVGV4dC55ID0geSArIHN3YXRjaFNpemUgKyA4O1xuICAgICAgICAgICAgICAgIG5hbWVUZXh0LnJlc2l6ZShzd2F0Y2hTaXplLCAxNCk7XG4gICAgICAgICAgICAgICAgbmFtZVRleHQudGV4dEFsaWduSG9yaXpvbnRhbCA9ICdDRU5URVInO1xuICAgICAgICAgICAgICAgIGZyYW1lLmFwcGVuZENoaWxkKG5hbWVUZXh0KTtcbiAgICAgICAgICAgICAgICAvLyBBZGQgdmFyaWFibGUgdmFsdWVcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZVRleHQgPSBmaWdtYS5jcmVhdGVUZXh0KCk7XG4gICAgICAgICAgICAgICAgdmFsdWVUZXh0LmZvbnROYW1lID0gcmVndWxhckZvbnQ7XG4gICAgICAgICAgICAgICAgdmFsdWVUZXh0LmZvbnRTaXplID0gOTtcbiAgICAgICAgICAgICAgICBsZXQgZGlzcGxheVZhbHVlID0gdmFyaWFibGUudmFsdWU7XG4gICAgICAgICAgICAgICAgaWYgKGRpc3BsYXlWYWx1ZS5sZW5ndGggPiAxOCkge1xuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5VmFsdWUgPSBkaXNwbGF5VmFsdWUuc3Vic3RyaW5nKDAsIDE1KSArICcuLi4nO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YWx1ZVRleHQuY2hhcmFjdGVycyA9IGRpc3BsYXlWYWx1ZTtcbiAgICAgICAgICAgICAgICB2YWx1ZVRleHQuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLjUsIGc6IDAuNSwgYjogMC41IH0gfV07XG4gICAgICAgICAgICAgICAgdmFsdWVUZXh0LnggPSB4O1xuICAgICAgICAgICAgICAgIHZhbHVlVGV4dC55ID0geSArIHN3YXRjaFNpemUgKyAyNTtcbiAgICAgICAgICAgICAgICB2YWx1ZVRleHQucmVzaXplKHN3YXRjaFNpemUsIDEyKTtcbiAgICAgICAgICAgICAgICB2YWx1ZVRleHQudGV4dEFsaWduSG9yaXpvbnRhbCA9ICdDRU5URVInO1xuICAgICAgICAgICAgICAgIGZyYW1lLmFwcGVuZENoaWxkKHZhbHVlVGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIud2FybihgRXJyb3IgY3JlYXRpbmcgc3dhdGNoIGZvciAke3ZhcmlhYmxlLm5hbWV9OmAsIGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBGb2N1cyBvbiB0aGUgZ2VuZXJhdGVkIGd1aWRlXG4gICAgICAgIGZpZ21hLnZpZXdwb3J0LnNjcm9sbEFuZFpvb21JbnRvVmlldyhbZnJhbWVdKTtcbiAgICAgICAgbG9nZ2VyLmxvZyhg4pyFIE1vZGUgY29sb3IgZ3VpZGUgZ2VuZXJhdGVkIHdpdGggJHtjb2xvclZhcmlhYmxlcy5sZW5ndGh9IGNvbG9yIHZhcmlhYmxlc2ApO1xuICAgICAgICByZXR1cm4gY29sb3JWYXJpYWJsZXMubGVuZ3RoO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBnZW5lcmF0aW5nIG1vZGUgY29sb3IgZ3VpZGU6JywgZXJyb3IpO1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG59XG4vLyBHZW5lcmF0ZSBjb2xvciBndWlkZSBmb3IgZW50aXJlIGNvbGxlY3Rpb24gd2l0aCBwcm9wZXIgbW9kZSBzZXBhcmF0aW9uXG5hc3luYyBmdW5jdGlvbiBnZW5lcmF0ZUNvbGxlY3Rpb25Db2xvckd1aWRlKGNvbGxlY3Rpb24pIHtcbiAgICB0cnkge1xuICAgICAgICBsb2dnZXIubG9nKGDwn46oIEdlbmVyYXRpbmcgY29sbGVjdGlvbiBjb2xvciBndWlkZSBmb3I6ICR7Y29sbGVjdGlvbi5uYW1lfWApO1xuICAgICAgICAvLyBDaGVjayBpZiBjb2xsZWN0aW9uIGhhcyBtdWx0aXBsZSBtb2Rlc1xuICAgICAgICBjb25zdCBoYXNNdWx0aXBsZU1vZGVzID0gY29sbGVjdGlvbi5hbGxNb2Rlcy5sZW5ndGggPiAxO1xuICAgICAgICBpZiAoIWhhc011bHRpcGxlTW9kZXMpIHtcbiAgICAgICAgICAgIC8vIFNpbmdsZSBtb2RlIC0gdXNlIHRoZSBleGlzdGluZyBzaW1wbGUgbGF5b3V0XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgZ2VuZXJhdGVTaW5nbGVNb2RlQ29sbGVjdGlvbkd1aWRlKGNvbGxlY3Rpb24pO1xuICAgICAgICB9XG4gICAgICAgIC8vIE11bHRpcGxlIG1vZGVzIC0gY3JlYXRlIG1vZGUtc2VwYXJhdGVkIGxheW91dCB1c2luZyBhdXRvLWxheW91dFxuICAgICAgICAvLyBGaXJzdCwgY29sbGVjdCBhbmQgZGVkdXBsaWNhdGUgdmFyaWFibGVzIGJ5IG5hbWVcbiAgICAgICAgY29uc3QgdW5pcXVlVmFyaWFibGVzID0gbmV3IE1hcCgpO1xuICAgICAgICBmb3IgKGNvbnN0IGdyb3VwIG9mIGNvbGxlY3Rpb24uZ3JvdXBzKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IG1vZGUgb2YgZ3JvdXAubW9kZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb2xvclZhcmlhYmxlcyA9IG1vZGUudmFyaWFibGVzLmZpbHRlcih2ID0+IHYudHlwZSA9PT0gJ2NvbG9yJyk7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCB2YXJpYWJsZSBvZiBjb2xvclZhcmlhYmxlcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXVuaXF1ZVZhcmlhYmxlcy5oYXModmFyaWFibGUubmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVuaXF1ZVZhcmlhYmxlcy5zZXQodmFyaWFibGUubmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHZhcmlhYmxlLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZVZhbHVlczogbmV3IE1hcCgpXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB1bmlxdWVWYXJpYWJsZXMuZ2V0KHZhcmlhYmxlLm5hbWUpLm1vZGVWYWx1ZXMuc2V0KG1vZGUuaWQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB2YXJpYWJsZS52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVOYW1lOiBtb2RlLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cE5hbWU6IGdyb3VwLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh1bmlxdWVWYXJpYWJsZXMuc2l6ZSA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBjb2xvciB2YXJpYWJsZXMgZm91bmQgaW4gY29sbGVjdGlvbiBcIiR7Y29sbGVjdGlvbi5uYW1lfVwiYCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTG9hZCBmb250c1xuICAgICAgICBjb25zdCBib2xkRm9udCA9IGF3YWl0IHNhZmVMb2FkRm9udCh7IGZhbWlseTogJ0ludGVyJywgc3R5bGU6ICdCb2xkJyB9KTtcbiAgICAgICAgY29uc3QgcmVndWxhckZvbnQgPSBhd2FpdCBzYWZlTG9hZEZvbnQoeyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnUmVndWxhcicgfSk7XG4gICAgICAgIGNvbnN0IG1lZGl1bUZvbnQgPSBhd2FpdCBzYWZlTG9hZEZvbnQoeyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnTWVkaXVtJyB9KTtcbiAgICAgICAgLy8gQ3JlYXRlIG1haW4gZnJhbWUgd2l0aCB2ZXJ0aWNhbCBhdXRvLWxheW91dFxuICAgICAgICBjb25zdCBtYWluRnJhbWUgPSBmaWdtYS5jcmVhdGVGcmFtZSgpO1xuICAgICAgICBtYWluRnJhbWUubmFtZSA9IGAke2NvbGxlY3Rpb24ubmFtZX0gLSBDb2xvciBHdWlkZWA7XG4gICAgICAgIG1haW5GcmFtZS5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDEsIGc6IDEsIGI6IDEgfSB9XTtcbiAgICAgICAgbWFpbkZyYW1lLmNvcm5lclJhZGl1cyA9IDg7XG4gICAgICAgIG1haW5GcmFtZS5sYXlvdXRNb2RlID0gJ1ZFUlRJQ0FMJztcbiAgICAgICAgbWFpbkZyYW1lLnBhZGRpbmdUb3AgPSAxNjtcbiAgICAgICAgbWFpbkZyYW1lLnBhZGRpbmdCb3R0b20gPSAxNjtcbiAgICAgICAgbWFpbkZyYW1lLnBhZGRpbmdMZWZ0ID0gMTY7XG4gICAgICAgIG1haW5GcmFtZS5wYWRkaW5nUmlnaHQgPSAxNjtcbiAgICAgICAgbWFpbkZyYW1lLml0ZW1TcGFjaW5nID0gMTI7XG4gICAgICAgIG1haW5GcmFtZS5jb3VudGVyQXhpc1NpemluZ01vZGUgPSAnQVVUTyc7XG4gICAgICAgIG1haW5GcmFtZS5wcmltYXJ5QXhpc1NpemluZ01vZGUgPSAnQVVUTyc7XG4gICAgICAgIC8vIFBvc2l0aW9uIGZyYW1lIGluIHZpZXdwb3J0XG4gICAgICAgIG1haW5GcmFtZS54ID0gZmlnbWEudmlld3BvcnQuYm91bmRzLnggKyA1MDtcbiAgICAgICAgbWFpbkZyYW1lLnkgPSBmaWdtYS52aWV3cG9ydC5ib3VuZHMueSArIDUwO1xuICAgICAgICAvLyBDcmVhdGUgaGVhZGVyIHNlY3Rpb25cbiAgICAgICAgY29uc3QgaGVhZGVyRnJhbWUgPSBmaWdtYS5jcmVhdGVGcmFtZSgpO1xuICAgICAgICBoZWFkZXJGcmFtZS5uYW1lID0gXCJIZWFkZXJcIjtcbiAgICAgICAgaGVhZGVyRnJhbWUubGF5b3V0TW9kZSA9ICdWRVJUSUNBTCc7XG4gICAgICAgIGhlYWRlckZyYW1lLml0ZW1TcGFjaW5nID0gNDtcbiAgICAgICAgaGVhZGVyRnJhbWUuZmlsbHMgPSBbXTtcbiAgICAgICAgaGVhZGVyRnJhbWUuY291bnRlckF4aXNTaXppbmdNb2RlID0gJ0FVVE8nO1xuICAgICAgICBoZWFkZXJGcmFtZS5wcmltYXJ5QXhpc1NpemluZ01vZGUgPSAnQVVUTyc7XG4gICAgICAgIC8vIEFkZCB0aXRsZVxuICAgICAgICBjb25zdCB0aXRsZVRleHQgPSBmaWdtYS5jcmVhdGVUZXh0KCk7XG4gICAgICAgIHRpdGxlVGV4dC5mb250TmFtZSA9IGJvbGRGb250O1xuICAgICAgICB0aXRsZVRleHQuZm9udFNpemUgPSAxODtcbiAgICAgICAgdGl0bGVUZXh0LmNoYXJhY3RlcnMgPSBjb2xsZWN0aW9uLm5hbWU7XG4gICAgICAgIHRpdGxlVGV4dC5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuMSwgZzogMC4xLCBiOiAwLjEgfSB9XTtcbiAgICAgICAgaGVhZGVyRnJhbWUuYXBwZW5kQ2hpbGQodGl0bGVUZXh0KTtcbiAgICAgICAgLy8gQWRkIHN1YnRpdGxlXG4gICAgICAgIGNvbnN0IHN1YnRpdGxlVGV4dCA9IGZpZ21hLmNyZWF0ZVRleHQoKTtcbiAgICAgICAgc3VidGl0bGVUZXh0LmZvbnROYW1lID0gcmVndWxhckZvbnQ7XG4gICAgICAgIHN1YnRpdGxlVGV4dC5mb250U2l6ZSA9IDEyO1xuICAgICAgICBzdWJ0aXRsZVRleHQuY2hhcmFjdGVycyA9IGAke3VuaXF1ZVZhcmlhYmxlcy5zaXplfSB1bmlxdWUgdmFyaWFibGVzIOKAoiAke2NvbGxlY3Rpb24uYWxsTW9kZXMubGVuZ3RofSBtb2Rlc2A7XG4gICAgICAgIHN1YnRpdGxlVGV4dC5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuNSwgZzogMC41LCBiOiAwLjUgfSB9XTtcbiAgICAgICAgaGVhZGVyRnJhbWUuYXBwZW5kQ2hpbGQoc3VidGl0bGVUZXh0KTtcbiAgICAgICAgbWFpbkZyYW1lLmFwcGVuZENoaWxkKGhlYWRlckZyYW1lKTtcbiAgICAgICAgLy8gQ3JlYXRlIG1vZGUgaGVhZGVycyByb3cgdXNpbmcgYXV0by1sYXlvdXRcbiAgICAgICAgY29uc3QgbW9kZUhlYWRlcnNGcmFtZSA9IGZpZ21hLmNyZWF0ZUZyYW1lKCk7XG4gICAgICAgIG1vZGVIZWFkZXJzRnJhbWUubmFtZSA9IFwiTW9kZSBIZWFkZXJzXCI7XG4gICAgICAgIG1vZGVIZWFkZXJzRnJhbWUubGF5b3V0TW9kZSA9ICdIT1JJWk9OVEFMJztcbiAgICAgICAgbW9kZUhlYWRlcnNGcmFtZS5pdGVtU3BhY2luZyA9IDEyOyAvLyBNYXRjaCB0aGUgZGF0YSByb3cgc3BhY2luZ1xuICAgICAgICBtb2RlSGVhZGVyc0ZyYW1lLmZpbGxzID0gW107XG4gICAgICAgIG1vZGVIZWFkZXJzRnJhbWUuY291bnRlckF4aXNTaXppbmdNb2RlID0gJ0FVVE8nO1xuICAgICAgICBtb2RlSGVhZGVyc0ZyYW1lLnByaW1hcnlBeGlzU2l6aW5nTW9kZSA9ICdBVVRPJztcbiAgICAgICAgLy8gVmFyaWFibGUgbmFtZSBjb2x1bW4gaGVhZGVyIChzcGFjZXIpIC0gbWF0Y2ggbmV3IHdpZHRoXG4gICAgICAgIGNvbnN0IG5hbWVIZWFkZXJGcmFtZSA9IGZpZ21hLmNyZWF0ZUZyYW1lKCk7XG4gICAgICAgIG5hbWVIZWFkZXJGcmFtZS5uYW1lID0gXCJWYXJpYWJsZSBOYW1lIEhlYWRlclwiO1xuICAgICAgICBuYW1lSGVhZGVyRnJhbWUucmVzaXplKDE4MCwgMzIpOyAvLyBNYXRjaCBuZXcgdmFyaWFibGUgbmFtZSBjb2x1bW4gd2lkdGggYW5kIGJldHRlciBoZWlnaHRcbiAgICAgICAgbmFtZUhlYWRlckZyYW1lLmZpbGxzID0gW107XG4gICAgICAgIG5hbWVIZWFkZXJGcmFtZS5sYXlvdXRNb2RlID0gJ1ZFUlRJQ0FMJztcbiAgICAgICAgbmFtZUhlYWRlckZyYW1lLmNvdW50ZXJBeGlzQWxpZ25JdGVtcyA9ICdNSU4nO1xuICAgICAgICBuYW1lSGVhZGVyRnJhbWUucHJpbWFyeUF4aXNBbGlnbkl0ZW1zID0gJ0NFTlRFUic7XG4gICAgICAgIG5hbWVIZWFkZXJGcmFtZS5wYWRkaW5nTGVmdCA9IDg7XG4gICAgICAgIG5hbWVIZWFkZXJGcmFtZS5wYWRkaW5nUmlnaHQgPSA4O1xuICAgICAgICBjb25zdCBuYW1lSGVhZGVyVGV4dCA9IGZpZ21hLmNyZWF0ZVRleHQoKTtcbiAgICAgICAgbmFtZUhlYWRlclRleHQuZm9udE5hbWUgPSBtZWRpdW1Gb250O1xuICAgICAgICBuYW1lSGVhZGVyVGV4dC5mb250U2l6ZSA9IDEwO1xuICAgICAgICBuYW1lSGVhZGVyVGV4dC5jaGFyYWN0ZXJzID0gXCJWYXJpYWJsZVwiO1xuICAgICAgICBuYW1lSGVhZGVyVGV4dC5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuNCwgZzogMC40LCBiOiAwLjQgfSB9XTtcbiAgICAgICAgbmFtZUhlYWRlckZyYW1lLmFwcGVuZENoaWxkKG5hbWVIZWFkZXJUZXh0KTtcbiAgICAgICAgbW9kZUhlYWRlcnNGcmFtZS5hcHBlbmRDaGlsZChuYW1lSGVhZGVyRnJhbWUpO1xuICAgICAgICAvLyBDcmVhdGUgbW9kZSBoZWFkZXIgY29sdW1ucyAtIG1hdGNoIG5ldyB3aWR0aFxuICAgICAgICBmb3IgKGNvbnN0IG1vZGUgb2YgY29sbGVjdGlvbi5hbGxNb2Rlcykge1xuICAgICAgICAgICAgY29uc3QgbW9kZUhlYWRlckNvbHVtbiA9IGZpZ21hLmNyZWF0ZUZyYW1lKCk7XG4gICAgICAgICAgICBtb2RlSGVhZGVyQ29sdW1uLm5hbWUgPSBgJHttb2RlLm5hbWV9IEhlYWRlcmA7XG4gICAgICAgICAgICBtb2RlSGVhZGVyQ29sdW1uLmxheW91dE1vZGUgPSAnVkVSVElDQUwnO1xuICAgICAgICAgICAgbW9kZUhlYWRlckNvbHVtbi5pdGVtU3BhY2luZyA9IDQ7XG4gICAgICAgICAgICBtb2RlSGVhZGVyQ29sdW1uLnJlc2l6ZSgxMTAsIDMyKTsgLy8gTWF0Y2ggbmV3IG1vZGUgY29sdW1uIHdpZHRoIGFuZCBiZXR0ZXIgaGVpZ2h0XG4gICAgICAgICAgICBtb2RlSGVhZGVyQ29sdW1uLmZpbGxzID0gW107XG4gICAgICAgICAgICBtb2RlSGVhZGVyQ29sdW1uLmNvdW50ZXJBeGlzQWxpZ25JdGVtcyA9ICdDRU5URVInO1xuICAgICAgICAgICAgbW9kZUhlYWRlckNvbHVtbi5wcmltYXJ5QXhpc0FsaWduSXRlbXMgPSAnQ0VOVEVSJztcbiAgICAgICAgICAgIG1vZGVIZWFkZXJDb2x1bW4ucGFkZGluZ1RvcCA9IDQ7XG4gICAgICAgICAgICBtb2RlSGVhZGVyQ29sdW1uLnBhZGRpbmdCb3R0b20gPSA0O1xuICAgICAgICAgICAgLy8gTW9kZSBuYW1lXG4gICAgICAgICAgICBjb25zdCBtb2RlTmFtZVRleHQgPSBmaWdtYS5jcmVhdGVUZXh0KCk7XG4gICAgICAgICAgICBtb2RlTmFtZVRleHQuZm9udE5hbWUgPSBtZWRpdW1Gb250O1xuICAgICAgICAgICAgbW9kZU5hbWVUZXh0LmZvbnRTaXplID0gMTE7XG4gICAgICAgICAgICBtb2RlTmFtZVRleHQuY2hhcmFjdGVycyA9IG1vZGUubmFtZTtcbiAgICAgICAgICAgIG1vZGVOYW1lVGV4dC5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuMiwgZzogMC4yLCBiOiAwLjIgfSB9XTtcbiAgICAgICAgICAgIG1vZGVOYW1lVGV4dC50ZXh0QWxpZ25Ib3Jpem9udGFsID0gJ0NFTlRFUic7XG4gICAgICAgICAgICBtb2RlTmFtZVRleHQudGV4dEF1dG9SZXNpemUgPSAnV0lEVEhfQU5EX0hFSUdIVCc7XG4gICAgICAgICAgICBtb2RlSGVhZGVyQ29sdW1uLmFwcGVuZENoaWxkKG1vZGVOYW1lVGV4dCk7XG4gICAgICAgICAgICAvLyBNb2RlIGluZGljYXRvciBsaW5lXG4gICAgICAgICAgICBjb25zdCBtb2RlTGluZSA9IGZpZ21hLmNyZWF0ZVJlY3RhbmdsZSgpO1xuICAgICAgICAgICAgbW9kZUxpbmUucmVzaXplKDYwLCAyKTtcbiAgICAgICAgICAgIG1vZGVMaW5lLmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC4zLCBnOiAwLjUsIGI6IDEuMCB9IH1dO1xuICAgICAgICAgICAgbW9kZUhlYWRlckNvbHVtbi5hcHBlbmRDaGlsZChtb2RlTGluZSk7XG4gICAgICAgICAgICBtb2RlSGVhZGVyc0ZyYW1lLmFwcGVuZENoaWxkKG1vZGVIZWFkZXJDb2x1bW4pO1xuICAgICAgICB9XG4gICAgICAgIG1haW5GcmFtZS5hcHBlbmRDaGlsZChtb2RlSGVhZGVyc0ZyYW1lKTtcbiAgICAgICAgLy8gQ3JlYXRlIHZhcmlhYmxlcyBncmlkIHVzaW5nIGF1dG8tbGF5b3V0XG4gICAgICAgIGNvbnN0IHZhcmlhYmxlc0NvbnRhaW5lciA9IGZpZ21hLmNyZWF0ZUZyYW1lKCk7XG4gICAgICAgIHZhcmlhYmxlc0NvbnRhaW5lci5uYW1lID0gXCJWYXJpYWJsZXMgQ29udGFpbmVyXCI7XG4gICAgICAgIHZhcmlhYmxlc0NvbnRhaW5lci5sYXlvdXRNb2RlID0gJ1ZFUlRJQ0FMJztcbiAgICAgICAgdmFyaWFibGVzQ29udGFpbmVyLml0ZW1TcGFjaW5nID0gMTI7IC8vIEluY3JlYXNlZCBzcGFjaW5nIGJldHdlZW4gcm93cyB0byBwcmV2ZW50IG92ZXJsYXBcbiAgICAgICAgdmFyaWFibGVzQ29udGFpbmVyLmZpbGxzID0gW107XG4gICAgICAgIHZhcmlhYmxlc0NvbnRhaW5lci5jb3VudGVyQXhpc1NpemluZ01vZGUgPSAnQVVUTyc7XG4gICAgICAgIHZhcmlhYmxlc0NvbnRhaW5lci5wcmltYXJ5QXhpc1NpemluZ01vZGUgPSAnQVVUTyc7XG4gICAgICAgIC8vIENyZWF0ZSBlYWNoIHZhcmlhYmxlIHJvd1xuICAgICAgICBmb3IgKGNvbnN0IFt2YXJpYWJsZU5hbWUsIHZhcmlhYmxlRGF0YV0gb2YgQXJyYXkuZnJvbSh1bmlxdWVWYXJpYWJsZXMuZW50cmllcygpKSkge1xuICAgICAgICAgICAgY29uc3QgdmFyaWFibGVSb3cgPSBmaWdtYS5jcmVhdGVGcmFtZSgpO1xuICAgICAgICAgICAgdmFyaWFibGVSb3cubmFtZSA9IGBSb3c6ICR7dmFyaWFibGVOYW1lfWA7XG4gICAgICAgICAgICB2YXJpYWJsZVJvdy5sYXlvdXRNb2RlID0gJ0hPUklaT05UQUwnO1xuICAgICAgICAgICAgdmFyaWFibGVSb3cuaXRlbVNwYWNpbmcgPSAxMjsgLy8gSW5jcmVhc2VkIHNwYWNpbmcgYmV0d2VlbiBjb2x1bW5zXG4gICAgICAgICAgICB2YXJpYWJsZVJvdy5maWxscyA9IFtdO1xuICAgICAgICAgICAgdmFyaWFibGVSb3cuY291bnRlckF4aXNTaXppbmdNb2RlID0gJ0FVVE8nO1xuICAgICAgICAgICAgdmFyaWFibGVSb3cucHJpbWFyeUF4aXNTaXppbmdNb2RlID0gJ0FVVE8nO1xuICAgICAgICAgICAgLy8gVmFyaWFibGUgbmFtZSBjb2x1bW4gLSB3aWRlciBhbmQgYmV0dGVyIHRleHQgaGFuZGxpbmdcbiAgICAgICAgICAgIGNvbnN0IG5hbWVDb2x1bW4gPSBmaWdtYS5jcmVhdGVGcmFtZSgpO1xuICAgICAgICAgICAgbmFtZUNvbHVtbi5uYW1lID0gXCJWYXJpYWJsZSBOYW1lXCI7XG4gICAgICAgICAgICBuYW1lQ29sdW1uLnJlc2l6ZSgxODAsIDQ0KTsgLy8gV2lkZXIgY29sdW1uIGFuZCB0YWxsZXIgdG8gYWNjb21tb2RhdGUgdGV4dCBwcm9wZXJseVxuICAgICAgICAgICAgbmFtZUNvbHVtbi5maWxscyA9IFtdO1xuICAgICAgICAgICAgbmFtZUNvbHVtbi5sYXlvdXRNb2RlID0gJ1ZFUlRJQ0FMJztcbiAgICAgICAgICAgIG5hbWVDb2x1bW4uY291bnRlckF4aXNBbGlnbkl0ZW1zID0gJ01JTic7XG4gICAgICAgICAgICBuYW1lQ29sdW1uLnByaW1hcnlBeGlzQWxpZ25JdGVtcyA9ICdDRU5URVInO1xuICAgICAgICAgICAgbmFtZUNvbHVtbi5wYWRkaW5nVG9wID0gNDtcbiAgICAgICAgICAgIG5hbWVDb2x1bW4ucGFkZGluZ0JvdHRvbSA9IDQ7XG4gICAgICAgICAgICBuYW1lQ29sdW1uLnBhZGRpbmdMZWZ0ID0gODtcbiAgICAgICAgICAgIG5hbWVDb2x1bW4ucGFkZGluZ1JpZ2h0ID0gODtcbiAgICAgICAgICAgIGNvbnN0IG5hbWVUZXh0ID0gZmlnbWEuY3JlYXRlVGV4dCgpO1xuICAgICAgICAgICAgbmFtZVRleHQuZm9udE5hbWUgPSBtZWRpdW1Gb250O1xuICAgICAgICAgICAgbmFtZVRleHQuZm9udFNpemUgPSAxMDsgLy8gU2xpZ2h0bHkgc21hbGxlciBmb250IHRvIGZpdCBiZXR0ZXJcbiAgICAgICAgICAgIC8vIEJldHRlciB0cnVuY2F0aW9uIC0gbW9yZSBjb25zZXJ2YXRpdmUgdG8gcHJldmVudCBvdmVyZmxvd1xuICAgICAgICAgICAgY29uc3QgbWF4V2lkdGggPSAxNjQ7IC8vIEFjY291bnQgZm9yIHBhZGRpbmdcbiAgICAgICAgICAgIGxldCBkaXNwbGF5TmFtZSA9IHZhcmlhYmxlTmFtZTtcbiAgICAgICAgICAgIC8vIFNtYXJ0IHRydW5jYXRpb24gLSBjaGVjayBhY3R1YWwgdGV4dCB3aWR0aFxuICAgICAgICAgICAgaWYgKHZhcmlhYmxlTmFtZS5sZW5ndGggPiAxOCkge1xuICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lID0gdmFyaWFibGVOYW1lLnN1YnN0cmluZygwLCAxNSkgKyAnLi4uJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5hbWVUZXh0LmNoYXJhY3RlcnMgPSBkaXNwbGF5TmFtZTtcbiAgICAgICAgICAgIG5hbWVUZXh0LmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC4xLCBnOiAwLjEsIGI6IDAuMSB9IH1dO1xuICAgICAgICAgICAgbmFtZVRleHQudGV4dEF1dG9SZXNpemUgPSAnV0lEVEhfQU5EX0hFSUdIVCc7IC8vIExldCB0ZXh0IGF1dG8tcmVzaXplXG4gICAgICAgICAgICBuYW1lQ29sdW1uLmFwcGVuZENoaWxkKG5hbWVUZXh0KTtcbiAgICAgICAgICAgIHZhcmlhYmxlUm93LmFwcGVuZENoaWxkKG5hbWVDb2x1bW4pO1xuICAgICAgICAgICAgLy8gQ3JlYXRlIG1vZGUgY29sdW1ucyBmb3IgdGhpcyB2YXJpYWJsZVxuICAgICAgICAgICAgZm9yIChjb25zdCBtb2RlIG9mIGNvbGxlY3Rpb24uYWxsTW9kZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtb2RlQ29sdW1uID0gZmlnbWEuY3JlYXRlRnJhbWUoKTtcbiAgICAgICAgICAgICAgICBtb2RlQ29sdW1uLm5hbWUgPSBgJHttb2RlLm5hbWV9IFZhbHVlYDtcbiAgICAgICAgICAgICAgICBtb2RlQ29sdW1uLnJlc2l6ZSgxMTAsIDQ0KTsgLy8gV2lkZXIgbW9kZSBjb2x1bW5zIGFuZCBzYW1lIGhlaWdodCBhcyBuYW1lIGNvbHVtblxuICAgICAgICAgICAgICAgIG1vZGVDb2x1bW4uZmlsbHMgPSBbXTtcbiAgICAgICAgICAgICAgICBtb2RlQ29sdW1uLmxheW91dE1vZGUgPSAnVkVSVElDQUwnO1xuICAgICAgICAgICAgICAgIG1vZGVDb2x1bW4uaXRlbVNwYWNpbmcgPSA2OyAvLyBTcGFjaW5nIGJldHdlZW4gc3dhdGNoIGFuZCB0ZXh0XG4gICAgICAgICAgICAgICAgbW9kZUNvbHVtbi5jb3VudGVyQXhpc0FsaWduSXRlbXMgPSAnQ0VOVEVSJztcbiAgICAgICAgICAgICAgICBtb2RlQ29sdW1uLnByaW1hcnlBeGlzQWxpZ25JdGVtcyA9ICdDRU5URVInOyAvLyBDZW50ZXIgZXZlcnl0aGluZ1xuICAgICAgICAgICAgICAgIG1vZGVDb2x1bW4ucGFkZGluZ1RvcCA9IDQ7XG4gICAgICAgICAgICAgICAgbW9kZUNvbHVtbi5wYWRkaW5nQm90dG9tID0gNDtcbiAgICAgICAgICAgICAgICBjb25zdCBtb2RlRGF0YSA9IHZhcmlhYmxlRGF0YS5tb2RlVmFsdWVzLmdldChtb2RlLmlkKTtcbiAgICAgICAgICAgICAgICBpZiAobW9kZURhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHN3YXRjaCAtIHNtYWxsZXIgc2l6ZSBhcyByZXF1ZXN0ZWRcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3dhdGNoID0gZmlnbWEuY3JlYXRlUmVjdGFuZ2xlKCk7XG4gICAgICAgICAgICAgICAgICAgIHN3YXRjaC5uYW1lID0gYCR7dmFyaWFibGVOYW1lfS0ke21vZGUubmFtZX0tc3dhdGNoYDtcbiAgICAgICAgICAgICAgICAgICAgc3dhdGNoLnJlc2l6ZSgyNCwgMjQpOyAvLyA0MCUgc21hbGxlciB0aGFuIGJlZm9yZSAod2FzIDQwcHgsIG5vdyAyNHB4KVxuICAgICAgICAgICAgICAgICAgICBzd2F0Y2guY29ybmVyUmFkaXVzID0gNDtcbiAgICAgICAgICAgICAgICAgICAgLy8gUGFyc2UgYW5kIGFwcGx5IGNvbG9yXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbG9yUmdiID0gcGFyc2VDb2xvclRvUmdiKG1vZGVEYXRhLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbG9yUmdiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2F0Y2guZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogY29sb3JSZ2IgfV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2F0Y2guZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLjksIGc6IDAuOSwgYjogMC45IH0gfV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gQWRkIGJvcmRlclxuICAgICAgICAgICAgICAgICAgICBzd2F0Y2guc3Ryb2tlcyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuODUsIGc6IDAuODUsIGI6IDAuODUgfSB9XTtcbiAgICAgICAgICAgICAgICAgICAgc3dhdGNoLnN0cm9rZVdlaWdodCA9IDE7XG4gICAgICAgICAgICAgICAgICAgIG1vZGVDb2x1bW4uYXBwZW5kQ2hpbGQoc3dhdGNoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHZhbHVlIHRleHQgLSBGVUxMIFZBTFVFIEFMV0FZUyBWSVNJQkxFXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlVGV4dCA9IGZpZ21hLmNyZWF0ZVRleHQoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVUZXh0LmZvbnROYW1lID0gcmVndWxhckZvbnQ7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlVGV4dC5mb250U2l6ZSA9IDg7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlVGV4dC5jaGFyYWN0ZXJzID0gbW9kZURhdGEudmFsdWU7IC8vIEZVTEwgVkFMVUUsIE5PIFRSVU5DQVRJT05cbiAgICAgICAgICAgICAgICAgICAgdmFsdWVUZXh0LmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC4yLCBnOiAwLjIsIGI6IDAuMiB9IH1dO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZVRleHQudGV4dEFsaWduSG9yaXpvbnRhbCA9ICdDRU5URVInO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZVRleHQudGV4dEF1dG9SZXNpemUgPSAnV0lEVEhfQU5EX0hFSUdIVCc7IC8vIEF1dG8tcmVzaXplIHRleHRcbiAgICAgICAgICAgICAgICAgICAgLy8gU2V0IG1heCB3aWR0aCB0byBwcmV2ZW50IG92ZXJmbG93XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlVGV4dC5yZXNpemUoMTAwLCAxMik7IC8vIE1heCB3aWR0aCBidXQgYWxsb3cgaGVpZ2h0IHRvIGdyb3dcbiAgICAgICAgICAgICAgICAgICAgbW9kZUNvbHVtbi5hcHBlbmRDaGlsZCh2YWx1ZVRleHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gTm8gdmFsdWUgZm9yIHRoaXMgbW9kZSAtIHNob3cgcGxhY2Vob2xkZXJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGxhY2Vob2xkZXIgPSBmaWdtYS5jcmVhdGVSZWN0YW5nbGUoKTtcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXIucmVzaXplKDI0LCAyNCk7IC8vIFNhbWUgc21hbGxlciBzaXplXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyLmNvcm5lclJhZGl1cyA9IDQ7XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyLmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC45NiwgZzogMC45NiwgYjogMC45NiB9IH1dO1xuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlci5zdHJva2VzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC45LCBnOiAwLjksIGI6IDAuOSB9IH1dO1xuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlci5zdHJva2VXZWlnaHQgPSAxO1xuICAgICAgICAgICAgICAgICAgICBtb2RlQ29sdW1uLmFwcGVuZENoaWxkKHBsYWNlaG9sZGVyKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gTi9BIHRleHRcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFUZXh0ID0gZmlnbWEuY3JlYXRlVGV4dCgpO1xuICAgICAgICAgICAgICAgICAgICBuYVRleHQuZm9udE5hbWUgPSByZWd1bGFyRm9udDtcbiAgICAgICAgICAgICAgICAgICAgbmFUZXh0LmZvbnRTaXplID0gODtcbiAgICAgICAgICAgICAgICAgICAgbmFUZXh0LmNoYXJhY3RlcnMgPSBcIk4vQVwiO1xuICAgICAgICAgICAgICAgICAgICBuYVRleHQuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLjYsIGc6IDAuNiwgYjogMC42IH0gfV07XG4gICAgICAgICAgICAgICAgICAgIG5hVGV4dC50ZXh0QWxpZ25Ib3Jpem9udGFsID0gJ0NFTlRFUic7XG4gICAgICAgICAgICAgICAgICAgIG5hVGV4dC50ZXh0QXV0b1Jlc2l6ZSA9ICdXSURUSF9BTkRfSEVJR0hUJztcbiAgICAgICAgICAgICAgICAgICAgbW9kZUNvbHVtbi5hcHBlbmRDaGlsZChuYVRleHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXJpYWJsZVJvdy5hcHBlbmRDaGlsZChtb2RlQ29sdW1uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhcmlhYmxlc0NvbnRhaW5lci5hcHBlbmRDaGlsZCh2YXJpYWJsZVJvdyk7XG4gICAgICAgIH1cbiAgICAgICAgbWFpbkZyYW1lLmFwcGVuZENoaWxkKHZhcmlhYmxlc0NvbnRhaW5lcik7XG4gICAgICAgIC8vIEFwcGVuZCB0byBwYWdlXG4gICAgICAgIGZpZ21hLmN1cnJlbnRQYWdlLmFwcGVuZENoaWxkKG1haW5GcmFtZSk7XG4gICAgICAgIC8vIFNlbGVjdCBhbmQgem9vbSB0byB0aGUgZnJhbWVcbiAgICAgICAgZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uID0gW21haW5GcmFtZV07XG4gICAgICAgIGZpZ21hLnZpZXdwb3J0LnNjcm9sbEFuZFpvb21JbnRvVmlldyhbbWFpbkZyYW1lXSk7XG4gICAgICAgIGxvZ2dlci5sb2coYOKchSBHZW5lcmF0ZWQgY29sbGVjdGlvbiBjb2xvciBndWlkZSB3aXRoICR7dW5pcXVlVmFyaWFibGVzLnNpemV9IHZhcmlhYmxlc2ApO1xuICAgICAgICByZXR1cm4gdW5pcXVlVmFyaWFibGVzLnNpemU7XG4gICAgfVxuICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICBsb2dnZXIuZXJyb3IoJ+KdjCBFcnJvciBnZW5lcmF0aW5nIGNvbGxlY3Rpb24gY29sb3IgZ3VpZGU6JywgZXJyb3IpO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBnZW5lcmF0ZSBjb2xsZWN0aW9uIGNvbG9yIGd1aWRlOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWApO1xuICAgIH1cbn1cbi8vIEhlbHBlciBmdW5jdGlvbiBmb3Igc2luZ2xlIG1vZGUgY29sbGVjdGlvbiBndWlkZXNcbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlU2luZ2xlTW9kZUNvbGxlY3Rpb25HdWlkZShjb2xsZWN0aW9uKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gQ29sbGVjdCBhbGwgY29sb3IgdmFyaWFibGVzIGZyb20gYWxsIGdyb3Vwc1xuICAgICAgICBjb25zdCBhbGxDb2xvclZhcmlhYmxlcyA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGdyb3VwIG9mIGNvbGxlY3Rpb24uZ3JvdXBzKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IG1vZGUgb2YgZ3JvdXAubW9kZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb2xvclZhcmlhYmxlcyA9IG1vZGUudmFyaWFibGVzLmZpbHRlcih2ID0+IHYudHlwZSA9PT0gJ2NvbG9yJyk7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCB2YXJpYWJsZSBvZiBjb2xvclZhcmlhYmxlcykge1xuICAgICAgICAgICAgICAgICAgICBhbGxDb2xvclZhcmlhYmxlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBOYW1lOiBncm91cC5uYW1lXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoYWxsQ29sb3JWYXJpYWJsZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIGNvbG9yIHZhcmlhYmxlcyBmb3VuZCBpbiBjb2xsZWN0aW9uIFwiJHtjb2xsZWN0aW9uLm5hbWV9XCJgKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBMb2FkIGZvbnRzXG4gICAgICAgIGNvbnN0IGJvbGRGb250ID0gYXdhaXQgc2FmZUxvYWRGb250KHsgZmFtaWx5OiAnSW50ZXInLCBzdHlsZTogJ0JvbGQnIH0pO1xuICAgICAgICBjb25zdCByZWd1bGFyRm9udCA9IGF3YWl0IHNhZmVMb2FkRm9udCh7IGZhbWlseTogJ0ludGVyJywgc3R5bGU6ICdSZWd1bGFyJyB9KTtcbiAgICAgICAgY29uc3QgbWVkaXVtRm9udCA9IGF3YWl0IHNhZmVMb2FkRm9udCh7IGZhbWlseTogJ0ludGVyJywgc3R5bGU6ICdNZWRpdW0nIH0pO1xuICAgICAgICAvLyBDcmVhdGUgbWFpbiBmcmFtZSB3aXRoIHZlcnRpY2FsIGF1dG8tbGF5b3V0XG4gICAgICAgIGNvbnN0IG1haW5GcmFtZSA9IGZpZ21hLmNyZWF0ZUZyYW1lKCk7XG4gICAgICAgIG1haW5GcmFtZS5uYW1lID0gYCR7Y29sbGVjdGlvbi5uYW1lfSAtIFNpbmdsZSBNb2RlIENvbG9yIEd1aWRlYDtcbiAgICAgICAgbWFpbkZyYW1lLmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMSwgZzogMSwgYjogMSB9IH1dO1xuICAgICAgICBtYWluRnJhbWUuY29ybmVyUmFkaXVzID0gODtcbiAgICAgICAgbWFpbkZyYW1lLmxheW91dE1vZGUgPSAnVkVSVElDQUwnO1xuICAgICAgICBtYWluRnJhbWUucGFkZGluZ1RvcCA9IDE2O1xuICAgICAgICBtYWluRnJhbWUucGFkZGluZ0JvdHRvbSA9IDE2O1xuICAgICAgICBtYWluRnJhbWUucGFkZGluZ0xlZnQgPSAxNjtcbiAgICAgICAgbWFpbkZyYW1lLnBhZGRpbmdSaWdodCA9IDE2O1xuICAgICAgICBtYWluRnJhbWUuaXRlbVNwYWNpbmcgPSAxMjtcbiAgICAgICAgbWFpbkZyYW1lLmNvdW50ZXJBeGlzU2l6aW5nTW9kZSA9ICdBVVRPJztcbiAgICAgICAgbWFpbkZyYW1lLnByaW1hcnlBeGlzU2l6aW5nTW9kZSA9ICdBVVRPJztcbiAgICAgICAgLy8gUG9zaXRpb24gZnJhbWUgaW4gdmlld3BvcnRcbiAgICAgICAgbWFpbkZyYW1lLnggPSBmaWdtYS52aWV3cG9ydC5ib3VuZHMueCArIDUwO1xuICAgICAgICBtYWluRnJhbWUueSA9IGZpZ21hLnZpZXdwb3J0LmJvdW5kcy55ICsgNTA7XG4gICAgICAgIC8vIENyZWF0ZSBoZWFkZXIgc2VjdGlvblxuICAgICAgICBjb25zdCBoZWFkZXJGcmFtZSA9IGZpZ21hLmNyZWF0ZUZyYW1lKCk7XG4gICAgICAgIGhlYWRlckZyYW1lLm5hbWUgPSBcIkhlYWRlclwiO1xuICAgICAgICBoZWFkZXJGcmFtZS5sYXlvdXRNb2RlID0gJ1ZFUlRJQ0FMJztcbiAgICAgICAgaGVhZGVyRnJhbWUuaXRlbVNwYWNpbmcgPSA0O1xuICAgICAgICBoZWFkZXJGcmFtZS5maWxscyA9IFtdO1xuICAgICAgICBoZWFkZXJGcmFtZS5jb3VudGVyQXhpc1NpemluZ01vZGUgPSAnQVVUTyc7XG4gICAgICAgIGhlYWRlckZyYW1lLnByaW1hcnlBeGlzU2l6aW5nTW9kZSA9ICdBVVRPJztcbiAgICAgICAgLy8gQWRkIHRpdGxlXG4gICAgICAgIGNvbnN0IHRpdGxlVGV4dCA9IGZpZ21hLmNyZWF0ZVRleHQoKTtcbiAgICAgICAgdGl0bGVUZXh0LmZvbnROYW1lID0gYm9sZEZvbnQ7XG4gICAgICAgIHRpdGxlVGV4dC5mb250U2l6ZSA9IDE4O1xuICAgICAgICB0aXRsZVRleHQuY2hhcmFjdGVycyA9IGNvbGxlY3Rpb24ubmFtZTtcbiAgICAgICAgdGl0bGVUZXh0LmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC4xLCBnOiAwLjEsIGI6IDAuMSB9IH1dO1xuICAgICAgICBoZWFkZXJGcmFtZS5hcHBlbmRDaGlsZCh0aXRsZVRleHQpO1xuICAgICAgICAvLyBBZGQgc3VidGl0bGVcbiAgICAgICAgY29uc3Qgc3VidGl0bGVUZXh0ID0gZmlnbWEuY3JlYXRlVGV4dCgpO1xuICAgICAgICBzdWJ0aXRsZVRleHQuZm9udE5hbWUgPSByZWd1bGFyRm9udDtcbiAgICAgICAgc3VidGl0bGVUZXh0LmZvbnRTaXplID0gMTI7XG4gICAgICAgIHN1YnRpdGxlVGV4dC5jaGFyYWN0ZXJzID0gYCR7YWxsQ29sb3JWYXJpYWJsZXMubGVuZ3RofSBjb2xvciB2YXJpYWJsZXNgO1xuICAgICAgICBzdWJ0aXRsZVRleHQuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLjUsIGc6IDAuNSwgYjogMC41IH0gfV07XG4gICAgICAgIGhlYWRlckZyYW1lLmFwcGVuZENoaWxkKHN1YnRpdGxlVGV4dCk7XG4gICAgICAgIG1haW5GcmFtZS5hcHBlbmRDaGlsZChoZWFkZXJGcmFtZSk7XG4gICAgICAgIC8vIENyZWF0ZSB2YXJpYWJsZXMgZ3JpZCB1c2luZyBhdXRvLWxheW91dFxuICAgICAgICBjb25zdCB2YXJpYWJsZXNDb250YWluZXIgPSBmaWdtYS5jcmVhdGVGcmFtZSgpO1xuICAgICAgICB2YXJpYWJsZXNDb250YWluZXIubmFtZSA9IFwiVmFyaWFibGVzIENvbnRhaW5lclwiO1xuICAgICAgICB2YXJpYWJsZXNDb250YWluZXIubGF5b3V0TW9kZSA9ICdWRVJUSUNBTCc7XG4gICAgICAgIHZhcmlhYmxlc0NvbnRhaW5lci5pdGVtU3BhY2luZyA9IDEyOyAvLyBJbmNyZWFzZWQgc3BhY2luZyB0byBwcmV2ZW50IG92ZXJsYXBcbiAgICAgICAgdmFyaWFibGVzQ29udGFpbmVyLmZpbGxzID0gW107XG4gICAgICAgIHZhcmlhYmxlc0NvbnRhaW5lci5jb3VudGVyQXhpc1NpemluZ01vZGUgPSAnQVVUTyc7XG4gICAgICAgIHZhcmlhYmxlc0NvbnRhaW5lci5wcmltYXJ5QXhpc1NpemluZ01vZGUgPSAnQVVUTyc7XG4gICAgICAgIC8vIEdyb3VwIHZhcmlhYmxlcyBieSBncm91cCBuYW1lIGZvciBiZXR0ZXIgb3JnYW5pemF0aW9uXG4gICAgICAgIGNvbnN0IGdyb3VwZWRWYXJpYWJsZXMgPSBuZXcgTWFwKCk7XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBhbGxDb2xvclZhcmlhYmxlcykge1xuICAgICAgICAgICAgaWYgKCFncm91cGVkVmFyaWFibGVzLmhhcyhpdGVtLmdyb3VwTmFtZSkpIHtcbiAgICAgICAgICAgICAgICBncm91cGVkVmFyaWFibGVzLnNldChpdGVtLmdyb3VwTmFtZSwgW10pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZ3JvdXBlZFZhcmlhYmxlcy5nZXQoaXRlbS5ncm91cE5hbWUpLnB1c2goaXRlbSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQ3JlYXRlIHZhcmlhYmxlcyBvcmdhbml6ZWQgYnkgZ3JvdXBcbiAgICAgICAgZm9yIChjb25zdCBbZ3JvdXBOYW1lLCB2YXJpYWJsZXNdIG9mIEFycmF5LmZyb20oZ3JvdXBlZFZhcmlhYmxlcy5lbnRyaWVzKCkpKSB7XG4gICAgICAgICAgICAvLyBBZGQgZ3JvdXAgaGVhZGVyIGlmIHRoZXJlIGFyZSBtdWx0aXBsZSBncm91cHNcbiAgICAgICAgICAgIGlmIChncm91cGVkVmFyaWFibGVzLnNpemUgPiAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZ3JvdXBIZWFkZXJGcmFtZSA9IGZpZ21hLmNyZWF0ZUZyYW1lKCk7XG4gICAgICAgICAgICAgICAgZ3JvdXBIZWFkZXJGcmFtZS5uYW1lID0gYEdyb3VwOiAke2dyb3VwTmFtZX1gO1xuICAgICAgICAgICAgICAgIGdyb3VwSGVhZGVyRnJhbWUuZmlsbHMgPSBbXTtcbiAgICAgICAgICAgICAgICBncm91cEhlYWRlckZyYW1lLmxheW91dE1vZGUgPSAnVkVSVElDQUwnO1xuICAgICAgICAgICAgICAgIGdyb3VwSGVhZGVyRnJhbWUuY291bnRlckF4aXNTaXppbmdNb2RlID0gJ0FVVE8nO1xuICAgICAgICAgICAgICAgIGdyb3VwSGVhZGVyRnJhbWUucHJpbWFyeUF4aXNTaXppbmdNb2RlID0gJ0FVVE8nO1xuICAgICAgICAgICAgICAgIGdyb3VwSGVhZGVyRnJhbWUucGFkZGluZ1RvcCA9IDg7XG4gICAgICAgICAgICAgICAgZ3JvdXBIZWFkZXJGcmFtZS5wYWRkaW5nQm90dG9tID0gNDtcbiAgICAgICAgICAgICAgICBjb25zdCBncm91cEhlYWRlclRleHQgPSBmaWdtYS5jcmVhdGVUZXh0KCk7XG4gICAgICAgICAgICAgICAgZ3JvdXBIZWFkZXJUZXh0LmZvbnROYW1lID0gbWVkaXVtRm9udDtcbiAgICAgICAgICAgICAgICBncm91cEhlYWRlclRleHQuZm9udFNpemUgPSAxMztcbiAgICAgICAgICAgICAgICBncm91cEhlYWRlclRleHQuY2hhcmFjdGVycyA9IGdyb3VwTmFtZTtcbiAgICAgICAgICAgICAgICBncm91cEhlYWRlclRleHQuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLjMsIGc6IDAuMywgYjogMC4zIH0gfV07XG4gICAgICAgICAgICAgICAgZ3JvdXBIZWFkZXJUZXh0LnRleHRBdXRvUmVzaXplID0gJ1dJRFRIX0FORF9IRUlHSFQnO1xuICAgICAgICAgICAgICAgIGdyb3VwSGVhZGVyRnJhbWUuYXBwZW5kQ2hpbGQoZ3JvdXBIZWFkZXJUZXh0KTtcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXNDb250YWluZXIuYXBwZW5kQ2hpbGQoZ3JvdXBIZWFkZXJGcmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBDcmVhdGUgZWFjaCB2YXJpYWJsZSByb3dcbiAgICAgICAgICAgIGZvciAoY29uc3QgeyB2YXJpYWJsZSB9IG9mIHZhcmlhYmxlcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhcmlhYmxlUm93ID0gZmlnbWEuY3JlYXRlRnJhbWUoKTtcbiAgICAgICAgICAgICAgICB2YXJpYWJsZVJvdy5uYW1lID0gYFJvdzogJHt2YXJpYWJsZS5uYW1lfWA7XG4gICAgICAgICAgICAgICAgdmFyaWFibGVSb3cubGF5b3V0TW9kZSA9ICdIT1JJWk9OVEFMJztcbiAgICAgICAgICAgICAgICB2YXJpYWJsZVJvdy5pdGVtU3BhY2luZyA9IDE2OyAvLyBNb3JlIHNwYWNlIGJldHdlZW4gc3dhdGNoIGFuZCB0ZXh0XG4gICAgICAgICAgICAgICAgdmFyaWFibGVSb3cuZmlsbHMgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXJpYWJsZVJvdy5jb3VudGVyQXhpc1NpemluZ01vZGUgPSAnQVVUTyc7XG4gICAgICAgICAgICAgICAgdmFyaWFibGVSb3cucHJpbWFyeUF4aXNTaXppbmdNb2RlID0gJ0FVVE8nO1xuICAgICAgICAgICAgICAgIHZhcmlhYmxlUm93LnBhZGRpbmdUb3AgPSA2O1xuICAgICAgICAgICAgICAgIHZhcmlhYmxlUm93LnBhZGRpbmdCb3R0b20gPSA2O1xuICAgICAgICAgICAgICAgIC8vIENvbG9yIHN3YXRjaFxuICAgICAgICAgICAgICAgIGNvbnN0IHN3YXRjaCA9IGZpZ21hLmNyZWF0ZVJlY3RhbmdsZSgpO1xuICAgICAgICAgICAgICAgIHN3YXRjaC5uYW1lID0gYCR7dmFyaWFibGUubmFtZX0tc3dhdGNoYDtcbiAgICAgICAgICAgICAgICBzd2F0Y2gucmVzaXplKDMyLCAzMik7IC8vIENvbXBhY3QgYnV0IHZpc2libGVcbiAgICAgICAgICAgICAgICBzd2F0Y2guY29ybmVyUmFkaXVzID0gNjtcbiAgICAgICAgICAgICAgICAvLyBQYXJzZSBhbmQgYXBwbHkgY29sb3JcbiAgICAgICAgICAgICAgICBjb25zdCBjb2xvclJnYiA9IHBhcnNlQ29sb3JUb1JnYih2YXJpYWJsZS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKGNvbG9yUmdiKSB7XG4gICAgICAgICAgICAgICAgICAgIHN3YXRjaC5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiBjb2xvclJnYiB9XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHN3YXRjaC5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuOSwgZzogMC45LCBiOiAwLjkgfSB9XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gQWRkIGJvcmRlclxuICAgICAgICAgICAgICAgIHN3YXRjaC5zdHJva2VzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC44NSwgZzogMC44NSwgYjogMC44NSB9IH1dO1xuICAgICAgICAgICAgICAgIHN3YXRjaC5zdHJva2VXZWlnaHQgPSAxO1xuICAgICAgICAgICAgICAgIHZhcmlhYmxlUm93LmFwcGVuZENoaWxkKHN3YXRjaCk7XG4gICAgICAgICAgICAgICAgLy8gVmFyaWFibGUgaW5mbyBjb2x1bW4gLSBiZXR0ZXIgc3BhY2luZyBhbmQgc2l6aW5nXG4gICAgICAgICAgICAgICAgY29uc3QgaW5mb0NvbHVtbiA9IGZpZ21hLmNyZWF0ZUZyYW1lKCk7XG4gICAgICAgICAgICAgICAgaW5mb0NvbHVtbi5uYW1lID0gXCJWYXJpYWJsZSBJbmZvXCI7XG4gICAgICAgICAgICAgICAgaW5mb0NvbHVtbi5sYXlvdXRNb2RlID0gJ1ZFUlRJQ0FMJztcbiAgICAgICAgICAgICAgICBpbmZvQ29sdW1uLml0ZW1TcGFjaW5nID0gNDsgLy8gQmV0dGVyIHNwYWNpbmcgYmV0d2VlbiBuYW1lIGFuZCB2YWx1ZVxuICAgICAgICAgICAgICAgIGluZm9Db2x1bW4uZmlsbHMgPSBbXTtcbiAgICAgICAgICAgICAgICBpbmZvQ29sdW1uLmNvdW50ZXJBeGlzU2l6aW5nTW9kZSA9ICdBVVRPJztcbiAgICAgICAgICAgICAgICBpbmZvQ29sdW1uLnByaW1hcnlBeGlzU2l6aW5nTW9kZSA9ICdBVVRPJztcbiAgICAgICAgICAgICAgICBpbmZvQ29sdW1uLmNvdW50ZXJBeGlzQWxpZ25JdGVtcyA9ICdNSU4nO1xuICAgICAgICAgICAgICAgIC8vIFZhcmlhYmxlIG5hbWUgLSB3aXRoIHByb3BlciB0cnVuY2F0aW9uXG4gICAgICAgICAgICAgICAgY29uc3QgbmFtZVRleHQgPSBmaWdtYS5jcmVhdGVUZXh0KCk7XG4gICAgICAgICAgICAgICAgbmFtZVRleHQuZm9udE5hbWUgPSBtZWRpdW1Gb250O1xuICAgICAgICAgICAgICAgIG5hbWVUZXh0LmZvbnRTaXplID0gMTI7XG4gICAgICAgICAgICAgICAgLy8gU21hcnQgdHJ1bmNhdGlvbiBmb3IgdmVyeSBsb25nIG5hbWVzXG4gICAgICAgICAgICAgICAgbGV0IGRpc3BsYXlOYW1lID0gdmFyaWFibGUubmFtZTtcbiAgICAgICAgICAgICAgICBpZiAodmFyaWFibGUubmFtZS5sZW5ndGggPiAzNSkge1xuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZSA9IHZhcmlhYmxlLm5hbWUuc3Vic3RyaW5nKDAsIDMyKSArICcuLi4nO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBuYW1lVGV4dC5jaGFyYWN0ZXJzID0gZGlzcGxheU5hbWU7XG4gICAgICAgICAgICAgICAgbmFtZVRleHQuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLjEsIGc6IDAuMSwgYjogMC4xIH0gfV07XG4gICAgICAgICAgICAgICAgbmFtZVRleHQudGV4dEF1dG9SZXNpemUgPSAnV0lEVEhfQU5EX0hFSUdIVCc7XG4gICAgICAgICAgICAgICAgaW5mb0NvbHVtbi5hcHBlbmRDaGlsZChuYW1lVGV4dCk7XG4gICAgICAgICAgICAgICAgLy8gVmFyaWFibGUgdmFsdWUgLSBGVUxMIFZBTFVFIEFMV0FZUyBWSVNJQkxFIHdpdGggYmV0dGVyIHNpemluZ1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlVGV4dCA9IGZpZ21hLmNyZWF0ZVRleHQoKTtcbiAgICAgICAgICAgICAgICB2YWx1ZVRleHQuZm9udE5hbWUgPSByZWd1bGFyRm9udDtcbiAgICAgICAgICAgICAgICB2YWx1ZVRleHQuZm9udFNpemUgPSAxMDtcbiAgICAgICAgICAgICAgICB2YWx1ZVRleHQuY2hhcmFjdGVycyA9IHZhcmlhYmxlLnZhbHVlOyAvLyBGVUxMIFZBTFVFLCBOTyBUUlVOQ0FUSU9OXG4gICAgICAgICAgICAgICAgdmFsdWVUZXh0LmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC40LCBnOiAwLjQsIGI6IDAuNCB9IH1dO1xuICAgICAgICAgICAgICAgIHZhbHVlVGV4dC50ZXh0QXV0b1Jlc2l6ZSA9ICdXSURUSF9BTkRfSEVJR0hUJzsgLy8gTGV0IHRleHQgYXV0by1zaXplXG4gICAgICAgICAgICAgICAgaW5mb0NvbHVtbi5hcHBlbmRDaGlsZCh2YWx1ZVRleHQpO1xuICAgICAgICAgICAgICAgIHZhcmlhYmxlUm93LmFwcGVuZENoaWxkKGluZm9Db2x1bW4pO1xuICAgICAgICAgICAgICAgIHZhcmlhYmxlc0NvbnRhaW5lci5hcHBlbmRDaGlsZCh2YXJpYWJsZVJvdyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbWFpbkZyYW1lLmFwcGVuZENoaWxkKHZhcmlhYmxlc0NvbnRhaW5lcik7XG4gICAgICAgIC8vIEFwcGVuZCB0byBwYWdlXG4gICAgICAgIGZpZ21hLmN1cnJlbnRQYWdlLmFwcGVuZENoaWxkKG1haW5GcmFtZSk7XG4gICAgICAgIC8vIFNlbGVjdCBhbmQgem9vbSB0byB0aGUgZnJhbWVcbiAgICAgICAgZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uID0gW21haW5GcmFtZV07XG4gICAgICAgIGZpZ21hLnZpZXdwb3J0LnNjcm9sbEFuZFpvb21JbnRvVmlldyhbbWFpbkZyYW1lXSk7XG4gICAgICAgIGxvZ2dlci5sb2coYOKchSBHZW5lcmF0ZWQgc2luZ2xlIG1vZGUgY29sb3IgZ3VpZGUgd2l0aCAke2FsbENvbG9yVmFyaWFibGVzLmxlbmd0aH0gdmFyaWFibGVzYCk7XG4gICAgICAgIHJldHVybiBhbGxDb2xvclZhcmlhYmxlcy5sZW5ndGg7XG4gICAgfVxuICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICBsb2dnZXIuZXJyb3IoJ+KdjCBFcnJvciBnZW5lcmF0aW5nIHNpbmdsZSBtb2RlIGNvbG9yIGd1aWRlOicsIGVycm9yKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gZ2VuZXJhdGUgc2luZ2xlIG1vZGUgY29sb3IgZ3VpZGU6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcid9YCk7XG4gICAgfVxufVxuLy8gPT09IEVORCBDT0xMRUNUSU9OIENPTE9SIEdVSURFID09PVxuLy8gSGFuZGxlIG1lc3NhZ2VzIGZyb20gdGhlIFVJXG5maWdtYS51aS5vbm1lc3NhZ2UgPSBhc3luYyAobXNnKSA9PiB7XG4gICAgaWYgKG1zZy50eXBlID09PSAnY3JlYXRlLXZhcmlhYmxlcycpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGNyZWF0ZUZpZ21hVmFyaWFibGVzKG1zZy50b2tlbnMpO1xuICAgICAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICd2YXJpYWJsZXMtY3JlYXRlZCcsXG4gICAgICAgICAgICAgICAgY291bnQ6IHJlc3VsdC5jb3VudCxcbiAgICAgICAgICAgICAgICBpc0V4dGVuc2lvbjogcmVzdWx0LmlzRXh0ZW5zaW9uLFxuICAgICAgICAgICAgICAgIGNvbGxlY3Rpb25OYW1lOiByZXN1bHQuY29sbGVjdGlvbk5hbWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgYWN0aW9uVGV4dCA9IHJlc3VsdC5pc0V4dGVuc2lvbiA/ICd1cGRhdGVkJyA6ICdjcmVhdGVkJztcbiAgICAgICAgICAgIGZpZ21hLm5vdGlmeShgU3VjY2Vzc2Z1bGx5ICR7YWN0aW9uVGV4dH0gJHtyZXN1bHQuY291bnR9IGRlc2lnbiB0b2tlbiB2YXJpYWJsZXMgaW4gXCIke3Jlc3VsdC5jb2xsZWN0aW9uTmFtZX1cIiFgKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yOicsIGVycm9yKTtcbiAgICAgICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnZXJyb3InLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gY3JlYXRlIHZhcmlhYmxlcy4gUGxlYXNlIHRyeSBhZ2Fpbi4nXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZpZ21hLm5vdGlmeSgnRmFpbGVkIHRvIGNyZWF0ZSB2YXJpYWJsZXMuIFBsZWFzZSB0cnkgYWdhaW4uJywgeyBlcnJvcjogdHJ1ZSB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAobXNnLnR5cGUgPT09ICdzY2FuLWV4aXN0aW5nLXZhcmlhYmxlcycpIHtcbiAgICAgICAgbG9nZ2VyLmxvZygn8J+UjSBCYWNrZW5kOiBSZWNlaXZlZCBzY2FuLWV4aXN0aW5nLXZhcmlhYmxlcyByZXF1ZXN0IChsZWdhY3kpJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsb2dnZXIubG9nKCfwn5OKIEJhY2tlbmQ6IFN0YXJ0aW5nIHZhcmlhYmxlIHNjYW4uLi4nKTtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nVG9rZW5zID0gYXdhaXQgc2NhbkV4aXN0aW5nVmFyaWFibGVzRW5oYW5jZWQoKTtcbiAgICAgICAgICAgIGNvbnN0IHRvdGFsQ291bnQgPSBleGlzdGluZ1Rva2Vucy5saWdodC5sZW5ndGggKyBleGlzdGluZ1Rva2Vucy5kYXJrLmxlbmd0aCArIGV4aXN0aW5nVG9rZW5zLmdsb2JhbC5sZW5ndGg7XG4gICAgICAgICAgICBsb2dnZXIubG9nKCfinIUgQmFja2VuZDogU2NhbiBjb21wbGV0ZWQhJywge1xuICAgICAgICAgICAgICAgIHRvdGFsOiB0b3RhbENvdW50LFxuICAgICAgICAgICAgICAgIGxpZ2h0OiBleGlzdGluZ1Rva2Vucy5saWdodC5sZW5ndGgsXG4gICAgICAgICAgICAgICAgZGFyazogZXhpc3RpbmdUb2tlbnMuZGFyay5sZW5ndGgsXG4gICAgICAgICAgICAgICAgZ2xvYmFsOiBleGlzdGluZ1Rva2Vucy5nbG9iYWwubGVuZ3RoXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGxvZ2dlci5sb2coJ/CfjqggQmFja2VuZDogU2FtcGxlIHRva2VuczonLCB7XG4gICAgICAgICAgICAgICAgbGlnaHRTYW1wbGU6IGV4aXN0aW5nVG9rZW5zLmxpZ2h0WzBdLFxuICAgICAgICAgICAgICAgIGRhcmtTYW1wbGU6IGV4aXN0aW5nVG9rZW5zLmRhcmtbMF0sXG4gICAgICAgICAgICAgICAgZ2xvYmFsU2FtcGxlOiBleGlzdGluZ1Rva2Vucy5nbG9iYWxbMF1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2V4aXN0aW5nLXZhcmlhYmxlcy1mb3VuZCcsXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiBleGlzdGluZ1Rva2VucyxcbiAgICAgICAgICAgICAgICBjb3VudDogdG90YWxDb3VudFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGxvZ2dlci5sb2coJ/Cfk6QgQmFja2VuZDogU2VuZGluZyByZXNwb25zZSB0byBVSTonLCByZXNwb25zZSk7XG4gICAgICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZShyZXNwb25zZSk7XG4gICAgICAgICAgICBmaWdtYS5ub3RpZnkoYEZvdW5kICR7dG90YWxDb3VudH0gZXhpc3RpbmcgdmFyaWFibGVzIWApO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCfinYwgQmFja2VuZDogRW5oYW5jZWQgc2NhbiBmYWlsZWQsIHRyeWluZyBmYWxsYmFjay4uLicsIGVycm9yKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gRmFsbGJhY2sgdG8gYmFzaWMgc2Nhbm5pbmcgaWYgZW5oYW5jZWQgZmFpbHNcbiAgICAgICAgICAgICAgICBjb25zdCBiYXNpY1Rva2VucyA9IGF3YWl0IHNjYW5FeGlzdGluZ1ZhcmlhYmxlc0Jhc2ljKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgdG90YWxDb3VudCA9IGJhc2ljVG9rZW5zLmxpZ2h0Lmxlbmd0aCArIGJhc2ljVG9rZW5zLmRhcmsubGVuZ3RoICsgYmFzaWNUb2tlbnMuZ2xvYmFsLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdleGlzdGluZy12YXJpYWJsZXMtZm91bmQnLFxuICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IGJhc2ljVG9rZW5zLFxuICAgICAgICAgICAgICAgICAgICBjb3VudDogdG90YWxDb3VudFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGZpZ21hLm5vdGlmeShgRm91bmQgJHt0b3RhbENvdW50fSB2YXJpYWJsZXMgKGJhc2ljIHNjYW4pIWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGZhbGxiYWNrRXJyb3IpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ+KdjCBCYWNrZW5kOiBCb3RoIHNjYW5zIGZhaWxlZDonLCBmYWxsYmFja0Vycm9yKTtcbiAgICAgICAgICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdlcnJvcicsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gc2NhbiBleGlzdGluZyB2YXJpYWJsZXMuIFBsZWFzZSB0cnkgYWdhaW4uJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGZpZ21hLm5vdGlmeSgnRmFpbGVkIHRvIHNjYW4gZXhpc3RpbmcgdmFyaWFibGVzLiBQbGVhc2UgdHJ5IGFnYWluLicsIHsgZXJyb3I6IHRydWUgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKG1zZy50eXBlID09PSAnc2Nhbi12YXJpYWJsZXMtaGllcmFyY2hpY2FsJykge1xuICAgICAgICBsb2dnZXIubG9nKCfwn5SNIEJhY2tlbmQ6IFJlY2VpdmVkIGhpZXJhcmNoaWNhbCB2YXJpYWJsZSBzY2FuIHJlcXVlc3QnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxvZ2dlci5sb2coJ/Cfk4ogQmFja2VuZDogU3RhcnRpbmcgaGllcmFyY2hpY2FsIHZhcmlhYmxlIHNjYW4uLi4nKTtcbiAgICAgICAgICAgIGNvbnN0IHZhcmlhYmxlU3RydWN0dXJlID0gYXdhaXQgc2NhblZhcmlhYmxlc0hpZXJhcmNoaWNhbCgpO1xuICAgICAgICAgICAgbG9nZ2VyLmxvZygn4pyFIEJhY2tlbmQ6IEhpZXJhcmNoaWNhbCBzY2FuIGNvbXBsZXRlZCEnLCB7XG4gICAgICAgICAgICAgICAgdG90YWxDb2xsZWN0aW9uczogdmFyaWFibGVTdHJ1Y3R1cmUudG90YWxDb2xsZWN0aW9ucyxcbiAgICAgICAgICAgICAgICB0b3RhbFZhcmlhYmxlczogdmFyaWFibGVTdHJ1Y3R1cmUudG90YWxWYXJpYWJsZXMsXG4gICAgICAgICAgICAgICAgY29sbGVjdGlvbnM6IHZhcmlhYmxlU3RydWN0dXJlLmNvbGxlY3Rpb25zLm1hcChjID0+ICh7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IGMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBzOiBjLmdyb3Vwcy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlczogYy50b3RhbFZhcmlhYmxlc1xuICAgICAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAndmFyaWFibGVzLXN0cnVjdHVyZS1mb3VuZCcsXG4gICAgICAgICAgICAgICAgc3RydWN0dXJlOiB2YXJpYWJsZVN0cnVjdHVyZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGxvZ2dlci5sb2coJ/Cfk6QgQmFja2VuZDogU2VuZGluZyBoaWVyYXJjaGljYWwgcmVzcG9uc2UgdG8gVUk6JywgcmVzcG9uc2UpO1xuICAgICAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2UocmVzcG9uc2UpO1xuICAgICAgICAgICAgZmlnbWEubm90aWZ5KGBGb3VuZCAke3ZhcmlhYmxlU3RydWN0dXJlLnRvdGFsVmFyaWFibGVzfSB2YXJpYWJsZXMgaW4gJHt2YXJpYWJsZVN0cnVjdHVyZS50b3RhbENvbGxlY3Rpb25zfSBjb2xsZWN0aW9ucyFgKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGxvZ2dlci5lcnJvcign4p2MIEJhY2tlbmQ6IEhpZXJhcmNoaWNhbCBzY2FuIGZhaWxlZDonLCBlcnJvcik7XG4gICAgICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2Vycm9yJyxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnRmFpbGVkIHRvIHNjYW4gdmFyaWFibGVzIGhpZXJhcmNoaWNhbGx5LiBQbGVhc2UgdHJ5IGFnYWluLidcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZmlnbWEubm90aWZ5KCdGYWlsZWQgdG8gc2NhbiB2YXJpYWJsZXMuIFBsZWFzZSB0cnkgYWdhaW4uJywgeyBlcnJvcjogdHJ1ZSB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAobXNnLnR5cGUgPT09ICdnZW5lcmF0ZS1jb2xvci1ndWlkZScpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbG9yQ291bnQgPSBhd2FpdCBnZW5lcmF0ZUNvbG9yR3VpZGUobXNnLnZhcmlhYmxlcyk7XG4gICAgICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2NvbG9yLWd1aWRlLWdlbmVyYXRlZCcsXG4gICAgICAgICAgICAgICAgY291bnQ6IGNvbG9yQ291bnRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZmlnbWEubm90aWZ5KGBDb2xvciBndWlkZSBnZW5lcmF0ZWQgd2l0aCAke2NvbG9yQ291bnR9IHZhcmlhYmxlcyFgKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGdlbmVyYXRpbmcgY29sb3IgZ3VpZGU6JywgZXJyb3IpO1xuICAgICAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdlcnJvcicsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ0ZhaWxlZCB0byBnZW5lcmF0ZSBjb2xvciBndWlkZS4gUGxlYXNlIHRyeSBhZ2Fpbi4nXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZpZ21hLm5vdGlmeSgnRmFpbGVkIHRvIGdlbmVyYXRlIGNvbG9yIGd1aWRlLiBQbGVhc2UgdHJ5IGFnYWluLicsIHsgZXJyb3I6IHRydWUgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKG1zZy50eXBlID09PSAnZ2VuZXJhdGUtY29sbGVjdGlvbi1jb2xvci1ndWlkZScpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBtc2cuY29sbGVjdGlvbjtcbiAgICAgICAgICAgIGNvbnN0IGNvbG9yQ291bnQgPSBhd2FpdCBnZW5lcmF0ZUNvbGxlY3Rpb25Db2xvckd1aWRlKGNvbGxlY3Rpb24pO1xuICAgICAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdjb2xvci1ndWlkZS1nZW5lcmF0ZWQnLFxuICAgICAgICAgICAgICAgIGNvdW50OiBjb2xvckNvdW50XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZpZ21hLm5vdGlmeShgQ29sb3IgZ3VpZGUgZ2VuZXJhdGVkIGZvciBcIiR7Y29sbGVjdGlvbi5uYW1lfVwiIHdpdGggJHtjb2xvckNvdW50fSB2YXJpYWJsZXMhYCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBnZW5lcmF0aW5nIGNvbGxlY3Rpb24gY29sb3IgZ3VpZGU6JywgZXJyb3IpO1xuICAgICAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdlcnJvcicsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ0ZhaWxlZCB0byBnZW5lcmF0ZSBjb2xvciBndWlkZS4gUGxlYXNlIHRyeSBhZ2Fpbi4nXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZpZ21hLm5vdGlmeSgnRmFpbGVkIHRvIGdlbmVyYXRlIGNvbGxlY3Rpb24gY29sb3IgZ3VpZGUuIFBsZWFzZSB0cnkgYWdhaW4uJywgeyBlcnJvcjogdHJ1ZSB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAobXNnLnR5cGUgPT09ICdnZW5lcmF0ZS1tb2RlLWNvbG9yLWd1aWRlJykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgeyBjb2xsZWN0aW9uLCBncm91cCwgbW9kZSB9ID0gbXNnO1xuICAgICAgICAgICAgY29uc3QgY29sb3JDb3VudCA9IGF3YWl0IGdlbmVyYXRlTW9kZUNvbG9yR3VpZGUoY29sbGVjdGlvbiwgZ3JvdXAsIG1vZGUpO1xuICAgICAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdjb2xvci1ndWlkZS1nZW5lcmF0ZWQnLFxuICAgICAgICAgICAgICAgIGNvdW50OiBjb2xvckNvdW50XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZpZ21hLm5vdGlmeShgQ29sb3IgZ3VpZGUgZ2VuZXJhdGVkIGZvciBcIiR7bW9kZS5uYW1lfVwiIG1vZGUgd2l0aCAke2NvbG9yQ291bnR9IHZhcmlhYmxlcyFgKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGdlbmVyYXRpbmcgbW9kZSBjb2xvciBndWlkZTonLCBlcnJvcik7XG4gICAgICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2Vycm9yJyxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnRmFpbGVkIHRvIGdlbmVyYXRlIGNvbG9yIGd1aWRlLiBQbGVhc2UgdHJ5IGFnYWluLidcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZmlnbWEubm90aWZ5KCdGYWlsZWQgdG8gZ2VuZXJhdGUgbW9kZSBjb2xvciBndWlkZS4gUGxlYXNlIHRyeSBhZ2Fpbi4nLCB7IGVycm9yOiB0cnVlIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChtc2cudHlwZSA9PT0gJ3NjYW4tdGV4dC1zdHlsZXMnKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzY2FuVGV4dFN0eWxlcygpO1xuICAgICAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICd0ZXh0LXN0eWxlcy1zY2FubmVkJyxcbiAgICAgICAgICAgICAgICBzdHlsZXM6IHJlc3VsdC5zdHlsZXMsXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiByZXN1bHQudmFyaWFibGVzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZpZ21hLm5vdGlmeShgRm91bmQgJHtyZXN1bHQuc3R5bGVzLmxlbmd0aH0gdGV4dCBzdHlsZXMgYW5kICR7cmVzdWx0LnZhcmlhYmxlcy5sZW5ndGh9IHRleHQgdmFyaWFibGVzIWApO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc2Nhbm5pbmcgdGV4dCBzdHlsZXM6JywgZXJyb3IpO1xuICAgICAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdlcnJvcicsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ0ZhaWxlZCB0byBzY2FuIHRleHQgc3R5bGVzLiBQbGVhc2UgdHJ5IGFnYWluLidcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZmlnbWEubm90aWZ5KCdGYWlsZWQgdG8gc2NhbiB0ZXh0IHN0eWxlcy4gUGxlYXNlIHRyeSBhZ2Fpbi4nLCB7IGVycm9yOiB0cnVlIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChtc2cudHlwZSA9PT0gJ2dlbmVyYXRlLXR5cG9ncmFwaHktZ3VpZGUnKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBpdGVtQ291bnQgPSBhd2FpdCBnZW5lcmF0ZVR5cG9ncmFwaHlHdWlkZShtc2cuc3R5bGVzLCBtc2cudmFyaWFibGVzKTtcbiAgICAgICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICB0eXBlOiAndHlwb2dyYXBoeS1ndWlkZS1nZW5lcmF0ZWQnLFxuICAgICAgICAgICAgICAgIGNvdW50OiBpdGVtQ291bnRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZmlnbWEubm90aWZ5KGBUeXBvZ3JhcGh5IGd1aWRlIGdlbmVyYXRlZCB3aXRoICR7aXRlbUNvdW50fSBpdGVtcyFgKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGdlbmVyYXRpbmcgdHlwb2dyYXBoeSBndWlkZTonLCBlcnJvcik7XG4gICAgICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3R5cG9ncmFwaHktZ3VpZGUtZXJyb3InLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gZ2VuZXJhdGUgdHlwb2dyYXBoeSBndWlkZS4gUGxlYXNlIHRyeSBhZ2Fpbi4nXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZpZ21hLm5vdGlmeSgnRmFpbGVkIHRvIGdlbmVyYXRlIHR5cG9ncmFwaHkgZ3VpZGUuIFBsZWFzZSB0cnkgYWdhaW4uJywgeyBlcnJvcjogdHJ1ZSB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAobXNnLnR5cGUgPT09ICdjbG9zZS1wbHVnaW4nKSB7XG4gICAgICAgIGZpZ21hLmNsb3NlUGx1Z2luKCk7XG4gICAgfVxuICAgIGlmIChtc2cudHlwZSA9PT0gJ3Jlc2l6ZScpIHtcbiAgICAgICAgZmlnbWEudWkucmVzaXplKG1zZy53aWR0aCwgbXNnLmhlaWdodCk7XG4gICAgfVxufTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==