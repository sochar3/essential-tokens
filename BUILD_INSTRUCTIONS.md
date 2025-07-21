# Figma Design Token Importer - Build Instructions

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build the Plugin**
   ```bash
   npm run build
   ```

3. **Load in Figma**
   - Open Figma desktop app
   - Go to **Plugins** → **Development** → **Import plugin from manifest...**
   - Select the `manifest.json` file in this directory
   - The plugin will appear in **Plugins** → **Development**

## Development Workflow

1. **Start Development Mode**
   ```bash
   npm run dev
   ```
   This will watch for changes and rebuild automatically.

2. **Make Changes**
   - Edit any file in the project
   - The plugin will rebuild automatically in development mode

3. **Test in Figma**
   - Run the plugin from **Plugins** → **Development** → **Design Token Importer**
   - To see changes, reload the plugin by right-clicking and selecting "Reload plugin"

## File Structure

```
├── src/
│   └── ui.tsx              # React UI entry point
├── components/
│   ├── css-parser.tsx      # CSS parsing logic
│   ├── TokenDisplay.tsx    # Token display components
│   └── ui/                 # shadcn/ui components
├── styles/
│   └── globals.css         # Tailwind styles
├── App.tsx                 # Main React component
├── code.ts                 # Figma plugin code
├── manifest.json           # Plugin manifest
├── ui.html                 # Plugin UI HTML
├── webpack.config.js       # Build configuration
└── package.json           # Dependencies
```

## Build Output

After running `npm run build`, the following files are created in `/dist`:
- `code.js` - Plugin sandbox code
- `ui.html` - Plugin UI HTML
- `ui.js` - Bundled React application

## Troubleshooting

### Plugin won't load
- Ensure you've run `npm run build`
- Check that `/dist` folder contains `code.js` and `ui.html`
- Try reloading the plugin in Figma

### Build errors
- Run `npm install` to install dependencies
- Check that Node.js version is 16 or higher
- Delete `node_modules` and `dist`, then reinstall

### Variables not creating
- Open browser dev tools in Figma (Plugins → Development → Open Console)
- Check for JavaScript errors
- Test with simple CSS variables first

## Publishing

When ready to publish:
1. Run `npm run build`
2. Test thoroughly in Figma
3. Follow Figma's plugin publishing guidelines
4. The built files in `/dist` are what get packaged for distribution