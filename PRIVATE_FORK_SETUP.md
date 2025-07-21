# Private Fork Setup

This document explains how to set up and maintain a private fork of Essential Tokens with your personal branding.

## Why This Approach?

- **Public repo**: Clean, open source, community-friendly
- **Private fork**: Contains your personal branding, Twitter links, company info
- **Single workflow**: Develop in public, sync to private for personal use

## Setup Instructions

### 1. Create Private Repository

1. Go to [GitHub.com](https://github.com) → "New Repository"
2. **Repository name**: `essential-tokens-personal`
3. **Visibility**: ✅ **Private**
4. **Description**: "Personal version of Essential Tokens with branding"
5. **DO NOT** initialize with README, .gitignore, or license

### 2. Clone and Setup

```bash
# Clone this public repo
git clone https://github.com/sochar3/essential-tokens.git essential-tokens-personal
cd essential-tokens-personal

# Add your private remote
git remote add personal https://github.com/YOUR_USERNAME/essential-tokens-personal.git

# Push to your private repo
git push personal main
```

### 3. Add Your Personal Content

Create or restore the InfoScreen with your content:

```bash
# In your private repo, create components/screens/InfoScreen.tsx
# Add your personal branding, links, company info
```

### 4. Update App.tsx in Private Repo

```typescript
// Add back the InfoScreen import and navigation
import InfoScreen from './components/screens/InfoScreen';
import { DocumentIconLarge, PaletteIconLarge, TypeIconLarge, XIcon, InfoIcon } from './components/ui/icons';

// Add back the Info button in sidebar
// Add back the InfoScreen case in renderCurrentScreen
```

## Sync Workflow

### Pull Updates from Public Repo

```bash
# In your private repo directory
git remote add upstream https://github.com/sochar3/essential-tokens.git
git fetch upstream
git merge upstream/main
```

### Handle Merge Conflicts

If there are conflicts with your personal content:
1. Resolve conflicts manually
2. Keep your personal branding
3. Adopt the new features from upstream

### Push to Private

```bash
git push personal main
```

## Benefits

✅ **Clean separation**: Public repo stays clean for community  
✅ **Private branding**: Your personal content stays private  
✅ **Easy syncing**: Pull improvements from public repo  
✅ **Professional**: Standard enterprise pattern  
✅ **Flexible**: Add any personal features you want  

## File Structure

**Public Repo** (this one):
- ❌ No InfoScreen
- ❌ No personal branding
- ✅ All core functionality
- ✅ Community contributions

**Private Fork** (yours):
- ✅ InfoScreen with your info
- ✅ Personal branding
- ✅ All core functionality
- ✅ Your custom features

## Example Personal Content

In your private `components/screens/InfoScreen.tsx`:

```tsx
<p style={{ margin: '0' }}>
  I am <a href='https://x.com/YOUR_HANDLE' target="_blank">Your Name</a> 
  co-founder of <a href="https://yourcompany.com" target="_blank">Your Company</a> 
  and [your description].
</p>
```

This approach gives you complete control over your personal version while contributing to the open source community! 