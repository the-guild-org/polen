# Custom Favicon & Logo

Polen allows you to customize the favicon and logo for your developer portal. If you don't provide custom assets, Polen will generate unique abstract motifs based on your project.

## Configuration

Add the `branding` configuration to your `polen.config.ts` file:

```typescript
import { Polen } from 'polen'

export default Polen.defineConfig({
  branding: {
    // Custom favicon (optional)
    favicon: './assets/favicon.svg',

    // Custom logo (optional)
    logo: {
      src: './assets/logo.svg',
      darkMode: './assets/logo-dark.svg', // Optional dark mode variant
      height: 40, // Optional height in pixels
      alt: 'My API', // Optional alt text
    },
  },
})
```

### Simple Logo Configuration

You can also use a simple string path for the logo:

```typescript
branding: {
  logo: './assets/logo.svg'
}
```

## Supported Formats

### Favicon

- `.svg` (recommended - supports dark/light modes)
- `.ico`
- `.png`, `.jpg`, `.jpeg` (will be used as-is)

### Logo

- `.svg` (recommended)
- `.png`, `.jpg`, `.jpeg`
- Any web-compatible image format

## Default Generated Assets

If you don't provide custom assets, Polen generates unique minimalist abstract motifs:

- **Favicon**: A simple geometric shape with colors based on your project
- **Logo**: A more complex abstract design with multiple shapes
- Both support automatic dark/light mode switching

The generated designs are deterministic - the same project will always get the same design.

## Dark Mode Support

### SVG with CSS

For SVG files, you can include CSS media queries for automatic dark mode support:

```svg
<svg viewBox="0 0 100 100">
  <style>
    .logo-bg { fill: #ffffff; }
    .logo-fg { fill: #000000; }
    
    @media (prefers-color-scheme: dark) {
      .logo-bg { fill: #1a1a1a; }
      .logo-fg { fill: #ffffff; }
    }
  </style>
  <rect class="logo-bg" width="100" height="100"/>
  <circle class="logo-fg" cx="50" cy="50" r="30"/>
</svg>
```

### Separate Dark Mode Files

Alternatively, provide separate files for light and dark modes:

```typescript
branding: {
  logo: {
    src: './assets/logo-light.svg',
    darkMode: './assets/logo-dark.svg'
  }
}
```

## Best Practices

1. **Use SVG format** when possible for better scalability and dark mode support
2. **Optimize images** before adding them to reduce build size
3. **Test both light and dark modes** to ensure good visibility
4. **Keep logos simple** for better recognition at small sizes
5. **Use transparent backgrounds** for logos to work with different themes

## Examples

### Minimal Configuration

```typescript
// Uses generated assets
branding: {}
```

### Custom Favicon Only

```typescript
branding: {
  favicon: './assets/favicon.svg'
}
```

### Full Custom Branding

```typescript
branding: {
  favicon: './assets/favicon.ico',
  logo: {
    src: './assets/logo.png',
    darkMode: './assets/logo-dark.png',
    height: 48,
    alt: 'Pokemon API'
  }
}
```
