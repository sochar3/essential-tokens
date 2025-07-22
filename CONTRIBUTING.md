# Contributing to Essential Tokens

Thank you for your interest in contributing to Essential Tokens! 🎉 This guide will help you get started with contributing to our Figma plugin for CSS design token parsing.

## 🌟 Ways to Contribute

- 🐛 **Bug Reports** - Help us identify and fix issues
- ✨ **Feature Requests** - Suggest new functionality
- 🎨 **UI/UX Improvements** - Enhance the user experience
- 📚 **Documentation** - Improve guides and examples
- 🔧 **Code Contributions** - Add features or fix bugs
- 🧪 **Testing** - Help test new features and color formats

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** - Required for building the plugin
- **Figma Desktop App** - For testing the plugin
- **Git** - For version control
- **Code Editor** - VS Code recommended

### Development Setup

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/essential-tokens.git
   cd essential-tokens
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Plugin**
   ```bash
   npm run build
   ```

4. **Load in Figma**
   - Open Figma Desktop App
   - Go to **Plugins** → **Development** → **Import plugin from manifest...**
   - Select `manifest.json` from the project folder
   - Plugin appears in **Plugins** → **Development**

5. **Start Development**
   ```bash
   npm run dev  # Watches files and rebuilds automatically
   ```

## 📋 Contribution Guidelines

### Before You Start
- ⭐ **Star the repository** to show your support
- 🔍 **Check existing issues** before creating new ones
- 💬 **Discuss major changes** in an issue first
- 📖 **Read this guide** completely

### Pull Request Process

#### 1. ✅ **Create Focused PRs**
- **One feature per PR** - Keep changes small and focused
- **Clear purpose** - Explain what the PR does and why
- **Test thoroughly** - Verify your changes work in Figma

#### 2. ✅ **Follow Code Standards**
```typescript
// ✅ Good - Descriptive names and TypeScript
interface ParsedColorToken {
  name: string;
  value: string;
  type: 'color';
  displayValue: string;
}

// ❌ Bad - Unclear naming and no types
const data = {
  n: string,
  v: any
}
```

#### 3. ✅ **Required Checks**
- **Build succeeds** - `npm run build` works without errors
- **TypeScript passes** - No compilation errors
- **No build artifacts** - Don't commit `/dist` files
- **Test in Figma** - Verify functionality works

#### 4. ✅ **PR Template**
```markdown
## What this PR does
Brief description of the changes

## Testing
- [ ] Tested in Figma Desktop App
- [ ] Verified color parsing works
- [ ] No console errors
- [ ] Build completes successfully

## Type of change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
```

## 🎨 What We're Looking For

### High Priority Contributions
- 🌈 **New Color Format Support** - Add OKLCH variations, P3 colors, etc.
- 🐛 **Bug Fixes** - Fix color parsing edge cases
- 🚀 **Performance** - Optimize parsing speed for large CSS files
- 📱 **UI Improvements** - Better responsive design, accessibility

### Medium Priority
- 📚 **Documentation** - Better examples, troubleshooting guides
- 🧪 **Testing** - Unit tests for color conversion functions
- 🔧 **Developer Experience** - Better error messages, logging

### Examples of Good Contributions

**🌈 Adding New Color Format:**
```typescript
// Add support for CSS Color Module Level 4 colors
export function labToRgb(labString: string): RGBColor | null {
  // Implementation for lab() color support
}
```

**🐛 Bug Fix Example:**
```typescript
// Fix: Handle negative HSL values properly
function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360;
}
```

**📚 Documentation Example:**
```markdown
## Supported Color Formats

### OKLCH Colors ✨ New!
```css
--primary: oklch(0.7 0.15 180);
```
```

## 🚫 What We're NOT Looking For

- ❌ **Breaking Changes** without discussion
- ❌ **Unrelated Features** (file management, etc.)
- ❌ **Build Artifacts** (`/dist` files in PRs)
- ❌ **Bundle Changes** (React version bumps, etc.)
- ❌ **Major Refactors** without prior agreement
- ❌ **Formatting-only PRs** without functional changes

## 🧪 Testing Your Changes

### Required Testing
1. **Build Test**
   ```bash
   npm run build
   # Should complete without errors
   ```

2. **Figma Test**
   ```bash
   # After building, test in Figma:
   # 1. Load the plugin
   # 2. Try parsing various CSS formats
   # 3. Verify variables are created correctly
   ```

3. **Color Format Test**
   ```css
   /* Test with various formats */
   :root {
     --hex: #3b82f6;
     --rgb: rgb(59, 130, 246);
     --hsl: hsl(217, 91%, 60%);
     --oklch: oklch(0.6104 0.0767 299.7335);
   }
   ```

### Browser Console Testing
- Open Figma DevTools: **Plugins** → **Development** → **Open Console**
- Check for JavaScript errors
- Verify color conversion logs

## 📝 Code Style

### TypeScript Standards
```typescript
// ✅ Use interfaces for objects
interface TokenData {
  name: string;
  value: string;
  type: TokenType;
}

// ✅ Use descriptive function names
function parseOklchToRgb(oklchValue: string): RGBColor | null

// ✅ Handle errors gracefully
try {
  const result = parseColor(input);
  return result;
} catch (error) {
  console.warn('Color parsing failed:', error);
  return null;
}
```

### React/UI Standards
```tsx
// ✅ Use functional components
export function ColorPreview({ color }: { color: string }) {
  return <div style={{ backgroundColor: color }} />;
}

// ✅ Use meaningful prop names
interface TokenDisplayProps {
  token: ParsedToken;
  showPreview: boolean;
}
```

## 🔄 Review Process

### Timeline
- **Initial Response** - Within 48-72 hours
- **Review Completion** - Within 1 week for small PRs
- **Feedback** - Clear, constructive, and actionable

### Review Criteria
1. **Functionality** - Does it work as intended?
2. **Code Quality** - Is it well-written and maintainable?
3. **Testing** - Has it been properly tested?
4. **Documentation** - Are changes documented if needed?
5. **Compatibility** - Does it break existing functionality?

### Getting Your PR Approved
- ✅ Address all feedback constructively
- ✅ Keep discussions professional and friendly
- ✅ Test requested changes thoroughly
- ✅ Update documentation if needed
- ✅ Be patient - quality reviews take time

## 🎯 Specific Contribution Areas

### Color Format Support
We're always looking to expand color format support:
- **CSS Color Module Level 4** - `lab()`, `lch()`, `hwb()`
- **Display P3** - Wide gamut color support
- **OKLCH variants** - Different OKLCH syntaxes
- **Custom formats** - Framework-specific color formats

### Parser Improvements
- **Better error handling** - Graceful failures
- **Performance optimization** - Faster parsing
- **Edge case support** - Handle unusual CSS formats
- **Memory efficiency** - Reduce memory usage

### UI/UX Enhancements
- **Accessibility** - Better screen reader support
- **Responsive design** - Works on different screen sizes
- **Visual feedback** - Better loading states, animations
- **Error messaging** - Clearer error explanations

## 🐛 Bug Reports

### Use the Bug Report Template
1. Go to **Issues** → **New Issue** → **Bug Report**
2. Fill out all sections completely
3. Include the CSS that's causing issues
4. Specify your Figma version

### Good Bug Report Example
```markdown
**Bug**: OKLCH colors with high chroma values aren't parsing correctly

**Steps to Reproduce**:
1. Paste this CSS: `--accent: oklch(0.7 0.37 142);`
2. Click "Parse Tokens"
3. See incorrect color preview

**Expected**: Should show bright green color
**Actual**: Shows muted gray color

**CSS Input**:
```css
:root {
  --accent: oklch(0.7 0.37 142);
}
```

**Figma Version**: Desktop App v116.5.28
```

## 🚀 Feature Requests

### Use the Feature Request Template
1. **Problem Description** - What problem does this solve?
2. **Proposed Solution** - How should it work?
3. **Use Cases** - When would this be useful?
4. **Examples** - Show concrete examples

### Good Feature Request Example
```markdown
**Problem**: The plugin doesn't support CSS Grid token values like `repeat(4, 1fr)`

**Solution**: Add parsing for CSS Grid and Flexbox token types

**Use Cases**: 
- Design systems with layout tokens
- Component spacing systems
- Grid-based designs

**Example**:
```css
:root {
  --grid-columns: repeat(4, 1fr);
  --gap: 1rem 2rem;
}
```
```

## 📚 Documentation Contributions

Documentation improvements are always welcome:
- **README updates** - Keep setup instructions current
- **Code comments** - Explain complex color conversion logic
- **Examples** - Add more CSS format examples
- **Troubleshooting** - Help with common issues

## 🙋‍♀️ Getting Help

### Where to Ask Questions
- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General questions and ideas
- **Code Comments** - For specific implementation questions

### Response Times
- **Critical Bugs** - Within 24 hours
- **General Issues** - Within 48-72 hours
- **Feature Requests** - Within 1 week

## 🏆 Recognition

Contributors are recognized in several ways:
- **Contributors Graph** - Automatic GitHub recognition
- **Release Notes** - Credit for significant contributions
- **Community Showcase** - Highlighting awesome contributions

## 📄 License

By contributing to Essential Tokens, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Essential Tokens!** 🎉

Your contributions help make design token management better for the entire community. Whether you're fixing a small bug or adding a major feature, every contribution matters and is appreciated.

**Happy Contributing!** ✨ 