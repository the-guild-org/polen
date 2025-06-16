# Logo & Branding Architecture

## Overview

Polen's branding system allows projects to customize their favicon and logo, with automatic generation of unique abstract motifs when custom assets aren't provided. The system supports dark/light mode switching and integrates seamlessly with the build pipeline.

## Components

### 1. Configuration (`src/api/config/configurator.ts`)

The branding configuration is part of the main Polen config:

```typescript
branding?: {
  favicon?: string
  logo?: string | {
    src: string
    alt?: string
    height?: number
    darkMode?: string
  }
}
```

### 2. Default Asset Generator (`src/lib/branding/default-asset-generator.ts`)

Generates unique minimalist abstract motifs using deterministic seeded randomization:

- **`generateProjectSeed(projectPath, projectName)`** - Creates a unique seed from project info
- **`generateDefaultFavicon(seed)`** - Creates a simple geometric shape (circle/square/diamond)
- **`generateDefaultLogo(options)`** - Creates a complex motif with multiple shapes
- **`seededRandom(seed)`** - Deterministic random number generator using SHA-256

Key features:

- Deterministic output (same project = same design)
- Automatic dark/light mode via CSS media queries in SVG
- Color palette generation based on HSL with varying hue

### 3. Vite Plugin (`src/api/vite/plugins/branding-simple.ts`)

Handles asset generation and serving during build:

- **Build Start Hook** - Ensures branding assets exist (copies custom or generates defaults)
- **Virtual Module Resolution** - Serves logo configurations and generated SVGs
- **Asset Generation** - Creates favicon.svg and manifest.json in build output

Virtual modules:

- `virtual:polen/branding` - Exports branding configuration
- `virtual:polen/branding/logo-light.svg` - Light mode logo
- `virtual:polen/branding/logo-dark.svg` - Dark mode logo

**Implementation Note**: Virtual module IDs must be prefixed with `\0` in the `load()` hook to prevent Vite from trying to resolve them as file paths. The `resolveId()` hook returns `'\0' + id` to mark them as virtual.

### 4. Logo Component (`src/template/components/Logo.tsx`)

React component for displaying the logo:

```typescript
interface LogoProps {
  title: string
  height?: number
  showTitle?: boolean
}
```

Features:

- Loads branding config from virtual module
- Handles missing/loading states
- Automatic dark mode detection and switching
- Fallback to generated logos if custom not provided
- Converts virtual module SVGs to data URLs for browser compatibility

**Important**: Virtual module paths like `virtual:polen/branding/logo-light.svg` cannot be used directly as image sources. The component imports the SVG content and converts it to base64 data URLs.

### 5. Integration Points

#### Root Template (`src/template/routes/root.tsx`)

- Imports and uses Logo component in header
- Includes favicon meta tags pointing to generated assets

#### Build Pipeline (`src/api/vite/plugins/main.ts`)

- Branding plugin registered before other plugins
- Ensures assets available for both dev and build modes

## Data Flow

```
1. User Config (polen.config.ts)
   ├─> branding?: { favicon, logo }
   │
2. Vite Plugin (buildStart)
   ├─> Custom assets? → Copy to build/
   └─> No assets? → Generate defaults
   │
3. Build Process
   ├─> Virtual modules serve logo config/SVGs
   ├─> HTML includes favicon meta tags
   └─> Assets emitted to build output
   │
4. Runtime
   ├─> Logo component imports config
   ├─> Renders appropriate image
   └─> Handles dark mode switching
```

## File Structure

```
src/
├── api/
│   ├── config/
│   │   └── configurator.ts      # Branding config interface
│   └── vite/
│       └── plugins/
│           └── branding-simple.ts # Asset generation plugin
├── lib/
│   └── branding/
│       └── default-asset-generator.ts # Motif generation
└── template/
    ├── components/
    │   └── Logo.tsx             # Logo display component
    └── routes/
        └── root.tsx             # Favicon meta tags
```

## Dark Mode Strategy

The system uses two approaches for dark mode:

1. **CSS Media Queries in SVG** (favicons & generated logos)
   ```svg
   <style>
     @media (prefers-color-scheme: dark) {
       .favicon-fg { fill: hsl(227, 70%, 65%); }
     }
   </style>
   ```

2. **Separate Files** (custom logos)
   ```typescript
   logo: {
     src: './logo-light.svg',
     darkMode: './logo-dark.svg'
   }
   ```

## Generated Asset Examples

### Favicon (32x32)

- Simple geometric shape (circle, square, or diamond)
- Single color with dark/light mode variants
- Minimal design for clarity at small sizes

### Logo (100x100)

- 3-5 overlapping shapes with varied opacity
- Primary and secondary colors from generated palette
- Decorative circle border
- More complex design suitable for larger display

## Known Issues & Solutions

1. **Virtual Module URLs** - Virtual module paths cannot be used directly as image `src` attributes. The Logo component handles this by importing the SVG content and converting to data URLs.

2. **ENOENT Errors** - Vite may try to load virtual modules as files. Solution: Prefix resolved IDs with `\0` to mark them as virtual modules that shouldn't be resolved to file paths.

## Future Considerations

1. **Image Optimization** - Currently PNG/JPG files are used as-is
2. **Multiple Sizes** - Could generate various favicon sizes (16x16, 32x32, etc.)
3. **PWA Icons** - Manifest currently references non-existent 192x192 and 512x512 PNGs
4. **Caching** - Generated assets could be cached to avoid regeneration
5. **Customization** - Allow users to influence generation (colors, complexity, etc.)
6. **Performance** - Loading SVGs as modules and converting to data URLs has a small runtime cost
