# Logo

## Introduction

Polen supports theme-aware logos that automatically adapt to light and dark modes. You can provide logos in two ways:

1. **Single Logo** - Provide one logo that automatically inverts for dark mode
2. **Theme-Specific Logos** - Provide separate logos optimized for each theme

## Single Logo (Default)

Place a `logo.svg` file (or other supported format) in your project's `public` directory:

```
public/
  logo.svg
```

By default, Polen assumes your logo is designed for light backgrounds (dark/black graphics). When users switch to dark mode, the logo will automatically be inverted.

### Customizing Logo Behavior

If your logo is designed for dark backgrounds (light/white graphics), you can configure this in your `polen.config.ts`:

```typescript
export default defineConfig({
  branding: {
    logoDesignedFor: 'dark', // Logo will be inverted in light mode
  },
})
```

## Theme-Specific Logos (Recommended)

For the best visual results, provide separate logos optimized for each theme:

```
public/
  logo-light.svg  # Logo FOR light mode (typically dark graphics)
  logo-dark.svg   # Logo FOR dark mode (typically light graphics)
```

**Important:** The suffix indicates which theme the logo is designed FOR, not the color of the logo itself:

- `logo-light.*` = Used when theme is light mode
- `logo-dark.*` = Used when theme is dark mode

When both files are present, Polen will automatically use the appropriate logo for the current theme without any filters or transformations.

## Supported Formats

Polen supports the following image formats for logos:

- SVG (recommended for scalability)
- PNG
- JPG/JPEG
- WebP

## Configuration Reference

```typescript
export default defineConfig({
  branding: {
    /**
     * Specifies which theme mode the single logo file is designed for.
     * Only applies when using a single logo file.
     * Ignored when both logo-light and logo-dark are provided.
     *
     * @default 'light'
     */
    logoDesignedFor: 'light' | 'dark',
  },
})
```

## Examples

### Dark Logo on Light Background (Default)

```
public/
  logo.svg  # Black/dark graphics
```

No configuration needed - Polen assumes this by default.

### Light Logo on Dark Background

```
public/
  logo.svg  # White/light graphics
```

```typescript
// polen.config.ts
export default defineConfig({
  branding: {
    logoDesignedFor: 'dark',
  },
})
```

### Optimized Logos for Each Theme

```
public/
  logo-light.png  # Dark graphics for light mode
  logo-dark.png   # Light graphics for dark mode
```

No configuration needed - Polen automatically uses the appropriate logo.
