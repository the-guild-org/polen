# Home Page

Polen can automatically generate a home page for your GraphQL developer portal.

## Overview

The home page is structured as a series of sections that work together to get your users going on their projects effeciently.

Each section is configurable but with sensible defaults that are often driven by project conventions like the presence of key files. Polen maximizes automation without blocking you from escaping into a custom setup.

## Hero Section

### Overview

##### Purpose

Pique your users's interest and give a solid sense about what the API is for.

##### Elements

- Title
- Tagline
- Image
- Primary and secondary call-to-action buttons
- Schema statistics

### Image

Polen offers multiple ways to add a hero image to your home page:

1. **Convention-based** - Add your own image file
2. **AI-generated** - Let Polen create one for you based on your GraphQL schema

#### Convention-Based (Manual)

Polen looks for a `hero.<format>` file in `public/` where `<format>` is one of `svg`, `png`, `jpg`, `jpeg`, or `webp`.

**Dimensions:**
- Recommended: **1200x400px** (3:1 aspect ratio)
- The image will scale responsively on all screen sizes

#### AI-Generated

Polen can automatically generate contextually relevant hero images by analyzing your GraphQL schema and using [Pollinations AI](https://pollinations.ai) - a free, open-source AI image generation service.

##### Quick Start: CLI Generation

Generate a hero image instantly with one command:

```bash
# Generate with automatic schema analysis
px polen hero-image

# Specify a style
px polen hero-image --style futuristic

# Provide custom prompt
px polen hero-image --prompt "Abstract network of glowing connections"

# Generate multiple variations
px polen hero-image --variations 3
```

The CLI will:
1. Analyze your GraphQL schema
2. Detect your API domain (e-commerce, social, analytics, etc.)
3. Generate an appropriate image
4. Save it as `public/hero.png`

##### Configuration-Based Generation

Enable AI generation in your `polen.config.ts` as a smart fallback for when you don't have a custom hero image:

```ts
import { defineConfig } from 'polen/polen'

export default defineConfig({
  home: {
    hero: {
      heroImage: {
        src: '/hero.png', // Use your custom image if it exists
        ai: {
          enabled: true, // Automatically generate if src doesn't exist
        },
      },
    },
  },
})
```

This is the **recommended default configuration** - it will use your custom hero image when available, and automatically generate one when needed.

If you want to always use AI generation without checking for a manual image:

```ts
export default defineConfig({
  home: {
    hero: {
      heroImage: {
        ai: {
          enabled: true,
        },
      },
    },
  },
})
```

Customize the AI generation with additional options:

```ts
export default defineConfig({
  home: {
    hero: {
      heroImage: {
        src: '/hero.png', // Optional: your custom image
        ai: {
          enabled: true,
          style: 'modern', // see Art Styles below
          prompt: 'Custom visualization of my API', // optional
          width: 1200,
          height: 400,
        },
      },
    },
  },
})
```

##### How It Works

1. **Schema Analysis**: Polen analyzes your GraphQL schema to understand:
   - Main types and entities
   - Query/mutation patterns
   - Domain context (e-commerce, social, analytics, etc.)

2. **Prompt Generation**: Based on the analysis, Polen generates an appropriate prompt:
   - E-commerce APIs → marketplace/shopping themes
   - Social APIs → network/connection themes
   - Analytics APIs → data visualization themes
   - Gaming APIs → adventure/gaming themes

3. **Image Generation**: The prompt is sent to [Pollinations](https://pollinations.ai) for generation

##### Art Styles

Choose from various art styles:

- `modern` - Clean design with subtle gradients (default)
- `minimalist` - Flat design with simple shapes
- `abstract` - Artistic representation
- `technical` - Blueprint style with grid patterns
- `vibrant` - Bright colors and dynamic composition
- `professional` - Corporate style
- `futuristic` - Sci-fi aesthetic with neon accents
- `gradient` - Smooth gradient mesh
- `geometric` - Angular shapes and patterns

##### Examples

**E-commerce API:**
```ts
// Schema with Product, Cart, Order types
// Generates marketplace-themed imagery
{
  ai: {
    enabled: true,
    style: 'vibrant'
  }
}
```

**Analytics Dashboard:**
```ts
// Schema with Metric, Report, Dashboard types
// Generates data visualization imagery
{
  ai: {
    enabled: true,
    style: 'technical'
  }
}
```

**Custom Creative:**
```ts
{
  ai: {
    enabled: true,
    prompt: 'Abstract network of glowing connections representing GraphQL queries',
    style: 'futuristic'
  }
}
```

##### Performance

- Images are generated asynchronously during page load
- A loading skeleton is shown while generating

##### Troubleshooting

**Image Not Generating:**
1. Check that `ai.enabled` is set to `true`
2. Verify your internet connection (required for Pollinations API)
3. Check browser console for error messages

**Custom Prompt Not Working:**
Ensure your prompt is descriptive and includes:
- Visual elements (not just concepts)
- Style descriptors
- "no text" to avoid text in images

## Quick Start Section

### Overview

##### Purpose

Give your user's an understanding of how to build against your API in practice.

### Examples

(todo: link to /examples)

<!-- @claude we are missing docs for a social proof section -->

## Features Grid Section

todo
