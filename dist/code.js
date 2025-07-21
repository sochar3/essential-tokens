/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

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
        if (false) // removed by dead control flow
{}
    },
    warn: (...args) => {
        if (false) // removed by dead control flow
{}
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q3ZIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYiwwRUFBMEUsYUFBYTtBQUN2RjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLHVEQUF1RCxZQUFZO0FBQ25FO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYixnRkFBZ0YsYUFBYTtBQUM3RjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsdURBQXVELGdCQUFnQixTQUFTLFlBQVk7QUFDNUY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLDJGQUEyRixhQUFhO0FBQ3hHO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLDBCQUEwQjtBQUM5QztBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYix1REFBdUQsVUFBVSxjQUFjLFlBQVk7QUFDM0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLHFGQUFxRixhQUFhO0FBQ2xHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYixrQ0FBa0Msc0JBQXNCLGtCQUFrQix5QkFBeUI7QUFDbkc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLDRFQUE0RSxhQUFhO0FBQ3pGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsNERBQTRELFdBQVc7QUFDdkU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLHFGQUFxRixhQUFhO0FBQ2xHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2Vzc2VudGlhbC10b2tlbnMvLi9jb2RlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xuLy8gVGhpcyBmaWxlIHJ1bnMgaW4gdGhlIEZpZ21hIHBsdWdpbiBzYW5kYm94IGFuZCBoYXMgYWNjZXNzIHRvIHRoZSBGaWdtYSBBUElcbi8vIFNob3cgdGhlIFVJIHVzaW5nIHRoZSBIVE1MIGNvbnRlbnQgZnJvbSB0aGUgbWFuaWZlc3RcbmZpZ21hLnNob3dVSShfX2h0bWxfXywge1xuICAgIHdpZHRoOiA5NjAsXG4gICAgaGVpZ2h0OiA3MDAsXG4gICAgdGhlbWVDb2xvcnM6IHRydWVcbn0pO1xuLy8gPT09IEVORCBORVcgSU5URVJGQUNFUyA9PT1cbi8vIENvbnZlcnQgb2tsY2ggdG8gUkdCIHZhbHVlcyBmb3IgRmlnbWFcbmZ1bmN0aW9uIG9rbGNoVG9SZ2Iob2tsY2hTdHJpbmcpIHtcbiAgICBjb25zdCBtYXRjaCA9IG9rbGNoU3RyaW5nLm1hdGNoKC9va2xjaFxcKChbXFxkLl0rKVxccysoW1xcZC5dKylcXHMrKFtcXGQuXSspXFwpLyk7XG4gICAgaWYgKCFtYXRjaClcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgWywgbCwgYywgaF0gPSBtYXRjaC5tYXAoTnVtYmVyKTtcbiAgICAvLyBCZXR0ZXIgT0tMQ0ggdG8gUkdCIGNvbnZlcnNpb25cbiAgICAvLyBOb3RlOiBUaGlzIGlzIHN0aWxsIGEgc2ltcGxpZmllZCB2ZXJzaW9uLiBGb3IgcHJvZHVjdGlvbiwgY29uc2lkZXIgdXNpbmcgYSBwcm9wZXIgY29sb3IgbGlicmFyeSBsaWtlIGN1bG9yaVxuICAgIGNvbnN0IGxpZ2h0bmVzcyA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEsIGwpKTtcbiAgICBjb25zdCBjaHJvbWEgPSBNYXRoLm1heCgwLCBjKTtcbiAgICBjb25zdCBodWVSYWQgPSAoaCAqIE1hdGguUEkpIC8gMTgwO1xuICAgIC8vIENvbnZlcnQgTENIIHRvIExhYlxuICAgIGNvbnN0IGEgPSBjaHJvbWEgKiBNYXRoLmNvcyhodWVSYWQpO1xuICAgIGNvbnN0IGIgPSBjaHJvbWEgKiBNYXRoLnNpbihodWVSYWQpO1xuICAgIC8vIFNpbXBsaWZpZWQgTGFiIHRvIFhZWiBjb252ZXJzaW9uICh1c2luZyBENjUgaWxsdW1pbmFudCBhcHByb3hpbWF0aW9uKVxuICAgIGNvbnN0IGZ5ID0gKGxpZ2h0bmVzcyArIDE2KSAvIDExNjtcbiAgICBjb25zdCBmeCA9IGEgLyA1MDAgKyBmeTtcbiAgICBjb25zdCBmeiA9IGZ5IC0gYiAvIDIwMDtcbiAgICBjb25zdCB4eXpfdG9fcmdiID0gKHQpID0+IHtcbiAgICAgICAgcmV0dXJuIHQgPiAwLjIwNjg5MzAzNCA/IHQgKiB0ICogdCA6ICh0IC0gMTYgLyAxMTYpIC8gNy43ODc7XG4gICAgfTtcbiAgICBsZXQgeCA9IHh5el90b19yZ2IoZngpICogMC45NTA0NztcbiAgICBsZXQgeSA9IHh5el90b19yZ2IoZnkpO1xuICAgIGxldCB6ID0geHl6X3RvX3JnYihmeikgKiAxLjA4ODgzO1xuICAgIC8vIFhZWiB0byBzUkdCIGNvbnZlcnNpb24gbWF0cml4XG4gICAgbGV0IHIgPSB4ICogMy4yNDA2ICsgeSAqIC0xLjUzNzIgKyB6ICogLTAuNDk4NjtcbiAgICBsZXQgZyA9IHggKiAtMC45Njg5ICsgeSAqIDEuODc1OCArIHogKiAwLjA0MTU7XG4gICAgbGV0IGJfdmFsID0geCAqIDAuMDU1NyArIHkgKiAtMC4yMDQwICsgeiAqIDEuMDU3MDtcbiAgICAvLyBHYW1tYSBjb3JyZWN0aW9uXG4gICAgY29uc3QgZ2FtbWFfY29ycmVjdCA9IChjKSA9PiB7XG4gICAgICAgIHJldHVybiBjID4gMC4wMDMxMzA4ID8gMS4wNTUgKiBNYXRoLnBvdyhjLCAxIC8gMi40KSAtIDAuMDU1IDogMTIuOTIgKiBjO1xuICAgIH07XG4gICAgciA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEsIGdhbW1hX2NvcnJlY3QocikpKTtcbiAgICBnID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgZ2FtbWFfY29ycmVjdChnKSkpO1xuICAgIGJfdmFsID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgZ2FtbWFfY29ycmVjdChiX3ZhbCkpKTtcbiAgICByZXR1cm4geyByLCBnLCBiOiBiX3ZhbCB9O1xufVxuLy8gQ29udmVydCBoZXggdG8gUkdCXG5mdW5jdGlvbiBoZXhUb1JnYihoZXgpIHtcbiAgICBjb25zdCByZXN1bHQgPSAvXiM/KFthLWZcXGRdezJ9KShbYS1mXFxkXXsyfSkoW2EtZlxcZF17Mn0pJC9pLmV4ZWMoaGV4KTtcbiAgICByZXR1cm4gcmVzdWx0ID8ge1xuICAgICAgICByOiBwYXJzZUludChyZXN1bHRbMV0sIDE2KSAvIDI1NSxcbiAgICAgICAgZzogcGFyc2VJbnQocmVzdWx0WzJdLCAxNikgLyAyNTUsXG4gICAgICAgIGI6IHBhcnNlSW50KHJlc3VsdFszXSwgMTYpIC8gMjU1XG4gICAgfSA6IG51bGw7XG59XG4vLyBDb252ZXJ0IEhTTCB0byBSR0IgLSBFbmhhbmNlZCB0byBzdXBwb3J0IGRlY2ltYWwgdmFsdWVzIGFuZCBwZXJjZW50YWdlc1xuZnVuY3Rpb24gaHNsVG9SZ2IoaHNsU3RyaW5nKSB7XG4gICAgLy8gU3VwcG9ydCBib3RoIGludGVnZXIgYW5kIGRlY2ltYWwgdmFsdWVzLCB3aXRoIG9yIHdpdGhvdXQgcGVyY2VudGFnZXNcbiAgICBjb25zdCBtYXRjaCA9IGhzbFN0cmluZy5tYXRjaCgvaHNsYT9cXCgoWystXT9bXFxkLl0rKSg/OmRlZyk/LD9cXHMqKFsrLV0/W1xcZC5dKyklPyw/XFxzKihbKy1dP1tcXGQuXSspJT8oPzosP1xccyooWystXT9bXFxkLl0rKSk/XFwpL2kpO1xuICAgIGlmICghbWF0Y2gpXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIGxldCBoID0gcGFyc2VGbG9hdChtYXRjaFsxXSk7XG4gICAgbGV0IHMgPSBwYXJzZUZsb2F0KG1hdGNoWzJdKTtcbiAgICBsZXQgbCA9IHBhcnNlRmxvYXQobWF0Y2hbM10pO1xuICAgIC8vIE5vcm1hbGl6ZSBodWUgdG8gMC0xIHJhbmdlXG4gICAgaCA9ICgoaCAlIDM2MCkgKyAzNjApICUgMzYwIC8gMzYwO1xuICAgIC8vIE5vcm1hbGl6ZSBzYXR1cmF0aW9uIGFuZCBsaWdodG5lc3NcbiAgICAvLyBJZiB2YWx1ZXMgYXJlID4gMSwgYXNzdW1lIHRoZXkncmUgcGVyY2VudGFnZXNcbiAgICBpZiAocyA+IDEpXG4gICAgICAgIHMgPSBzIC8gMTAwO1xuICAgIGlmIChsID4gMSlcbiAgICAgICAgbCA9IGwgLyAxMDA7XG4gICAgLy8gQ2xhbXAgdmFsdWVzXG4gICAgcyA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEsIHMpKTtcbiAgICBsID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgbCkpO1xuICAgIGNvbnN0IGh1ZTJyZ2IgPSAocCwgcSwgdCkgPT4ge1xuICAgICAgICBpZiAodCA8IDApXG4gICAgICAgICAgICB0ICs9IDE7XG4gICAgICAgIGlmICh0ID4gMSlcbiAgICAgICAgICAgIHQgLT0gMTtcbiAgICAgICAgaWYgKHQgPCAxIC8gNilcbiAgICAgICAgICAgIHJldHVybiBwICsgKHEgLSBwKSAqIDYgKiB0O1xuICAgICAgICBpZiAodCA8IDEgLyAyKVxuICAgICAgICAgICAgcmV0dXJuIHE7XG4gICAgICAgIGlmICh0IDwgMiAvIDMpXG4gICAgICAgICAgICByZXR1cm4gcCArIChxIC0gcCkgKiAoMiAvIDMgLSB0KSAqIDY7XG4gICAgICAgIHJldHVybiBwO1xuICAgIH07XG4gICAgY29uc3QgcSA9IGwgPCAwLjUgPyBsICogKDEgKyBzKSA6IGwgKyBzIC0gbCAqIHM7XG4gICAgY29uc3QgcCA9IDIgKiBsIC0gcTtcbiAgICByZXR1cm4ge1xuICAgICAgICByOiBodWUycmdiKHAsIHEsIGggKyAxIC8gMyksXG4gICAgICAgIGc6IGh1ZTJyZ2IocCwgcSwgaCksXG4gICAgICAgIGI6IGh1ZTJyZ2IocCwgcSwgaCAtIDEgLyAzKVxuICAgIH07XG59XG4vLyBDb252ZXJ0IEhTQi9IU1YgdG8gUkdCIC0gTmV3IGZ1bmN0aW9uIGZvciBIU0Igc3VwcG9ydFxuZnVuY3Rpb24gaHNiVG9SZ2IoaHNiU3RyaW5nKSB7XG4gICAgLy8gU3VwcG9ydCBoc2IoKSwgaHN2KCksIGFuZCBoc2JhKCkvaHN2YSgpIGZvcm1hdHNcbiAgICBjb25zdCBtYXRjaCA9IGhzYlN0cmluZy5tYXRjaCgvaHNiW2F2XT9cXCgoWystXT9bXFxkLl0rKSg/OmRlZyk/LD9cXHMqKFsrLV0/W1xcZC5dKyklPyw/XFxzKihbKy1dP1tcXGQuXSspJT8oPzosP1xccyooWystXT9bXFxkLl0rKSk/XFwpL2kpO1xuICAgIGlmICghbWF0Y2gpXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIGxldCBoID0gcGFyc2VGbG9hdChtYXRjaFsxXSk7XG4gICAgbGV0IHMgPSBwYXJzZUZsb2F0KG1hdGNoWzJdKTtcbiAgICBsZXQgYiA9IHBhcnNlRmxvYXQobWF0Y2hbM10pO1xuICAgIC8vIE5vcm1hbGl6ZSBodWUgdG8gMC0xIHJhbmdlXG4gICAgaCA9ICgoaCAlIDM2MCkgKyAzNjApICUgMzYwIC8gMzYwO1xuICAgIC8vIE5vcm1hbGl6ZSBzYXR1cmF0aW9uIGFuZCBicmlnaHRuZXNzXG4gICAgLy8gSWYgdmFsdWVzIGFyZSA+IDEsIGFzc3VtZSB0aGV5J3JlIHBlcmNlbnRhZ2VzXG4gICAgaWYgKHMgPiAxKVxuICAgICAgICBzID0gcyAvIDEwMDtcbiAgICBpZiAoYiA+IDEpXG4gICAgICAgIGIgPSBiIC8gMTAwO1xuICAgIC8vIENsYW1wIHZhbHVlc1xuICAgIHMgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBzKSk7XG4gICAgYiA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEsIGIpKTtcbiAgICBjb25zdCBjID0gYiAqIHM7XG4gICAgY29uc3QgeCA9IGMgKiAoMSAtIE1hdGguYWJzKChoICogNikgJSAyIC0gMSkpO1xuICAgIGNvbnN0IG0gPSBiIC0gYztcbiAgICBsZXQgciA9IDAsIGcgPSAwLCBiX3ZhbCA9IDA7XG4gICAgY29uc3QgaFNlY3RvciA9IGggKiA2O1xuICAgIGlmIChoU2VjdG9yID49IDAgJiYgaFNlY3RvciA8IDEpIHtcbiAgICAgICAgciA9IGM7XG4gICAgICAgIGcgPSB4O1xuICAgICAgICBiX3ZhbCA9IDA7XG4gICAgfVxuICAgIGVsc2UgaWYgKGhTZWN0b3IgPj0gMSAmJiBoU2VjdG9yIDwgMikge1xuICAgICAgICByID0geDtcbiAgICAgICAgZyA9IGM7XG4gICAgICAgIGJfdmFsID0gMDtcbiAgICB9XG4gICAgZWxzZSBpZiAoaFNlY3RvciA+PSAyICYmIGhTZWN0b3IgPCAzKSB7XG4gICAgICAgIHIgPSAwO1xuICAgICAgICBnID0gYztcbiAgICAgICAgYl92YWwgPSB4O1xuICAgIH1cbiAgICBlbHNlIGlmIChoU2VjdG9yID49IDMgJiYgaFNlY3RvciA8IDQpIHtcbiAgICAgICAgciA9IDA7XG4gICAgICAgIGcgPSB4O1xuICAgICAgICBiX3ZhbCA9IGM7XG4gICAgfVxuICAgIGVsc2UgaWYgKGhTZWN0b3IgPj0gNCAmJiBoU2VjdG9yIDwgNSkge1xuICAgICAgICByID0geDtcbiAgICAgICAgZyA9IDA7XG4gICAgICAgIGJfdmFsID0gYztcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHIgPSBjO1xuICAgICAgICBnID0gMDtcbiAgICAgICAgYl92YWwgPSB4O1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICByOiByICsgbSxcbiAgICAgICAgZzogZyArIG0sXG4gICAgICAgIGI6IGJfdmFsICsgbVxuICAgIH07XG59XG4vLyBFbmhhbmNlZCBSR0IgcGFyc2luZyB0byBzdXBwb3J0IGRlY2ltYWxzLCBwZXJjZW50YWdlcywgYW5kIHJnYmFcbmZ1bmN0aW9uIHJnYlRvUmdiKHJnYlN0cmluZykge1xuICAgIC8vIFN1cHBvcnQgcmdiKCksIHJnYmEoKSwgYW5kIHZhcmlvdXMgZm9ybWF0cyBpbmNsdWRpbmcgZGVjaW1hbHMgYW5kIHBlcmNlbnRhZ2VzXG4gICAgY29uc3QgbWF0Y2ggPSByZ2JTdHJpbmcubWF0Y2goL3JnYmE/XFwoKFsrLV0/W1xcZC5dKyklPyw/XFxzKihbKy1dP1tcXGQuXSspJT8sP1xccyooWystXT9bXFxkLl0rKSU/KD86LD9cXHMqKFsrLV0/W1xcZC5dKykpP1xcKS9pKTtcbiAgICBpZiAoIW1hdGNoKVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICBsZXQgciA9IHBhcnNlRmxvYXQobWF0Y2hbMV0pO1xuICAgIGxldCBnID0gcGFyc2VGbG9hdChtYXRjaFsyXSk7XG4gICAgbGV0IGIgPSBwYXJzZUZsb2F0KG1hdGNoWzNdKTtcbiAgICAvLyBDaGVjayBpZiB2YWx1ZXMgYXJlIHBlcmNlbnRhZ2VzIGJ5IGxvb2tpbmcgZm9yICUgaW4gdGhlIG9yaWdpbmFsIHN0cmluZ1xuICAgIGNvbnN0IGlzUGVyY2VudGFnZSA9IHJnYlN0cmluZy5pbmNsdWRlcygnJScpO1xuICAgIGlmIChpc1BlcmNlbnRhZ2UpIHtcbiAgICAgICAgLy8gSWYgcGVyY2VudGFnZXMsIG5vcm1hbGl6ZSB0byAwLTFcbiAgICAgICAgciA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEwMCwgcikpIC8gMTAwO1xuICAgICAgICBnID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMTAwLCBnKSkgLyAxMDA7XG4gICAgICAgIGIgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxMDAsIGIpKSAvIDEwMDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIC8vIElmIG5vdCBwZXJjZW50YWdlcywgYXNzdW1lIDAtMjU1IHJhbmdlIGlmID4gMSwgb3RoZXJ3aXNlIDAtMVxuICAgICAgICBpZiAociA+IDEgfHwgZyA+IDEgfHwgYiA+IDEpIHtcbiAgICAgICAgICAgIHIgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigyNTUsIHIpKSAvIDI1NTtcbiAgICAgICAgICAgIGcgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigyNTUsIGcpKSAvIDI1NTtcbiAgICAgICAgICAgIGIgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigyNTUsIGIpKSAvIDI1NTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHIgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCByKSk7XG4gICAgICAgICAgICBnID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgZykpO1xuICAgICAgICAgICAgYiA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEsIGIpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4geyByLCBnLCBiIH07XG59XG4vLyBDb252ZXJ0IFNoYWRDTiByYXcgSFNMIGZvcm1hdCB0byBSR0IgKGUuZy4sIFwiMCAwJSAxMDAlXCIgLT4gUkdCKVxuZnVuY3Rpb24gc2hhZGNuSHNsVG9SZ2Ioc2hhZGNuSHNsU3RyaW5nKSB7XG4gICAgLy8gUGFyc2UgU2hhZENOIGZvcm1hdDogXCJoIHMlIGwlXCIgKHdpdGhvdXQgaHNsKCkgd3JhcHBlcilcbiAgICBjb25zdCBtYXRjaCA9IHNoYWRjbkhzbFN0cmluZy50cmltKCkubWF0Y2goL14oWystXT9bXFxkLl0rKVxccysoWystXT9bXFxkLl0rKSVcXHMrKFsrLV0/W1xcZC5dKyklJC8pO1xuICAgIGlmICghbWF0Y2gpXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIGxldCBoID0gcGFyc2VGbG9hdChtYXRjaFsxXSk7XG4gICAgbGV0IHMgPSBwYXJzZUZsb2F0KG1hdGNoWzJdKTtcbiAgICBsZXQgbCA9IHBhcnNlRmxvYXQobWF0Y2hbM10pO1xuICAgIC8vIE5vcm1hbGl6ZSBodWUgdG8gMC0xIHJhbmdlXG4gICAgaCA9ICgoaCAlIDM2MCkgKyAzNjApICUgMzYwIC8gMzYwO1xuICAgIC8vIE5vcm1hbGl6ZSBzYXR1cmF0aW9uIGFuZCBsaWdodG5lc3MgKGFscmVhZHkgaW4gcGVyY2VudGFnZSBmb3JtYXQpXG4gICAgcyA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEwMCwgcykpIC8gMTAwO1xuICAgIGwgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxMDAsIGwpKSAvIDEwMDtcbiAgICBjb25zdCBodWUycmdiID0gKHAsIHEsIHQpID0+IHtcbiAgICAgICAgaWYgKHQgPCAwKVxuICAgICAgICAgICAgdCArPSAxO1xuICAgICAgICBpZiAodCA+IDEpXG4gICAgICAgICAgICB0IC09IDE7XG4gICAgICAgIGlmICh0IDwgMSAvIDYpXG4gICAgICAgICAgICByZXR1cm4gcCArIChxIC0gcCkgKiA2ICogdDtcbiAgICAgICAgaWYgKHQgPCAxIC8gMilcbiAgICAgICAgICAgIHJldHVybiBxO1xuICAgICAgICBpZiAodCA8IDIgLyAzKVxuICAgICAgICAgICAgcmV0dXJuIHAgKyAocSAtIHApICogKDIgLyAzIC0gdCkgKiA2O1xuICAgICAgICByZXR1cm4gcDtcbiAgICB9O1xuICAgIGNvbnN0IHEgPSBsIDwgMC41ID8gbCAqICgxICsgcykgOiBsICsgcyAtIGwgKiBzO1xuICAgIGNvbnN0IHAgPSAyICogbCAtIHE7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcjogaHVlMnJnYihwLCBxLCBoICsgMSAvIDMpLFxuICAgICAgICBnOiBodWUycmdiKHAsIHEsIGgpLFxuICAgICAgICBiOiBodWUycmdiKHAsIHEsIGggLSAxIC8gMylcbiAgICB9O1xufVxuLy8gUGFyc2UgY29sb3IgdmFsdWUgdG8gUkdCIC0gRW5oYW5jZWQgd2l0aCBjb21wcmVoZW5zaXZlIGZvcm1hdCBzdXBwb3J0XG5mdW5jdGlvbiBwYXJzZUNvbG9yVG9SZ2IoY29sb3JWYWx1ZSkge1xuICAgIGNvbnN0IGNsZWFuVmFsdWUgPSBjb2xvclZhbHVlLnRyaW0oKTtcbiAgICAvLyBDaGVjayBmb3IgU2hhZENOIHJhdyBIU0wgZm9ybWF0IGZpcnN0IChlLmcuLCBcIjAgMCUgMTAwJVwiKVxuICAgIGNvbnN0IHNoYWRjbkhzbE1hdGNoID0gY2xlYW5WYWx1ZS5tYXRjaCgvXihbKy1dP1tcXGQuXSspXFxzKyhbKy1dP1tcXGQuXSspJVxccysoWystXT9bXFxkLl0rKSUkLyk7XG4gICAgaWYgKHNoYWRjbkhzbE1hdGNoKSB7XG4gICAgICAgIHJldHVybiBzaGFkY25Ic2xUb1JnYihjbGVhblZhbHVlKTtcbiAgICB9XG4gICAgaWYgKGNsZWFuVmFsdWUuaW5jbHVkZXMoJ29rbGNoJykpIHtcbiAgICAgICAgcmV0dXJuIG9rbGNoVG9SZ2IoY2xlYW5WYWx1ZSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGNsZWFuVmFsdWUuc3RhcnRzV2l0aCgnIycpKSB7XG4gICAgICAgIHJldHVybiBoZXhUb1JnYihjbGVhblZhbHVlKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoY2xlYW5WYWx1ZS5pbmNsdWRlcygnaHNsJykpIHtcbiAgICAgICAgcmV0dXJuIGhzbFRvUmdiKGNsZWFuVmFsdWUpO1xuICAgIH1cbiAgICBlbHNlIGlmIChjbGVhblZhbHVlLmluY2x1ZGVzKCdoc2InKSB8fCBjbGVhblZhbHVlLmluY2x1ZGVzKCdoc3YnKSkge1xuICAgICAgICByZXR1cm4gaHNiVG9SZ2IoY2xlYW5WYWx1ZSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGNsZWFuVmFsdWUuaW5jbHVkZXMoJ3JnYicpKSB7XG4gICAgICAgIHJldHVybiByZ2JUb1JnYihjbGVhblZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG4vLyBEZWJ1ZyBsb2dnZXIgdXRpbGl0eSBmb3IgZGV2ZWxvcG1lbnRcbmNvbnN0IGxvZ2dlciA9IHtcbiAgICBsb2c6ICguLi5hcmdzKSA9PiB7XG4gICAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyguLi5hcmdzKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgd2FybjogKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybiguLi5hcmdzKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZXJyb3I6ICguLi5hcmdzKSA9PiB7XG4gICAgICAgIC8vIEFsd2F5cyBsb2cgZXJyb3JzXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoLi4uYXJncyk7XG4gICAgfVxufTtcbi8vIEZ1bmN0aW9uIHRvIGZpbmQgZXhpc3Rpbmcgc2hhZGNuLWNvbXBhdGlibGUgdmFyaWFibGUgY29sbGVjdGlvbiAodXBkYXRlZCBmb3IgU2hhZENOIHBhdHRlcm5zKVxuYXN5bmMgZnVuY3Rpb24gZmluZEV4aXN0aW5nU2hhZGNuQ29sbGVjdGlvbigpIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBjb2xsZWN0aW9ucyA9IGF3YWl0IGZpZ21hLnZhcmlhYmxlcy5nZXRMb2NhbFZhcmlhYmxlQ29sbGVjdGlvbnNBc3luYygpO1xuICAgICAgICBjb25zdCB2YXJpYWJsZXMgPSBhd2FpdCBmaWdtYS52YXJpYWJsZXMuZ2V0TG9jYWxWYXJpYWJsZXNBc3luYygpO1xuICAgICAgICBsb2dnZXIubG9nKCdBdmFpbGFibGUgY29sbGVjdGlvbnM6JywgY29sbGVjdGlvbnMubWFwKChjKSA9PiAoeyBuYW1lOiBjLm5hbWUsIGlkOiBjLmlkLCBtb2RlczogYy5tb2Rlcy5sZW5ndGggfSkpKTtcbiAgICAgICAgLy8gTG9vayBmb3IgU2hhZENOIGNvbGxlY3Rpb25zIGluIG9yZGVyIG9mIHByZWZlcmVuY2VcbiAgICAgICAgY29uc3Qgc2hhZGNuQ29sbGVjdGlvbk5hbWVzID0gWycyLiBUaGVtZXMnLCAnMy4gTW9kZScsICdUaGVtZXMnLCAnQ29sb3JzJywgJ0Rlc2lnbiBUb2tlbnMnXTtcbiAgICAgICAgZm9yIChjb25zdCBjb2xsZWN0aW9uTmFtZSBvZiBzaGFkY25Db2xsZWN0aW9uTmFtZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldENvbGxlY3Rpb24gPSBjb2xsZWN0aW9ucy5maW5kKChjb2xsZWN0aW9uKSA9PiBjb2xsZWN0aW9uLm5hbWUgPT09IGNvbGxlY3Rpb25OYW1lKTtcbiAgICAgICAgICAgIGlmICh0YXJnZXRDb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29sbGVjdGlvblZhcmlhYmxlcyA9IHZhcmlhYmxlcy5maWx0ZXIoKHYpID0+IHYudmFyaWFibGVDb2xsZWN0aW9uSWQgPT09IHRhcmdldENvbGxlY3Rpb24uaWQpO1xuICAgICAgICAgICAgICAgIGxvZ2dlci5sb2coYEZvdW5kIFwiJHtjb2xsZWN0aW9uTmFtZX1cIiBjb2xsZWN0aW9uIHdpdGggJHtjb2xsZWN0aW9uVmFyaWFibGVzLmxlbmd0aH0gdmFyaWFibGVzYCk7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmxvZygnVmFyaWFibGUgbmFtZXMgc2FtcGxlOicsIGNvbGxlY3Rpb25WYXJpYWJsZXMuc2xpY2UoMCwgNSkubWFwKCh2KSA9PiB2Lm5hbWUpKTtcbiAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiBpdCBoYXMgdmFyaWFibGVzIHdpdGggU2hhZENOIG5hbWluZyBwYXR0ZXJuc1xuICAgICAgICAgICAgICAgIGNvbnN0IHNoYWRjblBhdHRlcm5zID0gWydiYWNrZ3JvdW5kJywgJ2ZvcmVncm91bmQnLCAncHJpbWFyeScsICdzZWNvbmRhcnknLCAnbXV0ZWQnLCAnYWNjZW50JywgJ2Rlc3RydWN0aXZlJywgJ2JvcmRlcicsICdpbnB1dCcsICdyaW5nJywgJ2NhcmQnLCAncG9wb3ZlciddO1xuICAgICAgICAgICAgICAgIC8vIENoZWNrIGZvciB2YXJpYWJsZXMgaW4gXCJiYXNlL1wiIG9yIFwiY29sb3IvXCIgZ3JvdXBzXG4gICAgICAgICAgICAgICAgY29uc3QgYmFzZUdyb3VwVmFyaWFibGVzID0gY29sbGVjdGlvblZhcmlhYmxlcy5maWx0ZXIoKHZhcmlhYmxlKSA9PiB2YXJpYWJsZS5uYW1lLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnYmFzZS8nKSB8fFxuICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZS5uYW1lLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnY29sb3IvJykpO1xuICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIGl0IGhhcyBTaGFkQ04gdmFyaWFibGVzICh3aXRoIG9yIHdpdGhvdXQgcHJlZml4ZXMpXG4gICAgICAgICAgICAgICAgY29uc3QgaGFzU2hhZGNuVmFyaWFibGVzID0gY29sbGVjdGlvblZhcmlhYmxlcy5zb21lKCh2YXJpYWJsZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gdmFyaWFibGUubmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2hhZGNuUGF0dGVybnMuc29tZShwYXR0ZXJuID0+IG5hbWUuaW5jbHVkZXMocGF0dGVybikpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGxvZ2dlci5sb2coYEJhc2UvY29sb3IgZ3JvdXAgdmFyaWFibGVzOiAke2Jhc2VHcm91cFZhcmlhYmxlcy5sZW5ndGh9LCBoYXMgc2hhZGNuIHBhdHRlcm5zOiAke2hhc1NoYWRjblZhcmlhYmxlc31gKTtcbiAgICAgICAgICAgICAgICAvLyBNb3JlIGxlbmllbnQgY3JpdGVyaWEgZm9yIFNoYWRDTiBjb2xsZWN0aW9uc1xuICAgICAgICAgICAgICAgIGlmIChoYXNTaGFkY25WYXJpYWJsZXMgJiYgY29sbGVjdGlvblZhcmlhYmxlcy5sZW5ndGggPj0gMykge1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIubG9nKGBVc2luZyBcIiR7Y29sbGVjdGlvbk5hbWV9XCIgY29sbGVjdGlvbiBhcyB0YXJnZXRgKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IHRhcmdldENvbGxlY3Rpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IGNvbGxlY3Rpb25WYXJpYWJsZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICBoYXNMaWdodERhcmtNb2RlczogdGFyZ2V0Q29sbGVjdGlvbi5tb2Rlcy5sZW5ndGggPiAxXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIEZhbGxiYWNrOiBsb29rIGZvciBhbnkgY29sbGVjdGlvbiB3aXRoIGEgcmVhc29uYWJsZSBudW1iZXIgb2YgY29sb3IgdmFyaWFibGVzXG4gICAgICAgIGZvciAoY29uc3QgY29sbGVjdGlvbiBvZiBjb2xsZWN0aW9ucykge1xuICAgICAgICAgICAgY29uc3QgY29sbGVjdGlvblZhcmlhYmxlcyA9IHZhcmlhYmxlcy5maWx0ZXIoKHYpID0+IHYudmFyaWFibGVDb2xsZWN0aW9uSWQgPT09IGNvbGxlY3Rpb24uaWQpO1xuICAgICAgICAgICAgLy8gQ291bnQgY29sb3IgdmFyaWFibGVzXG4gICAgICAgICAgICBjb25zdCBjb2xvclZhcmlhYmxlcyA9IGNvbGxlY3Rpb25WYXJpYWJsZXMuZmlsdGVyKCh2YXJpYWJsZSkgPT4gdmFyaWFibGUucmVzb2x2ZWRUeXBlID09PSAnQ09MT1InKTtcbiAgICAgICAgICAgIC8vIExvb2sgZm9yIGNvbGxlY3Rpb25zIHdpdGggc2lnbmlmaWNhbnQgY29sb3IgdmFyaWFibGVzXG4gICAgICAgICAgICBpZiAoY29sb3JWYXJpYWJsZXMubGVuZ3RoID49IDEwKSB7IC8vIExvd2VyZWQgdGhyZXNob2xkIGZvciBTaGFkQ04gY29tcGF0aWJpbGl0eVxuICAgICAgICAgICAgICAgIGxvZ2dlci5sb2coYFVzaW5nIGZhbGxiYWNrIGNvbGxlY3Rpb246IFwiJHtjb2xsZWN0aW9uLm5hbWV9XCIgd2l0aCAke2NvbG9yVmFyaWFibGVzLmxlbmd0aH0gY29sb3IgdmFyaWFibGVzYCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbixcbiAgICAgICAgICAgICAgICAgICAgdmFyaWFibGVzOiBjb2xsZWN0aW9uVmFyaWFibGVzLFxuICAgICAgICAgICAgICAgICAgICBoYXNMaWdodERhcmtNb2RlczogY29sbGVjdGlvbi5tb2Rlcy5sZW5ndGggPiAxXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsb2dnZXIubG9nKCdObyBleGlzdGluZyBTaGFkQ04tY29tcGF0aWJsZSBjb2xsZWN0aW9uIGZvdW5kJyk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBmaW5kaW5nIGV4aXN0aW5nIFNoYWRDTiBjb2xsZWN0aW9uOicsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlRmlnbWFWYXJpYWJsZXModG9rZW5zKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gRmlyc3QsIGNoZWNrIGlmIHRoZXJlJ3MgYW4gZXhpc3Rpbmcgc2hhZGNuLWNvbXBhdGlibGUgY29sbGVjdGlvblxuICAgICAgICBjb25zdCBleGlzdGluZ1NldHVwID0gYXdhaXQgZmluZEV4aXN0aW5nU2hhZGNuQ29sbGVjdGlvbigpO1xuICAgICAgICBsZXQgY29sbGVjdGlvbjtcbiAgICAgICAgbGV0IGxpZ2h0TW9kZUlkO1xuICAgICAgICBsZXQgZGFya01vZGVJZDtcbiAgICAgICAgaWYgKGV4aXN0aW5nU2V0dXApIHtcbiAgICAgICAgICAgIC8vIFVzZSBleGlzdGluZyBjb2xsZWN0aW9uIGFuZCBleHRlbmQgaXRcbiAgICAgICAgICAgIGNvbGxlY3Rpb24gPSBleGlzdGluZ1NldHVwLmNvbGxlY3Rpb247XG4gICAgICAgICAgICAvLyBDaGVjayBpZiB0aGlzIGlzIHRoZSBzcGVjaWZpYyBcIjMuIE1vZGVcIiBjb2xsZWN0aW9uXG4gICAgICAgICAgICBjb25zdCBpc1RoZW1lTW9kZUNvbGxlY3Rpb24gPSBjb2xsZWN0aW9uLm5hbWUgPT09ICczLiBNb2RlJztcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdFeGlzdGluZyBtb2RlczonLCBjb2xsZWN0aW9uLm1vZGVzLm1hcCgobSkgPT4gbS5uYW1lKSk7XG4gICAgICAgICAgICAvLyBDcmVhdGUgbmV3IGN1c3RvbSBtb2RlcyBhbG9uZ3NpZGUgZXhpc3Rpbmcgb25lcyAoZG9uJ3Qgb3ZlcndyaXRlKVxuICAgICAgICAgICAgbGlnaHRNb2RlSWQgPSBjb2xsZWN0aW9uLmFkZE1vZGUoJ2xpZ2h0IGN1c3RvbScpO1xuICAgICAgICAgICAgZGFya01vZGVJZCA9IGNvbGxlY3Rpb24uYWRkTW9kZSgnZGFyayBjdXN0b20nKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBDcmVhdGVkIG5ldyBtb2RlczogXCJsaWdodCBjdXN0b21cIiBhbmQgXCJkYXJrIGN1c3RvbVwiYCk7XG4gICAgICAgICAgICBpZiAoaXNUaGVtZU1vZGVDb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgZmlnbWEubm90aWZ5KGBBZGRpbmcgY3VzdG9tIHRoZW1lIG1vZGVzIHRvIFwiJHtjb2xsZWN0aW9uLm5hbWV9XCIg4oaSIGJhc2UgZ3JvdXBgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGZpZ21hLm5vdGlmeShgQWRkaW5nIGN1c3RvbSBtb2RlcyB0byBleGlzdGluZyBjb2xsZWN0aW9uOiBcIiR7Y29sbGVjdGlvbi5uYW1lfVwiYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBDcmVhdGUgYSBuZXcgdmFyaWFibGUgY29sbGVjdGlvbiBmb3IgZGVzaWduIHRva2Vuc1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ05vIGV4aXN0aW5nIGNvbGxlY3Rpb24gZm91bmQsIGNyZWF0aW5nIG5ldyBcIkRlc2lnbiBUb2tlbnNcIiBjb2xsZWN0aW9uJyk7XG4gICAgICAgICAgICBjb2xsZWN0aW9uID0gZmlnbWEudmFyaWFibGVzLmNyZWF0ZVZhcmlhYmxlQ29sbGVjdGlvbignRGVzaWduIFRva2VucycpO1xuICAgICAgICAgICAgLy8gU2V0IHVwIG1vZGVzIC0gZmlyc3QgbW9kZSBpcyBsaWdodCwgYWRkIGRhcmsgbW9kZVxuICAgICAgICAgICAgbGlnaHRNb2RlSWQgPSBjb2xsZWN0aW9uLm1vZGVzWzBdLm1vZGVJZDtcbiAgICAgICAgICAgIGNvbGxlY3Rpb24ucmVuYW1lTW9kZShsaWdodE1vZGVJZCwgJ0xpZ2h0Jyk7XG4gICAgICAgICAgICBkYXJrTW9kZUlkID0gY29sbGVjdGlvbi5hZGRNb2RlKCdEYXJrJyk7XG4gICAgICAgICAgICBmaWdtYS5ub3RpZnkoJ0NyZWF0aW5nIG5ldyBcIkRlc2lnbiBUb2tlbnNcIiBjb2xsZWN0aW9uIHdpdGggTGlnaHQvRGFyayBtb2RlcycpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBjcmVhdGVkQ291bnQgPSAwO1xuICAgICAgICAvLyBIZWxwZXIgZnVuY3Rpb24gdG8gY3JlYXRlIG9yIHVwZGF0ZSBhIHZhcmlhYmxlIHdpdGggYm90aCBsaWdodCBhbmQgZGFyayBtb2RlIHZhbHVlc1xuICAgICAgICBjb25zdCBjcmVhdGVPclVwZGF0ZVZhcmlhYmxlV2l0aE1vZGVzID0gYXN5bmMgKGxpZ2h0VG9rZW4sIGRhcmtUb2tlbiwgY29sbGVjdGlvbiwgbGlnaHRNb2RlSWQsIGRhcmtNb2RlSWQsIGV4aXN0aW5nVmFyaWFibGVzKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxldCB2YXJpYWJsZVR5cGU7XG4gICAgICAgICAgICAgICAgbGV0IGxpZ2h0VmFsdWU7XG4gICAgICAgICAgICAgICAgbGV0IGRhcmtWYWx1ZTtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGxpZ2h0VG9rZW4udHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdjb2xvcic6XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZVR5cGUgPSAnQ09MT1InO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbGlnaHRSZ2IgPSBwYXJzZUNvbG9yVG9SZ2IobGlnaHRUb2tlbi52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWxpZ2h0UmdiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBDb3VsZCBub3QgcGFyc2UgbGlnaHQgY29sb3I6ICR7bGlnaHRUb2tlbi52YWx1ZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBsaWdodFZhbHVlID0gbGlnaHRSZ2I7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGFya1Rva2VuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGFya1JnYiA9IHBhcnNlQ29sb3JUb1JnYihkYXJrVG9rZW4udmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhcmtWYWx1ZSA9IGRhcmtSZ2IgfHwgbGlnaHRSZ2I7IC8vIEZhbGxiYWNrIHRvIGxpZ2h0IGlmIGRhcmsgZmFpbHNcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhcmtWYWx1ZSA9IGxpZ2h0UmdiO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3JhZGl1cyc6XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZVR5cGUgPSAnRkxPQVQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRXh0cmFjdCBudW1lcmljIHZhbHVlIGZyb20gcmVtLCBweCwgZXRjLlxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbGlnaHROdW1NYXRjaCA9IGxpZ2h0VG9rZW4udmFsdWUubWF0Y2goLyhbXFxkLl0rKS8pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxpZ2h0TnVtTWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaWdodFZhbHVlID0gcGFyc2VGbG9hdChsaWdodE51bU1hdGNoWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDb252ZXJ0IHJlbSB0byBweCAoYXNzdW1pbmcgMTZweCA9IDFyZW0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxpZ2h0VG9rZW4udmFsdWUuaW5jbHVkZXMoJ3JlbScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpZ2h0VmFsdWUgKj0gMTY7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBDb3VsZCBub3QgcGFyc2UgcmFkaXVzOiAke2xpZ2h0VG9rZW4udmFsdWV9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhcmtUb2tlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhcmtOdW1NYXRjaCA9IGRhcmtUb2tlbi52YWx1ZS5tYXRjaCgvKFtcXGQuXSspLyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhcmtOdW1NYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXJrVmFsdWUgPSBwYXJzZUZsb2F0KGRhcmtOdW1NYXRjaFsxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXJrVG9rZW4udmFsdWUuaW5jbHVkZXMoJ3JlbScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXJrVmFsdWUgKj0gMTY7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhcmtWYWx1ZSA9IGxpZ2h0VmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGFya1ZhbHVlID0gbGlnaHRWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdmb250JzpcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlVHlwZSA9ICdTVFJJTkcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGlnaHRWYWx1ZSA9IGxpZ2h0VG9rZW4udmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXJrVmFsdWUgPSBkYXJrVG9rZW4gPyBkYXJrVG9rZW4udmFsdWUgOiBsaWdodFRva2VuLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEFkZCBcImJhc2UvXCIgcHJlZml4IGZvciBjb2xvciB2YXJpYWJsZXMgdG8gZ3JvdXAgdGhlbVxuICAgICAgICAgICAgICAgIGNvbnN0IHZhcmlhYmxlTmFtZSA9IGxpZ2h0VG9rZW4udHlwZSA9PT0gJ2NvbG9yJyA/IGBiYXNlLyR7bGlnaHRUb2tlbi5uYW1lfWAgOiBsaWdodFRva2VuLm5hbWU7XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdmFyaWFibGUgYWxyZWFkeSBleGlzdHMgd2hlbiBleHRlbmRpbmcgZXhpc3RpbmcgY29sbGVjdGlvblxuICAgICAgICAgICAgICAgIGxldCB2YXJpYWJsZTtcbiAgICAgICAgICAgICAgICBpZiAoZXhpc3RpbmdWYXJpYWJsZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyaWFibGUgPSBleGlzdGluZ1ZhcmlhYmxlcy5maW5kKCh2KSA9PiB2Lm5hbWUgPT09IHZhcmlhYmxlTmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh2YXJpYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgZXhpc3RpbmcgdmFyaWFibGUgd2l0aCBuZXcgY3VzdG9tIG1vZGUgdmFsdWVzIG9ubHlcbiAgICAgICAgICAgICAgICAgICAgLy8gRG9uJ3QgdG91Y2ggZXhpc3RpbmcgbW9kZSB2YWx1ZXMgLSBvbmx5IGFkZCB0byB0aGUgbmV3IGN1c3RvbSBtb2Rlc1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyaWFibGUuc2V0VmFsdWVGb3JNb2RlKGxpZ2h0TW9kZUlkLCBsaWdodFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlLnNldFZhbHVlRm9yTW9kZShkYXJrTW9kZUlkLCBkYXJrVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmxvZyhgVXBkYXRlZCBleGlzdGluZyB2YXJpYWJsZSBcIiR7dmFyaWFibGVOYW1lfVwiIHdpdGggY3VzdG9tIG1vZGUgdmFsdWVzYCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIud2FybihgQ291bGQgbm90IGFkZCBjdXN0b20gbW9kZXMgdG8gdmFyaWFibGUgJHt2YXJpYWJsZU5hbWV9OmAsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIG5ldyB2YXJpYWJsZSBhbmQgc2V0IHZhbHVlcyBvbmx5IGZvciBjdXN0b20gbW9kZXNcbiAgICAgICAgICAgICAgICAgICAgdmFyaWFibGUgPSBmaWdtYS52YXJpYWJsZXMuY3JlYXRlVmFyaWFibGUodmFyaWFibGVOYW1lLCBjb2xsZWN0aW9uLCB2YXJpYWJsZVR5cGUpO1xuICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZS5zZXRWYWx1ZUZvck1vZGUobGlnaHRNb2RlSWQsIGxpZ2h0VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZS5zZXRWYWx1ZUZvck1vZGUoZGFya01vZGVJZCwgZGFya1ZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmxvZyhgQ3JlYXRlZCBuZXcgdmFyaWFibGUgXCIke3ZhcmlhYmxlTmFtZX1cIiB3aXRoIGN1c3RvbSBtb2RlIHZhbHVlc2ApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjcmVhdGVkQ291bnQrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcihgRXJyb3IgY3JlYXRpbmcgdmFyaWFibGUgJHtsaWdodFRva2VuLm5hbWV9OmAsIGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLy8gRGVmaW5lIGN1c3RvbSBvcmRlciBmb3IgY29sb3IgdmFyaWFibGVzXG4gICAgICAgIGNvbnN0IGNvbG9yVmFyaWFibGVPcmRlciA9IFtcbiAgICAgICAgICAgICdhY2NlbnQnLFxuICAgICAgICAgICAgJ2FjY2VudC1mb3JlZ3JvdW5kJyxcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kJyxcbiAgICAgICAgICAgICdib3JkZXInLFxuICAgICAgICAgICAgJ2NhcmQnLFxuICAgICAgICAgICAgJ2NhcmQtZm9yZWdyb3VuZCcsXG4gICAgICAgICAgICAnZGVzdHJ1Y3RpdmUnLFxuICAgICAgICAgICAgJ2Rlc3RydWN0aXZlLWZvcmVncm91bmQnLFxuICAgICAgICAgICAgJ2ZvcmVncm91bmQnLFxuICAgICAgICAgICAgJ2lucHV0JyxcbiAgICAgICAgICAgICdtdXRlZCcsXG4gICAgICAgICAgICAnbXV0ZWQtZm9yZWdyb3VuZCcsXG4gICAgICAgICAgICAncG9wb3ZlcicsXG4gICAgICAgICAgICAncG9wb3Zlci1mb3JlZ3JvdW5kJyxcbiAgICAgICAgICAgICdwcmltYXJ5JyxcbiAgICAgICAgICAgICdwcmltYXJ5LWZvcmVncm91bmQnLFxuICAgICAgICAgICAgJ3JpbmcnLFxuICAgICAgICAgICAgJ3Jpbmctb2Zmc2V0JyxcbiAgICAgICAgICAgICdzZWNvbmRhcnknLFxuICAgICAgICAgICAgJ3NlY29uZGFyeS1mb3JlZ3JvdW5kJyxcbiAgICAgICAgICAgICdjaGFydC0xJyxcbiAgICAgICAgICAgICdjaGFydC0yJyxcbiAgICAgICAgICAgICdjaGFydC0zJyxcbiAgICAgICAgICAgICdjaGFydC00JyxcbiAgICAgICAgICAgICdjaGFydC01JyxcbiAgICAgICAgICAgICdzaWRlYmFyLXByaW1hcnktZm9yZWdyb3VuZCcsXG4gICAgICAgICAgICAnc2lkZWJhci1wcmltYXJ5JyxcbiAgICAgICAgICAgICdzaWRlYmFyLWZvcmVncm91bmQnLFxuICAgICAgICAgICAgJ3NpZGViYXItYmFja2dyb3VuZCcsXG4gICAgICAgICAgICAnc2lkZWJhci1hY2NlbnQnLFxuICAgICAgICAgICAgJ3NpZGViYXItYWNjZW50LWZvcmVncm91bmQnLFxuICAgICAgICAgICAgJ3NpZGViYXItYm9yZGVyJyxcbiAgICAgICAgICAgICdzaWRlYmFyLXJpbmcnXG4gICAgICAgIF07XG4gICAgICAgIC8vIENyZWF0ZSB2YXJpYWJsZXMgd2l0aCB2YWx1ZXMgZm9yIGJvdGggbGlnaHQgYW5kIGRhcmsgbW9kZXNcbiAgICAgICAgY29uc3QgYWxsVG9rZW5OYW1lcyA9IEFycmF5LmZyb20obmV3IFNldChbXG4gICAgICAgICAgICAuLi50b2tlbnMubGlnaHQubWFwKHQgPT4gdC5uYW1lKSxcbiAgICAgICAgICAgIC4uLnRva2Vucy5kYXJrLm1hcCh0ID0+IHQubmFtZSksXG4gICAgICAgICAgICAuLi50b2tlbnMuZ2xvYmFsLm1hcCh0ID0+IHQubmFtZSlcbiAgICAgICAgXSkpLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgIC8vIEN1c3RvbSBzb3J0aW5nOiBjb2xvcnMgZm9sbG93IHRoZSBkZWZpbmVkIG9yZGVyLCBvdGhlcnMgYWxwaGFiZXRpY2FsbHlcbiAgICAgICAgICAgIGNvbnN0IGFMaWdodFRva2VuID0gdG9rZW5zLmxpZ2h0LmZpbmQodCA9PiB0Lm5hbWUgPT09IGEpO1xuICAgICAgICAgICAgY29uc3QgYURhcmtUb2tlbiA9IHRva2Vucy5kYXJrLmZpbmQodCA9PiB0Lm5hbWUgPT09IGEpO1xuICAgICAgICAgICAgY29uc3QgYUdsb2JhbFRva2VuID0gdG9rZW5zLmdsb2JhbC5maW5kKHQgPT4gdC5uYW1lID09PSBhKTtcbiAgICAgICAgICAgIGNvbnN0IGFJc0NvbG9yID0gKGFMaWdodFRva2VuICYmIGFMaWdodFRva2VuLnR5cGUgPT09ICdjb2xvcicpIHx8XG4gICAgICAgICAgICAgICAgKGFEYXJrVG9rZW4gJiYgYURhcmtUb2tlbi50eXBlID09PSAnY29sb3InKSB8fFxuICAgICAgICAgICAgICAgIChhR2xvYmFsVG9rZW4gJiYgYUdsb2JhbFRva2VuLnR5cGUgPT09ICdjb2xvcicpO1xuICAgICAgICAgICAgY29uc3QgYkxpZ2h0VG9rZW4gPSB0b2tlbnMubGlnaHQuZmluZCh0ID0+IHQubmFtZSA9PT0gYik7XG4gICAgICAgICAgICBjb25zdCBiRGFya1Rva2VuID0gdG9rZW5zLmRhcmsuZmluZCh0ID0+IHQubmFtZSA9PT0gYik7XG4gICAgICAgICAgICBjb25zdCBiR2xvYmFsVG9rZW4gPSB0b2tlbnMuZ2xvYmFsLmZpbmQodCA9PiB0Lm5hbWUgPT09IGIpO1xuICAgICAgICAgICAgY29uc3QgYklzQ29sb3IgPSAoYkxpZ2h0VG9rZW4gJiYgYkxpZ2h0VG9rZW4udHlwZSA9PT0gJ2NvbG9yJykgfHxcbiAgICAgICAgICAgICAgICAoYkRhcmtUb2tlbiAmJiBiRGFya1Rva2VuLnR5cGUgPT09ICdjb2xvcicpIHx8XG4gICAgICAgICAgICAgICAgKGJHbG9iYWxUb2tlbiAmJiBiR2xvYmFsVG9rZW4udHlwZSA9PT0gJ2NvbG9yJyk7XG4gICAgICAgICAgICBpZiAoYUlzQ29sb3IgJiYgYklzQ29sb3IpIHtcbiAgICAgICAgICAgICAgICAvLyBCb3RoIGFyZSBjb2xvcnMsIHVzZSBjdXN0b20gb3JkZXJcbiAgICAgICAgICAgICAgICBjb25zdCBhSW5kZXggPSBjb2xvclZhcmlhYmxlT3JkZXIuaW5kZXhPZihhKTtcbiAgICAgICAgICAgICAgICBjb25zdCBiSW5kZXggPSBjb2xvclZhcmlhYmxlT3JkZXIuaW5kZXhPZihiKTtcbiAgICAgICAgICAgICAgICAvLyBJZiBib3RoIGFyZSBpbiB0aGUgb3JkZXIgbGlzdCwgc29ydCBieSBwb3NpdGlvblxuICAgICAgICAgICAgICAgIGlmIChhSW5kZXggIT09IC0xICYmIGJJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFJbmRleCAtIGJJbmRleDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gSWYgb25seSBvbmUgaXMgaW4gdGhlIGxpc3QsIHByaW9yaXRpemUgaXRcbiAgICAgICAgICAgICAgICBpZiAoYUluZGV4ICE9PSAtMSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgIGlmIChiSW5kZXggIT09IC0xKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICAvLyBJZiBuZWl0aGVyIGlzIGluIHRoZSBsaXN0LCBzb3J0IGFscGhhYmV0aWNhbGx5XG4gICAgICAgICAgICAgICAgcmV0dXJuIGEubG9jYWxlQ29tcGFyZShiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGFJc0NvbG9yICYmICFiSXNDb2xvcikge1xuICAgICAgICAgICAgICAgIC8vIENvbG9ycyBjb21lIGZpcnN0XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoIWFJc0NvbG9yICYmIGJJc0NvbG9yKSB7XG4gICAgICAgICAgICAgICAgLy8gTm9uLWNvbG9ycyBjb21lIGFmdGVyIGNvbG9yc1xuICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gQm90aCBhcmUgbm9uLWNvbG9ycywgc29ydCBhbHBoYWJldGljYWxseVxuICAgICAgICAgICAgICAgIHJldHVybiBhLmxvY2FsZUNvbXBhcmUoYik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBmb3IgKGNvbnN0IHRva2VuTmFtZSBvZiBhbGxUb2tlbk5hbWVzKSB7XG4gICAgICAgICAgICBjb25zdCBsaWdodFRva2VuID0gdG9rZW5zLmxpZ2h0LmZpbmQodCA9PiB0Lm5hbWUgPT09IHRva2VuTmFtZSkgfHxcbiAgICAgICAgICAgICAgICB0b2tlbnMuZ2xvYmFsLmZpbmQodCA9PiB0Lm5hbWUgPT09IHRva2VuTmFtZSk7XG4gICAgICAgICAgICBjb25zdCBkYXJrVG9rZW4gPSB0b2tlbnMuZGFyay5maW5kKHQgPT4gdC5uYW1lID09PSB0b2tlbk5hbWUpIHx8IGxpZ2h0VG9rZW47XG4gICAgICAgICAgICBpZiAobGlnaHRUb2tlbikge1xuICAgICAgICAgICAgICAgIGF3YWl0IGNyZWF0ZU9yVXBkYXRlVmFyaWFibGVXaXRoTW9kZXMobGlnaHRUb2tlbiwgZGFya1Rva2VuLCBjb2xsZWN0aW9uLCBsaWdodE1vZGVJZCwgZGFya01vZGVJZCwgZXhpc3RpbmdTZXR1cCA/IGV4aXN0aW5nU2V0dXAudmFyaWFibGVzIDogdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY291bnQ6IGNyZWF0ZWRDb3VudCxcbiAgICAgICAgICAgIGlzRXh0ZW5zaW9uOiAhIWV4aXN0aW5nU2V0dXAsXG4gICAgICAgICAgICBjb2xsZWN0aW9uTmFtZTogY29sbGVjdGlvbi5uYW1lXG4gICAgICAgIH07XG4gICAgfVxuICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBjcmVhdGluZyBGaWdtYSB2YXJpYWJsZXM6JywgZXJyb3IpO1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG59XG4vLyBGdW5jdGlvbiB0byBnZW5lcmF0ZSBhIGNvbG9yIGd1aWRlIGZyYW1lIG9uIHRoZSBjYW52YXNcbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlQ29sb3JHdWlkZSh0b2tlbnMpIHtcbiAgICB0cnkge1xuICAgICAgICAvLyBHZXQgYWxsIGNvbG9yIHRva2VucyBmcm9tIGFsbCBtb2Rlc1xuICAgICAgICBjb25zdCBhbGxDb2xvclRva2VucyA9IFtcbiAgICAgICAgICAgIC4uLnRva2Vucy5saWdodC5maWx0ZXIodCA9PiB0LnR5cGUgPT09ICdjb2xvcicpLFxuICAgICAgICAgICAgLi4udG9rZW5zLmRhcmsuZmlsdGVyKHQgPT4gdC50eXBlID09PSAnY29sb3InKSxcbiAgICAgICAgICAgIC4uLnRva2Vucy5nbG9iYWwuZmlsdGVyKHQgPT4gdC50eXBlID09PSAnY29sb3InKVxuICAgICAgICBdO1xuICAgICAgICBpZiAoYWxsQ29sb3JUb2tlbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGNvbG9yIHZhcmlhYmxlcyBmb3VuZCB0byBnZW5lcmF0ZSBndWlkZScpO1xuICAgICAgICB9XG4gICAgICAgIC8vIEdyb3VwIHRva2VucyBieSBjb2xsZWN0aW9uXG4gICAgICAgIGNvbnN0IHRva2Vuc0J5Q29sbGVjdGlvbiA9IG5ldyBNYXAoKTtcbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBjb2xsZWN0aW9uc1xuICAgICAgICBmb3IgKGNvbnN0IHRva2VuIG9mIGFsbENvbG9yVG9rZW5zKSB7XG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uTmFtZSA9IHRva2VuLmNvbGxlY3Rpb24gfHwgJ1Vua25vd24gQ29sbGVjdGlvbic7XG4gICAgICAgICAgICBpZiAoIXRva2Vuc0J5Q29sbGVjdGlvbi5oYXMoY29sbGVjdGlvbk5hbWUpKSB7XG4gICAgICAgICAgICAgICAgdG9rZW5zQnlDb2xsZWN0aW9uLnNldChjb2xsZWN0aW9uTmFtZSwgeyBsaWdodDogW10sIGRhcms6IFtdLCBnbG9iYWw6IFtdIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIFNvcnQgdG9rZW5zIGludG8gY29sbGVjdGlvbnMgYnkgbW9kZVxuICAgICAgICBmb3IgKGNvbnN0IHRva2VuIG9mIHRva2Vucy5saWdodC5maWx0ZXIodCA9PiB0LnR5cGUgPT09ICdjb2xvcicpKSB7XG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uTmFtZSA9IHRva2VuLmNvbGxlY3Rpb24gfHwgJ1Vua25vd24gQ29sbGVjdGlvbic7XG4gICAgICAgICAgICB0b2tlbnNCeUNvbGxlY3Rpb24uZ2V0KGNvbGxlY3Rpb25OYW1lKS5saWdodC5wdXNoKHRva2VuKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IHRva2VuIG9mIHRva2Vucy5kYXJrLmZpbHRlcih0ID0+IHQudHlwZSA9PT0gJ2NvbG9yJykpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxlY3Rpb25OYW1lID0gdG9rZW4uY29sbGVjdGlvbiB8fCAnVW5rbm93biBDb2xsZWN0aW9uJztcbiAgICAgICAgICAgIHRva2Vuc0J5Q29sbGVjdGlvbi5nZXQoY29sbGVjdGlvbk5hbWUpLmRhcmsucHVzaCh0b2tlbik7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChjb25zdCB0b2tlbiBvZiB0b2tlbnMuZ2xvYmFsLmZpbHRlcih0ID0+IHQudHlwZSA9PT0gJ2NvbG9yJykpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxlY3Rpb25OYW1lID0gdG9rZW4uY29sbGVjdGlvbiB8fCAnVW5rbm93biBDb2xsZWN0aW9uJztcbiAgICAgICAgICAgIHRva2Vuc0J5Q29sbGVjdGlvbi5nZXQoY29sbGVjdGlvbk5hbWUpLmdsb2JhbC5wdXNoKHRva2VuKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBMYXlvdXQgY29uc3RhbnRzXG4gICAgICAgIGNvbnN0IHN3YXRjaFNpemUgPSA5MDtcbiAgICAgICAgY29uc3Qgc3dhdGNoR2FwID0gMjQ7XG4gICAgICAgIGNvbnN0IG5hbWVIZWlnaHQgPSAyMDtcbiAgICAgICAgY29uc3QgdmFsdWVIZWlnaHQgPSAxNjtcbiAgICAgICAgY29uc3QgdmVydGljYWxHYXAgPSA4O1xuICAgICAgICBjb25zdCB0b3RhbExhYmVsSGVpZ2h0ID0gbmFtZUhlaWdodCArIHZhbHVlSGVpZ2h0ICsgdmVydGljYWxHYXA7XG4gICAgICAgIGNvbnN0IGJvdHRvbVBhZGRpbmcgPSAxNjtcbiAgICAgICAgY29uc3QgdG90YWxJdGVtSGVpZ2h0ID0gc3dhdGNoU2l6ZSArIHRvdGFsTGFiZWxIZWlnaHQgKyBib3R0b21QYWRkaW5nO1xuICAgICAgICBjb25zdCBpdGVtc1BlclJvdyA9IDU7XG4gICAgICAgIGNvbnN0IHNlY3Rpb25HYXAgPSA0ODtcbiAgICAgICAgY29uc3QgdGl0bGVIZWlnaHQgPSA2NDtcbiAgICAgICAgY29uc3QgcGFkZGluZyA9IDI4O1xuICAgICAgICBjb25zdCBmcmFtZUdhcCA9IDEwMDsgLy8gR2FwIGJldHdlZW4gY29sbGVjdGlvbiBmcmFtZXNcbiAgICAgICAgLy8gTG9hZCBmb250c1xuICAgICAgICBhd2FpdCBmaWdtYS5sb2FkRm9udEFzeW5jKHsgZmFtaWx5OiAnSW50ZXInLCBzdHlsZTogJ0JvbGQnIH0pO1xuICAgICAgICBhd2FpdCBmaWdtYS5sb2FkRm9udEFzeW5jKHsgZmFtaWx5OiAnSW50ZXInLCBzdHlsZTogJ1NlbWkgQm9sZCcgfSk7XG4gICAgICAgIGF3YWl0IGZpZ21hLmxvYWRGb250QXN5bmMoeyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnTWVkaXVtJyB9KTtcbiAgICAgICAgYXdhaXQgZmlnbWEubG9hZEZvbnRBc3luYyh7IGZhbWlseTogJ0ludGVyJywgc3R5bGU6ICdSZWd1bGFyJyB9KTtcbiAgICAgICAgY29uc3QgY3JlYXRlZEZyYW1lcyA9IFtdO1xuICAgICAgICBjb25zdCB2aWV3cG9ydCA9IGZpZ21hLnZpZXdwb3J0LmJvdW5kcztcbiAgICAgICAgbGV0IGZyYW1lT2Zmc2V0WCA9IDA7XG4gICAgICAgIC8vIEhlbHBlciBmdW5jdGlvbiB0byB0cnVuY2F0ZSB0ZXh0IHRoYXQncyB0b28gbG9uZ1xuICAgICAgICBjb25zdCB0cnVuY2F0ZVRleHQgPSAodGV4dCwgbWF4TGVuZ3RoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGV4dC5sZW5ndGggPD0gbWF4TGVuZ3RoKVxuICAgICAgICAgICAgICAgIHJldHVybiB0ZXh0O1xuICAgICAgICAgICAgcmV0dXJuIHRleHQuc3Vic3RyaW5nKDAsIG1heExlbmd0aCAtIDMpICsgJy4uLic7XG4gICAgICAgIH07XG4gICAgICAgIC8vIENyZWF0ZSBhIGZyYW1lIGZvciBlYWNoIGNvbGxlY3Rpb25cbiAgICAgICAgZm9yIChjb25zdCBbY29sbGVjdGlvbk5hbWUsIGNvbGxlY3Rpb25Ub2tlbnNdIG9mIEFycmF5LmZyb20odG9rZW5zQnlDb2xsZWN0aW9uLmVudHJpZXMoKSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGxpZ2h0Q29sb3JzID0gY29sbGVjdGlvblRva2Vucy5saWdodDtcbiAgICAgICAgICAgIGNvbnN0IGRhcmtDb2xvcnMgPSBjb2xsZWN0aW9uVG9rZW5zLmRhcms7XG4gICAgICAgICAgICBjb25zdCBnbG9iYWxDb2xvcnMgPSBjb2xsZWN0aW9uVG9rZW5zLmdsb2JhbDtcbiAgICAgICAgICAgIC8vIFNraXAgY29sbGVjdGlvbnMgd2l0aCBubyBjb2xvcnNcbiAgICAgICAgICAgIGlmIChsaWdodENvbG9ycy5sZW5ndGggPT09IDAgJiYgZGFya0NvbG9ycy5sZW5ndGggPT09IDAgJiYgZ2xvYmFsQ29sb3JzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHNlY3Rpb25zIGZvciB0aGlzIGNvbGxlY3Rpb25cbiAgICAgICAgICAgIGNvbnN0IHNlY3Rpb25zID0gW107XG4gICAgICAgICAgICBpZiAobGlnaHRDb2xvcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHNlY3Rpb25zLnB1c2goeyB0aXRsZTogJ0xpZ2h0IE1vZGUnLCBjb2xvcnM6IGxpZ2h0Q29sb3JzLCBiYWRnZUNvbG9yOiB7IHI6IDAuMiwgZzogMC42LCBiOiAxLjAgfSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChkYXJrQ29sb3JzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBzZWN0aW9ucy5wdXNoKHsgdGl0bGU6ICdEYXJrIE1vZGUnLCBjb2xvcnM6IGRhcmtDb2xvcnMsIGJhZGdlQ29sb3I6IHsgcjogMC40LCBnOiAwLjIsIGI6IDAuOCB9IH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGdsb2JhbENvbG9ycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgc2VjdGlvbnMucHVzaCh7IHRpdGxlOiAnR2xvYmFsIENvbG9ycycsIGNvbG9yczogZ2xvYmFsQ29sb3JzLCBiYWRnZUNvbG9yOiB7IHI6IDAuMCwgZzogMC43LCBiOiAwLjQgfSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSBmcmFtZSBkaW1lbnNpb25zIGZvciB0aGlzIGNvbGxlY3Rpb25cbiAgICAgICAgICAgIGNvbnN0IG1heEl0ZW1zSW5TZWN0aW9uID0gTWF0aC5tYXgoLi4uc2VjdGlvbnMubWFwKHMgPT4gcy5jb2xvcnMubGVuZ3RoKSk7XG4gICAgICAgICAgICBjb25zdCBtYXhSb3dzSW5TZWN0aW9uID0gTWF0aC5jZWlsKG1heEl0ZW1zSW5TZWN0aW9uIC8gaXRlbXNQZXJSb3cpO1xuICAgICAgICAgICAgY29uc3Qgc2VjdGlvbkhlaWdodCA9IHRpdGxlSGVpZ2h0ICsgKG1heFJvd3NJblNlY3Rpb24gKiB0b3RhbEl0ZW1IZWlnaHQpIC0gKG1heFJvd3NJblNlY3Rpb24gPiAwID8gc3dhdGNoR2FwIDogMCk7XG4gICAgICAgICAgICBjb25zdCBmcmFtZVdpZHRoID0gTWF0aC5tYXgoNjgwLCBpdGVtc1BlclJvdyAqIChzd2F0Y2hTaXplICsgc3dhdGNoR2FwKSAtIHN3YXRjaEdhcCArIChwYWRkaW5nICogMikpO1xuICAgICAgICAgICAgY29uc3QgZnJhbWVIZWlnaHQgPSAxMDAgKyAoc2VjdGlvbnMubGVuZ3RoICogKHNlY3Rpb25IZWlnaHQgKyBzZWN0aW9uR2FwKSkgLSBzZWN0aW9uR2FwICsgcGFkZGluZztcbiAgICAgICAgICAgIC8vIENyZWF0ZSBjb2xsZWN0aW9uIGZyYW1lXG4gICAgICAgICAgICBjb25zdCBmcmFtZSA9IGZpZ21hLmNyZWF0ZUZyYW1lKCk7XG4gICAgICAgICAgICBmcmFtZS5uYW1lID0gYCR7Y29sbGVjdGlvbk5hbWV9IC0gQ29sb3IgR3VpZGVgO1xuICAgICAgICAgICAgZnJhbWUucmVzaXplKGZyYW1lV2lkdGgsIGZyYW1lSGVpZ2h0KTtcbiAgICAgICAgICAgIGZyYW1lLmZpbGxzID0gW3tcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ1NPTElEJyxcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IHsgcjogMC45OSwgZzogMC45OSwgYjogMS4wIH1cbiAgICAgICAgICAgICAgICB9XTtcbiAgICAgICAgICAgIGZyYW1lLmNvcm5lclJhZGl1cyA9IDEyO1xuICAgICAgICAgICAgZnJhbWUuZWZmZWN0cyA9IFt7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdEUk9QX1NIQURPVycsXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiB7IHI6IDAsIGc6IDAsIGI6IDAsIGE6IDAuMSB9LFxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IHsgeDogMCwgeTogNCB9LFxuICAgICAgICAgICAgICAgICAgICByYWRpdXM6IDEyLFxuICAgICAgICAgICAgICAgICAgICBzcHJlYWQ6IDAsXG4gICAgICAgICAgICAgICAgICAgIHZpc2libGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGJsZW5kTW9kZTogJ05PUk1BTCdcbiAgICAgICAgICAgICAgICB9XTtcbiAgICAgICAgICAgIC8vIFBvc2l0aW9uIGZyYW1lXG4gICAgICAgICAgICBmcmFtZS54ID0gdmlld3BvcnQueCArIDUwICsgZnJhbWVPZmZzZXRYO1xuICAgICAgICAgICAgZnJhbWUueSA9IHZpZXdwb3J0LnkgKyA1MDtcbiAgICAgICAgICAgIGZyYW1lT2Zmc2V0WCArPSBmcmFtZVdpZHRoICsgZnJhbWVHYXA7XG4gICAgICAgICAgICAvLyBBZGQgY29sbGVjdGlvbiB0aXRsZVxuICAgICAgICAgICAgY29uc3QgdGl0bGVUZXh0ID0gZmlnbWEuY3JlYXRlVGV4dCgpO1xuICAgICAgICAgICAgdGl0bGVUZXh0LmZvbnROYW1lID0geyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnQm9sZCcgfTtcbiAgICAgICAgICAgIHRpdGxlVGV4dC5mb250U2l6ZSA9IDI0O1xuICAgICAgICAgICAgdGl0bGVUZXh0LmNoYXJhY3RlcnMgPSBjb2xsZWN0aW9uTmFtZTtcbiAgICAgICAgICAgIHRpdGxlVGV4dC5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuMSwgZzogMC4xLCBiOiAwLjEgfSB9XTtcbiAgICAgICAgICAgIHRpdGxlVGV4dC54ID0gcGFkZGluZztcbiAgICAgICAgICAgIHRpdGxlVGV4dC55ID0gMjY7XG4gICAgICAgICAgICBmcmFtZS5hcHBlbmRDaGlsZCh0aXRsZVRleHQpO1xuICAgICAgICAgICAgLy8gQWRkIHN1YnRpdGxlXG4gICAgICAgICAgICBjb25zdCB0b3RhbENvbG9ycyA9IGxpZ2h0Q29sb3JzLmxlbmd0aCArIGRhcmtDb2xvcnMubGVuZ3RoICsgZ2xvYmFsQ29sb3JzLmxlbmd0aDtcbiAgICAgICAgICAgIGNvbnN0IHN1YnRpdGxlVGV4dCA9IGZpZ21hLmNyZWF0ZVRleHQoKTtcbiAgICAgICAgICAgIHN1YnRpdGxlVGV4dC5mb250TmFtZSA9IHsgZmFtaWx5OiAnSW50ZXInLCBzdHlsZTogJ1JlZ3VsYXInIH07XG4gICAgICAgICAgICBzdWJ0aXRsZVRleHQuZm9udFNpemUgPSAxNDtcbiAgICAgICAgICAgIHN1YnRpdGxlVGV4dC5jaGFyYWN0ZXJzID0gYCR7dG90YWxDb2xvcnN9IGNvbG9yIHZhcmlhYmxlcyBhY3Jvc3MgJHtzZWN0aW9ucy5sZW5ndGh9IG1vZGUke3NlY3Rpb25zLmxlbmd0aCAhPT0gMSA/ICdzJyA6ICcnfWA7XG4gICAgICAgICAgICBzdWJ0aXRsZVRleHQuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLjUsIGc6IDAuNSwgYjogMC41IH0gfV07XG4gICAgICAgICAgICBzdWJ0aXRsZVRleHQueCA9IHBhZGRpbmc7XG4gICAgICAgICAgICBzdWJ0aXRsZVRleHQueSA9IDU2O1xuICAgICAgICAgICAgZnJhbWUuYXBwZW5kQ2hpbGQoc3VidGl0bGVUZXh0KTtcbiAgICAgICAgICAgIGxldCBjdXJyZW50WSA9IDExMDtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBzZWN0aW9ucyBmb3IgZWFjaCBtb2RlIHdpdGhpbiB0aGlzIGNvbGxlY3Rpb25cbiAgICAgICAgICAgIGZvciAoY29uc3Qgc2VjdGlvbiBvZiBzZWN0aW9ucykge1xuICAgICAgICAgICAgICAgIC8vIFNlY3Rpb24gdGl0bGUgd2l0aCBjb2xvcmVkIGJhZGdlXG4gICAgICAgICAgICAgICAgY29uc3Qgc2VjdGlvblRpdGxlID0gZmlnbWEuY3JlYXRlVGV4dCgpO1xuICAgICAgICAgICAgICAgIHNlY3Rpb25UaXRsZS5mb250TmFtZSA9IHsgZmFtaWx5OiAnSW50ZXInLCBzdHlsZTogJ1NlbWkgQm9sZCcgfTtcbiAgICAgICAgICAgICAgICBzZWN0aW9uVGl0bGUuZm9udFNpemUgPSAxODtcbiAgICAgICAgICAgICAgICBzZWN0aW9uVGl0bGUuY2hhcmFjdGVycyA9IHNlY3Rpb24udGl0bGU7XG4gICAgICAgICAgICAgICAgc2VjdGlvblRpdGxlLmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC4xLCBnOiAwLjEsIGI6IDAuMSB9IH1dO1xuICAgICAgICAgICAgICAgIHNlY3Rpb25UaXRsZS54ID0gcGFkZGluZyArIDM2O1xuICAgICAgICAgICAgICAgIHNlY3Rpb25UaXRsZS55ID0gY3VycmVudFk7XG4gICAgICAgICAgICAgICAgZnJhbWUuYXBwZW5kQ2hpbGQoc2VjdGlvblRpdGxlKTtcbiAgICAgICAgICAgICAgICAvLyBDb2xvcmVkIGJhZGdlXG4gICAgICAgICAgICAgICAgY29uc3QgYmFkZ2UgPSBmaWdtYS5jcmVhdGVFbGxpcHNlKCk7XG4gICAgICAgICAgICAgICAgYmFkZ2UucmVzaXplKDIwLCAyMCk7XG4gICAgICAgICAgICAgICAgYmFkZ2UueCA9IHBhZGRpbmc7XG4gICAgICAgICAgICAgICAgYmFkZ2UueSA9IGN1cnJlbnRZICsgMjtcbiAgICAgICAgICAgICAgICBiYWRnZS5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiBzZWN0aW9uLmJhZGdlQ29sb3IgfV07XG4gICAgICAgICAgICAgICAgZnJhbWUuYXBwZW5kQ2hpbGQoYmFkZ2UpO1xuICAgICAgICAgICAgICAgIC8vIFNlY3Rpb24gY291bnRcbiAgICAgICAgICAgICAgICBjb25zdCBjb3VudFRleHQgPSBmaWdtYS5jcmVhdGVUZXh0KCk7XG4gICAgICAgICAgICAgICAgY291bnRUZXh0LmZvbnROYW1lID0geyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnUmVndWxhcicgfTtcbiAgICAgICAgICAgICAgICBjb3VudFRleHQuZm9udFNpemUgPSAxMztcbiAgICAgICAgICAgICAgICBjb3VudFRleHQuY2hhcmFjdGVycyA9IGAke3NlY3Rpb24uY29sb3JzLmxlbmd0aH0gdmFyaWFibGVzYDtcbiAgICAgICAgICAgICAgICBjb3VudFRleHQuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLjYsIGc6IDAuNiwgYjogMC42IH0gfV07XG4gICAgICAgICAgICAgICAgY291bnRUZXh0LnggPSBwYWRkaW5nICsgMzYgKyBzZWN0aW9uVGl0bGUud2lkdGggKyAxMjtcbiAgICAgICAgICAgICAgICBjb3VudFRleHQueSA9IGN1cnJlbnRZICsgMztcbiAgICAgICAgICAgICAgICBmcmFtZS5hcHBlbmRDaGlsZChjb3VudFRleHQpO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRZICs9IHRpdGxlSGVpZ2h0O1xuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBjb2xvciBzd2F0Y2hlcyBmb3IgdGhpcyBzZWN0aW9uXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWN0aW9uLmNvbG9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0b2tlbiA9IHNlY3Rpb24uY29sb3JzW2ldO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByb3cgPSBNYXRoLmZsb29yKGkgLyBpdGVtc1BlclJvdyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbCA9IGkgJSBpdGVtc1BlclJvdztcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeCA9IHBhZGRpbmcgKyBjb2wgKiAoc3dhdGNoU2l6ZSArIHN3YXRjaEdhcCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHkgPSBjdXJyZW50WSArIHJvdyAqIHRvdGFsSXRlbUhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHN3YXRjaCByZWN0YW5nbGVcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3dhdGNoID0gZmlnbWEuY3JlYXRlUmVjdGFuZ2xlKCk7XG4gICAgICAgICAgICAgICAgICAgIHN3YXRjaC5uYW1lID0gYCR7c2VjdGlvbi50aXRsZS50b0xvd2VyQ2FzZSgpfS0ke3Rva2VuLm5hbWV9YDtcbiAgICAgICAgICAgICAgICAgICAgc3dhdGNoLnJlc2l6ZShzd2F0Y2hTaXplLCBzd2F0Y2hTaXplKTtcbiAgICAgICAgICAgICAgICAgICAgc3dhdGNoLnggPSB4O1xuICAgICAgICAgICAgICAgICAgICBzd2F0Y2gueSA9IHk7XG4gICAgICAgICAgICAgICAgICAgIHN3YXRjaC5jb3JuZXJSYWRpdXMgPSA4O1xuICAgICAgICAgICAgICAgICAgICAvLyBQYXJzZSBjb2xvciBhbmQgc2V0IGZpbGxcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJnYiA9IHBhcnNlQ29sb3JUb1JnYih0b2tlbi52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZ2IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3YXRjaC5maWxscyA9IFt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdTT0xJRCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiB7IHI6IHJnYi5yLCBnOiByZ2IuZywgYjogcmdiLmIgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1dO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmFsbGJhY2sgZm9yIHVucGFyc2VhYmxlIGNvbG9yc1xuICAgICAgICAgICAgICAgICAgICAgICAgc3dhdGNoLmZpbGxzID0gW3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ1NPTElEJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IHsgcjogMC45LCBnOiAwLjksIGI6IDAuOSB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHN1YnRsZSBib3JkZXJcbiAgICAgICAgICAgICAgICAgICAgc3dhdGNoLnN0cm9rZXMgPSBbe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdTT0xJRCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IHsgcjogMC45LCBnOiAwLjksIGI6IDAuOSB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XTtcbiAgICAgICAgICAgICAgICAgICAgc3dhdGNoLnN0cm9rZVdlaWdodCA9IDE7XG4gICAgICAgICAgICAgICAgICAgIGZyYW1lLmFwcGVuZENoaWxkKHN3YXRjaCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIENyZWF0ZSB2YXJpYWJsZSBuYW1lIGxhYmVsIHdpdGggdHJ1bmNhdGlvblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBuYW1lTGFiZWwgPSBmaWdtYS5jcmVhdGVUZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIG5hbWVMYWJlbC5mb250TmFtZSA9IHsgZmFtaWx5OiAnSW50ZXInLCBzdHlsZTogJ01lZGl1bScgfTtcbiAgICAgICAgICAgICAgICAgICAgbmFtZUxhYmVsLmZvbnRTaXplID0gMTI7XG4gICAgICAgICAgICAgICAgICAgIG5hbWVMYWJlbC5jaGFyYWN0ZXJzID0gdHJ1bmNhdGVUZXh0KHRva2VuLm5hbWUsIDIwKTtcbiAgICAgICAgICAgICAgICAgICAgbmFtZUxhYmVsLmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC4xLCBnOiAwLjEsIGI6IDAuMSB9IH1dO1xuICAgICAgICAgICAgICAgICAgICBuYW1lTGFiZWwueCA9IHg7XG4gICAgICAgICAgICAgICAgICAgIG5hbWVMYWJlbC55ID0geSArIHN3YXRjaFNpemUgKyAxMDtcbiAgICAgICAgICAgICAgICAgICAgbmFtZUxhYmVsLnRleHRBbGlnbkhvcml6b250YWwgPSAnTEVGVCc7XG4gICAgICAgICAgICAgICAgICAgIG5hbWVMYWJlbC5yZXNpemUoc3dhdGNoU2l6ZSwgbmFtZUhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgIG5hbWVMYWJlbC50ZXh0QXV0b1Jlc2l6ZSA9ICdOT05FJztcbiAgICAgICAgICAgICAgICAgICAgZnJhbWUuYXBwZW5kQ2hpbGQobmFtZUxhYmVsKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHZhbHVlIGxhYmVsIHdpdGggYmV0dGVyIGZvcm1hdHRpbmdcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsdWVMYWJlbCA9IGZpZ21hLmNyZWF0ZVRleHQoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVMYWJlbC5mb250TmFtZSA9IHsgZmFtaWx5OiAnSW50ZXInLCBzdHlsZTogJ1JlZ3VsYXInIH07XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlTGFiZWwuZm9udFNpemUgPSAxMDtcbiAgICAgICAgICAgICAgICAgICAgLy8gU2hvdyBvcmlnaW5hbCBmb3JtYXQgaWYgaXQncyBjb25jaXNlLCBvdGhlcndpc2UgY29udmVydCB0byBoZXhcbiAgICAgICAgICAgICAgICAgICAgbGV0IGRpc3BsYXlWYWx1ZSA9IHRva2VuLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgb3JpZ2luYWwgdmFsdWUgaXMgdG9vIGxvbmcgb3IgY29tcGxleCwgY29udmVydCB0byBoZXggZm9yIHJlYWRhYmlsaXR5XG4gICAgICAgICAgICAgICAgICAgIGlmICh0b2tlbi52YWx1ZS5sZW5ndGggPiAyMiB8fCB0b2tlbi52YWx1ZS5pbmNsdWRlcygnb2tsY2gnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJnYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGhleCA9ICcjJyArIFtyZ2IuciwgcmdiLmcsIHJnYi5iXS5tYXAoYyA9PiBNYXRoLnJvdW5kKGMgKiAyNTUpLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCAnMCcpKS5qb2luKCcnKS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXlWYWx1ZSA9IGhleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEtlZXAgb3JpZ2luYWwgZm9ybWF0IGZvciBIU0wsIEhTQiwgUkdCIGlmIHRoZXkncmUgY29uY2lzZVxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheVZhbHVlID0gdG9rZW4udmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gVHJ1bmNhdGUgdmFsdWUgaWYgc3RpbGwgdG9vIGxvbmdcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheVZhbHVlID0gdHJ1bmNhdGVUZXh0KGRpc3BsYXlWYWx1ZSwgMTgpO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZUxhYmVsLmNoYXJhY3RlcnMgPSBkaXNwbGF5VmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlTGFiZWwuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLjUsIGc6IDAuNSwgYjogMC41IH0gfV07XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlTGFiZWwueCA9IHg7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlTGFiZWwueSA9IHkgKyBzd2F0Y2hTaXplICsgMTAgKyBuYW1lSGVpZ2h0ICsgdmVydGljYWxHYXA7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlTGFiZWwudGV4dEFsaWduSG9yaXpvbnRhbCA9ICdMRUZUJztcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVMYWJlbC5yZXNpemUoc3dhdGNoU2l6ZSwgdmFsdWVIZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZUxhYmVsLnRleHRBdXRvUmVzaXplID0gJ05PTkUnO1xuICAgICAgICAgICAgICAgICAgICBmcmFtZS5hcHBlbmRDaGlsZCh2YWx1ZUxhYmVsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gTW92ZSB0byBuZXh0IHNlY3Rpb25cbiAgICAgICAgICAgICAgICBjb25zdCByb3dzVXNlZCA9IE1hdGguY2VpbChzZWN0aW9uLmNvbG9ycy5sZW5ndGggLyBpdGVtc1BlclJvdyk7XG4gICAgICAgICAgICAgICAgY3VycmVudFkgKz0gKHJvd3NVc2VkICogdG90YWxJdGVtSGVpZ2h0KSArIHNlY3Rpb25HYXA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjcmVhdGVkRnJhbWVzLnB1c2goZnJhbWUpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFNlbGVjdCBhbGwgY3JlYXRlZCBmcmFtZXMgYW5kIGZvY3VzIG9uIHRoZW1cbiAgICAgICAgaWYgKGNyZWF0ZWRGcmFtZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uID0gY3JlYXRlZEZyYW1lcztcbiAgICAgICAgICAgIGZpZ21hLnZpZXdwb3J0LnNjcm9sbEFuZFpvb21JbnRvVmlldyhjcmVhdGVkRnJhbWVzKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBSZXR1cm4gdG90YWwgY291bnQgb2YgY29sb3IgdmFyaWFibGVzIHByb2Nlc3NlZFxuICAgICAgICByZXR1cm4gYWxsQ29sb3JUb2tlbnMubGVuZ3RoO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZ2VuZXJhdGluZyBjb2xvciBndWlkZTonLCBlcnJvcik7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbn1cbi8vIEVuaGFuY2VkIGZ1bmN0aW9uIHRvIHNjYW4gZXhpc3RpbmcgRmlnbWEgdmFyaWFibGVzIGFuZCBzdHlsZXMgY29tcHJlaGVuc2l2ZWx5XG5hc3luYyBmdW5jdGlvbiBzY2FuRXhpc3RpbmdWYXJpYWJsZXNFbmhhbmNlZCgpIHtcbiAgICB0cnkge1xuICAgICAgICBsb2dnZXIubG9nKCc9PT0gRU5IQU5DRUQgU0NBTk5JTkcgU1RBUlRFRCA9PT0nKTtcbiAgICAgICAgY29uc3QgdG9rZW5zID0ge1xuICAgICAgICAgICAgbGlnaHQ6IFtdLFxuICAgICAgICAgICAgZGFyazogW10sXG4gICAgICAgICAgICBnbG9iYWw6IFtdXG4gICAgICAgIH07XG4gICAgICAgIC8vIDEuIFNjYW4gTG9jYWwgVmFyaWFibGVzXG4gICAgICAgIGF3YWl0IHNjYW5Mb2NhbFZhcmlhYmxlcyh0b2tlbnMpO1xuICAgICAgICAvLyAyLiBTY2FuIFBhaW50IFN0eWxlcyBcbiAgICAgICAgYXdhaXQgc2NhblBhaW50U3R5bGVzKHRva2Vucyk7XG4gICAgICAgIC8vIDMuIFNjYW4gUHVibGlzaGVkIExpYnJhcnkgVmFyaWFibGVzIChpZiBhdmFpbGFibGUpXG4gICAgICAgIGF3YWl0IHNjYW5QdWJsaXNoZWRMaWJyYXJ5VmFyaWFibGVzKHRva2Vucyk7XG4gICAgICAgIGxvZ2dlci5sb2coJz09PSBFTkhBTkNFRCBTQ0FOIENPTVBMRVRFID09PScpO1xuICAgICAgICBsb2dnZXIubG9nKGBUb3RhbCBmb3VuZCAtIExpZ2h0OiAke3Rva2Vucy5saWdodC5sZW5ndGh9LCBEYXJrOiAke3Rva2Vucy5kYXJrLmxlbmd0aH0sIEdsb2JhbDogJHt0b2tlbnMuZ2xvYmFsLmxlbmd0aH1gKTtcbiAgICAgICAgcmV0dXJuIHRva2VucztcbiAgICB9XG4gICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3IgaW4gZW5oYW5jZWQgc2Nhbm5pbmc6JywgZXJyb3IpO1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG59XG4vLyBIZWxwZXIgZnVuY3Rpb24gdG8gZGV0ZWN0IGlmIGEgdmFsdWUgcmVwcmVzZW50cyBhIGNvbG9yXG5mdW5jdGlvbiBpc0NvbG9yVmFsdWUodmFsdWUsIHZhcmlhYmxlTmFtZSkge1xuICAgIHRyeSB7XG4gICAgICAgIC8vIERpcmVjdCBSR0Igb2JqZWN0XG4gICAgICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmICdyJyBpbiB2YWx1ZSAmJiAnZycgaW4gdmFsdWUgJiYgJ2InIGluIHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBTdHJpbmcgY29sb3IgZm9ybWF0c1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY29uc3QgdHJpbW1lZCA9IHZhbHVlLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgLy8gQ29tbW9uIGNvbG9yIGZvcm1hdHNcbiAgICAgICAgICAgIGlmICh0cmltbWVkLnN0YXJ0c1dpdGgoJyMnKSB8fFxuICAgICAgICAgICAgICAgIHRyaW1tZWQuaW5jbHVkZXMoJ3JnYicpIHx8XG4gICAgICAgICAgICAgICAgdHJpbW1lZC5pbmNsdWRlcygnaHNsJykgfHxcbiAgICAgICAgICAgICAgICB0cmltbWVkLmluY2x1ZGVzKCdva2xjaCcpIHx8XG4gICAgICAgICAgICAgICAgdHJpbW1lZC5pbmNsdWRlcygnaHNiJykgfHxcbiAgICAgICAgICAgICAgICB0cmltbWVkLmluY2x1ZGVzKCdoc3YnKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gU2hhZENOIHJhdyBIU0wgZm9ybWF0IChlLmcuLCBcIjAgMCUgMTAwJVwiKVxuICAgICAgICAgICAgaWYgKHRyaW1tZWQubWF0Y2goL14oWystXT9bXFxkLl0rKVxccysoWystXT9bXFxkLl0rKSVcXHMrKFsrLV0/W1xcZC5dKyklJC8pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBOYW1lZCBjb2xvcnNcbiAgICAgICAgICAgIGNvbnN0IG5hbWVkQ29sb3JzID0gWyd0cmFuc3BhcmVudCcsICdpbmhlcml0JywgJ2N1cnJlbnRjb2xvcicsICdibGFjaycsICd3aGl0ZScsICdyZWQnLCAnZ3JlZW4nLCAnYmx1ZScsICd5ZWxsb3cnLCAnb3JhbmdlJywgJ3B1cnBsZScsICdwaW5rJywgJ2dyYXknLCAnZ3JleSddO1xuICAgICAgICAgICAgaWYgKG5hbWVkQ29sb3JzLmluY2x1ZGVzKHRyaW1tZWQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gVmFyaWFibGUgbmFtZSBhbmFseXNpcyAoZmFsbGJhY2spXG4gICAgICAgIGlmICh2YXJpYWJsZU5hbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWVMb3dlciA9IHZhcmlhYmxlTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgY29uc3QgY29sb3JLZXl3b3JkcyA9IFtcbiAgICAgICAgICAgICAgICAnY29sb3InLCAnYmFja2dyb3VuZCcsICdmb3JlZ3JvdW5kJywgJ2JnJywgJ2ZnJywgJ3RleHQnLCAnYm9yZGVyJywgJ3NoYWRvdycsXG4gICAgICAgICAgICAgICAgJ3ByaW1hcnknLCAnc2Vjb25kYXJ5JywgJ2FjY2VudCcsICdzdWNjZXNzJywgJ2Vycm9yJywgJ3dhcm5pbmcnLCAnaW5mbycsXG4gICAgICAgICAgICAgICAgJ211dGVkJywgJ2Rlc3RydWN0aXZlJywgJ3JpbmcnLCAnY2FyZCcsICdwb3BvdmVyJywgJ2lucHV0JywgJ3N1cmZhY2UnLFxuICAgICAgICAgICAgICAgICdicmFuZCcsICduZXV0cmFsJywgJ3NsYXRlJywgJ2dyYXknLCAnemluYycsICdzdG9uZScsICdyZWQnLCAnb3JhbmdlJyxcbiAgICAgICAgICAgICAgICAnYW1iZXInLCAneWVsbG93JywgJ2xpbWUnLCAnZ3JlZW4nLCAnZW1lcmFsZCcsICd0ZWFsJywgJ2N5YW4nLCAnc2t5JyxcbiAgICAgICAgICAgICAgICAnYmx1ZScsICdpbmRpZ28nLCAndmlvbGV0JywgJ3B1cnBsZScsICdmdWNoc2lhJywgJ3BpbmsnLCAncm9zZSdcbiAgICAgICAgICAgIF07XG4gICAgICAgICAgICByZXR1cm4gY29sb3JLZXl3b3Jkcy5zb21lKGtleXdvcmQgPT4gbmFtZUxvd2VyLmluY2x1ZGVzKGtleXdvcmQpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuLy8gRW5oYW5jZWQgY29sb3IgdmFsdWUgZXh0cmFjdGlvbiB3aXRoIGJldHRlciBmb3JtYXQgc3VwcG9ydCBhbmQgYWxpYXMgcmVzb2x1dGlvblxuYXN5bmMgZnVuY3Rpb24gZXh0cmFjdENvbG9yVmFsdWVFbmhhbmNlZCh2YWx1ZSwgdmFyaWFibGVOYW1lLCBhbGxWYXJpYWJsZXMsIHZpc2l0ZWRBbGlhc2VzKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gSW5pdGlhbGl6ZSB2aXNpdGVkIGFsaWFzZXMgdG8gcHJldmVudCBpbmZpbml0ZSBsb29wc1xuICAgICAgICBpZiAoIXZpc2l0ZWRBbGlhc2VzKSB7XG4gICAgICAgICAgICB2aXNpdGVkQWxpYXNlcyA9IG5ldyBTZXQoKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBIYW5kbGUgZGlyZWN0IGNvbG9yIG9iamVjdHNcbiAgICAgICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgJ3InIGluIHZhbHVlICYmICdnJyBpbiB2YWx1ZSAmJiAnYicgaW4gdmFsdWUpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgciwgZywgYiwgYSB9ID0gdmFsdWU7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHIgPT09ICdudW1iZXInICYmIHR5cGVvZiBnID09PSAnbnVtYmVyJyAmJiB0eXBlb2YgYiA9PT0gJ251bWJlcicgJiZcbiAgICAgICAgICAgICAgICAhaXNOYU4ocikgJiYgIWlzTmFOKGcpICYmICFpc05hTihiKSkge1xuICAgICAgICAgICAgICAgIGlmIChhICE9PSB1bmRlZmluZWQgJiYgYSA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGByZ2JhKCR7TWF0aC5yb3VuZChyICogMjU1KX0sICR7TWF0aC5yb3VuZChnICogMjU1KX0sICR7TWF0aC5yb3VuZChiICogMjU1KX0sICR7YX0pYDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGByZ2IoJHtNYXRoLnJvdW5kKHIgKiAyNTUpfSwgJHtNYXRoLnJvdW5kKGcgKiAyNTUpfSwgJHtNYXRoLnJvdW5kKGIgKiAyNTUpfSlgO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIEhhbmRsZSB2YXJpYWJsZSBhbGlhc2VzL3JlZmVyZW5jZXMgd2l0aCBhY3R1YWwgcmVzb2x1dGlvblxuICAgICAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiAndHlwZScgaW4gdmFsdWUgJiYgdmFsdWUudHlwZSA9PT0gJ1ZBUklBQkxFX0FMSUFTJyAmJiAnaWQnIGluIHZhbHVlKSB7XG4gICAgICAgICAgICBjb25zdCBhbGlhc0lkID0gdmFsdWUuaWQ7XG4gICAgICAgICAgICAvLyBQcmV2ZW50IGluZmluaXRlIGxvb3BzXG4gICAgICAgICAgICBpZiAodmlzaXRlZEFsaWFzZXMuaGFzKGFsaWFzSWQpKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oYENpcmN1bGFyIHJlZmVyZW5jZSBkZXRlY3RlZCBmb3IgdmFyaWFibGUgJHt2YXJpYWJsZU5hbWV9LCBzdG9wcGluZyByZXNvbHV0aW9uYCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2aXNpdGVkQWxpYXNlcy5hZGQoYWxpYXNJZCk7XG4gICAgICAgICAgICBsb2dnZXIubG9nKGBWYXJpYWJsZSAke3ZhcmlhYmxlTmFtZX0gaXMgYW4gYWxpYXMgdG8gJHthbGlhc0lkfSwgYXR0ZW1wdGluZyB0byByZXNvbHZlLi4uYCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIFRyeSB0byBnZXQgYWxsIHZhcmlhYmxlcyBpZiBub3QgcHJvdmlkZWRcbiAgICAgICAgICAgICAgICBpZiAoIWFsbFZhcmlhYmxlcykge1xuICAgICAgICAgICAgICAgICAgICBhbGxWYXJpYWJsZXMgPSBhd2FpdCBmaWdtYS52YXJpYWJsZXMuZ2V0TG9jYWxWYXJpYWJsZXNBc3luYygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBGaW5kIHRoZSByZWZlcmVuY2VkIHZhcmlhYmxlXG4gICAgICAgICAgICAgICAgY29uc3QgcmVmZXJlbmNlZFZhciA9IGFsbFZhcmlhYmxlcyAmJiBhbGxWYXJpYWJsZXMuZmluZCgodikgPT4gdi5pZCA9PT0gYWxpYXNJZCk7XG4gICAgICAgICAgICAgICAgaWYgKCFyZWZlcmVuY2VkVmFyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRyeSB0aGUgRmlnbWEgQVBJIHRvIGdldCB0aGUgdmFyaWFibGUgZGlyZWN0bHlcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpcmVjdFZhciA9IGF3YWl0IGZpZ21hLnZhcmlhYmxlcy5nZXRWYXJpYWJsZUJ5SWRBc3luYyhhbGlhc0lkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkaXJlY3RWYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZXQgdGhlIGZpcnN0IGF2YWlsYWJsZSBtb2RlIHZhbHVlIGZyb20gdGhlIHJlZmVyZW5jZWQgdmFyaWFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtb2RlSWRzID0gT2JqZWN0LmtleXMoZGlyZWN0VmFyLnZhbHVlc0J5TW9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1vZGVJZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZWZlcmVuY2VkVmFsdWUgPSBkaXJlY3RWYXIudmFsdWVzQnlNb2RlW21vZGVJZHNbMF1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIubG9nKGBSZXNvbHZlZCBhbGlhcyAke2FsaWFzSWR9IHRvIHZhbHVlOmAsIHJlZmVyZW5jZWRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlY3Vyc2l2ZWx5IHJlc29sdmUgaW4gY2FzZSB0aGUgcmVmZXJlbmNlZCB2YXJpYWJsZSBpcyBhbHNvIGFuIGFsaWFzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCBleHRyYWN0Q29sb3JWYWx1ZUVuaGFuY2VkKHJlZmVyZW5jZWRWYWx1ZSwgZGlyZWN0VmFyLm5hbWUsIGFsbFZhcmlhYmxlcywgdmlzaXRlZEFsaWFzZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoYXBpRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKGBDb3VsZCBub3QgcmVzb2x2ZSB2YXJpYWJsZSAke2FsaWFzSWR9IHZpYSBBUEk6YCwgYXBpRXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKGBSZWZlcmVuY2VkIHZhcmlhYmxlICR7YWxpYXNJZH0gbm90IGZvdW5kYCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBHZXQgdGhlIGZpcnN0IGF2YWlsYWJsZSBtb2RlIHZhbHVlIGZyb20gdGhlIHJlZmVyZW5jZWQgdmFyaWFibGVcbiAgICAgICAgICAgICAgICBjb25zdCBtb2RlSWRzID0gT2JqZWN0LmtleXMocmVmZXJlbmNlZFZhci52YWx1ZXNCeU1vZGUpO1xuICAgICAgICAgICAgICAgIGlmIChtb2RlSWRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVmZXJlbmNlZFZhbHVlID0gcmVmZXJlbmNlZFZhci52YWx1ZXNCeU1vZGVbbW9kZUlkc1swXV07XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci5sb2coYFJlc29sdmVkIGFsaWFzICR7YWxpYXNJZH0gKCR7cmVmZXJlbmNlZFZhci5uYW1lfSkgdG8gdmFsdWU6YCwgcmVmZXJlbmNlZFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVjdXJzaXZlbHkgcmVzb2x2ZSBpbiBjYXNlIHRoZSByZWZlcmVuY2VkIHZhcmlhYmxlIGlzIGFsc28gYW4gYWxpYXNcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGV4dHJhY3RDb2xvclZhbHVlRW5oYW5jZWQocmVmZXJlbmNlZFZhbHVlLCByZWZlcmVuY2VkVmFyLm5hbWUsIGFsbFZhcmlhYmxlcywgdmlzaXRlZEFsaWFzZXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oYFJlZmVyZW5jZWQgdmFyaWFibGUgJHthbGlhc0lkfSBoYXMgbm8gbW9kZSB2YWx1ZXNgKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKGBFcnJvciByZXNvbHZpbmcgYWxpYXMgJHthbGlhc0lkfTpgLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gSGFuZGxlIHN0cmluZyB2YWx1ZXNcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGNvbnN0IHRyaW1tZWQgPSB2YWx1ZS50cmltKCk7XG4gICAgICAgICAgICAvLyBTaGFkQ04gSFNMIGZvcm1hdCBjb252ZXJzaW9uXG4gICAgICAgICAgICBjb25zdCBoc2xNYXRjaCA9IHRyaW1tZWQubWF0Y2goL14oWystXT9bXFxkLl0rKVxccysoWystXT9bXFxkLl0rKSVcXHMrKFsrLV0/W1xcZC5dKyklJC8pO1xuICAgICAgICAgICAgaWYgKGhzbE1hdGNoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgWywgaCwgcywgbF0gPSBoc2xNYXRjaDtcbiAgICAgICAgICAgICAgICByZXR1cm4gYGhzbCgke2h9LCAke3N9JSwgJHtsfSUpYDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFJldHVybiBvdGhlciBzdHJpbmcgZm9ybWF0cyBhcy1pc1xuICAgICAgICAgICAgcmV0dXJuIHRyaW1tZWQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICBsb2dnZXIuZXJyb3IoYEVycm9yIGV4dHJhY3RpbmcgY29sb3IgdmFsdWUgZm9yICR7dmFyaWFibGVOYW1lfTpgLCBlcnJvcik7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbi8vIFN5bmNocm9ub3VzIHZlcnNpb24gZm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHlcbmZ1bmN0aW9uIGV4dHJhY3RDb2xvclZhbHVlRW5oYW5jZWRTeW5jKHZhbHVlLCB2YXJpYWJsZU5hbWUpIHtcbiAgICB0cnkge1xuICAgICAgICAvLyBIYW5kbGUgZGlyZWN0IGNvbG9yIG9iamVjdHNcbiAgICAgICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgJ3InIGluIHZhbHVlICYmICdnJyBpbiB2YWx1ZSAmJiAnYicgaW4gdmFsdWUpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgciwgZywgYiwgYSB9ID0gdmFsdWU7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHIgPT09ICdudW1iZXInICYmIHR5cGVvZiBnID09PSAnbnVtYmVyJyAmJiB0eXBlb2YgYiA9PT0gJ251bWJlcicgJiZcbiAgICAgICAgICAgICAgICAhaXNOYU4ocikgJiYgIWlzTmFOKGcpICYmICFpc05hTihiKSkge1xuICAgICAgICAgICAgICAgIGlmIChhICE9PSB1bmRlZmluZWQgJiYgYSA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGByZ2JhKCR7TWF0aC5yb3VuZChyICogMjU1KX0sICR7TWF0aC5yb3VuZChnICogMjU1KX0sICR7TWF0aC5yb3VuZChiICogMjU1KX0sICR7YX0pYDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGByZ2IoJHtNYXRoLnJvdW5kKHIgKiAyNTUpfSwgJHtNYXRoLnJvdW5kKGcgKiAyNTUpfSwgJHtNYXRoLnJvdW5kKGIgKiAyNTUpfSlgO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIEhhbmRsZSB2YXJpYWJsZSBhbGlhc2VzL3JlZmVyZW5jZXMgLSBtYXJrIGZvciBsYXRlciByZXNvbHV0aW9uXG4gICAgICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmICd0eXBlJyBpbiB2YWx1ZSAmJiB2YWx1ZS50eXBlID09PSAnVkFSSUFCTEVfQUxJQVMnKSB7XG4gICAgICAgICAgICBsb2dnZXIubG9nKGBWYXJpYWJsZSAke3ZhcmlhYmxlTmFtZX0gaXMgYW4gYWxpYXMsIHdpbGwgbmVlZCBhc3luYyByZXNvbHV0aW9uYCk7XG4gICAgICAgICAgICByZXR1cm4gYHZhcigtLSR7dmFyaWFibGVOYW1lLnJlcGxhY2UoL1teYS16QS1aMC05LV9dL2csICctJyl9KWA7XG4gICAgICAgIH1cbiAgICAgICAgLy8gSGFuZGxlIHN0cmluZyB2YWx1ZXNcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGNvbnN0IHRyaW1tZWQgPSB2YWx1ZS50cmltKCk7XG4gICAgICAgICAgICAvLyBTaGFkQ04gSFNMIGZvcm1hdCBjb252ZXJzaW9uXG4gICAgICAgICAgICBjb25zdCBoc2xNYXRjaCA9IHRyaW1tZWQubWF0Y2goL14oWystXT9bXFxkLl0rKVxccysoWystXT9bXFxkLl0rKSVcXHMrKFsrLV0/W1xcZC5dKyklJC8pO1xuICAgICAgICAgICAgaWYgKGhzbE1hdGNoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgWywgaCwgcywgbF0gPSBoc2xNYXRjaDtcbiAgICAgICAgICAgICAgICByZXR1cm4gYGhzbCgke2h9LCAke3N9JSwgJHtsfSUpYDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFJldHVybiBvdGhlciBzdHJpbmcgZm9ybWF0cyBhcy1pc1xuICAgICAgICAgICAgcmV0dXJuIHRyaW1tZWQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICBsb2dnZXIuZXJyb3IoYEVycm9yIGV4dHJhY3RpbmcgY29sb3IgdmFsdWUgZm9yICR7dmFyaWFibGVOYW1lfTpgLCBlcnJvcik7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbi8vIFNjYW4gbG9jYWwgdmFyaWFibGVzIHdpdGggaW1wcm92ZWQgZGV0ZWN0aW9uXG5hc3luYyBmdW5jdGlvbiBzY2FuTG9jYWxWYXJpYWJsZXModG9rZW5zKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgbG9nZ2VyLmxvZygnU2Nhbm5pbmcgbG9jYWwgdmFyaWFibGVzLi4uJyk7XG4gICAgICAgIGNvbnN0IHZhcmlhYmxlcyA9IGF3YWl0IGZpZ21hLnZhcmlhYmxlcy5nZXRMb2NhbFZhcmlhYmxlc0FzeW5jKCk7XG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb25zID0gYXdhaXQgZmlnbWEudmFyaWFibGVzLmdldExvY2FsVmFyaWFibGVDb2xsZWN0aW9uc0FzeW5jKCk7XG4gICAgICAgIGxvZ2dlci5sb2coYEZvdW5kICR7dmFyaWFibGVzLmxlbmd0aH0gbG9jYWwgdmFyaWFibGVzIGFjcm9zcyAke2NvbGxlY3Rpb25zLmxlbmd0aH0gY29sbGVjdGlvbnNgKTtcbiAgICAgICAgZm9yIChjb25zdCB2YXJpYWJsZSBvZiB2YXJpYWJsZXMpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29sbGVjdGlvbiA9IGNvbGxlY3Rpb25zLmZpbmQoKGMpID0+IGMuaWQgPT09IHZhcmlhYmxlLnZhcmlhYmxlQ29sbGVjdGlvbklkKTtcbiAgICAgICAgICAgICAgICBpZiAoIWNvbGxlY3Rpb24pXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIC8vIERldGVybWluZSBpZiB0aGlzIHZhcmlhYmxlIGlzIGNvbG9yLXJlbGF0ZWRcbiAgICAgICAgICAgICAgICBjb25zdCBpc0NvbG9yID0gdmFyaWFibGUucmVzb2x2ZWRUeXBlID09PSAnQ09MT1InIHx8XG4gICAgICAgICAgICAgICAgICAgIGlzQ29sb3JWYWx1ZShPYmplY3QudmFsdWVzKHZhcmlhYmxlLnZhbHVlc0J5TW9kZSlbMF0sIHZhcmlhYmxlLm5hbWUpO1xuICAgICAgICAgICAgICAgIGlmICghaXNDb2xvcilcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7IC8vIFNraXAgbm9uLWNvbG9yIHZhcmlhYmxlcyBmb3IgY29sb3Igc2Nhbm5pbmdcbiAgICAgICAgICAgICAgICBsb2dnZXIubG9nKGBQcm9jZXNzaW5nIGNvbG9yIHZhcmlhYmxlOiAke3ZhcmlhYmxlLm5hbWV9IGluIGNvbGxlY3Rpb246ICR7Y29sbGVjdGlvbi5uYW1lfWApO1xuICAgICAgICAgICAgICAgIC8vIEVuaGFuY2VkIG1vZGUgZGV0ZWN0aW9uXG4gICAgICAgICAgICAgICAgY29uc3QgbW9kZXMgPSBjb2xsZWN0aW9uLm1vZGVzO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxpZ2h0TW9kZSA9IG1vZGVzLmZpbmQoKG0pID0+IG0ubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdsaWdodCcpIHx8XG4gICAgICAgICAgICAgICAgICAgIG0ubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdkZWZhdWx0JykgfHxcbiAgICAgICAgICAgICAgICAgICAgbS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2RheScpIHx8XG4gICAgICAgICAgICAgICAgICAgIG1vZGVzLmxlbmd0aCA9PT0gMSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZGFya01vZGUgPSBtb2Rlcy5maW5kKChtKSA9PiBtLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnZGFyaycpIHx8XG4gICAgICAgICAgICAgICAgICAgIG0ubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCduaWdodCcpKTtcbiAgICAgICAgICAgICAgICAvLyBDbGVhbiB2YXJpYWJsZSBuYW1lIC0gcmVtb3ZlIGNvbW1vbiBwcmVmaXhlcyBmbGV4aWJseVxuICAgICAgICAgICAgICAgIGxldCBjbGVhbk5hbWUgPSB2YXJpYWJsZS5uYW1lO1xuICAgICAgICAgICAgICAgIGNvbnN0IHByZWZpeGVzID0gWydiYXNlLycsICdjb2xvci8nLCAnY29sb3JzLycsICdzZW1hbnRpYy8nLCAncHJpbWl0aXZlLycsICdzeXMvJywgJ3JlZi8nXTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHByZWZpeCBvZiBwcmVmaXhlcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2xlYW5OYW1lLnN0YXJ0c1dpdGgocHJlZml4KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYW5OYW1lID0gY2xlYW5OYW1lLnN1YnN0cmluZyhwcmVmaXgubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFByb2Nlc3MgbW9kZXNcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IG1vZGUgb2YgbW9kZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSB2YXJpYWJsZS52YWx1ZXNCeU1vZGVbbW9kZS5tb2RlSWRdO1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXNwbGF5VmFsdWUgPSBhd2FpdCBleHRyYWN0Q29sb3JWYWx1ZUVuaGFuY2VkKHZhbHVlLCB2YXJpYWJsZS5uYW1lLCB2YXJpYWJsZXMpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWRpc3BsYXlWYWx1ZSB8fCBkaXNwbGF5VmFsdWUgPT09ICdJbnZhbGlkIENvbG9yJylcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0b2tlbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGNsZWFuTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBkaXNwbGF5VmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY29sb3InLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheVZhbHVlOiBkaXNwbGF5VmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogJ0NvbG9ycycsXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IGBWYXJpYWJsZSBDb2xsZWN0aW9uOiAke2NvbGxlY3Rpb24ubmFtZX1gLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbi5uYW1lXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIC8vIENhdGVnb3JpemUgYnkgbW9kZVxuICAgICAgICAgICAgICAgICAgICBpZiAobGlnaHRNb2RlICYmIG1vZGUubW9kZUlkID09PSBsaWdodE1vZGUubW9kZUlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnMubGlnaHQucHVzaCh0b2tlbik7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIubG9nKGDinJMgQWRkZWQgbGlnaHQgdmFyaWFibGU6ICR7Y2xlYW5OYW1lfSA9ICR7ZGlzcGxheVZhbHVlfWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGRhcmtNb2RlICYmIG1vZGUubW9kZUlkID09PSBkYXJrTW9kZS5tb2RlSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vucy5kYXJrLnB1c2godG9rZW4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmxvZyhg4pyTIEFkZGVkIGRhcmsgdmFyaWFibGU6ICR7Y2xlYW5OYW1lfSA9ICR7ZGlzcGxheVZhbHVlfWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zLmdsb2JhbC5wdXNoKHRva2VuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci5sb2coYOKckyBBZGRlZCBnbG9iYWwgdmFyaWFibGU6ICR7Y2xlYW5OYW1lfSA9ICR7ZGlzcGxheVZhbHVlfWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKGBFcnJvciBwcm9jZXNzaW5nIHZhcmlhYmxlICR7dmFyaWFibGUubmFtZX06YCwgZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIHNjYW5uaW5nIGxvY2FsIHZhcmlhYmxlczonLCBlcnJvcik7XG4gICAgfVxufVxuLy8gU2NhbiBwYWludCBzdHlsZXNcbmFzeW5jIGZ1bmN0aW9uIHNjYW5QYWludFN0eWxlcyh0b2tlbnMpIHtcbiAgICB0cnkge1xuICAgICAgICBsb2dnZXIubG9nKCdTY2FubmluZyBwYWludCBzdHlsZXMuLi4nKTtcbiAgICAgICAgY29uc3QgcGFpbnRTdHlsZXMgPSBhd2FpdCBmaWdtYS5nZXRMb2NhbFBhaW50U3R5bGVzQXN5bmMoKTtcbiAgICAgICAgbG9nZ2VyLmxvZyhgRm91bmQgJHtwYWludFN0eWxlcy5sZW5ndGh9IGxvY2FsIHBhaW50IHN0eWxlc2ApO1xuICAgICAgICBmb3IgKGNvbnN0IHN0eWxlIG9mIHBhaW50U3R5bGVzKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIHN0eWxlIGhhcyBjb2xvciBwYWludHNcbiAgICAgICAgICAgICAgICBpZiAoIXN0eWxlLnBhaW50cyB8fCBzdHlsZS5wYWludHMubGVuZ3RoID09PSAwKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0eWxlLnBhaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYWludCA9IHN0eWxlLnBhaW50c1tpXTtcbiAgICAgICAgICAgICAgICAgICAgLy8gT25seSBwcm9jZXNzIHNvbGlkIGNvbG9yIHBhaW50cyBmb3Igbm93XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYWludC50eXBlICE9PSAnU09MSUQnKVxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbG9yVmFsdWUgPSBleHRyYWN0Q29sb3JWYWx1ZUVuaGFuY2VkU3luYyhwYWludC5jb2xvciwgc3R5bGUubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghY29sb3JWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAvLyBDbGVhbiBzdHlsZSBuYW1lXG4gICAgICAgICAgICAgICAgICAgIGxldCBjbGVhbk5hbWUgPSBzdHlsZS5uYW1lO1xuICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgY29tbW9uIHN0eWxlIHByZWZpeGVzL3N1ZmZpeGVzXG4gICAgICAgICAgICAgICAgICAgIGNsZWFuTmFtZSA9IGNsZWFuTmFtZS5yZXBsYWNlKC9eKHN0eWxlfGNvbG9yfHBhaW50KVstX1xcc10qfFstX1xcc10qKHN0eWxlfGNvbG9yfHBhaW50KSQvZ2ksICcnKTtcbiAgICAgICAgICAgICAgICAgICAgY2xlYW5OYW1lID0gY2xlYW5OYW1lLnRyaW0oKSB8fCBzdHlsZS5uYW1lO1xuICAgICAgICAgICAgICAgICAgICAvLyBBZGQgaW5kZXggaWYgbXVsdGlwbGUgcGFpbnRzXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpc3BsYXlOYW1lID0gc3R5bGUucGFpbnRzLmxlbmd0aCA+IDEgPyBgJHtjbGVhbk5hbWV9LSR7aSArIDF9YCA6IGNsZWFuTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdG9rZW4gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBkaXNwbGF5TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBjb2xvclZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NvbG9yJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXlWYWx1ZTogY29sb3JWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiAnQ29sb3JzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogYFBhaW50IFN0eWxlOiAke3N0eWxlLm5hbWV9YCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246ICdQYWludCBTdHlsZXMnXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIC8vIERldGVybWluZSBjYXRlZ29yeSBiYXNlZCBvbiBzdHlsZSBuYW1lXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5hbWVMb3dlciA9IHN0eWxlLm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWVMb3dlci5pbmNsdWRlcygnZGFyaycpIHx8IG5hbWVMb3dlci5pbmNsdWRlcygnbmlnaHQnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zLmRhcmsucHVzaCh0b2tlbik7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIubG9nKGDinJMgQWRkZWQgZGFyayBzdHlsZTogJHtkaXNwbGF5TmFtZX0gPSAke2NvbG9yVmFsdWV9YCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobmFtZUxvd2VyLmluY2x1ZGVzKCdsaWdodCcpIHx8IG5hbWVMb3dlci5pbmNsdWRlcygnZGF5JykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vucy5saWdodC5wdXNoKHRva2VuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci5sb2coYOKckyBBZGRlZCBsaWdodCBzdHlsZTogJHtkaXNwbGF5TmFtZX0gPSAke2NvbG9yVmFsdWV9YCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnMuZ2xvYmFsLnB1c2godG9rZW4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmxvZyhg4pyTIEFkZGVkIGdsb2JhbCBzdHlsZTogJHtkaXNwbGF5TmFtZX0gPSAke2NvbG9yVmFsdWV9YCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoYEVycm9yIHByb2Nlc3NpbmcgcGFpbnQgc3R5bGUgJHtzdHlsZS5uYW1lfTpgLCBlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3Igc2Nhbm5pbmcgcGFpbnQgc3R5bGVzOicsIGVycm9yKTtcbiAgICB9XG59XG4vLyBTY2FuIHB1Ymxpc2hlZCBsaWJyYXJ5IHZhcmlhYmxlc1xuYXN5bmMgZnVuY3Rpb24gc2NhblB1Ymxpc2hlZExpYnJhcnlWYXJpYWJsZXModG9rZW5zKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgbG9nZ2VyLmxvZygnU2Nhbm5pbmcgZm9yIHB1Ymxpc2hlZCBsaWJyYXJ5IHZhcmlhYmxlcy4uLicpO1xuICAgICAgICAvLyBHZXQgYWxsIHZhcmlhYmxlIGNvbGxlY3Rpb25zIChpbmNsdWRpbmcgaW1wb3J0ZWQgb25lcylcbiAgICAgICAgLy8gTm90ZTogVGhpcyBpcyBhIHNpbXBsaWZpZWQgYXBwcm9hY2ggLSBpbiBwcmFjdGljZSwgd2UnZCBuZWVkIHRvIGtub3dcbiAgICAgICAgLy8gc3BlY2lmaWMgbGlicmFyeSBrZXlzIG9yIGl0ZXJhdGUgdGhyb3VnaCBrbm93biBwdWJsaXNoZWQgY29sbGVjdGlvbnNcbiAgICAgICAgLy8gRm9yIG5vdywgd2UgY2FuIGxvb2sgZm9yIHZhcmlhYmxlIGFsaWFzZXMgdGhhdCByZWZlcmVuY2UgZXh0ZXJuYWwgdmFyaWFibGVzXG4gICAgICAgIC8vIGFuZCBhdHRlbXB0IHRvIHJlc29sdmUgdGhlbVxuICAgICAgICBjb25zdCB2YXJpYWJsZXMgPSBhd2FpdCBmaWdtYS52YXJpYWJsZXMuZ2V0TG9jYWxWYXJpYWJsZXNBc3luYygpO1xuICAgICAgICBjb25zdCBleHRlcm5hbEFsaWFzZXMgPSBuZXcgU2V0KCk7XG4gICAgICAgIC8vIEZpbmQgYWxsIGV4dGVybmFsIHZhcmlhYmxlIHJlZmVyZW5jZXNcbiAgICAgICAgZm9yIChjb25zdCB2YXJpYWJsZSBvZiB2YXJpYWJsZXMpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgW21vZGVJZCwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHZhcmlhYmxlLnZhbHVlc0J5TW9kZSkpIHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiAndHlwZScgaW4gdmFsdWUgJiYgdmFsdWUudHlwZSA9PT0gJ1ZBUklBQkxFX0FMSUFTJyAmJiAnaWQnIGluIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUcnkgdG8gcmVzb2x2ZSB0aGUgYWxpYXMgdG8gc2VlIGlmIGl0J3MgZXh0ZXJuYWxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFsaWFzSWQgPSB2YWx1ZS5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlZmVyZW5jZWRWYXIgPSBhd2FpdCBmaWdtYS52YXJpYWJsZXMuZ2V0VmFyaWFibGVCeUlkQXN5bmMoYWxpYXNJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlZmVyZW5jZWRWYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIG1pZ2h0IGJlIGFuIGV4dGVybmFsIHZhcmlhYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0ZXJuYWxBbGlhc2VzLmFkZChhbGlhc0lkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIubG9nKGBGb3VuZCBwb3RlbnRpYWwgZXh0ZXJuYWwgdmFyaWFibGUgcmVmZXJlbmNlOiAke2FsaWFzSWR9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBWYXJpYWJsZSBub3QgZm91bmQgbG9jYWxseSwgbGlrZWx5IGV4dGVybmFsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhbGlhc0lkID0gdmFsdWUuaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBleHRlcm5hbEFsaWFzZXMuYWRkKGFsaWFzSWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxvZ2dlci5sb2coYEZvdW5kICR7ZXh0ZXJuYWxBbGlhc2VzLnNpemV9IHBvdGVudGlhbCBleHRlcm5hbCB2YXJpYWJsZSByZWZlcmVuY2VzYCk7XG4gICAgICAgIC8vIEF0dGVtcHQgdG8gaW1wb3J0IGFuZCBwcm9jZXNzIGV4dGVybmFsIHZhcmlhYmxlc1xuICAgICAgICBjb25zdCBhbGlhc0FycmF5ID0gQXJyYXkuZnJvbShleHRlcm5hbEFsaWFzZXMpO1xuICAgICAgICBmb3IgKGNvbnN0IGFsaWFzSWQgb2YgYWxpYXNBcnJheSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyBOb3RlOiBUaGlzIHJlcXVpcmVzIHRoZSBpbXBvcnRWYXJpYWJsZUJ5S2V5QXN5bmMgbWV0aG9kXG4gICAgICAgICAgICAgICAgLy8gd2hpY2ggbmVlZHMgdGhlIHZhcmlhYmxlIGtleSwgbm90IElEXG4gICAgICAgICAgICAgICAgbG9nZ2VyLmxvZyhgQXR0ZW1wdGluZyB0byByZXNvbHZlIGV4dGVybmFsIHZhcmlhYmxlOiAke2FsaWFzSWR9YCk7XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBhIHBsYWNlaG9sZGVyIC0gYWN0dWFsIGltcGxlbWVudGF0aW9uIHdvdWxkIGRlcGVuZCBvblxuICAgICAgICAgICAgICAgIC8vIGhhdmluZyB0aGUgcHJvcGVyIHZhcmlhYmxlIGtleXMgZnJvbSB0aGUgdGVhbSBsaWJyYXJ5XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIud2FybihgQ291bGQgbm90IHJlc29sdmUgZXh0ZXJuYWwgdmFyaWFibGUgJHthbGlhc0lkfTpgLCBlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3Igc2Nhbm5pbmcgcHVibGlzaGVkIGxpYnJhcnkgdmFyaWFibGVzOicsIGVycm9yKTtcbiAgICB9XG59XG4vLyBGYWxsYmFjayBiYXNpYyBzY2FubmluZyBmdW5jdGlvbiAob3JpZ2luYWwgaW1wbGVtZW50YXRpb24pXG5hc3luYyBmdW5jdGlvbiBzY2FuRXhpc3RpbmdWYXJpYWJsZXNCYXNpYygpIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCB2YXJpYWJsZXMgPSBhd2FpdCBmaWdtYS52YXJpYWJsZXMuZ2V0TG9jYWxWYXJpYWJsZXNBc3luYygpO1xuICAgICAgICBjb25zdCBjb2xsZWN0aW9ucyA9IGF3YWl0IGZpZ21hLnZhcmlhYmxlcy5nZXRMb2NhbFZhcmlhYmxlQ29sbGVjdGlvbnNBc3luYygpO1xuICAgICAgICBsb2dnZXIubG9nKCc9PT0gQkFTSUMgU0NBTk5JTkcgKEZBTExCQUNLKSA9PT0nKTtcbiAgICAgICAgbG9nZ2VyLmxvZyhgRm91bmQgJHt2YXJpYWJsZXMubGVuZ3RofSB2YXJpYWJsZXMgYWNyb3NzICR7Y29sbGVjdGlvbnMubGVuZ3RofSBjb2xsZWN0aW9uc2ApO1xuICAgICAgICBjb25zdCB0b2tlbnMgPSB7XG4gICAgICAgICAgICBsaWdodDogW10sXG4gICAgICAgICAgICBkYXJrOiBbXSxcbiAgICAgICAgICAgIGdsb2JhbDogW11cbiAgICAgICAgfTtcbiAgICAgICAgLy8gUHJvY2VzcyBlYWNoIHZhcmlhYmxlIHdpdGggYmFzaWMgbG9naWNcbiAgICAgICAgZm9yIChjb25zdCB2YXJpYWJsZSBvZiB2YXJpYWJsZXMpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29sbGVjdGlvbiA9IGNvbGxlY3Rpb25zLmZpbmQoKGMpID0+IGMuaWQgPT09IHZhcmlhYmxlLnZhcmlhYmxlQ29sbGVjdGlvbklkKTtcbiAgICAgICAgICAgICAgICBpZiAoIWNvbGxlY3Rpb24pXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIC8vIE9ubHkgcHJvY2VzcyBDT0xPUiB0eXBlIHZhcmlhYmxlcyBpbiBiYXNpYyBtb2RlXG4gICAgICAgICAgICAgICAgaWYgKHZhcmlhYmxlLnJlc29sdmVkVHlwZSAhPT0gJ0NPTE9SJylcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmxvZyhgUHJvY2Vzc2luZyB2YXJpYWJsZTogJHt2YXJpYWJsZS5uYW1lfSAoJHt2YXJpYWJsZS5yZXNvbHZlZFR5cGV9KSBpbiBjb2xsZWN0aW9uOiAke2NvbGxlY3Rpb24ubmFtZX1gKTtcbiAgICAgICAgICAgICAgICAvLyBGaW5kIGxpZ2h0IGFuZCBkYXJrIG1vZGVzXG4gICAgICAgICAgICAgICAgY29uc3QgbGlnaHRNb2RlID0gY29sbGVjdGlvbi5tb2Rlcy5maW5kKChtKSA9PiBtLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnbGlnaHQnKSB8fFxuICAgICAgICAgICAgICAgICAgICBtLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnZGVmYXVsdCcpIHx8XG4gICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb24ubW9kZXMubGVuZ3RoID09PSAxKTtcbiAgICAgICAgICAgICAgICBjb25zdCBkYXJrTW9kZSA9IGNvbGxlY3Rpb24ubW9kZXMuZmluZCgobSkgPT4gbS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2RhcmsnKSB8fFxuICAgICAgICAgICAgICAgICAgICBtLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnbmlnaHQnKSk7XG4gICAgICAgICAgICAgICAgLy8gQ2xlYW4gdmFyaWFibGUgbmFtZVxuICAgICAgICAgICAgICAgIGxldCBjbGVhbk5hbWUgPSB2YXJpYWJsZS5uYW1lO1xuICAgICAgICAgICAgICAgIGlmIChjbGVhbk5hbWUuc3RhcnRzV2l0aCgnYmFzZS8nKSkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhbk5hbWUgPSBjbGVhbk5hbWUuc3Vic3RyaW5nKDUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoY2xlYW5OYW1lLnN0YXJ0c1dpdGgoJ2NvbG9yLycpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFuTmFtZSA9IGNsZWFuTmFtZS5zdWJzdHJpbmcoNik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFByb2Nlc3MgbGlnaHQgbW9kZSB2YWx1ZXNcbiAgICAgICAgICAgICAgICBpZiAobGlnaHRNb2RlICYmIHZhcmlhYmxlLnZhbHVlc0J5TW9kZVtsaWdodE1vZGUubW9kZUlkXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxpZ2h0VmFsdWUgPSB2YXJpYWJsZS52YWx1ZXNCeU1vZGVbbGlnaHRNb2RlLm1vZGVJZF07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpc3BsYXlWYWx1ZSA9IGV4dHJhY3RDb2xvclZhbHVlRW5oYW5jZWRTeW5jKGxpZ2h0VmFsdWUsIHZhcmlhYmxlLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGlzcGxheVZhbHVlICYmIGRpc3BsYXlWYWx1ZSAhPT0gJ0ludmFsaWQgQ29sb3InKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnMubGlnaHQucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogY2xlYW5OYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBkaXNwbGF5VmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NvbG9yJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5VmFsdWU6IGRpc3BsYXlWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogJ0NvbG9ycydcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmxvZyhg4pyTIEFkZGVkIGxpZ2h0IG1vZGU6ICR7Y2xlYW5OYW1lfSA9ICR7ZGlzcGxheVZhbHVlfWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFByb2Nlc3MgZGFyayBtb2RlIHZhbHVlc1xuICAgICAgICAgICAgICAgIGlmIChkYXJrTW9kZSAmJiB2YXJpYWJsZS52YWx1ZXNCeU1vZGVbZGFya01vZGUubW9kZUlkXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhcmtWYWx1ZSA9IHZhcmlhYmxlLnZhbHVlc0J5TW9kZVtkYXJrTW9kZS5tb2RlSWRdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXNwbGF5VmFsdWUgPSBleHRyYWN0Q29sb3JWYWx1ZUVuaGFuY2VkU3luYyhkYXJrVmFsdWUsIHZhcmlhYmxlLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGlzcGxheVZhbHVlICYmIGRpc3BsYXlWYWx1ZSAhPT0gJ0ludmFsaWQgQ29sb3InKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b2tlbnMuZGFyay5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBjbGVhbk5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGRpc3BsYXlWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY29sb3InLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXlWYWx1ZTogZGlzcGxheVZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiAnQ29sb3JzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIubG9nKGDinJMgQWRkZWQgZGFyayBtb2RlOiAke2NsZWFuTmFtZX0gPSAke2Rpc3BsYXlWYWx1ZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBJZiBubyBzcGVjaWZpYyBsaWdodC9kYXJrIG1vZGUsIHRyZWF0IGFzIGdsb2JhbFxuICAgICAgICAgICAgICAgIGlmICghbGlnaHRNb2RlICYmICFkYXJrTW9kZSAmJiBjb2xsZWN0aW9uLm1vZGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlyc3RNb2RlID0gY29sbGVjdGlvbi5tb2Rlc1swXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSB2YXJpYWJsZS52YWx1ZXNCeU1vZGVbZmlyc3RNb2RlLm1vZGVJZF07XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXNwbGF5VmFsdWUgPSBleHRyYWN0Q29sb3JWYWx1ZUVuaGFuY2VkU3luYyh2YWx1ZSwgdmFyaWFibGUubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGlzcGxheVZhbHVlICYmIGRpc3BsYXlWYWx1ZSAhPT0gJ0ludmFsaWQgQ29sb3InKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zLmdsb2JhbC5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogY2xlYW5OYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZGlzcGxheVZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY29sb3InLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5VmFsdWU6IGRpc3BsYXlWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnk6ICdDb2xvcnMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmxvZyhg4pyTIEFkZGVkIGdsb2JhbDogJHtjbGVhbk5hbWV9ID0gJHtkaXNwbGF5VmFsdWV9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoYEVycm9yIHByb2Nlc3NpbmcgdmFyaWFibGUgJHt2YXJpYWJsZS5uYW1lfTpgLCBlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbG9nZ2VyLmxvZygnPT09IEJBU0lDIFNDQU4gQ09NUExFVEUgPT09Jyk7XG4gICAgICAgIGxvZ2dlci5sb2coYExpZ2h0IHRva2VuczogJHt0b2tlbnMubGlnaHQubGVuZ3RofWApO1xuICAgICAgICBsb2dnZXIubG9nKGBEYXJrIHRva2VuczogJHt0b2tlbnMuZGFyay5sZW5ndGh9YCk7XG4gICAgICAgIGxvZ2dlci5sb2coYEdsb2JhbCB0b2tlbnM6ICR7dG9rZW5zLmdsb2JhbC5sZW5ndGh9YCk7XG4gICAgICAgIHJldHVybiB0b2tlbnM7XG4gICAgfVxuICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIGluIGJhc2ljIHNjYW5uaW5nOicsIGVycm9yKTtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxufVxuLy8gRnVuY3Rpb24gdG8gc2NhbiB0ZXh0IHN0eWxlcyBmcm9tIHRoZSBjdXJyZW50IGZpbGVcbmFzeW5jIGZ1bmN0aW9uIHNjYW5UZXh0U3R5bGVzKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHRleHRTdHlsZXMgPSBhd2FpdCBmaWdtYS5nZXRMb2NhbFRleHRTdHlsZXNBc3luYygpO1xuICAgICAgICBjb25zdCB0ZXh0VmFyaWFibGVzID0gYXdhaXQgZmlnbWEudmFyaWFibGVzLmdldExvY2FsVmFyaWFibGVzQXN5bmMoKTtcbiAgICAgICAgLy8gRmlsdGVyIGZvciBzdHJpbmcvdGV4dCB2YXJpYWJsZXNcbiAgICAgICAgY29uc3Qgc3RyaW5nVmFyaWFibGVzID0gdGV4dFZhcmlhYmxlcy5maWx0ZXIoKHZhcmlhYmxlKSA9PiB2YXJpYWJsZS5yZXNvbHZlZFR5cGUgPT09ICdTVFJJTkcnIHx8XG4gICAgICAgICAgICB2YXJpYWJsZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2ZvbnQnKSB8fFxuICAgICAgICAgICAgdmFyaWFibGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCd0ZXh0JykpO1xuICAgICAgICBjb25zdCBwcm9jZXNzZWRTdHlsZXMgPSB0ZXh0U3R5bGVzLm1hcCgoc3R5bGUpID0+ICh7XG4gICAgICAgICAgICBpZDogc3R5bGUuaWQsXG4gICAgICAgICAgICBuYW1lOiBzdHlsZS5uYW1lLFxuICAgICAgICAgICAgZm9udFNpemU6IHN0eWxlLmZvbnRTaXplLFxuICAgICAgICAgICAgZm9udE5hbWU6IHN0eWxlLmZvbnROYW1lLFxuICAgICAgICAgICAgbGV0dGVyU3BhY2luZzogc3R5bGUubGV0dGVyU3BhY2luZyxcbiAgICAgICAgICAgIGxpbmVIZWlnaHQ6IHN0eWxlLmxpbmVIZWlnaHQsXG4gICAgICAgICAgICB0ZXh0RGVjb3JhdGlvbjogc3R5bGUudGV4dERlY29yYXRpb24sXG4gICAgICAgICAgICB0ZXh0Q2FzZTogc3R5bGUudGV4dENhc2UsXG4gICAgICAgICAgICBmaWxsczogc3R5bGUuZmlsbHNcbiAgICAgICAgfSkpO1xuICAgICAgICBjb25zdCBwcm9jZXNzZWRWYXJpYWJsZXMgPSBzdHJpbmdWYXJpYWJsZXMubWFwKCh2YXJpYWJsZSkgPT4gKHtcbiAgICAgICAgICAgIGlkOiB2YXJpYWJsZS5pZCxcbiAgICAgICAgICAgIG5hbWU6IHZhcmlhYmxlLm5hbWUsXG4gICAgICAgICAgICByZXNvbHZlZFR5cGU6IHZhcmlhYmxlLnJlc29sdmVkVHlwZSxcbiAgICAgICAgICAgIHZhbHVlc0J5TW9kZTogdmFyaWFibGUudmFsdWVzQnlNb2RlXG4gICAgICAgIH0pKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0eWxlczogcHJvY2Vzc2VkU3R5bGVzLFxuICAgICAgICAgICAgdmFyaWFibGVzOiBwcm9jZXNzZWRWYXJpYWJsZXNcbiAgICAgICAgfTtcbiAgICB9XG4gICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNjYW5uaW5nIHRleHQgc3R5bGVzOicsIGVycm9yKTtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxufVxuLy8gRnVuY3Rpb24gdG8gZ2VuZXJhdGUgdHlwb2dyYXBoeSBndWlkZSBvbiBjYW52YXNcbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlVHlwb2dyYXBoeUd1aWRlKHN0eWxlcywgdmFyaWFibGVzKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgY3VycmVudFBhZ2UgPSBmaWdtYS5jdXJyZW50UGFnZTtcbiAgICAgICAgLy8gQ3JlYXRlIGEgZnJhbWUgZm9yIHRoZSB0eXBvZ3JhcGh5IGd1aWRlXG4gICAgICAgIGNvbnN0IGd1aWRlRnJhbWUgPSBmaWdtYS5jcmVhdGVGcmFtZSgpO1xuICAgICAgICBndWlkZUZyYW1lLm5hbWUgPSAnVHlwb2dyYXBoeSBHdWlkZSc7XG4gICAgICAgIGd1aWRlRnJhbWUuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAxLCBnOiAxLCBiOiAxIH0gfV07XG4gICAgICAgIC8vIFBvc2l0aW9uIHRoZSBmcmFtZVxuICAgICAgICBndWlkZUZyYW1lLnggPSAxMDA7XG4gICAgICAgIGd1aWRlRnJhbWUueSA9IDEwMDtcbiAgICAgICAgZ3VpZGVGcmFtZS5yZXNpemUoODAwLCBNYXRoLm1heCg2MDAsIChzdHlsZXMubGVuZ3RoICsgdmFyaWFibGVzLmxlbmd0aCkgKiA4MCArIDEwMCkpO1xuICAgICAgICBjdXJyZW50UGFnZS5hcHBlbmRDaGlsZChndWlkZUZyYW1lKTtcbiAgICAgICAgbGV0IGN1cnJlbnRZID0gNDA7XG4gICAgICAgIC8vIEhlbHBlciBmdW5jdGlvbiB0byBzYWZlbHkgbG9hZCBmb250cyB3aXRoIGZhbGxiYWNrc1xuICAgICAgICBjb25zdCBzYWZlTG9hZEZvbnQgPSBhc3luYyAoZm9udE5hbWUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZmlnbWEubG9hZEZvbnRBc3luYyhmb250TmFtZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvbnROYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBDb3VsZCBub3QgbG9hZCBmb250ICR7Zm9udE5hbWUuZmFtaWx5fSAke2ZvbnROYW1lLnN0eWxlfSwgdHJ5aW5nIGZhbGxiYWNrcy4uLmApO1xuICAgICAgICAgICAgICAgIC8vIFRyeSBjb21tb24gZmFsbGJhY2tzIGZvciBJbnRlclxuICAgICAgICAgICAgICAgIGNvbnN0IGZhbGxiYWNrcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgeyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnUmVndWxhcicgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBmYW1pbHk6ICdSb2JvdG8nLCBzdHlsZTogJ1JlZ3VsYXInIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgZmFtaWx5OiAnQXJpYWwnLCBzdHlsZTogJ1JlZ3VsYXInIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgZmFtaWx5OiAnSGVsdmV0aWNhJywgc3R5bGU6ICdSZWd1bGFyJyB9XG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGZhbGxiYWNrIG9mIGZhbGxiYWNrcykge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgZmlnbWEubG9hZEZvbnRBc3luYyhmYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsbGJhY2s7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGZhbGxiYWNrRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENvbnRpbnVlIHRvIG5leHQgZmFsbGJhY2tcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBJZiBhbGwgZWxzZSBmYWlscywgdXNlIHRoZSBkZWZhdWx0IHN5c3RlbSBmb250XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBzdWl0YWJsZSBmb250cyBhdmFpbGFibGUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLy8gQWRkIHRpdGxlXG4gICAgICAgIGNvbnN0IHRpdGxlVGV4dCA9IGZpZ21hLmNyZWF0ZVRleHQoKTtcbiAgICAgICAgY29uc3QgdGl0bGVGb250ID0gYXdhaXQgc2FmZUxvYWRGb250KHsgZmFtaWx5OiAnSW50ZXInLCBzdHlsZTogJ0JvbGQnIH0pO1xuICAgICAgICB0aXRsZVRleHQuZm9udE5hbWUgPSB0aXRsZUZvbnQ7XG4gICAgICAgIHRpdGxlVGV4dC5mb250U2l6ZSA9IDI0O1xuICAgICAgICB0aXRsZVRleHQuY2hhcmFjdGVycyA9ICdUeXBvZ3JhcGh5IEd1aWRlJztcbiAgICAgICAgdGl0bGVUZXh0LmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMCwgZzogMCwgYjogMCB9IH1dO1xuICAgICAgICB0aXRsZVRleHQueCA9IDQwO1xuICAgICAgICB0aXRsZVRleHQueSA9IGN1cnJlbnRZO1xuICAgICAgICBndWlkZUZyYW1lLmFwcGVuZENoaWxkKHRpdGxlVGV4dCk7XG4gICAgICAgIGN1cnJlbnRZICs9IDYwO1xuICAgICAgICAvLyBBZGQgdGV4dCBzdHlsZXMgc2VjdGlvblxuICAgICAgICBpZiAoc3R5bGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHN0eWxlc0hlYWRlciA9IGZpZ21hLmNyZWF0ZVRleHQoKTtcbiAgICAgICAgICAgIGNvbnN0IGhlYWRlckZvbnQgPSBhd2FpdCBzYWZlTG9hZEZvbnQoeyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnU2VtaSBCb2xkJyB9KTtcbiAgICAgICAgICAgIHN0eWxlc0hlYWRlci5mb250TmFtZSA9IGhlYWRlckZvbnQ7XG4gICAgICAgICAgICBzdHlsZXNIZWFkZXIuZm9udFNpemUgPSAxODtcbiAgICAgICAgICAgIHN0eWxlc0hlYWRlci5jaGFyYWN0ZXJzID0gYFRleHQgU3R5bGVzICgke3N0eWxlcy5sZW5ndGh9KWA7XG4gICAgICAgICAgICBzdHlsZXNIZWFkZXIuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLjIsIGc6IDAuMiwgYjogMC4yIH0gfV07XG4gICAgICAgICAgICBzdHlsZXNIZWFkZXIueCA9IDQwO1xuICAgICAgICAgICAgc3R5bGVzSGVhZGVyLnkgPSBjdXJyZW50WTtcbiAgICAgICAgICAgIGd1aWRlRnJhbWUuYXBwZW5kQ2hpbGQoc3R5bGVzSGVhZGVyKTtcbiAgICAgICAgICAgIGN1cnJlbnRZICs9IDQwO1xuICAgICAgICAgICAgLy8gQWRkIGVhY2ggdGV4dCBzdHlsZVxuICAgICAgICAgICAgZm9yIChjb25zdCBzdHlsZSBvZiBzdHlsZXMpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAvLyBMb2FkIHRoZSBmb250IGZvciB0aGlzIHN0eWxlIHdpdGggZmFsbGJhY2tcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3R5bGVGb250ID0gYXdhaXQgc2FmZUxvYWRGb250KHN0eWxlLmZvbnROYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGNsZWFuIHVwIHN0eWxlIG5hbWVcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2xlYW5TdHlsZU5hbWUgPSAoc3R5bGVOYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgZm9udCBmYW1pbHkgZnJvbSBzdHlsZSBuYW1lIGlmIGl0J3MgcmVkdW5kYW50XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJ0cyA9IHN0eWxlTmFtZS5zcGxpdCgnLycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcnRzLmxlbmd0aCA+IDEgPyBwYXJ0c1twYXJ0cy5sZW5ndGggLSAxXSA6IHN0eWxlTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGZvcm1hdCBsaW5lIGhlaWdodFxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3JtYXRMaW5lSGVpZ2h0ID0gKGxpbmVIZWlnaHQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbGluZUhlaWdodCB8fCBsaW5lSGVpZ2h0ID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdBdXRvJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbGluZUhlaWdodCA9PT0gJ29iamVjdCcgJiYgbGluZUhlaWdodC51bml0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxpbmVIZWlnaHQudW5pdCA9PT0gJ1BFUkNFTlQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBgJHtNYXRoLnJvdW5kKGxpbmVIZWlnaHQudmFsdWUpfSVgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChsaW5lSGVpZ2h0LnVuaXQgPT09ICdQSVhFTFMnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBgJHtsaW5lSGVpZ2h0LnZhbHVlfXB4YDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGxpbmVIZWlnaHQgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGAke01hdGgucm91bmQobGluZUhlaWdodCl9JWA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ0F1dG8nO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBIZWxwZXIgZnVuY3Rpb24gdG8gZm9ybWF0IGxldHRlciBzcGFjaW5nXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1hdExldHRlclNwYWNpbmcgPSAobGV0dGVyU3BhY2luZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFsZXR0ZXJTcGFjaW5nIHx8IGxldHRlclNwYWNpbmcgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJzAnO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBsZXR0ZXJTcGFjaW5nID09PSAnb2JqZWN0JyAmJiBsZXR0ZXJTcGFjaW5nLnVuaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobGV0dGVyU3BhY2luZy51bml0ID09PSAnUEVSQ0VOVCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGAke2xldHRlclNwYWNpbmcudmFsdWUudG9GaXhlZCgxKX0lYDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobGV0dGVyU3BhY2luZy51bml0ID09PSAnUElYRUxTJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYCR7bGV0dGVyU3BhY2luZy52YWx1ZX1weGA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBsZXR0ZXJTcGFjaW5nID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBgJHtsZXR0ZXJTcGFjaW5nLnRvRml4ZWQoMSl9cHhgO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcwJztcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGNsZWFuIHN0eWxlIG5hbWUgKGZpcnN0IHJvdylcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3R5bGVOYW1lVGV4dCA9IGZpZ21hLmNyZWF0ZVRleHQoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZUZvbnQgPSBhd2FpdCBzYWZlTG9hZEZvbnQoeyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnU2VtaSBCb2xkJyB9KTtcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVOYW1lVGV4dC5mb250TmFtZSA9IG5hbWVGb250O1xuICAgICAgICAgICAgICAgICAgICBzdHlsZU5hbWVUZXh0LmZvbnRTaXplID0gMTM7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlTmFtZVRleHQuY2hhcmFjdGVycyA9IGNsZWFuU3R5bGVOYW1lKHN0eWxlLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBzdHlsZU5hbWVUZXh0LmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC4xLCBnOiAwLjEsIGI6IDAuMSB9IH1dO1xuICAgICAgICAgICAgICAgICAgICBzdHlsZU5hbWVUZXh0LnggPSA0MDtcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVOYW1lVGV4dC55ID0gY3VycmVudFk7XG4gICAgICAgICAgICAgICAgICAgIGd1aWRlRnJhbWUuYXBwZW5kQ2hpbGQoc3R5bGVOYW1lVGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRZICs9IDIyOyAvLyBTcGFjZSBiZXR3ZWVuIHN0eWxlIG5hbWUgYW5kIHNwZWNzXG4gICAgICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBmb250IHNwZWNpZmljYXRpb25zIChzZWNvbmQgcm93KVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmb250U3BlY3MgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICBgJHtzdHlsZS5mb250TmFtZS5mYW1pbHl9YCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGAke3N0eWxlLmZvbnRTaXplfXB4YCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGAke3N0eWxlLmZvbnROYW1lLnN0eWxlfWAsXG4gICAgICAgICAgICAgICAgICAgICAgICBgTEg6ICR7Zm9ybWF0TGluZUhlaWdodChzdHlsZS5saW5lSGVpZ2h0KX1gLFxuICAgICAgICAgICAgICAgICAgICAgICAgYExTOiAke2Zvcm1hdExldHRlclNwYWNpbmcoc3R5bGUubGV0dGVyU3BhY2luZyl9YFxuICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzcGVjc1RleHQgPSBmaWdtYS5jcmVhdGVUZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNwZWNzRm9udCA9IGF3YWl0IHNhZmVMb2FkRm9udCh7IGZhbWlseTogJ0ludGVyJywgc3R5bGU6ICdSZWd1bGFyJyB9KTtcbiAgICAgICAgICAgICAgICAgICAgc3BlY3NUZXh0LmZvbnROYW1lID0gc3BlY3NGb250O1xuICAgICAgICAgICAgICAgICAgICBzcGVjc1RleHQuZm9udFNpemUgPSAxMTtcbiAgICAgICAgICAgICAgICAgICAgc3BlY3NUZXh0LmNoYXJhY3RlcnMgPSBmb250U3BlY3Muam9pbignIOKAoiAnKTtcbiAgICAgICAgICAgICAgICAgICAgc3BlY3NUZXh0LmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC41LCBnOiAwLjUsIGI6IDAuNSB9IH1dO1xuICAgICAgICAgICAgICAgICAgICBzcGVjc1RleHQueCA9IDQwO1xuICAgICAgICAgICAgICAgICAgICBzcGVjc1RleHQueSA9IGN1cnJlbnRZO1xuICAgICAgICAgICAgICAgICAgICBndWlkZUZyYW1lLmFwcGVuZENoaWxkKHNwZWNzVGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRZICs9IDE4OyAvLyBTcGFjZSBiZXR3ZWVuIHNwZWNzIGFuZCBzYW1wbGUgdGV4dFxuICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUgc2FtcGxlIHRleHQgKHNlY29uZCByb3cpXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNhbXBsZVRleHQgPSBmaWdtYS5jcmVhdGVUZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIHNhbXBsZVRleHQuZm9udE5hbWUgPSBzdHlsZUZvbnQ7XG4gICAgICAgICAgICAgICAgICAgIHNhbXBsZVRleHQuZm9udFNpemUgPSBzdHlsZS5mb250U2l6ZSB8fCAxNjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0eWxlLmxldHRlclNwYWNpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2FtcGxlVGV4dC5sZXR0ZXJTcGFjaW5nID0gc3R5bGUubGV0dGVyU3BhY2luZztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoc3R5bGUubGluZUhlaWdodCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzYW1wbGVUZXh0LmxpbmVIZWlnaHQgPSBzdHlsZS5saW5lSGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdHlsZS50ZXh0RGVjb3JhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2FtcGxlVGV4dC50ZXh0RGVjb3JhdGlvbiA9IHN0eWxlLnRleHREZWNvcmF0aW9uO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdHlsZS50ZXh0Q2FzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2FtcGxlVGV4dC50ZXh0Q2FzZSA9IHN0eWxlLnRleHRDYXNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdHlsZS5maWxscyAmJiBzdHlsZS5maWxscy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzYW1wbGVUZXh0LmZpbGxzID0gc3R5bGUuZmlsbHM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzYW1wbGVUZXh0LmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMCwgZzogMCwgYjogMCB9IH1dO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIFVzZSBmYWxsYmFjayBtZXNzYWdlIGlmIGZvbnQgY291bGRuJ3QgYmUgbG9hZGVkIGV4YWN0bHlcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZm9udE1lc3NhZ2UgPSAoc3R5bGVGb250LmZhbWlseSA9PT0gc3R5bGUuZm9udE5hbWUuZmFtaWx5ICYmIHN0eWxlRm9udC5zdHlsZSA9PT0gc3R5bGUuZm9udE5hbWUuc3R5bGUpXG4gICAgICAgICAgICAgICAgICAgICAgICA/ICdUaGUgcXVpY2sgYnJvd24gZm94IGp1bXBzIG92ZXIgdGhlIGxhenkgZG9nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgOiBgVGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZyAodXNpbmcgJHtzdHlsZUZvbnQuZmFtaWx5fSAke3N0eWxlRm9udC5zdHlsZX0pYDtcbiAgICAgICAgICAgICAgICAgICAgc2FtcGxlVGV4dC5jaGFyYWN0ZXJzID0gZm9udE1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgIHNhbXBsZVRleHQueCA9IDQwO1xuICAgICAgICAgICAgICAgICAgICBzYW1wbGVUZXh0LnkgPSBjdXJyZW50WTtcbiAgICAgICAgICAgICAgICAgICAgZ3VpZGVGcmFtZS5hcHBlbmRDaGlsZChzYW1wbGVUZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gTW92ZSB0byBuZXh0IHN0eWxlIHdpdGggcHJvcGVyIHNwYWNpbmdcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFkgKz0gTWF0aC5tYXgoNDAsIChzdHlsZS5mb250U2l6ZSB8fCAxNikgKyAyNSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChmb250RXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBDb3VsZCBub3QgbG9hZCBhbnkgZm9udCBmb3Igc3R5bGUgJHtzdHlsZS5uYW1lfTpgLCBmb250RXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAvLyBIZWxwZXIgZnVuY3Rpb24gdG8gY2xlYW4gdXAgc3R5bGUgbmFtZSAoc2FtZSBhcyBhYm92ZSlcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2xlYW5TdHlsZU5hbWUgPSAoc3R5bGVOYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJ0cyA9IHN0eWxlTmFtZS5zcGxpdCgnLycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcnRzLmxlbmd0aCA+IDEgPyBwYXJ0c1twYXJ0cy5sZW5ndGggLSAxXSA6IHN0eWxlTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGNsZWFuIHN0eWxlIG5hbWUgKGZpcnN0IHJvdylcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3R5bGVOYW1lVGV4dCA9IGZpZ21hLmNyZWF0ZVRleHQoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZUZvbnQgPSBhd2FpdCBzYWZlTG9hZEZvbnQoeyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnU2VtaSBCb2xkJyB9KTtcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVOYW1lVGV4dC5mb250TmFtZSA9IG5hbWVGb250O1xuICAgICAgICAgICAgICAgICAgICBzdHlsZU5hbWVUZXh0LmZvbnRTaXplID0gMTM7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlTmFtZVRleHQuY2hhcmFjdGVycyA9IGNsZWFuU3R5bGVOYW1lKHN0eWxlLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBzdHlsZU5hbWVUZXh0LmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC43LCBnOiAwLjMsIGI6IDAuMyB9IH1dO1xuICAgICAgICAgICAgICAgICAgICBzdHlsZU5hbWVUZXh0LnggPSA0MDtcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVOYW1lVGV4dC55ID0gY3VycmVudFk7XG4gICAgICAgICAgICAgICAgICAgIGd1aWRlRnJhbWUuYXBwZW5kQ2hpbGQoc3R5bGVOYW1lVGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRZICs9IDIyOyAvLyBTcGFjZSBiZXR3ZWVuIHN0eWxlIG5hbWUgYW5kIGVycm9yIG1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgLy8gQWRkIGVycm9yIGluZm8gKHNlY29uZCByb3cpXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVycm9yVGV4dCA9IGZpZ21hLmNyZWF0ZVRleHQoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyb3JGb250ID0gYXdhaXQgc2FmZUxvYWRGb250KHsgZmFtaWx5OiAnSW50ZXInLCBzdHlsZTogJ1JlZ3VsYXInIH0pO1xuICAgICAgICAgICAgICAgICAgICBlcnJvclRleHQuZm9udE5hbWUgPSBlcnJvckZvbnQ7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yVGV4dC5mb250U2l6ZSA9IDExO1xuICAgICAgICAgICAgICAgICAgICBlcnJvclRleHQuY2hhcmFjdGVycyA9IGBGb250IG5vdCBhdmFpbGFibGU6ICR7c3R5bGUuZm9udE5hbWUuZmFtaWx5fSAke3N0eWxlLmZvbnROYW1lLnN0eWxlfWA7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yVGV4dC5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuNywgZzogMC4zLCBiOiAwLjMgfSB9XTtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JUZXh0LnggPSA0MDtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JUZXh0LnkgPSBjdXJyZW50WTtcbiAgICAgICAgICAgICAgICAgICAgZ3VpZGVGcmFtZS5hcHBlbmRDaGlsZChlcnJvclRleHQpO1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50WSArPSAxODsgLy8gU3BhY2UgYmV0d2VlbiBlcnJvciBhbmQgc2FtcGxlIHRleHRcbiAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGZhbGxiYWNrIHNhbXBsZSB0ZXh0ICh0aGlyZCByb3cpXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZhbGxiYWNrVGV4dCA9IGZpZ21hLmNyZWF0ZVRleHQoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmFsbGJhY2tGb250ID0gYXdhaXQgc2FmZUxvYWRGb250KHsgZmFtaWx5OiAnSW50ZXInLCBzdHlsZTogJ1JlZ3VsYXInIH0pO1xuICAgICAgICAgICAgICAgICAgICBmYWxsYmFja1RleHQuZm9udE5hbWUgPSBmYWxsYmFja0ZvbnQ7XG4gICAgICAgICAgICAgICAgICAgIGZhbGxiYWNrVGV4dC5mb250U2l6ZSA9IHN0eWxlLmZvbnRTaXplIHx8IDE2O1xuICAgICAgICAgICAgICAgICAgICBmYWxsYmFja1RleHQuY2hhcmFjdGVycyA9ICdGb250IG5vdCBhdmFpbGFibGUgLSB1c2luZyBmYWxsYmFjayB0ZXh0JztcbiAgICAgICAgICAgICAgICAgICAgZmFsbGJhY2tUZXh0LmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC43LCBnOiAwLjMsIGI6IDAuMyB9IH1dO1xuICAgICAgICAgICAgICAgICAgICBmYWxsYmFja1RleHQueCA9IDQwO1xuICAgICAgICAgICAgICAgICAgICBmYWxsYmFja1RleHQueSA9IGN1cnJlbnRZO1xuICAgICAgICAgICAgICAgICAgICBndWlkZUZyYW1lLmFwcGVuZENoaWxkKGZhbGxiYWNrVGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRZICs9IE1hdGgubWF4KDQwLCAoc3R5bGUuZm9udFNpemUgfHwgMTYpICsgMjUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnJlbnRZICs9IDIwO1xuICAgICAgICB9XG4gICAgICAgIC8vIEFkZCB0ZXh0IHZhcmlhYmxlcyBzZWN0aW9uXG4gICAgICAgIGlmICh2YXJpYWJsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgdmFyaWFibGVzSGVhZGVyID0gZmlnbWEuY3JlYXRlVGV4dCgpO1xuICAgICAgICAgICAgY29uc3QgdmFyaWFibGVzSGVhZGVyRm9udCA9IGF3YWl0IHNhZmVMb2FkRm9udCh7IGZhbWlseTogJ0ludGVyJywgc3R5bGU6ICdTZW1pIEJvbGQnIH0pO1xuICAgICAgICAgICAgdmFyaWFibGVzSGVhZGVyLmZvbnROYW1lID0gdmFyaWFibGVzSGVhZGVyRm9udDtcbiAgICAgICAgICAgIHZhcmlhYmxlc0hlYWRlci5mb250U2l6ZSA9IDE4O1xuICAgICAgICAgICAgdmFyaWFibGVzSGVhZGVyLmNoYXJhY3RlcnMgPSBgVGV4dCBWYXJpYWJsZXMgKCR7dmFyaWFibGVzLmxlbmd0aH0pYDtcbiAgICAgICAgICAgIHZhcmlhYmxlc0hlYWRlci5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuMiwgZzogMC4yLCBiOiAwLjIgfSB9XTtcbiAgICAgICAgICAgIHZhcmlhYmxlc0hlYWRlci54ID0gNDA7XG4gICAgICAgICAgICB2YXJpYWJsZXNIZWFkZXIueSA9IGN1cnJlbnRZO1xuICAgICAgICAgICAgZ3VpZGVGcmFtZS5hcHBlbmRDaGlsZCh2YXJpYWJsZXNIZWFkZXIpO1xuICAgICAgICAgICAgY3VycmVudFkgKz0gNDA7XG4gICAgICAgICAgICAvLyBBZGQgZWFjaCB0ZXh0IHZhcmlhYmxlXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHZhcmlhYmxlIG9mIHZhcmlhYmxlcykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgZmlyc3QgbW9kZSB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaXJzdE1vZGUgPSBPYmplY3Qua2V5cyh2YXJpYWJsZS52YWx1ZXNCeU1vZGUpWzBdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHZhcmlhYmxlLnZhbHVlc0J5TW9kZVtmaXJzdE1vZGVdIHx8ICdObyB2YWx1ZSc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhcmlhYmxlVGV4dCA9IGZpZ21hLmNyZWF0ZVRleHQoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFyaWFibGVGb250ID0gYXdhaXQgc2FmZUxvYWRGb250KHsgZmFtaWx5OiAnSW50ZXInLCBzdHlsZTogJ1JlZ3VsYXInIH0pO1xuICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZVRleHQuZm9udE5hbWUgPSB2YXJpYWJsZUZvbnQ7XG4gICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlVGV4dC5mb250U2l6ZSA9IDE0O1xuICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZVRleHQuY2hhcmFjdGVycyA9IGAke3ZhcmlhYmxlLm5hbWV9OiBcIiR7dmFsdWV9XCJgO1xuICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZVRleHQuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLCBnOiAwLCBiOiAwIH0gfV07XG4gICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlVGV4dC54ID0gNDA7XG4gICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlVGV4dC55ID0gY3VycmVudFk7XG4gICAgICAgICAgICAgICAgICAgIGd1aWRlRnJhbWUuYXBwZW5kQ2hpbGQodmFyaWFibGVUZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHR5cGUgbGFiZWxcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdHlwZVRleHQgPSBmaWdtYS5jcmVhdGVUZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHR5cGVGb250ID0gYXdhaXQgc2FmZUxvYWRGb250KHsgZmFtaWx5OiAnSW50ZXInLCBzdHlsZTogJ1JlZ3VsYXInIH0pO1xuICAgICAgICAgICAgICAgICAgICB0eXBlVGV4dC5mb250TmFtZSA9IHR5cGVGb250O1xuICAgICAgICAgICAgICAgICAgICB0eXBlVGV4dC5mb250U2l6ZSA9IDEwO1xuICAgICAgICAgICAgICAgICAgICB0eXBlVGV4dC5jaGFyYWN0ZXJzID0gdmFyaWFibGUucmVzb2x2ZWRUeXBlIHx8ICdTVFJJTkcnO1xuICAgICAgICAgICAgICAgICAgICB0eXBlVGV4dC5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuNSwgZzogMC41LCBiOiAwLjUgfSB9XTtcbiAgICAgICAgICAgICAgICAgICAgdHlwZVRleHQueCA9IDUwMDtcbiAgICAgICAgICAgICAgICAgICAgdHlwZVRleHQueSA9IGN1cnJlbnRZICsgMjtcbiAgICAgICAgICAgICAgICAgICAgZ3VpZGVGcmFtZS5hcHBlbmRDaGlsZCh0eXBlVGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRZICs9IDMwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBFcnJvciBwcm9jZXNzaW5nIHZhcmlhYmxlICR7dmFyaWFibGUubmFtZX06YCwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50WSArPSAzMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gQWRqdXN0IGZyYW1lIGhlaWdodCB0byBjb250ZW50XG4gICAgICAgIGd1aWRlRnJhbWUucmVzaXplKDgwMCwgY3VycmVudFkgKyA0MCk7XG4gICAgICAgIC8vIEZvY3VzIG9uIHRoZSBnZW5lcmF0ZWQgZ3VpZGVcbiAgICAgICAgZmlnbWEudmlld3BvcnQuc2Nyb2xsQW5kWm9vbUludG9WaWV3KFtndWlkZUZyYW1lXSk7XG4gICAgICAgIHJldHVybiBzdHlsZXMubGVuZ3RoICsgdmFyaWFibGVzLmxlbmd0aDtcbiAgICB9XG4gICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGdlbmVyYXRpbmcgdHlwb2dyYXBoeSBndWlkZTonLCBlcnJvcik7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbn1cbi8vID09PSBORVcgSElFUkFSQ0hJQ0FMIFZBUklBQkxFIFNDQU5OSU5HID09PVxuYXN5bmMgZnVuY3Rpb24gc2NhblZhcmlhYmxlc0hpZXJhcmNoaWNhbCgpIHtcbiAgICB0cnkge1xuICAgICAgICBsb2dnZXIubG9nKCfwn5SNIFN0YXJ0aW5nIGhpZXJhcmNoaWNhbCB2YXJpYWJsZSBzY2FuLi4uJyk7XG4gICAgICAgIC8vIEdldCBhbGwgdmFyaWFibGUgY29sbGVjdGlvbnNcbiAgICAgICAgY29uc3QgY29sbGVjdGlvbnMgPSBhd2FpdCBmaWdtYS52YXJpYWJsZXMuZ2V0TG9jYWxWYXJpYWJsZUNvbGxlY3Rpb25zQXN5bmMoKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgICAgICAgY29sbGVjdGlvbnM6IFtdLFxuICAgICAgICAgICAgdG90YWxDb2xsZWN0aW9uczogMCxcbiAgICAgICAgICAgIHRvdGFsVmFyaWFibGVzOiAwXG4gICAgICAgIH07XG4gICAgICAgIGlmICghY29sbGVjdGlvbnMgfHwgY29sbGVjdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBsb2dnZXIubG9nKCdObyB2YXJpYWJsZSBjb2xsZWN0aW9ucyBmb3VuZCcpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICBsb2dnZXIubG9nKGBGb3VuZCAke2NvbGxlY3Rpb25zLmxlbmd0aH0gdmFyaWFibGUgY29sbGVjdGlvbnNgKTtcbiAgICAgICAgZm9yIChjb25zdCBjb2xsZWN0aW9uIG9mIGNvbGxlY3Rpb25zKSB7XG4gICAgICAgICAgICBsb2dnZXIubG9nKGBQcm9jZXNzaW5nIGNvbGxlY3Rpb246ICR7Y29sbGVjdGlvbi5uYW1lfSAoJHtjb2xsZWN0aW9uLmlkfSlgKTtcbiAgICAgICAgICAgIGNvbnN0IGZpZ21hQ29sbGVjdGlvbiA9IHtcbiAgICAgICAgICAgICAgICBpZDogY29sbGVjdGlvbi5pZCxcbiAgICAgICAgICAgICAgICBuYW1lOiBjb2xsZWN0aW9uLm5hbWUsXG4gICAgICAgICAgICAgICAgZ3JvdXBzOiBbXSxcbiAgICAgICAgICAgICAgICB0b3RhbFZhcmlhYmxlczogMCxcbiAgICAgICAgICAgICAgICBhbGxNb2RlczogY29sbGVjdGlvbi5tb2Rlcy5tYXAoKG1vZGUpID0+ICh7IGlkOiBtb2RlLm1vZGVJZCwgbmFtZTogbW9kZS5uYW1lIH0pKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8vIEdldCBhbGwgdmFyaWFibGVzIGluIHRoaXMgY29sbGVjdGlvblxuICAgICAgICAgICAgY29uc3QgY29sbGVjdGlvblZhcmlhYmxlcyA9IGF3YWl0IGZpZ21hLnZhcmlhYmxlcy5nZXRMb2NhbFZhcmlhYmxlc0FzeW5jKCk7XG4gICAgICAgICAgICBjb25zdCBmaWx0ZXJlZFZhcmlhYmxlcyA9IGNvbGxlY3Rpb25WYXJpYWJsZXMuZmlsdGVyKCh2YXJpYWJsZSkgPT4gdmFyaWFibGUudmFyaWFibGVDb2xsZWN0aW9uSWQgPT09IGNvbGxlY3Rpb24uaWQpO1xuICAgICAgICAgICAgbG9nZ2VyLmxvZyhgRm91bmQgJHtmaWx0ZXJlZFZhcmlhYmxlcy5sZW5ndGh9IHZhcmlhYmxlcyBpbiBjb2xsZWN0aW9uICR7Y29sbGVjdGlvbi5uYW1lfWApO1xuICAgICAgICAgICAgaWYgKGZpbHRlcmVkVmFyaWFibGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gR3JvdXAgdmFyaWFibGVzIGJ5IHRoZWlyIGJhc2UgbmFtZSAoZXZlcnl0aGluZyBiZWZvcmUgdGhlIGZpcnN0IHNsYXNoIG9yIGRvdClcbiAgICAgICAgICAgIGNvbnN0IHZhcmlhYmxlc0J5R3JvdXAgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHZhcmlhYmxlIG9mIGZpbHRlcmVkVmFyaWFibGVzKSB7XG4gICAgICAgICAgICAgICAgLy8gRXh0cmFjdCBncm91cCBuYW1lIGZyb20gdmFyaWFibGUgbmFtZVxuICAgICAgICAgICAgICAgIC8vIEV4YW1wbGVzOiBcImNvbG9ycy9wcmltYXJ5XCIgLT4gXCJjb2xvcnNcIiwgXCJ0eXBvZ3JhcGh5LmhlYWRpbmdcIiAtPiBcInR5cG9ncmFwaHlcIlxuICAgICAgICAgICAgICAgIGNvbnN0IGdyb3VwTmFtZSA9IGV4dHJhY3RHcm91cE5hbWUodmFyaWFibGUubmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKCF2YXJpYWJsZXNCeUdyb3VwLmhhcyhncm91cE5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlc0J5R3JvdXAuc2V0KGdyb3VwTmFtZSwgW10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXJpYWJsZXNCeUdyb3VwLmdldChncm91cE5hbWUpLnB1c2godmFyaWFibGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbG9nZ2VyLmxvZyhgT3JnYW5pemVkIGludG8gJHt2YXJpYWJsZXNCeUdyb3VwLnNpemV9IGdyb3VwczpgLCBBcnJheS5mcm9tKHZhcmlhYmxlc0J5R3JvdXAua2V5cygpKSk7XG4gICAgICAgICAgICAvLyBQcm9jZXNzIGVhY2ggZ3JvdXBcbiAgICAgICAgICAgIGZvciAoY29uc3QgW2dyb3VwTmFtZSwgZ3JvdXBWYXJpYWJsZXNdIG9mIEFycmF5LmZyb20odmFyaWFibGVzQnlHcm91cC5lbnRyaWVzKCkpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlnbWFHcm91cCA9IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogZ3JvdXBOYW1lLFxuICAgICAgICAgICAgICAgICAgICBtb2RlczogW10sXG4gICAgICAgICAgICAgICAgICAgIHRvdGFsVmFyaWFibGVzOiAwXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAvLyBPcmdhbml6ZSBieSBtb2Rlc1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhcmlhYmxlc0J5TW9kZSA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHZhcmlhYmxlIG9mIGdyb3VwVmFyaWFibGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgW21vZGVJZCwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHZhcmlhYmxlLnZhbHVlc0J5TW9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdmFyaWFibGVzQnlNb2RlLmhhcyhtb2RlSWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyaWFibGVzQnlNb2RlLnNldChtb2RlSWQsIFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlc0J5TW9kZS5nZXQobW9kZUlkKS5wdXNoKHsgdmFyaWFibGUsIHZhbHVlLCBtb2RlSWQgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIG1vZGUgb2JqZWN0c1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgW21vZGVJZCwgbW9kZVZhcmlhYmxlRGF0YV0gb2YgQXJyYXkuZnJvbSh2YXJpYWJsZXNCeU1vZGUuZW50cmllcygpKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtb2RlID0gY29sbGVjdGlvbi5tb2Rlcy5maW5kKChtKSA9PiBtLm1vZGVJZCA9PT0gbW9kZUlkKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbW9kZU5hbWUgPSBtb2RlID8gbW9kZS5uYW1lIDogbW9kZUlkO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWdtYU1vZGUgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogbW9kZUlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogbW9kZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IFtdXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIC8vIFByb2Nlc3MgdmFyaWFibGVzIGZvciB0aGlzIG1vZGVcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCB7IHZhcmlhYmxlLCB2YWx1ZSwgbW9kZUlkIH0gb2YgbW9kZVZhcmlhYmxlRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb2xvclZhbHVlID0gYXdhaXQgZXh0cmFjdENvbG9yVmFsdWVFbmhhbmNlZCh2YWx1ZSwgdmFyaWFibGUubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFyaWFibGVUeXBlID0gZGV0ZXJtaW5lVmFyaWFibGVUeXBlKHZhcmlhYmxlLCBjb2xvclZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWdtYVZhcmlhYmxlID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogdmFyaWFibGUuaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHZhcmlhYmxlLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBjb2xvclZhbHVlIHx8IFN0cmluZyh2YWx1ZSkgfHwgJ1Vua25vd24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiB2YXJpYWJsZVR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXlWYWx1ZTogY29sb3JWYWx1ZSB8fCBTdHJpbmcodmFsdWUpIHx8ICdVbmtub3duJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRUeXBlOiB2YXJpYWJsZS5yZXNvbHZlZFR5cGUgfHwgJ1VOS05PV04nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogdmFyaWFibGUuZGVzY3JpcHRpb24gfHwgdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZUNvbGxlY3Rpb25JZDogY29sbGVjdGlvbi5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZUlkOiBtb2RlSWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZ21hTW9kZS52YXJpYWJsZXMucHVzaChmaWdtYVZhcmlhYmxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWdtYUdyb3VwLnRvdGFsVmFyaWFibGVzKys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlnbWFDb2xsZWN0aW9uLnRvdGFsVmFyaWFibGVzKys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnRvdGFsVmFyaWFibGVzKys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIud2FybihgRXJyb3IgcHJvY2Vzc2luZyB2YXJpYWJsZSAke3ZhcmlhYmxlLm5hbWV9OmAsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZmlnbWFNb2RlLnZhcmlhYmxlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWdtYUdyb3VwLm1vZGVzLnB1c2goZmlnbWFNb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZmlnbWFHcm91cC5tb2Rlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpZ21hQ29sbGVjdGlvbi5ncm91cHMucHVzaChmaWdtYUdyb3VwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZmlnbWFDb2xsZWN0aW9uLmdyb3Vwcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LmNvbGxlY3Rpb25zLnB1c2goZmlnbWFDb2xsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICByZXN1bHQudG90YWxDb2xsZWN0aW9ucysrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxvZ2dlci5sb2coYEhpZXJhcmNoaWNhbCBzY2FuIGNvbXBsZXRlOiAke3Jlc3VsdC50b3RhbENvbGxlY3Rpb25zfSBjb2xsZWN0aW9ucywgJHtyZXN1bHQudG90YWxWYXJpYWJsZXN9IHZhcmlhYmxlc2ApO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBpbiBoaWVyYXJjaGljYWwgdmFyaWFibGUgc2NhbjonLCBlcnJvcik7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGV4dHJhY3RHcm91cE5hbWUodmFyaWFibGVOYW1lKSB7XG4gICAgLy8gUmVtb3ZlIGNvbW1vbiBwcmVmaXhlcyBhbmQgZXh0cmFjdCBtZWFuaW5nZnVsIGdyb3VwIG5hbWVcbiAgICBsZXQgbmFtZSA9IHZhcmlhYmxlTmFtZTtcbiAgICAvLyBSZW1vdmUgbGVhZGluZyBzbGFzaGVzIG9yIGRvdHNcbiAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC9eWy4vXSsvLCAnJyk7XG4gICAgLy8gRXh0cmFjdCB0aGUgZmlyc3QgcGFydCBhcyBncm91cCBuYW1lXG4gICAgY29uc3QgcGFydHMgPSBuYW1lLnNwbGl0KC9bLy5dLyk7XG4gICAgaWYgKHBhcnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgLy8gSWYgd2UgaGF2ZSBtdWx0aXBsZSBwYXJ0cywgdXNlIHRoZSBmaXJzdCBtZWFuaW5nZnVsIG9uZVxuICAgICAgICBjb25zdCBmaXJzdFBhcnQgPSBwYXJ0c1swXS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAvLyBNYXAgY29tbW9uIHBhdHRlcm5zIHRvIG1vcmUgcmVhZGFibGUgbmFtZXNcbiAgICAgICAgY29uc3QgZ3JvdXBNYXBwaW5ncyA9IHtcbiAgICAgICAgICAgICdjb2xvcic6ICdDb2xvcnMnLFxuICAgICAgICAgICAgJ2NvbG9ycyc6ICdDb2xvcnMnLFxuICAgICAgICAgICAgJ2JnJzogJ0NvbG9ycycsXG4gICAgICAgICAgICAnYmFja2dyb3VuZCc6ICdDb2xvcnMnLFxuICAgICAgICAgICAgJ2ZvcmVncm91bmQnOiAnQ29sb3JzJyxcbiAgICAgICAgICAgICdib3JkZXInOiAnQ29sb3JzJyxcbiAgICAgICAgICAgICdwcmltYXJ5JzogJ0NvbG9ycycsXG4gICAgICAgICAgICAnc2Vjb25kYXJ5JzogJ0NvbG9ycycsXG4gICAgICAgICAgICAnYWNjZW50JzogJ0NvbG9ycycsXG4gICAgICAgICAgICAndHlwb2dyYXBoeSc6ICdUeXBvZ3JhcGh5JyxcbiAgICAgICAgICAgICdmb250JzogJ1R5cG9ncmFwaHknLFxuICAgICAgICAgICAgJ2hlYWRpbmcnOiAnVHlwb2dyYXBoeScsXG4gICAgICAgICAgICAnYm9keSc6ICdUeXBvZ3JhcGh5JyxcbiAgICAgICAgICAgICdzcGFjaW5nJzogJ1NwYWNpbmcnLFxuICAgICAgICAgICAgJ3NwYWNlJzogJ1NwYWNpbmcnLFxuICAgICAgICAgICAgJ3NpemUnOiAnU3BhY2luZycsXG4gICAgICAgICAgICAncmFkaXVzJzogJ1JhZGl1cycsXG4gICAgICAgICAgICAnYm9yZGVyLXJhZGl1cyc6ICdSYWRpdXMnLFxuICAgICAgICAgICAgJ3NoYWRvdyc6ICdTaGFkb3dzJyxcbiAgICAgICAgICAgICdzaGFkb3dzJzogJ1NoYWRvd3MnLFxuICAgICAgICAgICAgJ2VsZXZhdGlvbic6ICdTaGFkb3dzJ1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZ3JvdXBNYXBwaW5nc1tmaXJzdFBhcnRdIHx8IGNhcGl0YWxpemVGaXJzdChmaXJzdFBhcnQpO1xuICAgIH1cbiAgICAvLyBGYWxsYmFjayB0byBmdWxsIG5hbWUgaWYgbm8gY2xlYXIgZ3JvdXAgc3RydWN0dXJlXG4gICAgcmV0dXJuIGNhcGl0YWxpemVGaXJzdChuYW1lKTtcbn1cbmZ1bmN0aW9uIGNhcGl0YWxpemVGaXJzdChzdHIpIHtcbiAgICByZXR1cm4gc3RyLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3RyLnNsaWNlKDEpO1xufVxuZnVuY3Rpb24gZGV0ZXJtaW5lVmFyaWFibGVUeXBlKHZhcmlhYmxlLCBjb2xvclZhbHVlKSB7XG4gICAgLy8gVXNlIHRoZSByZXNvbHZlZCB0eXBlIGlmIGF2YWlsYWJsZVxuICAgIGlmICh2YXJpYWJsZS5yZXNvbHZlZFR5cGUpIHtcbiAgICAgICAgc3dpdGNoICh2YXJpYWJsZS5yZXNvbHZlZFR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ0NPTE9SJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gJ2NvbG9yJztcbiAgICAgICAgICAgIGNhc2UgJ1NUUklORyc6XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgaXQncyBmb250LXJlbGF0ZWRcbiAgICAgICAgICAgICAgICBpZiAodmFyaWFibGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdmb250JykgfHxcbiAgICAgICAgICAgICAgICAgICAgdmFyaWFibGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCd0eXBvZ3JhcGh5JykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdmb250JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICdvdGhlcic7XG4gICAgICAgICAgICBjYXNlICdGTE9BVCc6XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgaXQncyByYWRpdXMgb3Igc3BhY2luZ1xuICAgICAgICAgICAgICAgIGlmICh2YXJpYWJsZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ3JhZGl1cycpIHx8XG4gICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnYm9yZGVyLXJhZGl1cycpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAncmFkaXVzJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICdvdGhlcic7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiAnb3RoZXInO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIEZhbGxiYWNrIHRvIG5hbWUtYmFzZWQgZGV0ZWN0aW9uXG4gICAgY29uc3QgbmFtZUxvd2VyID0gdmFyaWFibGUubmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmIChjb2xvclZhbHVlIHx8IGlzQ29sb3JWYWx1ZSh2YXJpYWJsZS52YWx1ZXNCeU1vZGVbT2JqZWN0LmtleXModmFyaWFibGUudmFsdWVzQnlNb2RlKVswXV0sIHZhcmlhYmxlLm5hbWUpKSB7XG4gICAgICAgIHJldHVybiAnY29sb3InO1xuICAgIH1cbiAgICBpZiAobmFtZUxvd2VyLmluY2x1ZGVzKCdmb250JykgfHwgbmFtZUxvd2VyLmluY2x1ZGVzKCd0eXBvZ3JhcGh5JykpIHtcbiAgICAgICAgcmV0dXJuICdmb250JztcbiAgICB9XG4gICAgaWYgKG5hbWVMb3dlci5pbmNsdWRlcygncmFkaXVzJykgfHwgbmFtZUxvd2VyLmluY2x1ZGVzKCdib3JkZXItcmFkaXVzJykpIHtcbiAgICAgICAgcmV0dXJuICdyYWRpdXMnO1xuICAgIH1cbiAgICBpZiAobmFtZUxvd2VyLmluY2x1ZGVzKCdzaGFkb3cnKSB8fCBuYW1lTG93ZXIuaW5jbHVkZXMoJ2VsZXZhdGlvbicpKSB7XG4gICAgICAgIHJldHVybiAnc2hhZG93JztcbiAgICB9XG4gICAgcmV0dXJuICdvdGhlcic7XG59XG4vLyA9PT0gQ09MTEVDVElPTiBBTkQgTU9ERSBDT0xPUiBHVUlERSBHRU5FUkFUSU9OID09PVxuLy8gSGVscGVyIGZ1bmN0aW9uIHRvIHNhZmVseSBsb2FkIGZvbnRzIHdpdGggZmFsbGJhY2tzXG5hc3luYyBmdW5jdGlvbiBzYWZlTG9hZEZvbnQoZm9udE5hbWUpIHtcbiAgICB0cnkge1xuICAgICAgICBhd2FpdCBmaWdtYS5sb2FkRm9udEFzeW5jKGZvbnROYW1lKTtcbiAgICAgICAgcmV0dXJuIGZvbnROYW1lO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgLy8gVHJ5IGNvbW1vbiBmYWxsYmFja3NcbiAgICAgICAgY29uc3QgZmFsbGJhY2tzID0gW1xuICAgICAgICAgICAgeyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnUmVndWxhcicgfSxcbiAgICAgICAgICAgIHsgZmFtaWx5OiAnUm9ib3RvJywgc3R5bGU6ICdSZWd1bGFyJyB9LFxuICAgICAgICAgICAgeyBmYW1pbHk6ICdBcmlhbCcsIHN0eWxlOiAnUmVndWxhcicgfSxcbiAgICAgICAgICAgIHsgZmFtaWx5OiAnSGVsdmV0aWNhJywgc3R5bGU6ICdSZWd1bGFyJyB9LFxuICAgICAgICAgICAgeyBmYW1pbHk6ICdTYW4gRnJhbmNpc2NvJywgc3R5bGU6ICdSZWd1bGFyJyB9XG4gICAgICAgIF07XG4gICAgICAgIGZvciAoY29uc3QgZmFsbGJhY2sgb2YgZmFsbGJhY2tzKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IGZpZ21hLmxvYWRGb250QXN5bmMoZmFsbGJhY2spO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxsYmFjaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChmYWxsYmFja0Vycm9yKSB7XG4gICAgICAgICAgICAgICAgLy8gQ29udGludWUgdG8gbmV4dCBmYWxsYmFja1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIEZpbmFsIGZhbGxiYWNrIC0gdXNlIHN5c3RlbSBkZWZhdWx0XG4gICAgICAgIHJldHVybiB7IGZhbWlseTogJ0FyaWFsJywgc3R5bGU6ICdSZWd1bGFyJyB9O1xuICAgIH1cbn1cbi8vIEdlbmVyYXRlIGNvbG9yIGd1aWRlIGZvciBhIHNwZWNpZmljIG1vZGVcbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlTW9kZUNvbG9yR3VpZGUoY29sbGVjdGlvbiwgZ3JvdXAsIG1vZGUpIHtcbiAgICB0cnkge1xuICAgICAgICBsb2dnZXIubG9nKGDwn46oIEdlbmVyYXRpbmcgbW9kZSBjb2xvciBndWlkZSBmb3I6ICR7Y29sbGVjdGlvbi5uYW1lfSA+ICR7Z3JvdXAubmFtZX0gPiAke21vZGUubmFtZX1gKTtcbiAgICAgICAgLy8gRmlsdGVyIGNvbG9yIHZhcmlhYmxlcyBvbmx5XG4gICAgICAgIGNvbnN0IGNvbG9yVmFyaWFibGVzID0gbW9kZS52YXJpYWJsZXMuZmlsdGVyKHZhcmlhYmxlID0+IHZhcmlhYmxlLnR5cGUgPT09ICdjb2xvcicpO1xuICAgICAgICBpZiAoY29sb3JWYXJpYWJsZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIGNvbG9yIHZhcmlhYmxlcyBmb3VuZCBpbiBtb2RlIFwiJHttb2RlLm5hbWV9XCJgKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBDcmVhdGUgbWFpbiBmcmFtZVxuICAgICAgICBjb25zdCBmcmFtZSA9IGZpZ21hLmNyZWF0ZUZyYW1lKCk7XG4gICAgICAgIGZyYW1lLm5hbWUgPSBgJHttb2RlLm5hbWV9IC0gQ29sb3IgR3VpZGVgO1xuICAgICAgICBmcmFtZS5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDEsIGc6IDEsIGI6IDEgfSB9XTtcbiAgICAgICAgZnJhbWUuY29ybmVyUmFkaXVzID0gODtcbiAgICAgICAgLy8gQ2FsY3VsYXRlIGZyYW1lIHNpemVcbiAgICAgICAgY29uc3Qgc3dhdGNoU2l6ZSA9IDgwO1xuICAgICAgICBjb25zdCBzd2F0Y2hHYXAgPSAxNjtcbiAgICAgICAgY29uc3QgaXRlbXNQZXJSb3cgPSA0O1xuICAgICAgICBjb25zdCBwYWRkaW5nID0gMzI7XG4gICAgICAgIGNvbnN0IGhlYWRlckhlaWdodCA9IDgwO1xuICAgICAgICBjb25zdCByb3dzID0gTWF0aC5jZWlsKGNvbG9yVmFyaWFibGVzLmxlbmd0aCAvIGl0ZW1zUGVyUm93KTtcbiAgICAgICAgY29uc3QgZnJhbWVXaWR0aCA9IE1hdGgubWF4KDQwMCwgaXRlbXNQZXJSb3cgKiAoc3dhdGNoU2l6ZSArIHN3YXRjaEdhcCkgLSBzd2F0Y2hHYXAgKyAocGFkZGluZyAqIDIpKTtcbiAgICAgICAgY29uc3QgZnJhbWVIZWlnaHQgPSBoZWFkZXJIZWlnaHQgKyAocm93cyAqIChzd2F0Y2hTaXplICsgNTApKSArIHBhZGRpbmc7XG4gICAgICAgIGZyYW1lLnJlc2l6ZShmcmFtZVdpZHRoLCBmcmFtZUhlaWdodCk7XG4gICAgICAgIC8vIFBvc2l0aW9uIGZyYW1lXG4gICAgICAgIGZyYW1lLnggPSBmaWdtYS52aWV3cG9ydC5ib3VuZHMueCArIDUwO1xuICAgICAgICBmcmFtZS55ID0gZmlnbWEudmlld3BvcnQuYm91bmRzLnkgKyA1MDtcbiAgICAgICAgLy8gTG9hZCBmb250c1xuICAgICAgICBjb25zdCBib2xkRm9udCA9IGF3YWl0IHNhZmVMb2FkRm9udCh7IGZhbWlseTogJ0ludGVyJywgc3R5bGU6ICdCb2xkJyB9KTtcbiAgICAgICAgY29uc3QgcmVndWxhckZvbnQgPSBhd2FpdCBzYWZlTG9hZEZvbnQoeyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnUmVndWxhcicgfSk7XG4gICAgICAgIGNvbnN0IG1lZGl1bUZvbnQgPSBhd2FpdCBzYWZlTG9hZEZvbnQoeyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnTWVkaXVtJyB9KTtcbiAgICAgICAgLy8gQWRkIHRpdGxlXG4gICAgICAgIGNvbnN0IHRpdGxlVGV4dCA9IGZpZ21hLmNyZWF0ZVRleHQoKTtcbiAgICAgICAgdGl0bGVUZXh0LmZvbnROYW1lID0gYm9sZEZvbnQ7XG4gICAgICAgIHRpdGxlVGV4dC5mb250U2l6ZSA9IDIwO1xuICAgICAgICB0aXRsZVRleHQuY2hhcmFjdGVycyA9IGAke21vZGUubmFtZX0gQ29sb3JzYDtcbiAgICAgICAgdGl0bGVUZXh0LmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC4xLCBnOiAwLjEsIGI6IDAuMSB9IH1dO1xuICAgICAgICB0aXRsZVRleHQueCA9IHBhZGRpbmc7XG4gICAgICAgIHRpdGxlVGV4dC55ID0gcGFkZGluZztcbiAgICAgICAgZnJhbWUuYXBwZW5kQ2hpbGQodGl0bGVUZXh0KTtcbiAgICAgICAgLy8gQWRkIHN1YnRpdGxlXG4gICAgICAgIGNvbnN0IHN1YnRpdGxlVGV4dCA9IGZpZ21hLmNyZWF0ZVRleHQoKTtcbiAgICAgICAgc3VidGl0bGVUZXh0LmZvbnROYW1lID0gcmVndWxhckZvbnQ7XG4gICAgICAgIHN1YnRpdGxlVGV4dC5mb250U2l6ZSA9IDEyO1xuICAgICAgICBzdWJ0aXRsZVRleHQuY2hhcmFjdGVycyA9IGAke2NvbG9yVmFyaWFibGVzLmxlbmd0aH0gdmFyaWFibGVzIGZyb20gJHtjb2xsZWN0aW9uLm5hbWV9ID4gJHtncm91cC5uYW1lfWA7XG4gICAgICAgIHN1YnRpdGxlVGV4dC5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuNSwgZzogMC41LCBiOiAwLjUgfSB9XTtcbiAgICAgICAgc3VidGl0bGVUZXh0LnggPSBwYWRkaW5nO1xuICAgICAgICBzdWJ0aXRsZVRleHQueSA9IHBhZGRpbmcgKyAyODtcbiAgICAgICAgZnJhbWUuYXBwZW5kQ2hpbGQoc3VidGl0bGVUZXh0KTtcbiAgICAgICAgLy8gQ3JlYXRlIGNvbG9yIHN3YXRjaGVzXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29sb3JWYXJpYWJsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHZhcmlhYmxlID0gY29sb3JWYXJpYWJsZXNbaV07XG4gICAgICAgICAgICBjb25zdCByb3cgPSBNYXRoLmZsb29yKGkgLyBpdGVtc1BlclJvdyk7XG4gICAgICAgICAgICBjb25zdCBjb2wgPSBpICUgaXRlbXNQZXJSb3c7XG4gICAgICAgICAgICBjb25zdCB4ID0gcGFkZGluZyArIGNvbCAqIChzd2F0Y2hTaXplICsgc3dhdGNoR2FwKTtcbiAgICAgICAgICAgIGNvbnN0IHkgPSBoZWFkZXJIZWlnaHQgKyByb3cgKiAoc3dhdGNoU2l6ZSArIDUwKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHN3YXRjaFxuICAgICAgICAgICAgICAgIGNvbnN0IHN3YXRjaCA9IGZpZ21hLmNyZWF0ZVJlY3RhbmdsZSgpO1xuICAgICAgICAgICAgICAgIHN3YXRjaC5uYW1lID0gdmFyaWFibGUubmFtZTtcbiAgICAgICAgICAgICAgICBzd2F0Y2gucmVzaXplKHN3YXRjaFNpemUsIHN3YXRjaFNpemUpO1xuICAgICAgICAgICAgICAgIHN3YXRjaC54ID0geDtcbiAgICAgICAgICAgICAgICBzd2F0Y2gueSA9IHk7XG4gICAgICAgICAgICAgICAgc3dhdGNoLmNvcm5lclJhZGl1cyA9IDY7XG4gICAgICAgICAgICAgICAgLy8gUGFyc2UgYW5kIGFwcGx5IGNvbG9yXG4gICAgICAgICAgICAgICAgY29uc3QgY29sb3JSZ2IgPSBwYXJzZUNvbG9yVG9SZ2IodmFyaWFibGUudmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChjb2xvclJnYikge1xuICAgICAgICAgICAgICAgICAgICBzd2F0Y2guZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogY29sb3JSZ2IgfV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzd2F0Y2guZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLjksIGc6IDAuOSwgYjogMC45IH0gfV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEFkZCBib3JkZXJcbiAgICAgICAgICAgICAgICBzd2F0Y2guc3Ryb2tlcyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuOSwgZzogMC45LCBiOiAwLjkgfSB9XTtcbiAgICAgICAgICAgICAgICBzd2F0Y2guc3Ryb2tlV2VpZ2h0ID0gMTtcbiAgICAgICAgICAgICAgICBmcmFtZS5hcHBlbmRDaGlsZChzd2F0Y2gpO1xuICAgICAgICAgICAgICAgIC8vIEFkZCB2YXJpYWJsZSBuYW1lXG4gICAgICAgICAgICAgICAgY29uc3QgbmFtZVRleHQgPSBmaWdtYS5jcmVhdGVUZXh0KCk7XG4gICAgICAgICAgICAgICAgbmFtZVRleHQuZm9udE5hbWUgPSBtZWRpdW1Gb250O1xuICAgICAgICAgICAgICAgIG5hbWVUZXh0LmZvbnRTaXplID0gMTE7XG4gICAgICAgICAgICAgICAgbmFtZVRleHQuY2hhcmFjdGVycyA9IHZhcmlhYmxlLm5hbWUubGVuZ3RoID4gMTUgPyB2YXJpYWJsZS5uYW1lLnN1YnN0cmluZygwLCAxMikgKyAnLi4uJyA6IHZhcmlhYmxlLm5hbWU7XG4gICAgICAgICAgICAgICAgbmFtZVRleHQuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLjEsIGc6IDAuMSwgYjogMC4xIH0gfV07XG4gICAgICAgICAgICAgICAgbmFtZVRleHQueCA9IHg7XG4gICAgICAgICAgICAgICAgbmFtZVRleHQueSA9IHkgKyBzd2F0Y2hTaXplICsgODtcbiAgICAgICAgICAgICAgICBuYW1lVGV4dC5yZXNpemUoc3dhdGNoU2l6ZSwgMTQpO1xuICAgICAgICAgICAgICAgIG5hbWVUZXh0LnRleHRBbGlnbkhvcml6b250YWwgPSAnQ0VOVEVSJztcbiAgICAgICAgICAgICAgICBmcmFtZS5hcHBlbmRDaGlsZChuYW1lVGV4dCk7XG4gICAgICAgICAgICAgICAgLy8gQWRkIHZhcmlhYmxlIHZhbHVlXG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWVUZXh0ID0gZmlnbWEuY3JlYXRlVGV4dCgpO1xuICAgICAgICAgICAgICAgIHZhbHVlVGV4dC5mb250TmFtZSA9IHJlZ3VsYXJGb250O1xuICAgICAgICAgICAgICAgIHZhbHVlVGV4dC5mb250U2l6ZSA9IDk7XG4gICAgICAgICAgICAgICAgbGV0IGRpc3BsYXlWYWx1ZSA9IHZhcmlhYmxlLnZhbHVlO1xuICAgICAgICAgICAgICAgIGlmIChkaXNwbGF5VmFsdWUubGVuZ3RoID4gMTgpIHtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheVZhbHVlID0gZGlzcGxheVZhbHVlLnN1YnN0cmluZygwLCAxNSkgKyAnLi4uJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFsdWVUZXh0LmNoYXJhY3RlcnMgPSBkaXNwbGF5VmFsdWU7XG4gICAgICAgICAgICAgICAgdmFsdWVUZXh0LmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC41LCBnOiAwLjUsIGI6IDAuNSB9IH1dO1xuICAgICAgICAgICAgICAgIHZhbHVlVGV4dC54ID0geDtcbiAgICAgICAgICAgICAgICB2YWx1ZVRleHQueSA9IHkgKyBzd2F0Y2hTaXplICsgMjU7XG4gICAgICAgICAgICAgICAgdmFsdWVUZXh0LnJlc2l6ZShzd2F0Y2hTaXplLCAxMik7XG4gICAgICAgICAgICAgICAgdmFsdWVUZXh0LnRleHRBbGlnbkhvcml6b250YWwgPSAnQ0VOVEVSJztcbiAgICAgICAgICAgICAgICBmcmFtZS5hcHBlbmRDaGlsZCh2YWx1ZVRleHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oYEVycm9yIGNyZWF0aW5nIHN3YXRjaCBmb3IgJHt2YXJpYWJsZS5uYW1lfTpgLCBlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gRm9jdXMgb24gdGhlIGdlbmVyYXRlZCBndWlkZVxuICAgICAgICBmaWdtYS52aWV3cG9ydC5zY3JvbGxBbmRab29tSW50b1ZpZXcoW2ZyYW1lXSk7XG4gICAgICAgIGxvZ2dlci5sb2coYOKchSBNb2RlIGNvbG9yIGd1aWRlIGdlbmVyYXRlZCB3aXRoICR7Y29sb3JWYXJpYWJsZXMubGVuZ3RofSBjb2xvciB2YXJpYWJsZXNgKTtcbiAgICAgICAgcmV0dXJuIGNvbG9yVmFyaWFibGVzLmxlbmd0aDtcbiAgICB9XG4gICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3IgZ2VuZXJhdGluZyBtb2RlIGNvbG9yIGd1aWRlOicsIGVycm9yKTtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxufVxuLy8gR2VuZXJhdGUgY29sb3IgZ3VpZGUgZm9yIGVudGlyZSBjb2xsZWN0aW9uIHdpdGggcHJvcGVyIG1vZGUgc2VwYXJhdGlvblxuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVDb2xsZWN0aW9uQ29sb3JHdWlkZShjb2xsZWN0aW9uKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgbG9nZ2VyLmxvZyhg8J+OqCBHZW5lcmF0aW5nIGNvbGxlY3Rpb24gY29sb3IgZ3VpZGUgZm9yOiAke2NvbGxlY3Rpb24ubmFtZX1gKTtcbiAgICAgICAgLy8gQ2hlY2sgaWYgY29sbGVjdGlvbiBoYXMgbXVsdGlwbGUgbW9kZXNcbiAgICAgICAgY29uc3QgaGFzTXVsdGlwbGVNb2RlcyA9IGNvbGxlY3Rpb24uYWxsTW9kZXMubGVuZ3RoID4gMTtcbiAgICAgICAgaWYgKCFoYXNNdWx0aXBsZU1vZGVzKSB7XG4gICAgICAgICAgICAvLyBTaW5nbGUgbW9kZSAtIHVzZSB0aGUgZXhpc3Rpbmcgc2ltcGxlIGxheW91dFxuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGdlbmVyYXRlU2luZ2xlTW9kZUNvbGxlY3Rpb25HdWlkZShjb2xsZWN0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBNdWx0aXBsZSBtb2RlcyAtIGNyZWF0ZSBtb2RlLXNlcGFyYXRlZCBsYXlvdXQgdXNpbmcgYXV0by1sYXlvdXRcbiAgICAgICAgLy8gRmlyc3QsIGNvbGxlY3QgYW5kIGRlZHVwbGljYXRlIHZhcmlhYmxlcyBieSBuYW1lXG4gICAgICAgIGNvbnN0IHVuaXF1ZVZhcmlhYmxlcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgZm9yIChjb25zdCBncm91cCBvZiBjb2xsZWN0aW9uLmdyb3Vwcykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBtb2RlIG9mIGdyb3VwLm1vZGVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29sb3JWYXJpYWJsZXMgPSBtb2RlLnZhcmlhYmxlcy5maWx0ZXIodiA9PiB2LnR5cGUgPT09ICdjb2xvcicpO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgdmFyaWFibGUgb2YgY29sb3JWYXJpYWJsZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF1bmlxdWVWYXJpYWJsZXMuaGFzKHZhcmlhYmxlLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1bmlxdWVWYXJpYWJsZXMuc2V0KHZhcmlhYmxlLm5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB2YXJpYWJsZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVWYWx1ZXM6IG5ldyBNYXAoKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdW5pcXVlVmFyaWFibGVzLmdldCh2YXJpYWJsZS5uYW1lKS5tb2RlVmFsdWVzLnNldChtb2RlLmlkLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdmFyaWFibGUudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBtb2RlTmFtZTogbW9kZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBOYW1lOiBncm91cC5uYW1lXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodW5pcXVlVmFyaWFibGVzLnNpemUgPT09IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gY29sb3IgdmFyaWFibGVzIGZvdW5kIGluIGNvbGxlY3Rpb24gXCIke2NvbGxlY3Rpb24ubmFtZX1cImApO1xuICAgICAgICB9XG4gICAgICAgIC8vIExvYWQgZm9udHNcbiAgICAgICAgY29uc3QgYm9sZEZvbnQgPSBhd2FpdCBzYWZlTG9hZEZvbnQoeyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnQm9sZCcgfSk7XG4gICAgICAgIGNvbnN0IHJlZ3VsYXJGb250ID0gYXdhaXQgc2FmZUxvYWRGb250KHsgZmFtaWx5OiAnSW50ZXInLCBzdHlsZTogJ1JlZ3VsYXInIH0pO1xuICAgICAgICBjb25zdCBtZWRpdW1Gb250ID0gYXdhaXQgc2FmZUxvYWRGb250KHsgZmFtaWx5OiAnSW50ZXInLCBzdHlsZTogJ01lZGl1bScgfSk7XG4gICAgICAgIC8vIENyZWF0ZSBtYWluIGZyYW1lIHdpdGggdmVydGljYWwgYXV0by1sYXlvdXRcbiAgICAgICAgY29uc3QgbWFpbkZyYW1lID0gZmlnbWEuY3JlYXRlRnJhbWUoKTtcbiAgICAgICAgbWFpbkZyYW1lLm5hbWUgPSBgJHtjb2xsZWN0aW9uLm5hbWV9IC0gQ29sb3IgR3VpZGVgO1xuICAgICAgICBtYWluRnJhbWUuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAxLCBnOiAxLCBiOiAxIH0gfV07XG4gICAgICAgIG1haW5GcmFtZS5jb3JuZXJSYWRpdXMgPSA4O1xuICAgICAgICBtYWluRnJhbWUubGF5b3V0TW9kZSA9ICdWRVJUSUNBTCc7XG4gICAgICAgIG1haW5GcmFtZS5wYWRkaW5nVG9wID0gMTY7XG4gICAgICAgIG1haW5GcmFtZS5wYWRkaW5nQm90dG9tID0gMTY7XG4gICAgICAgIG1haW5GcmFtZS5wYWRkaW5nTGVmdCA9IDE2O1xuICAgICAgICBtYWluRnJhbWUucGFkZGluZ1JpZ2h0ID0gMTY7XG4gICAgICAgIG1haW5GcmFtZS5pdGVtU3BhY2luZyA9IDEyO1xuICAgICAgICBtYWluRnJhbWUuY291bnRlckF4aXNTaXppbmdNb2RlID0gJ0FVVE8nO1xuICAgICAgICBtYWluRnJhbWUucHJpbWFyeUF4aXNTaXppbmdNb2RlID0gJ0FVVE8nO1xuICAgICAgICAvLyBQb3NpdGlvbiBmcmFtZSBpbiB2aWV3cG9ydFxuICAgICAgICBtYWluRnJhbWUueCA9IGZpZ21hLnZpZXdwb3J0LmJvdW5kcy54ICsgNTA7XG4gICAgICAgIG1haW5GcmFtZS55ID0gZmlnbWEudmlld3BvcnQuYm91bmRzLnkgKyA1MDtcbiAgICAgICAgLy8gQ3JlYXRlIGhlYWRlciBzZWN0aW9uXG4gICAgICAgIGNvbnN0IGhlYWRlckZyYW1lID0gZmlnbWEuY3JlYXRlRnJhbWUoKTtcbiAgICAgICAgaGVhZGVyRnJhbWUubmFtZSA9IFwiSGVhZGVyXCI7XG4gICAgICAgIGhlYWRlckZyYW1lLmxheW91dE1vZGUgPSAnVkVSVElDQUwnO1xuICAgICAgICBoZWFkZXJGcmFtZS5pdGVtU3BhY2luZyA9IDQ7XG4gICAgICAgIGhlYWRlckZyYW1lLmZpbGxzID0gW107XG4gICAgICAgIGhlYWRlckZyYW1lLmNvdW50ZXJBeGlzU2l6aW5nTW9kZSA9ICdBVVRPJztcbiAgICAgICAgaGVhZGVyRnJhbWUucHJpbWFyeUF4aXNTaXppbmdNb2RlID0gJ0FVVE8nO1xuICAgICAgICAvLyBBZGQgdGl0bGVcbiAgICAgICAgY29uc3QgdGl0bGVUZXh0ID0gZmlnbWEuY3JlYXRlVGV4dCgpO1xuICAgICAgICB0aXRsZVRleHQuZm9udE5hbWUgPSBib2xkRm9udDtcbiAgICAgICAgdGl0bGVUZXh0LmZvbnRTaXplID0gMTg7XG4gICAgICAgIHRpdGxlVGV4dC5jaGFyYWN0ZXJzID0gY29sbGVjdGlvbi5uYW1lO1xuICAgICAgICB0aXRsZVRleHQuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLjEsIGc6IDAuMSwgYjogMC4xIH0gfV07XG4gICAgICAgIGhlYWRlckZyYW1lLmFwcGVuZENoaWxkKHRpdGxlVGV4dCk7XG4gICAgICAgIC8vIEFkZCBzdWJ0aXRsZVxuICAgICAgICBjb25zdCBzdWJ0aXRsZVRleHQgPSBmaWdtYS5jcmVhdGVUZXh0KCk7XG4gICAgICAgIHN1YnRpdGxlVGV4dC5mb250TmFtZSA9IHJlZ3VsYXJGb250O1xuICAgICAgICBzdWJ0aXRsZVRleHQuZm9udFNpemUgPSAxMjtcbiAgICAgICAgc3VidGl0bGVUZXh0LmNoYXJhY3RlcnMgPSBgJHt1bmlxdWVWYXJpYWJsZXMuc2l6ZX0gdW5pcXVlIHZhcmlhYmxlcyDigKIgJHtjb2xsZWN0aW9uLmFsbE1vZGVzLmxlbmd0aH0gbW9kZXNgO1xuICAgICAgICBzdWJ0aXRsZVRleHQuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLjUsIGc6IDAuNSwgYjogMC41IH0gfV07XG4gICAgICAgIGhlYWRlckZyYW1lLmFwcGVuZENoaWxkKHN1YnRpdGxlVGV4dCk7XG4gICAgICAgIG1haW5GcmFtZS5hcHBlbmRDaGlsZChoZWFkZXJGcmFtZSk7XG4gICAgICAgIC8vIENyZWF0ZSBtb2RlIGhlYWRlcnMgcm93IHVzaW5nIGF1dG8tbGF5b3V0XG4gICAgICAgIGNvbnN0IG1vZGVIZWFkZXJzRnJhbWUgPSBmaWdtYS5jcmVhdGVGcmFtZSgpO1xuICAgICAgICBtb2RlSGVhZGVyc0ZyYW1lLm5hbWUgPSBcIk1vZGUgSGVhZGVyc1wiO1xuICAgICAgICBtb2RlSGVhZGVyc0ZyYW1lLmxheW91dE1vZGUgPSAnSE9SSVpPTlRBTCc7XG4gICAgICAgIG1vZGVIZWFkZXJzRnJhbWUuaXRlbVNwYWNpbmcgPSAxMjsgLy8gTWF0Y2ggdGhlIGRhdGEgcm93IHNwYWNpbmdcbiAgICAgICAgbW9kZUhlYWRlcnNGcmFtZS5maWxscyA9IFtdO1xuICAgICAgICBtb2RlSGVhZGVyc0ZyYW1lLmNvdW50ZXJBeGlzU2l6aW5nTW9kZSA9ICdBVVRPJztcbiAgICAgICAgbW9kZUhlYWRlcnNGcmFtZS5wcmltYXJ5QXhpc1NpemluZ01vZGUgPSAnQVVUTyc7XG4gICAgICAgIC8vIFZhcmlhYmxlIG5hbWUgY29sdW1uIGhlYWRlciAoc3BhY2VyKSAtIG1hdGNoIG5ldyB3aWR0aFxuICAgICAgICBjb25zdCBuYW1lSGVhZGVyRnJhbWUgPSBmaWdtYS5jcmVhdGVGcmFtZSgpO1xuICAgICAgICBuYW1lSGVhZGVyRnJhbWUubmFtZSA9IFwiVmFyaWFibGUgTmFtZSBIZWFkZXJcIjtcbiAgICAgICAgbmFtZUhlYWRlckZyYW1lLnJlc2l6ZSgxODAsIDMyKTsgLy8gTWF0Y2ggbmV3IHZhcmlhYmxlIG5hbWUgY29sdW1uIHdpZHRoIGFuZCBiZXR0ZXIgaGVpZ2h0XG4gICAgICAgIG5hbWVIZWFkZXJGcmFtZS5maWxscyA9IFtdO1xuICAgICAgICBuYW1lSGVhZGVyRnJhbWUubGF5b3V0TW9kZSA9ICdWRVJUSUNBTCc7XG4gICAgICAgIG5hbWVIZWFkZXJGcmFtZS5jb3VudGVyQXhpc0FsaWduSXRlbXMgPSAnTUlOJztcbiAgICAgICAgbmFtZUhlYWRlckZyYW1lLnByaW1hcnlBeGlzQWxpZ25JdGVtcyA9ICdDRU5URVInO1xuICAgICAgICBuYW1lSGVhZGVyRnJhbWUucGFkZGluZ0xlZnQgPSA4O1xuICAgICAgICBuYW1lSGVhZGVyRnJhbWUucGFkZGluZ1JpZ2h0ID0gODtcbiAgICAgICAgY29uc3QgbmFtZUhlYWRlclRleHQgPSBmaWdtYS5jcmVhdGVUZXh0KCk7XG4gICAgICAgIG5hbWVIZWFkZXJUZXh0LmZvbnROYW1lID0gbWVkaXVtRm9udDtcbiAgICAgICAgbmFtZUhlYWRlclRleHQuZm9udFNpemUgPSAxMDtcbiAgICAgICAgbmFtZUhlYWRlclRleHQuY2hhcmFjdGVycyA9IFwiVmFyaWFibGVcIjtcbiAgICAgICAgbmFtZUhlYWRlclRleHQuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLjQsIGc6IDAuNCwgYjogMC40IH0gfV07XG4gICAgICAgIG5hbWVIZWFkZXJGcmFtZS5hcHBlbmRDaGlsZChuYW1lSGVhZGVyVGV4dCk7XG4gICAgICAgIG1vZGVIZWFkZXJzRnJhbWUuYXBwZW5kQ2hpbGQobmFtZUhlYWRlckZyYW1lKTtcbiAgICAgICAgLy8gQ3JlYXRlIG1vZGUgaGVhZGVyIGNvbHVtbnMgLSBtYXRjaCBuZXcgd2lkdGhcbiAgICAgICAgZm9yIChjb25zdCBtb2RlIG9mIGNvbGxlY3Rpb24uYWxsTW9kZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IG1vZGVIZWFkZXJDb2x1bW4gPSBmaWdtYS5jcmVhdGVGcmFtZSgpO1xuICAgICAgICAgICAgbW9kZUhlYWRlckNvbHVtbi5uYW1lID0gYCR7bW9kZS5uYW1lfSBIZWFkZXJgO1xuICAgICAgICAgICAgbW9kZUhlYWRlckNvbHVtbi5sYXlvdXRNb2RlID0gJ1ZFUlRJQ0FMJztcbiAgICAgICAgICAgIG1vZGVIZWFkZXJDb2x1bW4uaXRlbVNwYWNpbmcgPSA0O1xuICAgICAgICAgICAgbW9kZUhlYWRlckNvbHVtbi5yZXNpemUoMTEwLCAzMik7IC8vIE1hdGNoIG5ldyBtb2RlIGNvbHVtbiB3aWR0aCBhbmQgYmV0dGVyIGhlaWdodFxuICAgICAgICAgICAgbW9kZUhlYWRlckNvbHVtbi5maWxscyA9IFtdO1xuICAgICAgICAgICAgbW9kZUhlYWRlckNvbHVtbi5jb3VudGVyQXhpc0FsaWduSXRlbXMgPSAnQ0VOVEVSJztcbiAgICAgICAgICAgIG1vZGVIZWFkZXJDb2x1bW4ucHJpbWFyeUF4aXNBbGlnbkl0ZW1zID0gJ0NFTlRFUic7XG4gICAgICAgICAgICBtb2RlSGVhZGVyQ29sdW1uLnBhZGRpbmdUb3AgPSA0O1xuICAgICAgICAgICAgbW9kZUhlYWRlckNvbHVtbi5wYWRkaW5nQm90dG9tID0gNDtcbiAgICAgICAgICAgIC8vIE1vZGUgbmFtZVxuICAgICAgICAgICAgY29uc3QgbW9kZU5hbWVUZXh0ID0gZmlnbWEuY3JlYXRlVGV4dCgpO1xuICAgICAgICAgICAgbW9kZU5hbWVUZXh0LmZvbnROYW1lID0gbWVkaXVtRm9udDtcbiAgICAgICAgICAgIG1vZGVOYW1lVGV4dC5mb250U2l6ZSA9IDExO1xuICAgICAgICAgICAgbW9kZU5hbWVUZXh0LmNoYXJhY3RlcnMgPSBtb2RlLm5hbWU7XG4gICAgICAgICAgICBtb2RlTmFtZVRleHQuZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLjIsIGc6IDAuMiwgYjogMC4yIH0gfV07XG4gICAgICAgICAgICBtb2RlTmFtZVRleHQudGV4dEFsaWduSG9yaXpvbnRhbCA9ICdDRU5URVInO1xuICAgICAgICAgICAgbW9kZU5hbWVUZXh0LnRleHRBdXRvUmVzaXplID0gJ1dJRFRIX0FORF9IRUlHSFQnO1xuICAgICAgICAgICAgbW9kZUhlYWRlckNvbHVtbi5hcHBlbmRDaGlsZChtb2RlTmFtZVRleHQpO1xuICAgICAgICAgICAgLy8gTW9kZSBpbmRpY2F0b3IgbGluZVxuICAgICAgICAgICAgY29uc3QgbW9kZUxpbmUgPSBmaWdtYS5jcmVhdGVSZWN0YW5nbGUoKTtcbiAgICAgICAgICAgIG1vZGVMaW5lLnJlc2l6ZSg2MCwgMik7XG4gICAgICAgICAgICBtb2RlTGluZS5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuMywgZzogMC41LCBiOiAxLjAgfSB9XTtcbiAgICAgICAgICAgIG1vZGVIZWFkZXJDb2x1bW4uYXBwZW5kQ2hpbGQobW9kZUxpbmUpO1xuICAgICAgICAgICAgbW9kZUhlYWRlcnNGcmFtZS5hcHBlbmRDaGlsZChtb2RlSGVhZGVyQ29sdW1uKTtcbiAgICAgICAgfVxuICAgICAgICBtYWluRnJhbWUuYXBwZW5kQ2hpbGQobW9kZUhlYWRlcnNGcmFtZSk7XG4gICAgICAgIC8vIENyZWF0ZSB2YXJpYWJsZXMgZ3JpZCB1c2luZyBhdXRvLWxheW91dFxuICAgICAgICBjb25zdCB2YXJpYWJsZXNDb250YWluZXIgPSBmaWdtYS5jcmVhdGVGcmFtZSgpO1xuICAgICAgICB2YXJpYWJsZXNDb250YWluZXIubmFtZSA9IFwiVmFyaWFibGVzIENvbnRhaW5lclwiO1xuICAgICAgICB2YXJpYWJsZXNDb250YWluZXIubGF5b3V0TW9kZSA9ICdWRVJUSUNBTCc7XG4gICAgICAgIHZhcmlhYmxlc0NvbnRhaW5lci5pdGVtU3BhY2luZyA9IDEyOyAvLyBJbmNyZWFzZWQgc3BhY2luZyBiZXR3ZWVuIHJvd3MgdG8gcHJldmVudCBvdmVybGFwXG4gICAgICAgIHZhcmlhYmxlc0NvbnRhaW5lci5maWxscyA9IFtdO1xuICAgICAgICB2YXJpYWJsZXNDb250YWluZXIuY291bnRlckF4aXNTaXppbmdNb2RlID0gJ0FVVE8nO1xuICAgICAgICB2YXJpYWJsZXNDb250YWluZXIucHJpbWFyeUF4aXNTaXppbmdNb2RlID0gJ0FVVE8nO1xuICAgICAgICAvLyBDcmVhdGUgZWFjaCB2YXJpYWJsZSByb3dcbiAgICAgICAgZm9yIChjb25zdCBbdmFyaWFibGVOYW1lLCB2YXJpYWJsZURhdGFdIG9mIEFycmF5LmZyb20odW5pcXVlVmFyaWFibGVzLmVudHJpZXMoKSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHZhcmlhYmxlUm93ID0gZmlnbWEuY3JlYXRlRnJhbWUoKTtcbiAgICAgICAgICAgIHZhcmlhYmxlUm93Lm5hbWUgPSBgUm93OiAke3ZhcmlhYmxlTmFtZX1gO1xuICAgICAgICAgICAgdmFyaWFibGVSb3cubGF5b3V0TW9kZSA9ICdIT1JJWk9OVEFMJztcbiAgICAgICAgICAgIHZhcmlhYmxlUm93Lml0ZW1TcGFjaW5nID0gMTI7IC8vIEluY3JlYXNlZCBzcGFjaW5nIGJldHdlZW4gY29sdW1uc1xuICAgICAgICAgICAgdmFyaWFibGVSb3cuZmlsbHMgPSBbXTtcbiAgICAgICAgICAgIHZhcmlhYmxlUm93LmNvdW50ZXJBeGlzU2l6aW5nTW9kZSA9ICdBVVRPJztcbiAgICAgICAgICAgIHZhcmlhYmxlUm93LnByaW1hcnlBeGlzU2l6aW5nTW9kZSA9ICdBVVRPJztcbiAgICAgICAgICAgIC8vIFZhcmlhYmxlIG5hbWUgY29sdW1uIC0gd2lkZXIgYW5kIGJldHRlciB0ZXh0IGhhbmRsaW5nXG4gICAgICAgICAgICBjb25zdCBuYW1lQ29sdW1uID0gZmlnbWEuY3JlYXRlRnJhbWUoKTtcbiAgICAgICAgICAgIG5hbWVDb2x1bW4ubmFtZSA9IFwiVmFyaWFibGUgTmFtZVwiO1xuICAgICAgICAgICAgbmFtZUNvbHVtbi5yZXNpemUoMTgwLCA0NCk7IC8vIFdpZGVyIGNvbHVtbiBhbmQgdGFsbGVyIHRvIGFjY29tbW9kYXRlIHRleHQgcHJvcGVybHlcbiAgICAgICAgICAgIG5hbWVDb2x1bW4uZmlsbHMgPSBbXTtcbiAgICAgICAgICAgIG5hbWVDb2x1bW4ubGF5b3V0TW9kZSA9ICdWRVJUSUNBTCc7XG4gICAgICAgICAgICBuYW1lQ29sdW1uLmNvdW50ZXJBeGlzQWxpZ25JdGVtcyA9ICdNSU4nO1xuICAgICAgICAgICAgbmFtZUNvbHVtbi5wcmltYXJ5QXhpc0FsaWduSXRlbXMgPSAnQ0VOVEVSJztcbiAgICAgICAgICAgIG5hbWVDb2x1bW4ucGFkZGluZ1RvcCA9IDQ7XG4gICAgICAgICAgICBuYW1lQ29sdW1uLnBhZGRpbmdCb3R0b20gPSA0O1xuICAgICAgICAgICAgbmFtZUNvbHVtbi5wYWRkaW5nTGVmdCA9IDg7XG4gICAgICAgICAgICBuYW1lQ29sdW1uLnBhZGRpbmdSaWdodCA9IDg7XG4gICAgICAgICAgICBjb25zdCBuYW1lVGV4dCA9IGZpZ21hLmNyZWF0ZVRleHQoKTtcbiAgICAgICAgICAgIG5hbWVUZXh0LmZvbnROYW1lID0gbWVkaXVtRm9udDtcbiAgICAgICAgICAgIG5hbWVUZXh0LmZvbnRTaXplID0gMTA7IC8vIFNsaWdodGx5IHNtYWxsZXIgZm9udCB0byBmaXQgYmV0dGVyXG4gICAgICAgICAgICAvLyBCZXR0ZXIgdHJ1bmNhdGlvbiAtIG1vcmUgY29uc2VydmF0aXZlIHRvIHByZXZlbnQgb3ZlcmZsb3dcbiAgICAgICAgICAgIGNvbnN0IG1heFdpZHRoID0gMTY0OyAvLyBBY2NvdW50IGZvciBwYWRkaW5nXG4gICAgICAgICAgICBsZXQgZGlzcGxheU5hbWUgPSB2YXJpYWJsZU5hbWU7XG4gICAgICAgICAgICAvLyBTbWFydCB0cnVuY2F0aW9uIC0gY2hlY2sgYWN0dWFsIHRleHQgd2lkdGhcbiAgICAgICAgICAgIGlmICh2YXJpYWJsZU5hbWUubGVuZ3RoID4gMTgpIHtcbiAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZSA9IHZhcmlhYmxlTmFtZS5zdWJzdHJpbmcoMCwgMTUpICsgJy4uLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBuYW1lVGV4dC5jaGFyYWN0ZXJzID0gZGlzcGxheU5hbWU7XG4gICAgICAgICAgICBuYW1lVGV4dC5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuMSwgZzogMC4xLCBiOiAwLjEgfSB9XTtcbiAgICAgICAgICAgIG5hbWVUZXh0LnRleHRBdXRvUmVzaXplID0gJ1dJRFRIX0FORF9IRUlHSFQnOyAvLyBMZXQgdGV4dCBhdXRvLXJlc2l6ZVxuICAgICAgICAgICAgbmFtZUNvbHVtbi5hcHBlbmRDaGlsZChuYW1lVGV4dCk7XG4gICAgICAgICAgICB2YXJpYWJsZVJvdy5hcHBlbmRDaGlsZChuYW1lQ29sdW1uKTtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBtb2RlIGNvbHVtbnMgZm9yIHRoaXMgdmFyaWFibGVcbiAgICAgICAgICAgIGZvciAoY29uc3QgbW9kZSBvZiBjb2xsZWN0aW9uLmFsbE1vZGVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbW9kZUNvbHVtbiA9IGZpZ21hLmNyZWF0ZUZyYW1lKCk7XG4gICAgICAgICAgICAgICAgbW9kZUNvbHVtbi5uYW1lID0gYCR7bW9kZS5uYW1lfSBWYWx1ZWA7XG4gICAgICAgICAgICAgICAgbW9kZUNvbHVtbi5yZXNpemUoMTEwLCA0NCk7IC8vIFdpZGVyIG1vZGUgY29sdW1ucyBhbmQgc2FtZSBoZWlnaHQgYXMgbmFtZSBjb2x1bW5cbiAgICAgICAgICAgICAgICBtb2RlQ29sdW1uLmZpbGxzID0gW107XG4gICAgICAgICAgICAgICAgbW9kZUNvbHVtbi5sYXlvdXRNb2RlID0gJ1ZFUlRJQ0FMJztcbiAgICAgICAgICAgICAgICBtb2RlQ29sdW1uLml0ZW1TcGFjaW5nID0gNjsgLy8gU3BhY2luZyBiZXR3ZWVuIHN3YXRjaCBhbmQgdGV4dFxuICAgICAgICAgICAgICAgIG1vZGVDb2x1bW4uY291bnRlckF4aXNBbGlnbkl0ZW1zID0gJ0NFTlRFUic7XG4gICAgICAgICAgICAgICAgbW9kZUNvbHVtbi5wcmltYXJ5QXhpc0FsaWduSXRlbXMgPSAnQ0VOVEVSJzsgLy8gQ2VudGVyIGV2ZXJ5dGhpbmdcbiAgICAgICAgICAgICAgICBtb2RlQ29sdW1uLnBhZGRpbmdUb3AgPSA0O1xuICAgICAgICAgICAgICAgIG1vZGVDb2x1bW4ucGFkZGluZ0JvdHRvbSA9IDQ7XG4gICAgICAgICAgICAgICAgY29uc3QgbW9kZURhdGEgPSB2YXJpYWJsZURhdGEubW9kZVZhbHVlcy5nZXQobW9kZS5pZCk7XG4gICAgICAgICAgICAgICAgaWYgKG1vZGVEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBzd2F0Y2ggLSBzbWFsbGVyIHNpemUgYXMgcmVxdWVzdGVkXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN3YXRjaCA9IGZpZ21hLmNyZWF0ZVJlY3RhbmdsZSgpO1xuICAgICAgICAgICAgICAgICAgICBzd2F0Y2gubmFtZSA9IGAke3ZhcmlhYmxlTmFtZX0tJHttb2RlLm5hbWV9LXN3YXRjaGA7XG4gICAgICAgICAgICAgICAgICAgIHN3YXRjaC5yZXNpemUoMjQsIDI0KTsgLy8gNDAlIHNtYWxsZXIgdGhhbiBiZWZvcmUgKHdhcyA0MHB4LCBub3cgMjRweClcbiAgICAgICAgICAgICAgICAgICAgc3dhdGNoLmNvcm5lclJhZGl1cyA9IDQ7XG4gICAgICAgICAgICAgICAgICAgIC8vIFBhcnNlIGFuZCBhcHBseSBjb2xvclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb2xvclJnYiA9IHBhcnNlQ29sb3JUb1JnYihtb2RlRGF0YS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb2xvclJnYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3dhdGNoLmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IGNvbG9yUmdiIH1dO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3dhdGNoLmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC45LCBnOiAwLjksIGI6IDAuOSB9IH1dO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIEFkZCBib3JkZXJcbiAgICAgICAgICAgICAgICAgICAgc3dhdGNoLnN0cm9rZXMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLjg1LCBnOiAwLjg1LCBiOiAwLjg1IH0gfV07XG4gICAgICAgICAgICAgICAgICAgIHN3YXRjaC5zdHJva2VXZWlnaHQgPSAxO1xuICAgICAgICAgICAgICAgICAgICBtb2RlQ29sdW1uLmFwcGVuZENoaWxkKHN3YXRjaCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIENyZWF0ZSB2YWx1ZSB0ZXh0IC0gRlVMTCBWQUxVRSBBTFdBWVMgVklTSUJMRVxuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZVRleHQgPSBmaWdtYS5jcmVhdGVUZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlVGV4dC5mb250TmFtZSA9IHJlZ3VsYXJGb250O1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZVRleHQuZm9udFNpemUgPSA4O1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZVRleHQuY2hhcmFjdGVycyA9IG1vZGVEYXRhLnZhbHVlOyAvLyBGVUxMIFZBTFVFLCBOTyBUUlVOQ0FUSU9OXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlVGV4dC5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuMiwgZzogMC4yLCBiOiAwLjIgfSB9XTtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVUZXh0LnRleHRBbGlnbkhvcml6b250YWwgPSAnQ0VOVEVSJztcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVUZXh0LnRleHRBdXRvUmVzaXplID0gJ1dJRFRIX0FORF9IRUlHSFQnOyAvLyBBdXRvLXJlc2l6ZSB0ZXh0XG4gICAgICAgICAgICAgICAgICAgIC8vIFNldCBtYXggd2lkdGggdG8gcHJldmVudCBvdmVyZmxvd1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZVRleHQucmVzaXplKDEwMCwgMTIpOyAvLyBNYXggd2lkdGggYnV0IGFsbG93IGhlaWdodCB0byBncm93XG4gICAgICAgICAgICAgICAgICAgIG1vZGVDb2x1bW4uYXBwZW5kQ2hpbGQodmFsdWVUZXh0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIE5vIHZhbHVlIGZvciB0aGlzIG1vZGUgLSBzaG93IHBsYWNlaG9sZGVyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBsYWNlaG9sZGVyID0gZmlnbWEuY3JlYXRlUmVjdGFuZ2xlKCk7XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyLnJlc2l6ZSgyNCwgMjQpOyAvLyBTYW1lIHNtYWxsZXIgc2l6ZVxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlci5jb3JuZXJSYWRpdXMgPSA0O1xuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlci5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuOTYsIGc6IDAuOTYsIGI6IDAuOTYgfSB9XTtcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXIuc3Ryb2tlcyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuOSwgZzogMC45LCBiOiAwLjkgfSB9XTtcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXIuc3Ryb2tlV2VpZ2h0ID0gMTtcbiAgICAgICAgICAgICAgICAgICAgbW9kZUNvbHVtbi5hcHBlbmRDaGlsZChwbGFjZWhvbGRlcik7XG4gICAgICAgICAgICAgICAgICAgIC8vIE4vQSB0ZXh0XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5hVGV4dCA9IGZpZ21hLmNyZWF0ZVRleHQoKTtcbiAgICAgICAgICAgICAgICAgICAgbmFUZXh0LmZvbnROYW1lID0gcmVndWxhckZvbnQ7XG4gICAgICAgICAgICAgICAgICAgIG5hVGV4dC5mb250U2l6ZSA9IDg7XG4gICAgICAgICAgICAgICAgICAgIG5hVGV4dC5jaGFyYWN0ZXJzID0gXCJOL0FcIjtcbiAgICAgICAgICAgICAgICAgICAgbmFUZXh0LmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC42LCBnOiAwLjYsIGI6IDAuNiB9IH1dO1xuICAgICAgICAgICAgICAgICAgICBuYVRleHQudGV4dEFsaWduSG9yaXpvbnRhbCA9ICdDRU5URVInO1xuICAgICAgICAgICAgICAgICAgICBuYVRleHQudGV4dEF1dG9SZXNpemUgPSAnV0lEVEhfQU5EX0hFSUdIVCc7XG4gICAgICAgICAgICAgICAgICAgIG1vZGVDb2x1bW4uYXBwZW5kQ2hpbGQobmFUZXh0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyaWFibGVSb3cuYXBwZW5kQ2hpbGQobW9kZUNvbHVtbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXJpYWJsZXNDb250YWluZXIuYXBwZW5kQ2hpbGQodmFyaWFibGVSb3cpO1xuICAgICAgICB9XG4gICAgICAgIG1haW5GcmFtZS5hcHBlbmRDaGlsZCh2YXJpYWJsZXNDb250YWluZXIpO1xuICAgICAgICAvLyBBcHBlbmQgdG8gcGFnZVxuICAgICAgICBmaWdtYS5jdXJyZW50UGFnZS5hcHBlbmRDaGlsZChtYWluRnJhbWUpO1xuICAgICAgICAvLyBTZWxlY3QgYW5kIHpvb20gdG8gdGhlIGZyYW1lXG4gICAgICAgIGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvbiA9IFttYWluRnJhbWVdO1xuICAgICAgICBmaWdtYS52aWV3cG9ydC5zY3JvbGxBbmRab29tSW50b1ZpZXcoW21haW5GcmFtZV0pO1xuICAgICAgICBsb2dnZXIubG9nKGDinIUgR2VuZXJhdGVkIGNvbGxlY3Rpb24gY29sb3IgZ3VpZGUgd2l0aCAke3VuaXF1ZVZhcmlhYmxlcy5zaXplfSB2YXJpYWJsZXNgKTtcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVZhcmlhYmxlcy5zaXplO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgbG9nZ2VyLmVycm9yKCfinYwgRXJyb3IgZ2VuZXJhdGluZyBjb2xsZWN0aW9uIGNvbG9yIGd1aWRlOicsIGVycm9yKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gZ2VuZXJhdGUgY29sbGVjdGlvbiBjb2xvciBndWlkZTogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ31gKTtcbiAgICB9XG59XG4vLyBIZWxwZXIgZnVuY3Rpb24gZm9yIHNpbmdsZSBtb2RlIGNvbGxlY3Rpb24gZ3VpZGVzXG5hc3luYyBmdW5jdGlvbiBnZW5lcmF0ZVNpbmdsZU1vZGVDb2xsZWN0aW9uR3VpZGUoY29sbGVjdGlvbikge1xuICAgIHRyeSB7XG4gICAgICAgIC8vIENvbGxlY3QgYWxsIGNvbG9yIHZhcmlhYmxlcyBmcm9tIGFsbCBncm91cHNcbiAgICAgICAgY29uc3QgYWxsQ29sb3JWYXJpYWJsZXMgPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCBncm91cCBvZiBjb2xsZWN0aW9uLmdyb3Vwcykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBtb2RlIG9mIGdyb3VwLm1vZGVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29sb3JWYXJpYWJsZXMgPSBtb2RlLnZhcmlhYmxlcy5maWx0ZXIodiA9PiB2LnR5cGUgPT09ICdjb2xvcicpO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgdmFyaWFibGUgb2YgY29sb3JWYXJpYWJsZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgYWxsQ29sb3JWYXJpYWJsZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwTmFtZTogZ3JvdXAubmFtZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFsbENvbG9yVmFyaWFibGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBjb2xvciB2YXJpYWJsZXMgZm91bmQgaW4gY29sbGVjdGlvbiBcIiR7Y29sbGVjdGlvbi5uYW1lfVwiYCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTG9hZCBmb250c1xuICAgICAgICBjb25zdCBib2xkRm9udCA9IGF3YWl0IHNhZmVMb2FkRm9udCh7IGZhbWlseTogJ0ludGVyJywgc3R5bGU6ICdCb2xkJyB9KTtcbiAgICAgICAgY29uc3QgcmVndWxhckZvbnQgPSBhd2FpdCBzYWZlTG9hZEZvbnQoeyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnUmVndWxhcicgfSk7XG4gICAgICAgIGNvbnN0IG1lZGl1bUZvbnQgPSBhd2FpdCBzYWZlTG9hZEZvbnQoeyBmYW1pbHk6ICdJbnRlcicsIHN0eWxlOiAnTWVkaXVtJyB9KTtcbiAgICAgICAgLy8gQ3JlYXRlIG1haW4gZnJhbWUgd2l0aCB2ZXJ0aWNhbCBhdXRvLWxheW91dFxuICAgICAgICBjb25zdCBtYWluRnJhbWUgPSBmaWdtYS5jcmVhdGVGcmFtZSgpO1xuICAgICAgICBtYWluRnJhbWUubmFtZSA9IGAke2NvbGxlY3Rpb24ubmFtZX0gLSBTaW5nbGUgTW9kZSBDb2xvciBHdWlkZWA7XG4gICAgICAgIG1haW5GcmFtZS5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDEsIGc6IDEsIGI6IDEgfSB9XTtcbiAgICAgICAgbWFpbkZyYW1lLmNvcm5lclJhZGl1cyA9IDg7XG4gICAgICAgIG1haW5GcmFtZS5sYXlvdXRNb2RlID0gJ1ZFUlRJQ0FMJztcbiAgICAgICAgbWFpbkZyYW1lLnBhZGRpbmdUb3AgPSAxNjtcbiAgICAgICAgbWFpbkZyYW1lLnBhZGRpbmdCb3R0b20gPSAxNjtcbiAgICAgICAgbWFpbkZyYW1lLnBhZGRpbmdMZWZ0ID0gMTY7XG4gICAgICAgIG1haW5GcmFtZS5wYWRkaW5nUmlnaHQgPSAxNjtcbiAgICAgICAgbWFpbkZyYW1lLml0ZW1TcGFjaW5nID0gMTI7XG4gICAgICAgIG1haW5GcmFtZS5jb3VudGVyQXhpc1NpemluZ01vZGUgPSAnQVVUTyc7XG4gICAgICAgIG1haW5GcmFtZS5wcmltYXJ5QXhpc1NpemluZ01vZGUgPSAnQVVUTyc7XG4gICAgICAgIC8vIFBvc2l0aW9uIGZyYW1lIGluIHZpZXdwb3J0XG4gICAgICAgIG1haW5GcmFtZS54ID0gZmlnbWEudmlld3BvcnQuYm91bmRzLnggKyA1MDtcbiAgICAgICAgbWFpbkZyYW1lLnkgPSBmaWdtYS52aWV3cG9ydC5ib3VuZHMueSArIDUwO1xuICAgICAgICAvLyBDcmVhdGUgaGVhZGVyIHNlY3Rpb25cbiAgICAgICAgY29uc3QgaGVhZGVyRnJhbWUgPSBmaWdtYS5jcmVhdGVGcmFtZSgpO1xuICAgICAgICBoZWFkZXJGcmFtZS5uYW1lID0gXCJIZWFkZXJcIjtcbiAgICAgICAgaGVhZGVyRnJhbWUubGF5b3V0TW9kZSA9ICdWRVJUSUNBTCc7XG4gICAgICAgIGhlYWRlckZyYW1lLml0ZW1TcGFjaW5nID0gNDtcbiAgICAgICAgaGVhZGVyRnJhbWUuZmlsbHMgPSBbXTtcbiAgICAgICAgaGVhZGVyRnJhbWUuY291bnRlckF4aXNTaXppbmdNb2RlID0gJ0FVVE8nO1xuICAgICAgICBoZWFkZXJGcmFtZS5wcmltYXJ5QXhpc1NpemluZ01vZGUgPSAnQVVUTyc7XG4gICAgICAgIC8vIEFkZCB0aXRsZVxuICAgICAgICBjb25zdCB0aXRsZVRleHQgPSBmaWdtYS5jcmVhdGVUZXh0KCk7XG4gICAgICAgIHRpdGxlVGV4dC5mb250TmFtZSA9IGJvbGRGb250O1xuICAgICAgICB0aXRsZVRleHQuZm9udFNpemUgPSAxODtcbiAgICAgICAgdGl0bGVUZXh0LmNoYXJhY3RlcnMgPSBjb2xsZWN0aW9uLm5hbWU7XG4gICAgICAgIHRpdGxlVGV4dC5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuMSwgZzogMC4xLCBiOiAwLjEgfSB9XTtcbiAgICAgICAgaGVhZGVyRnJhbWUuYXBwZW5kQ2hpbGQodGl0bGVUZXh0KTtcbiAgICAgICAgLy8gQWRkIHN1YnRpdGxlXG4gICAgICAgIGNvbnN0IHN1YnRpdGxlVGV4dCA9IGZpZ21hLmNyZWF0ZVRleHQoKTtcbiAgICAgICAgc3VidGl0bGVUZXh0LmZvbnROYW1lID0gcmVndWxhckZvbnQ7XG4gICAgICAgIHN1YnRpdGxlVGV4dC5mb250U2l6ZSA9IDEyO1xuICAgICAgICBzdWJ0aXRsZVRleHQuY2hhcmFjdGVycyA9IGAke2FsbENvbG9yVmFyaWFibGVzLmxlbmd0aH0gY29sb3IgdmFyaWFibGVzYDtcbiAgICAgICAgc3VidGl0bGVUZXh0LmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC41LCBnOiAwLjUsIGI6IDAuNSB9IH1dO1xuICAgICAgICBoZWFkZXJGcmFtZS5hcHBlbmRDaGlsZChzdWJ0aXRsZVRleHQpO1xuICAgICAgICBtYWluRnJhbWUuYXBwZW5kQ2hpbGQoaGVhZGVyRnJhbWUpO1xuICAgICAgICAvLyBDcmVhdGUgdmFyaWFibGVzIGdyaWQgdXNpbmcgYXV0by1sYXlvdXRcbiAgICAgICAgY29uc3QgdmFyaWFibGVzQ29udGFpbmVyID0gZmlnbWEuY3JlYXRlRnJhbWUoKTtcbiAgICAgICAgdmFyaWFibGVzQ29udGFpbmVyLm5hbWUgPSBcIlZhcmlhYmxlcyBDb250YWluZXJcIjtcbiAgICAgICAgdmFyaWFibGVzQ29udGFpbmVyLmxheW91dE1vZGUgPSAnVkVSVElDQUwnO1xuICAgICAgICB2YXJpYWJsZXNDb250YWluZXIuaXRlbVNwYWNpbmcgPSAxMjsgLy8gSW5jcmVhc2VkIHNwYWNpbmcgdG8gcHJldmVudCBvdmVybGFwXG4gICAgICAgIHZhcmlhYmxlc0NvbnRhaW5lci5maWxscyA9IFtdO1xuICAgICAgICB2YXJpYWJsZXNDb250YWluZXIuY291bnRlckF4aXNTaXppbmdNb2RlID0gJ0FVVE8nO1xuICAgICAgICB2YXJpYWJsZXNDb250YWluZXIucHJpbWFyeUF4aXNTaXppbmdNb2RlID0gJ0FVVE8nO1xuICAgICAgICAvLyBHcm91cCB2YXJpYWJsZXMgYnkgZ3JvdXAgbmFtZSBmb3IgYmV0dGVyIG9yZ2FuaXphdGlvblxuICAgICAgICBjb25zdCBncm91cGVkVmFyaWFibGVzID0gbmV3IE1hcCgpO1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgYWxsQ29sb3JWYXJpYWJsZXMpIHtcbiAgICAgICAgICAgIGlmICghZ3JvdXBlZFZhcmlhYmxlcy5oYXMoaXRlbS5ncm91cE5hbWUpKSB7XG4gICAgICAgICAgICAgICAgZ3JvdXBlZFZhcmlhYmxlcy5zZXQoaXRlbS5ncm91cE5hbWUsIFtdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGdyb3VwZWRWYXJpYWJsZXMuZ2V0KGl0ZW0uZ3JvdXBOYW1lKS5wdXNoKGl0ZW0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIENyZWF0ZSB2YXJpYWJsZXMgb3JnYW5pemVkIGJ5IGdyb3VwXG4gICAgICAgIGZvciAoY29uc3QgW2dyb3VwTmFtZSwgdmFyaWFibGVzXSBvZiBBcnJheS5mcm9tKGdyb3VwZWRWYXJpYWJsZXMuZW50cmllcygpKSkge1xuICAgICAgICAgICAgLy8gQWRkIGdyb3VwIGhlYWRlciBpZiB0aGVyZSBhcmUgbXVsdGlwbGUgZ3JvdXBzXG4gICAgICAgICAgICBpZiAoZ3JvdXBlZFZhcmlhYmxlcy5zaXplID4gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGdyb3VwSGVhZGVyRnJhbWUgPSBmaWdtYS5jcmVhdGVGcmFtZSgpO1xuICAgICAgICAgICAgICAgIGdyb3VwSGVhZGVyRnJhbWUubmFtZSA9IGBHcm91cDogJHtncm91cE5hbWV9YDtcbiAgICAgICAgICAgICAgICBncm91cEhlYWRlckZyYW1lLmZpbGxzID0gW107XG4gICAgICAgICAgICAgICAgZ3JvdXBIZWFkZXJGcmFtZS5sYXlvdXRNb2RlID0gJ1ZFUlRJQ0FMJztcbiAgICAgICAgICAgICAgICBncm91cEhlYWRlckZyYW1lLmNvdW50ZXJBeGlzU2l6aW5nTW9kZSA9ICdBVVRPJztcbiAgICAgICAgICAgICAgICBncm91cEhlYWRlckZyYW1lLnByaW1hcnlBeGlzU2l6aW5nTW9kZSA9ICdBVVRPJztcbiAgICAgICAgICAgICAgICBncm91cEhlYWRlckZyYW1lLnBhZGRpbmdUb3AgPSA4O1xuICAgICAgICAgICAgICAgIGdyb3VwSGVhZGVyRnJhbWUucGFkZGluZ0JvdHRvbSA9IDQ7XG4gICAgICAgICAgICAgICAgY29uc3QgZ3JvdXBIZWFkZXJUZXh0ID0gZmlnbWEuY3JlYXRlVGV4dCgpO1xuICAgICAgICAgICAgICAgIGdyb3VwSGVhZGVyVGV4dC5mb250TmFtZSA9IG1lZGl1bUZvbnQ7XG4gICAgICAgICAgICAgICAgZ3JvdXBIZWFkZXJUZXh0LmZvbnRTaXplID0gMTM7XG4gICAgICAgICAgICAgICAgZ3JvdXBIZWFkZXJUZXh0LmNoYXJhY3RlcnMgPSBncm91cE5hbWU7XG4gICAgICAgICAgICAgICAgZ3JvdXBIZWFkZXJUZXh0LmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC4zLCBnOiAwLjMsIGI6IDAuMyB9IH1dO1xuICAgICAgICAgICAgICAgIGdyb3VwSGVhZGVyVGV4dC50ZXh0QXV0b1Jlc2l6ZSA9ICdXSURUSF9BTkRfSEVJR0hUJztcbiAgICAgICAgICAgICAgICBncm91cEhlYWRlckZyYW1lLmFwcGVuZENoaWxkKGdyb3VwSGVhZGVyVGV4dCk7XG4gICAgICAgICAgICAgICAgdmFyaWFibGVzQ29udGFpbmVyLmFwcGVuZENoaWxkKGdyb3VwSGVhZGVyRnJhbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQ3JlYXRlIGVhY2ggdmFyaWFibGUgcm93XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHsgdmFyaWFibGUgfSBvZiB2YXJpYWJsZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YXJpYWJsZVJvdyA9IGZpZ21hLmNyZWF0ZUZyYW1lKCk7XG4gICAgICAgICAgICAgICAgdmFyaWFibGVSb3cubmFtZSA9IGBSb3c6ICR7dmFyaWFibGUubmFtZX1gO1xuICAgICAgICAgICAgICAgIHZhcmlhYmxlUm93LmxheW91dE1vZGUgPSAnSE9SSVpPTlRBTCc7XG4gICAgICAgICAgICAgICAgdmFyaWFibGVSb3cuaXRlbVNwYWNpbmcgPSAxNjsgLy8gTW9yZSBzcGFjZSBiZXR3ZWVuIHN3YXRjaCBhbmQgdGV4dFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlUm93LmZpbGxzID0gW107XG4gICAgICAgICAgICAgICAgdmFyaWFibGVSb3cuY291bnRlckF4aXNTaXppbmdNb2RlID0gJ0FVVE8nO1xuICAgICAgICAgICAgICAgIHZhcmlhYmxlUm93LnByaW1hcnlBeGlzU2l6aW5nTW9kZSA9ICdBVVRPJztcbiAgICAgICAgICAgICAgICB2YXJpYWJsZVJvdy5wYWRkaW5nVG9wID0gNjtcbiAgICAgICAgICAgICAgICB2YXJpYWJsZVJvdy5wYWRkaW5nQm90dG9tID0gNjtcbiAgICAgICAgICAgICAgICAvLyBDb2xvciBzd2F0Y2hcbiAgICAgICAgICAgICAgICBjb25zdCBzd2F0Y2ggPSBmaWdtYS5jcmVhdGVSZWN0YW5nbGUoKTtcbiAgICAgICAgICAgICAgICBzd2F0Y2gubmFtZSA9IGAke3ZhcmlhYmxlLm5hbWV9LXN3YXRjaGA7XG4gICAgICAgICAgICAgICAgc3dhdGNoLnJlc2l6ZSgzMiwgMzIpOyAvLyBDb21wYWN0IGJ1dCB2aXNpYmxlXG4gICAgICAgICAgICAgICAgc3dhdGNoLmNvcm5lclJhZGl1cyA9IDY7XG4gICAgICAgICAgICAgICAgLy8gUGFyc2UgYW5kIGFwcGx5IGNvbG9yXG4gICAgICAgICAgICAgICAgY29uc3QgY29sb3JSZ2IgPSBwYXJzZUNvbG9yVG9SZ2IodmFyaWFibGUudmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChjb2xvclJnYikge1xuICAgICAgICAgICAgICAgICAgICBzd2F0Y2guZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogY29sb3JSZ2IgfV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzd2F0Y2guZmlsbHMgPSBbeyB0eXBlOiAnU09MSUQnLCBjb2xvcjogeyByOiAwLjksIGc6IDAuOSwgYjogMC45IH0gfV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEFkZCBib3JkZXJcbiAgICAgICAgICAgICAgICBzd2F0Y2guc3Ryb2tlcyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuODUsIGc6IDAuODUsIGI6IDAuODUgfSB9XTtcbiAgICAgICAgICAgICAgICBzd2F0Y2guc3Ryb2tlV2VpZ2h0ID0gMTtcbiAgICAgICAgICAgICAgICB2YXJpYWJsZVJvdy5hcHBlbmRDaGlsZChzd2F0Y2gpO1xuICAgICAgICAgICAgICAgIC8vIFZhcmlhYmxlIGluZm8gY29sdW1uIC0gYmV0dGVyIHNwYWNpbmcgYW5kIHNpemluZ1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZm9Db2x1bW4gPSBmaWdtYS5jcmVhdGVGcmFtZSgpO1xuICAgICAgICAgICAgICAgIGluZm9Db2x1bW4ubmFtZSA9IFwiVmFyaWFibGUgSW5mb1wiO1xuICAgICAgICAgICAgICAgIGluZm9Db2x1bW4ubGF5b3V0TW9kZSA9ICdWRVJUSUNBTCc7XG4gICAgICAgICAgICAgICAgaW5mb0NvbHVtbi5pdGVtU3BhY2luZyA9IDQ7IC8vIEJldHRlciBzcGFjaW5nIGJldHdlZW4gbmFtZSBhbmQgdmFsdWVcbiAgICAgICAgICAgICAgICBpbmZvQ29sdW1uLmZpbGxzID0gW107XG4gICAgICAgICAgICAgICAgaW5mb0NvbHVtbi5jb3VudGVyQXhpc1NpemluZ01vZGUgPSAnQVVUTyc7XG4gICAgICAgICAgICAgICAgaW5mb0NvbHVtbi5wcmltYXJ5QXhpc1NpemluZ01vZGUgPSAnQVVUTyc7XG4gICAgICAgICAgICAgICAgaW5mb0NvbHVtbi5jb3VudGVyQXhpc0FsaWduSXRlbXMgPSAnTUlOJztcbiAgICAgICAgICAgICAgICAvLyBWYXJpYWJsZSBuYW1lIC0gd2l0aCBwcm9wZXIgdHJ1bmNhdGlvblxuICAgICAgICAgICAgICAgIGNvbnN0IG5hbWVUZXh0ID0gZmlnbWEuY3JlYXRlVGV4dCgpO1xuICAgICAgICAgICAgICAgIG5hbWVUZXh0LmZvbnROYW1lID0gbWVkaXVtRm9udDtcbiAgICAgICAgICAgICAgICBuYW1lVGV4dC5mb250U2l6ZSA9IDEyO1xuICAgICAgICAgICAgICAgIC8vIFNtYXJ0IHRydW5jYXRpb24gZm9yIHZlcnkgbG9uZyBuYW1lc1xuICAgICAgICAgICAgICAgIGxldCBkaXNwbGF5TmFtZSA9IHZhcmlhYmxlLm5hbWU7XG4gICAgICAgICAgICAgICAgaWYgKHZhcmlhYmxlLm5hbWUubGVuZ3RoID4gMzUpIHtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheU5hbWUgPSB2YXJpYWJsZS5uYW1lLnN1YnN0cmluZygwLCAzMikgKyAnLi4uJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbmFtZVRleHQuY2hhcmFjdGVycyA9IGRpc3BsYXlOYW1lO1xuICAgICAgICAgICAgICAgIG5hbWVUZXh0LmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMC4xLCBnOiAwLjEsIGI6IDAuMSB9IH1dO1xuICAgICAgICAgICAgICAgIG5hbWVUZXh0LnRleHRBdXRvUmVzaXplID0gJ1dJRFRIX0FORF9IRUlHSFQnO1xuICAgICAgICAgICAgICAgIGluZm9Db2x1bW4uYXBwZW5kQ2hpbGQobmFtZVRleHQpO1xuICAgICAgICAgICAgICAgIC8vIFZhcmlhYmxlIHZhbHVlIC0gRlVMTCBWQUxVRSBBTFdBWVMgVklTSUJMRSB3aXRoIGJldHRlciBzaXppbmdcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZVRleHQgPSBmaWdtYS5jcmVhdGVUZXh0KCk7XG4gICAgICAgICAgICAgICAgdmFsdWVUZXh0LmZvbnROYW1lID0gcmVndWxhckZvbnQ7XG4gICAgICAgICAgICAgICAgdmFsdWVUZXh0LmZvbnRTaXplID0gMTA7XG4gICAgICAgICAgICAgICAgdmFsdWVUZXh0LmNoYXJhY3RlcnMgPSB2YXJpYWJsZS52YWx1ZTsgLy8gRlVMTCBWQUxVRSwgTk8gVFJVTkNBVElPTlxuICAgICAgICAgICAgICAgIHZhbHVlVGV4dC5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAuNCwgZzogMC40LCBiOiAwLjQgfSB9XTtcbiAgICAgICAgICAgICAgICB2YWx1ZVRleHQudGV4dEF1dG9SZXNpemUgPSAnV0lEVEhfQU5EX0hFSUdIVCc7IC8vIExldCB0ZXh0IGF1dG8tc2l6ZVxuICAgICAgICAgICAgICAgIGluZm9Db2x1bW4uYXBwZW5kQ2hpbGQodmFsdWVUZXh0KTtcbiAgICAgICAgICAgICAgICB2YXJpYWJsZVJvdy5hcHBlbmRDaGlsZChpbmZvQ29sdW1uKTtcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXNDb250YWluZXIuYXBwZW5kQ2hpbGQodmFyaWFibGVSb3cpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG1haW5GcmFtZS5hcHBlbmRDaGlsZCh2YXJpYWJsZXNDb250YWluZXIpO1xuICAgICAgICAvLyBBcHBlbmQgdG8gcGFnZVxuICAgICAgICBmaWdtYS5jdXJyZW50UGFnZS5hcHBlbmRDaGlsZChtYWluRnJhbWUpO1xuICAgICAgICAvLyBTZWxlY3QgYW5kIHpvb20gdG8gdGhlIGZyYW1lXG4gICAgICAgIGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvbiA9IFttYWluRnJhbWVdO1xuICAgICAgICBmaWdtYS52aWV3cG9ydC5zY3JvbGxBbmRab29tSW50b1ZpZXcoW21haW5GcmFtZV0pO1xuICAgICAgICBsb2dnZXIubG9nKGDinIUgR2VuZXJhdGVkIHNpbmdsZSBtb2RlIGNvbG9yIGd1aWRlIHdpdGggJHthbGxDb2xvclZhcmlhYmxlcy5sZW5ndGh9IHZhcmlhYmxlc2ApO1xuICAgICAgICByZXR1cm4gYWxsQ29sb3JWYXJpYWJsZXMubGVuZ3RoO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgbG9nZ2VyLmVycm9yKCfinYwgRXJyb3IgZ2VuZXJhdGluZyBzaW5nbGUgbW9kZSBjb2xvciBndWlkZTonLCBlcnJvcik7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGdlbmVyYXRlIHNpbmdsZSBtb2RlIGNvbG9yIGd1aWRlOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWApO1xuICAgIH1cbn1cbi8vID09PSBFTkQgQ09MTEVDVElPTiBDT0xPUiBHVUlERSA9PT1cbi8vIEhhbmRsZSBtZXNzYWdlcyBmcm9tIHRoZSBVSVxuZmlnbWEudWkub25tZXNzYWdlID0gYXN5bmMgKG1zZykgPT4ge1xuICAgIGlmIChtc2cudHlwZSA9PT0gJ2NyZWF0ZS12YXJpYWJsZXMnKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjcmVhdGVGaWdtYVZhcmlhYmxlcyhtc2cudG9rZW5zKTtcbiAgICAgICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICB0eXBlOiAndmFyaWFibGVzLWNyZWF0ZWQnLFxuICAgICAgICAgICAgICAgIGNvdW50OiByZXN1bHQuY291bnQsXG4gICAgICAgICAgICAgICAgaXNFeHRlbnNpb246IHJlc3VsdC5pc0V4dGVuc2lvbixcbiAgICAgICAgICAgICAgICBjb2xsZWN0aW9uTmFtZTogcmVzdWx0LmNvbGxlY3Rpb25OYW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IGFjdGlvblRleHQgPSByZXN1bHQuaXNFeHRlbnNpb24gPyAndXBkYXRlZCcgOiAnY3JlYXRlZCc7XG4gICAgICAgICAgICBmaWdtYS5ub3RpZnkoYFN1Y2Nlc3NmdWxseSAke2FjdGlvblRleHR9ICR7cmVzdWx0LmNvdW50fSBkZXNpZ24gdG9rZW4gdmFyaWFibGVzIGluIFwiJHtyZXN1bHQuY29sbGVjdGlvbk5hbWV9XCIhYCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvcjonLCBlcnJvcik7XG4gICAgICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2Vycm9yJyxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnRmFpbGVkIHRvIGNyZWF0ZSB2YXJpYWJsZXMuIFBsZWFzZSB0cnkgYWdhaW4uJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmaWdtYS5ub3RpZnkoJ0ZhaWxlZCB0byBjcmVhdGUgdmFyaWFibGVzLiBQbGVhc2UgdHJ5IGFnYWluLicsIHsgZXJyb3I6IHRydWUgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKG1zZy50eXBlID09PSAnc2Nhbi1leGlzdGluZy12YXJpYWJsZXMnKSB7XG4gICAgICAgIGxvZ2dlci5sb2coJ/CflI0gQmFja2VuZDogUmVjZWl2ZWQgc2Nhbi1leGlzdGluZy12YXJpYWJsZXMgcmVxdWVzdCAobGVnYWN5KScpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbG9nZ2VyLmxvZygn8J+TiiBCYWNrZW5kOiBTdGFydGluZyB2YXJpYWJsZSBzY2FuLi4uJyk7XG4gICAgICAgICAgICBjb25zdCBleGlzdGluZ1Rva2VucyA9IGF3YWl0IHNjYW5FeGlzdGluZ1ZhcmlhYmxlc0VuaGFuY2VkKCk7XG4gICAgICAgICAgICBjb25zdCB0b3RhbENvdW50ID0gZXhpc3RpbmdUb2tlbnMubGlnaHQubGVuZ3RoICsgZXhpc3RpbmdUb2tlbnMuZGFyay5sZW5ndGggKyBleGlzdGluZ1Rva2Vucy5nbG9iYWwubGVuZ3RoO1xuICAgICAgICAgICAgbG9nZ2VyLmxvZygn4pyFIEJhY2tlbmQ6IFNjYW4gY29tcGxldGVkIScsIHtcbiAgICAgICAgICAgICAgICB0b3RhbDogdG90YWxDb3VudCxcbiAgICAgICAgICAgICAgICBsaWdodDogZXhpc3RpbmdUb2tlbnMubGlnaHQubGVuZ3RoLFxuICAgICAgICAgICAgICAgIGRhcms6IGV4aXN0aW5nVG9rZW5zLmRhcmsubGVuZ3RoLFxuICAgICAgICAgICAgICAgIGdsb2JhbDogZXhpc3RpbmdUb2tlbnMuZ2xvYmFsLmxlbmd0aFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBsb2dnZXIubG9nKCfwn46oIEJhY2tlbmQ6IFNhbXBsZSB0b2tlbnM6Jywge1xuICAgICAgICAgICAgICAgIGxpZ2h0U2FtcGxlOiBleGlzdGluZ1Rva2Vucy5saWdodFswXSxcbiAgICAgICAgICAgICAgICBkYXJrU2FtcGxlOiBleGlzdGluZ1Rva2Vucy5kYXJrWzBdLFxuICAgICAgICAgICAgICAgIGdsb2JhbFNhbXBsZTogZXhpc3RpbmdUb2tlbnMuZ2xvYmFsWzBdXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdleGlzdGluZy12YXJpYWJsZXMtZm91bmQnLFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczogZXhpc3RpbmdUb2tlbnMsXG4gICAgICAgICAgICAgICAgY291bnQ6IHRvdGFsQ291bnRcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBsb2dnZXIubG9nKCfwn5OkIEJhY2tlbmQ6IFNlbmRpbmcgcmVzcG9uc2UgdG8gVUk6JywgcmVzcG9uc2UpO1xuICAgICAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2UocmVzcG9uc2UpO1xuICAgICAgICAgICAgZmlnbWEubm90aWZ5KGBGb3VuZCAke3RvdGFsQ291bnR9IGV4aXN0aW5nIHZhcmlhYmxlcyFgKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGxvZ2dlci5lcnJvcign4p2MIEJhY2tlbmQ6IEVuaGFuY2VkIHNjYW4gZmFpbGVkLCB0cnlpbmcgZmFsbGJhY2suLi4nLCBlcnJvcik7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIEZhbGxiYWNrIHRvIGJhc2ljIHNjYW5uaW5nIGlmIGVuaGFuY2VkIGZhaWxzXG4gICAgICAgICAgICAgICAgY29uc3QgYmFzaWNUb2tlbnMgPSBhd2FpdCBzY2FuRXhpc3RpbmdWYXJpYWJsZXNCYXNpYygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvdGFsQ291bnQgPSBiYXNpY1Rva2Vucy5saWdodC5sZW5ndGggKyBiYXNpY1Rva2Vucy5kYXJrLmxlbmd0aCArIGJhc2ljVG9rZW5zLmdsb2JhbC5sZW5ndGg7XG4gICAgICAgICAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZXhpc3RpbmctdmFyaWFibGVzLWZvdW5kJyxcbiAgICAgICAgICAgICAgICAgICAgdmFyaWFibGVzOiBiYXNpY1Rva2VucyxcbiAgICAgICAgICAgICAgICAgICAgY291bnQ6IHRvdGFsQ291bnRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBmaWdtYS5ub3RpZnkoYEZvdW5kICR7dG90YWxDb3VudH0gdmFyaWFibGVzIChiYXNpYyBzY2FuKSFgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChmYWxsYmFja0Vycm9yKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCfinYwgQmFja2VuZDogQm90aCBzY2FucyBmYWlsZWQ6JywgZmFsbGJhY2tFcnJvcik7XG4gICAgICAgICAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZXJyb3InLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnRmFpbGVkIHRvIHNjYW4gZXhpc3RpbmcgdmFyaWFibGVzLiBQbGVhc2UgdHJ5IGFnYWluLidcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBmaWdtYS5ub3RpZnkoJ0ZhaWxlZCB0byBzY2FuIGV4aXN0aW5nIHZhcmlhYmxlcy4gUGxlYXNlIHRyeSBhZ2Fpbi4nLCB7IGVycm9yOiB0cnVlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChtc2cudHlwZSA9PT0gJ3NjYW4tdmFyaWFibGVzLWhpZXJhcmNoaWNhbCcpIHtcbiAgICAgICAgbG9nZ2VyLmxvZygn8J+UjSBCYWNrZW5kOiBSZWNlaXZlZCBoaWVyYXJjaGljYWwgdmFyaWFibGUgc2NhbiByZXF1ZXN0Jyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsb2dnZXIubG9nKCfwn5OKIEJhY2tlbmQ6IFN0YXJ0aW5nIGhpZXJhcmNoaWNhbCB2YXJpYWJsZSBzY2FuLi4uJyk7XG4gICAgICAgICAgICBjb25zdCB2YXJpYWJsZVN0cnVjdHVyZSA9IGF3YWl0IHNjYW5WYXJpYWJsZXNIaWVyYXJjaGljYWwoKTtcbiAgICAgICAgICAgIGxvZ2dlci5sb2coJ+KchSBCYWNrZW5kOiBIaWVyYXJjaGljYWwgc2NhbiBjb21wbGV0ZWQhJywge1xuICAgICAgICAgICAgICAgIHRvdGFsQ29sbGVjdGlvbnM6IHZhcmlhYmxlU3RydWN0dXJlLnRvdGFsQ29sbGVjdGlvbnMsXG4gICAgICAgICAgICAgICAgdG90YWxWYXJpYWJsZXM6IHZhcmlhYmxlU3RydWN0dXJlLnRvdGFsVmFyaWFibGVzLFxuICAgICAgICAgICAgICAgIGNvbGxlY3Rpb25zOiB2YXJpYWJsZVN0cnVjdHVyZS5jb2xsZWN0aW9ucy5tYXAoYyA9PiAoe1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBjLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwczogYy5ncm91cHMubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IGMudG90YWxWYXJpYWJsZXNcbiAgICAgICAgICAgICAgICB9KSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3ZhcmlhYmxlcy1zdHJ1Y3R1cmUtZm91bmQnLFxuICAgICAgICAgICAgICAgIHN0cnVjdHVyZTogdmFyaWFibGVTdHJ1Y3R1cmVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBsb2dnZXIubG9nKCfwn5OkIEJhY2tlbmQ6IFNlbmRpbmcgaGllcmFyY2hpY2FsIHJlc3BvbnNlIHRvIFVJOicsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIGZpZ21hLm5vdGlmeShgRm91bmQgJHt2YXJpYWJsZVN0cnVjdHVyZS50b3RhbFZhcmlhYmxlc30gdmFyaWFibGVzIGluICR7dmFyaWFibGVTdHJ1Y3R1cmUudG90YWxDb2xsZWN0aW9uc30gY29sbGVjdGlvbnMhYCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ+KdjCBCYWNrZW5kOiBIaWVyYXJjaGljYWwgc2NhbiBmYWlsZWQ6JywgZXJyb3IpO1xuICAgICAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdlcnJvcicsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ0ZhaWxlZCB0byBzY2FuIHZhcmlhYmxlcyBoaWVyYXJjaGljYWxseS4gUGxlYXNlIHRyeSBhZ2Fpbi4nXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZpZ21hLm5vdGlmeSgnRmFpbGVkIHRvIHNjYW4gdmFyaWFibGVzLiBQbGVhc2UgdHJ5IGFnYWluLicsIHsgZXJyb3I6IHRydWUgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKG1zZy50eXBlID09PSAnZ2VuZXJhdGUtY29sb3ItZ3VpZGUnKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb2xvckNvdW50ID0gYXdhaXQgZ2VuZXJhdGVDb2xvckd1aWRlKG1zZy52YXJpYWJsZXMpO1xuICAgICAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdjb2xvci1ndWlkZS1nZW5lcmF0ZWQnLFxuICAgICAgICAgICAgICAgIGNvdW50OiBjb2xvckNvdW50XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZpZ21hLm5vdGlmeShgQ29sb3IgZ3VpZGUgZ2VuZXJhdGVkIHdpdGggJHtjb2xvckNvdW50fSB2YXJpYWJsZXMhYCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBnZW5lcmF0aW5nIGNvbG9yIGd1aWRlOicsIGVycm9yKTtcbiAgICAgICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnZXJyb3InLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gZ2VuZXJhdGUgY29sb3IgZ3VpZGUuIFBsZWFzZSB0cnkgYWdhaW4uJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmaWdtYS5ub3RpZnkoJ0ZhaWxlZCB0byBnZW5lcmF0ZSBjb2xvciBndWlkZS4gUGxlYXNlIHRyeSBhZ2Fpbi4nLCB7IGVycm9yOiB0cnVlIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChtc2cudHlwZSA9PT0gJ2dlbmVyYXRlLWNvbGxlY3Rpb24tY29sb3ItZ3VpZGUnKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uID0gbXNnLmNvbGxlY3Rpb247XG4gICAgICAgICAgICBjb25zdCBjb2xvckNvdW50ID0gYXdhaXQgZ2VuZXJhdGVDb2xsZWN0aW9uQ29sb3JHdWlkZShjb2xsZWN0aW9uKTtcbiAgICAgICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnY29sb3ItZ3VpZGUtZ2VuZXJhdGVkJyxcbiAgICAgICAgICAgICAgICBjb3VudDogY29sb3JDb3VudFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmaWdtYS5ub3RpZnkoYENvbG9yIGd1aWRlIGdlbmVyYXRlZCBmb3IgXCIke2NvbGxlY3Rpb24ubmFtZX1cIiB3aXRoICR7Y29sb3JDb3VudH0gdmFyaWFibGVzIWApO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZ2VuZXJhdGluZyBjb2xsZWN0aW9uIGNvbG9yIGd1aWRlOicsIGVycm9yKTtcbiAgICAgICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnZXJyb3InLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gZ2VuZXJhdGUgY29sb3IgZ3VpZGUuIFBsZWFzZSB0cnkgYWdhaW4uJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmaWdtYS5ub3RpZnkoJ0ZhaWxlZCB0byBnZW5lcmF0ZSBjb2xsZWN0aW9uIGNvbG9yIGd1aWRlLiBQbGVhc2UgdHJ5IGFnYWluLicsIHsgZXJyb3I6IHRydWUgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKG1zZy50eXBlID09PSAnZ2VuZXJhdGUtbW9kZS1jb2xvci1ndWlkZScpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHsgY29sbGVjdGlvbiwgZ3JvdXAsIG1vZGUgfSA9IG1zZztcbiAgICAgICAgICAgIGNvbnN0IGNvbG9yQ291bnQgPSBhd2FpdCBnZW5lcmF0ZU1vZGVDb2xvckd1aWRlKGNvbGxlY3Rpb24sIGdyb3VwLCBtb2RlKTtcbiAgICAgICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnY29sb3ItZ3VpZGUtZ2VuZXJhdGVkJyxcbiAgICAgICAgICAgICAgICBjb3VudDogY29sb3JDb3VudFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmaWdtYS5ub3RpZnkoYENvbG9yIGd1aWRlIGdlbmVyYXRlZCBmb3IgXCIke21vZGUubmFtZX1cIiBtb2RlIHdpdGggJHtjb2xvckNvdW50fSB2YXJpYWJsZXMhYCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBnZW5lcmF0aW5nIG1vZGUgY29sb3IgZ3VpZGU6JywgZXJyb3IpO1xuICAgICAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdlcnJvcicsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ0ZhaWxlZCB0byBnZW5lcmF0ZSBjb2xvciBndWlkZS4gUGxlYXNlIHRyeSBhZ2Fpbi4nXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZpZ21hLm5vdGlmeSgnRmFpbGVkIHRvIGdlbmVyYXRlIG1vZGUgY29sb3IgZ3VpZGUuIFBsZWFzZSB0cnkgYWdhaW4uJywgeyBlcnJvcjogdHJ1ZSB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAobXNnLnR5cGUgPT09ICdzY2FuLXRleHQtc3R5bGVzJykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2NhblRleHRTdHlsZXMoKTtcbiAgICAgICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICB0eXBlOiAndGV4dC1zdHlsZXMtc2Nhbm5lZCcsXG4gICAgICAgICAgICAgICAgc3R5bGVzOiByZXN1bHQuc3R5bGVzLFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczogcmVzdWx0LnZhcmlhYmxlc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmaWdtYS5ub3RpZnkoYEZvdW5kICR7cmVzdWx0LnN0eWxlcy5sZW5ndGh9IHRleHQgc3R5bGVzIGFuZCAke3Jlc3VsdC52YXJpYWJsZXMubGVuZ3RofSB0ZXh0IHZhcmlhYmxlcyFgKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNjYW5uaW5nIHRleHQgc3R5bGVzOicsIGVycm9yKTtcbiAgICAgICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnZXJyb3InLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gc2NhbiB0ZXh0IHN0eWxlcy4gUGxlYXNlIHRyeSBhZ2Fpbi4nXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZpZ21hLm5vdGlmeSgnRmFpbGVkIHRvIHNjYW4gdGV4dCBzdHlsZXMuIFBsZWFzZSB0cnkgYWdhaW4uJywgeyBlcnJvcjogdHJ1ZSB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAobXNnLnR5cGUgPT09ICdnZW5lcmF0ZS10eXBvZ3JhcGh5LWd1aWRlJykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgaXRlbUNvdW50ID0gYXdhaXQgZ2VuZXJhdGVUeXBvZ3JhcGh5R3VpZGUobXNnLnN0eWxlcywgbXNnLnZhcmlhYmxlcyk7XG4gICAgICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3R5cG9ncmFwaHktZ3VpZGUtZ2VuZXJhdGVkJyxcbiAgICAgICAgICAgICAgICBjb3VudDogaXRlbUNvdW50XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZpZ21hLm5vdGlmeShgVHlwb2dyYXBoeSBndWlkZSBnZW5lcmF0ZWQgd2l0aCAke2l0ZW1Db3VudH0gaXRlbXMhYCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBnZW5lcmF0aW5nIHR5cG9ncmFwaHkgZ3VpZGU6JywgZXJyb3IpO1xuICAgICAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICd0eXBvZ3JhcGh5LWd1aWRlLWVycm9yJyxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnRmFpbGVkIHRvIGdlbmVyYXRlIHR5cG9ncmFwaHkgZ3VpZGUuIFBsZWFzZSB0cnkgYWdhaW4uJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmaWdtYS5ub3RpZnkoJ0ZhaWxlZCB0byBnZW5lcmF0ZSB0eXBvZ3JhcGh5IGd1aWRlLiBQbGVhc2UgdHJ5IGFnYWluLicsIHsgZXJyb3I6IHRydWUgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKG1zZy50eXBlID09PSAnY2xvc2UtcGx1Z2luJykge1xuICAgICAgICBmaWdtYS5jbG9zZVBsdWdpbigpO1xuICAgIH1cbiAgICBpZiAobXNnLnR5cGUgPT09ICdyZXNpemUnKSB7XG4gICAgICAgIGZpZ21hLnVpLnJlc2l6ZShtc2cud2lkdGgsIG1zZy5oZWlnaHQpO1xuICAgIH1cbn07XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=