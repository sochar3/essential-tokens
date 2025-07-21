# Figma Design Token Importer Plugin

A complete, working Figma plugin that converts CSS design tokens into native Figma variables.

## Quick Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the plugin:**
   ```bash
   npm run build
   ```

3. **Load in Figma:**
   - Open Figma desktop app
   - Go to **Plugins → Development → Import plugin from manifest...**
   - Select `manifest.json` from this folder
   - Plugin appears in **Plugins → Development → Design Token Importer**

## Development

- **Development mode:** `npm run dev` (watches files and rebuilds)
- **Production build:** `npm run build`
- **Clean build files:** `npm run clean`

## Features

✅ **Parse CSS Variables** - Paste :root and .dark CSS variables  
✅ **Comprehensive Color Support** - HSB, HSL, RGB, OKLCH, and hex formats  
✅ **Multiple Token Types** - Colors, fonts, spacing, shadows  
✅ **Light/Dark Mode** - Separate variable collections  
✅ **Live Preview** - See parsed tokens before creating  
✅ **Select All** - Easy text selection in input area  
✅ **Compact Design** - 380px width optimized for Figma  



## Supported Color Formats

This plugin supports **all major color formats** for both preview and Figma variable creation:

### ✅ Hex Colors
```css
--primary: #3b82f6;
--accent: #f59e0b;
```

### ✅ RGB Colors
```css
--red: rgb(239, 68, 68);
--green: rgb(34, 197, 94);
--blue: rgba(59, 130, 246, 0.8);
--percentage: rgb(50%, 25%, 100%);
--decimal: rgb(0.9, 0.1, 0.5);
```

### ✅ HSL Colors
```css
--primary: hsl(217, 91%, 60%);
--secondary: hsla(45, 93%, 47%, 0.9);
--with-deg: hsl(217deg, 91%, 60%);
--decimal: hsl(217.5, 91.2%, 60.8%);
```

### ✅ HSB/HSV Colors
```css
--bright: hsb(217, 76%, 96%);
--vivid: hsv(300, 100%, 80%);
--transparent: hsba(217, 76%, 96%, 0.7);
--decimal: hsb(217.5, 76.2%, 96.8%);
```

### ✅ OKLCH Colors
```css
--modern: oklch(0.6104 0.0767 299.7335);
--dynamic: oklch(0.7058 0.0777 302.0489);
```

### ✅ ShadCN Raw HSL Format
```css
/* ShadCN's unique format without hsl() wrapper */
--background: 0 0% 100%;
--foreground: 224 71.4% 4.1%;
--primary: 262.1 83.3% 57.8%;
--muted: 210 40% 98%;
```

**All formats support:**
- Decimal values (`hsl(217.5, 91.2%, 60.8%)`)
- Integer values (`hsl(217, 91%, 60%)`) 
- Percentage notation (`rgb(50%, 25%, 100%)`)
- Alpha transparency (`rgba`, `hsla`, `hsba`)
- Degree units (`hsl(217deg, 91%, 60%)`)
- **ShadCN raw HSL** (`224 71.4% 4.1%`)

## ShadCN UI Kit Support

This plugin has **enhanced support for ShadCN UI Kits** with improved variable scanning:

✅ **Auto-detects ShadCN collections** - "2. Themes", "3. Mode", "Themes", "Colors"  
✅ **ShadCN raw HSL format** - Properly handles `224 71.4% 4.1%` format  
✅ **Variable aliases/references** - Handles complex variable relationships  
✅ **Robust error handling** - Skips invalid variables instead of failing  
✅ **Detailed logging** - Console output helps debug scanning issues  

### Troubleshooting ShadCN Scanning

If variables show as `rgb(NaN, NaN, NaN)` or scanning fails:

1. **Check Console Output**: Open Figma DevTools (Plugins → Development → Open Console) 
2. **Collection Detection**: Look for "Found [Collection Name] collection" messages
3. **Variable Processing**: Check for "✓ Added" vs "✗ Skipped" messages  
4. **Try Simple Test**: Start with a few basic variables to isolate issues

**Common ShadCN structures that work:**
- Collection: "2. Themes" or "Themes"
- Variables: `base/background`, `color/primary`, or direct names
- Values: Raw HSL (`0 0% 100%`) or standard formats

## Usage

1. Copy CSS variables from your design system
2. Paste into the plugin's input area
3. Click "Parse Tokens" to extract design tokens
4. Review the parsed tokens in the preview
5. Click "Create Variables" to import into Figma
6. Access variables in Figma's Variables panel

## Example CSS Input

```css
:root {
  /* OKLCH colors */
  --primary: oklch(0.6104 0.0767 299.7335);
  --secondary: oklch(0.8 0.05 200);
  
  /* HSL colors */
  --accent: hsl(45, 93%, 47%);
  --muted: hsla(210, 15%, 90%, 0.8);
  
  /* HSB colors */
  --bright: hsb(217, 76%, 96%);
  --vivid: hsv(300, 100%, 80%);
  
  /* RGB colors */
  --danger: rgb(239, 68, 68);
  --success: rgba(34, 197, 94, 0.9);
  
  /* Hex colors */
  --info: #3b82f6;
  --warning: #f59e0b;
  
  /* Other tokens */
  --font-sans: Geist, sans-serif;
  --radius: 0.5rem;
  --shadow-sm: 1px 2px 5px rgba(0,0,0,0.1);
}

.dark {
  --primary: oklch(0.7058 0.0777 302.0489);
  --background: oklch(0.145 0 0);
  --accent: hsl(45, 85%, 55%);
}
```

## File Structure

```
├── App.tsx                 # Main React component
├── code.ts                 # Figma plugin sandbox code
├── manifest.json           # Plugin configuration
├── src/ui.tsx             # React entry point
├── components/
│   ├── css-parser.tsx     # CSS parsing logic
│   ├── TokenDisplay.tsx   # Token display components
│   └── ui/                # Shadcn UI components
├── styles/globals.css     # Tailwind styles
└── webpack.config.js      # Build configuration
```

## Troubleshooting

**Build errors?**
- Run `npm install` to ensure dependencies are installed
- Delete `node_modules` and reinstall if needed

**Plugin won't load?**
- Check that `dist/` folder contains `code.js` and `ui.html` after building
- Verify `manifest.json` paths are correct

**Variables not creating?**
- Test with simple CSS variables first
- Check browser console for errors (Plugins → Development → Open Console)

## Built With

- React + TypeScript
- Tailwind CSS v4
- Shadcn UI components
- Figma Plugin API
- Webpack build system