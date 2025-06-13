# Custom Favicon/Logo Design for Polen

## Executive Summary

This document outlines the design for allowing Polen users to provide custom favicons and logos for their developer portals. The solution should support multiple formats, provide good defaults, and integrate seamlessly with the existing build system.

## Requirements

1. Support common image formats (PNG, SVG, ICO, JPG/JPEG)
2. Generate appropriate favicon sizes for different platforms
3. Allow logo usage in navigation/header
4. Provide sensible defaults when not specified
5. Hot reload in development mode
6. Optimize images during build

## Architecture Overview

### Configuration Interface

```typescript
// polen.config.ts
export default defineConfig({
  branding: {
    favicon: './assets/favicon.png', // or .ico, .svg
    logo: {
      src: './assets/logo.svg',
      alt: 'My GraphQL API',
      height: 40, // optional, in pixels
      darkMode: './assets/logo-dark.svg' // optional
    }
  }
})
```

### Alternative: Simple String Format

```typescript
export default defineConfig({
  favicon: './assets/favicon.ico',
  logo: './assets/logo.svg'
})
```

## Implementation Approach

### Phase 1: Favicon Support

#### 1.1 File Detection and Loading
- Support paths relative to config file
- Accept: `.ico`, `.png`, `.svg`, `.jpg`/`.jpeg`
- Use Vite's asset handling for optimization

#### 1.2 Favicon Generation Pipeline
```typescript
// lib/favicon/favicon-generator.ts
interface FaviconSizes {
  '16x16': boolean
  '32x32': boolean
  '48x48': boolean
  '180x180': boolean  // Apple touch icon
  '192x192': boolean  // Android
  '512x512': boolean  // PWA
}
```

#### 1.3 HTML Injection
```html
<!-- Generated in head -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
```

### Phase 2: Logo Support

#### 2.1 Logo Component
```tsx
// template/components/Logo.tsx
interface LogoProps {
  config: LogoConfig
  className?: string
}

export const Logo: React.FC<LogoProps> = ({ config, className }) => {
  const { colorMode } = useColorMode()
  const src = colorMode === 'dark' && config.darkMode 
    ? config.darkMode 
    : config.src
    
  return (
    <img 
      src={src} 
      alt={config.alt || 'Logo'} 
      height={config.height}
      className={className}
    />
  )
}
```

#### 2.2 Vite Plugin Integration
```typescript
// vite/plugins/branding.ts
export function brandingPlugin(config: PolenConfig): Plugin {
  return {
    name: 'polen:branding',
    
    configureServer(server) {
      // Watch favicon/logo files for changes
    },
    
    generateBundle() {
      // Generate favicon variants
      // Optimize logo images
    }
  }
}
```

## Technical Considerations

### Image Processing

**Option 1: Sharp** (Recommended)
- Pros: Fast, full-featured, handles all formats
- Cons: Native dependency
- Usage: Development dependency only

**Option 2: Browser-based (Canvas API)**
- Pros: No native deps, works everywhere
- Cons: Limited format support, slower
- Usage: Fallback option

### Build-time vs Runtime

- **Build-time**: Generate all favicon sizes during build
- **Runtime**: Serve original and let browser handle
- **Recommendation**: Build-time for production, runtime for dev

### Defaults Strategy

```typescript
const defaults = {
  favicon: [
    './public/favicon.ico',
    './favicon.ico',
    './assets/favicon.ico',
    // Fall back to Polen's default favicon
  ],
  logo: [
    './public/logo.svg',
    './logo.svg',
    './assets/logo.svg',
    // Fall back to text-based logo
  ]
}
```

## User Experience

### Development Workflow
1. User adds favicon/logo to their project
2. Updates `polen.config.ts` with paths
3. Sees immediate update in dev mode
4. Build generates optimized versions

### Error Handling
```typescript
// Clear error messages
"Favicon not found at './assets/favicon.png'. Please check the path is relative to polen.config.ts"

// Helpful warnings
"Logo image is larger than 500KB. Consider optimizing for better performance."
```

## Performance Considerations

1. **Lazy Loading**: Only process images when needed
2. **Caching**: Cache generated favicons between builds
3. **Format Selection**: Prefer modern formats (WebP, AVIF) with fallbacks
4. **Size Limits**: Warn if logos exceed reasonable size (500KB)

## Migration Path

For existing Polen users:
1. Feature is opt-in, no breaking changes
2. Existing projects continue to work with defaults
3. Add configuration when ready

## Future Enhancements

1. **PWA Support**: Generate complete PWA manifest
2. **Social Media**: Open Graph images generation
3. **Theming**: Extract brand colors from logo
4. **SVG Optimization**: Built-in SVGO support
5. **Image CDN**: Optional CDN upload for logos

## Testing Strategy

1. **Unit Tests**: Image processing functions
2. **Integration Tests**: Config loading and validation
3. **E2E Tests**: Favicon visible in browser
4. **Visual Tests**: Logo rendering in different themes

## Security Considerations

1. **Path Traversal**: Validate file paths are within project
2. **File Type Validation**: Verify actual file type matches extension
3. **Size Limits**: Prevent DoS via huge images
4. **Content Security**: Sanitize SVG files

## References

- [Favicon Best Practices](https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs)
- [Vite Asset Handling](https://vitejs.dev/guide/assets.html)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)