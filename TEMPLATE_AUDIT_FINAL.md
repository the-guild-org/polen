# Polen Template System Audit & Action Plan

## Current State

Polen is a meta-framework that generates GraphQL developer portals. The template system (`src/template/`) has accumulated significant technical debt:

### Core Problems

1. **4 competing CSS systems** (Radix Themes, Swiss Grid, Swiss Sharp, inline styles)
2. **No state persistence** - user settings lost on navigation
3. **2.3MB JavaScript bundle** - should be < 600KB
4. **Complex routing logic** with no error boundaries

## Starting Point: Fix CSS First

The CSS chaos is blocking everything else. You must pick ONE approach before touching anything else.

### Decision: Radix UI Primitives + Tailwind

**Why this approach:**

- Radix Themes fights your Swiss minimalist vision
- You need full control over styling
- Smallest possible bundle size
- This is what shadcn/ui does (without the copy-paste)

**What this means:**

```typescript
// Before: Radix Themes component with built-in styles
import { Button } from '@radix-ui/themes'
<Button variant="solid" color="blue">Click</Button>

// After: Radix primitive + Tailwind
import * as Button from '@radix-ui/react-button'
<Button.Root className="bg-black text-white px-4 py-2">Click</Button.Root>
```

## Implementation Roadmap

### Week 1: CSS Migration

**Goal: Remove 3 CSS systems, keep only Tailwind**

1. **Day 1-2: Setup**
   ```bash
   npm remove @radix-ui/themes
   npm add -D tailwindcss @radix-ui/react-primitive
   ```
   - Configure Tailwind with your Swiss design tokens
   - Create base CSS with variables only

2. **Day 3-4: Component Migration**
   - Start with smallest components (Button, Badge, Link)
   - Replace Radix Themes with Radix Primitives + Tailwind
   - Delete Swiss Grid and Swiss Sharp CSS files

3. **Day 5: Clean Up**
   - Remove all inline styles
   - Verify no Radix Themes imports remain
   - Test build size (should drop 30-40%)

### Week 2: State Persistence

**Goal: User preferences persist across sessions**

1. **Implement Zustand with persistence:**
   ```typescript
   const usePolenStore = create(
     persist(
       (set) => ({
         theme: 'light',
         codeBlockExpanded: false,
         schemaFilters: {},
       }),
       { name: 'polen-preferences' },
     ),
   )
   ```

2. **Remove Valtio and Context patterns**
3. **Handle SSR hydration properly**

### Week 3: Performance

**Goal: Reduce bundle to < 600KB**

1. **Code splitting:**
   ```typescript
   // Lazy load heavy components
   const GraphQLInteractive = lazy(() => import('./GraphQLInteractive'))
   ```

2. **Move TreeSitter to Web Worker:**
   ```typescript
   // Stop loading 800KB WASM in main bundle
   const parser = new Worker('./treesitter.worker.js')
   ```

3. **Split GraphQLInteractive component** (400+ lines → 3 focused components)

### Week 4: Routing & Polish

**Goal: Clean architecture, error handling**

1. **Simplify route generation:**
   ```typescript
   // Clean declarative routing
   const routes = buildRoutes({
     home: config.home.enabled,
     reference: config.schema?.enabled,
     examples: config.examples?.enabled,
   })
   ```

2. **Add error boundaries at route level**
3. **Performance monitoring and testing**

## Design System

### Swiss Minimalist Variables

```css
:root {
  /* Typography */
  --font-sans: 'Inter', system-ui;
  --font-mono: 'JetBrains Mono', monospace;
  --text-xs: 0.75rem;
  --text-base: 1rem;
  --text-xl: 1.5rem;

  /* Colors - Minimal palette */
  --white: #ffffff;
  --black: #000000;
  --gray: #f5f5f5;
  --accent: #0066ff;

  /* Layout */
  --radius: 0; /* Sharp corners */
  --border: 1px solid rgba(0,0,0,0.1);
}
```

### Tailwind Config

```javascript
module.exports = {
  content: ['./src/template/**/*.tsx'],
  theme: {
    extend: {
      colors: {
        background: 'var(--white)',
        foreground: 'var(--black)',
        accent: 'var(--accent)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      borderRadius: {
        none: '0',
      },
    },
  },
}
```

## Success Metrics

### Performance

- Bundle size: 2.3MB → < 600KB
- Initial load: 3s → < 1s
- CSS size: 280KB → < 40KB

### User Experience

- Preferences persist across sessions
- Zero layout shift (CLS < 0.1)
- 60fps interactions

### Developer Experience

- Single CSS approach
- Clear state management pattern
- Maintainable component structure

## FAQ

**Q: Why not keep Radix Themes?**
A: It has built-in design opinions (rounded corners, colors, spacing) that fight your Swiss minimalist vision. You'll spend more time overriding than building.

**Q: Why not TanStack Start?**
A: Polen already implements SSR/SSG via Vite plugins. Adding another framework is redundant.

**Q: Is this a complete rewrite?**
A: No. It's surgical removal of conflicting systems and consolidation to one approach. Most component logic stays the same.

## Next Steps

1. **Today**: Delete `swiss-sharp.css` (90% commented out anyway)
2. **Tomorrow**: Set up Tailwind and start migrating first component
3. **This Week**: Complete CSS migration
4. **This Month**: Ship the complete refactor

The hardest part is the CSS migration in Week 1. Everything else becomes straightforward once you have a single, consistent styling approach.
