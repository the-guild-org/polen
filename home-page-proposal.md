# Polen Home Page Redesign & Implementation Plan

## Executive Summary

Polen is a framework that generates developer portals for GraphQL APIs. Currently, the home page is just a placeholder. This proposal outlines how to create a **flexible, configurable home page system** that:

1. **Works out-of-the-box** with zero configuration
2. **Scales to different needs** - from simple internal APIs to complex public portals
3. **Allows progressive customization** - override what you need, keep defaults for the rest
4. **Leverages existing Polen infrastructure** - schema data, changelog, routing

The key insight: Polen users have diverse needs, so we should provide excellent defaults while allowing complete customization.

## Current State Analysis

- **Home page in Polen's template**: Currently `src/template/routes/index.tsx` renders a placeholder `<Box>home todo</Box>`. This is the default home page that every Polen-generated developer portal shows when users visit the root URL. Polen generates a full React app, and this home route is part of that generated template.

### Existing Features Polen Provides

- Robust routing system with React Router
- GraphQL schema introspection and handling
- Component infrastructure for rendering schema documentation
- Changelog generation from schema versions

### Technical Foundation

- Built with Radix UI Themes for consistent design system
- Vite-based build system with SSG/SSR support
- Example implementations demonstrating schema reference, changelog, and custom pages

## Home Page Design Philosophy

Polen is a framework that generates developer portals for GraphQL APIs. Different organizations will use it at different scales and for different purposes. The home page should be **flexible and configurable** to support various use cases while providing sensible defaults.

### Default Developer Journey Through the Portal

This describes how a developer would typically navigate through a Polen-generated portal (not just scrolling the home page, but their overall journey through the entire portal):

1. **Landing (Home Page)** → First impression, understand the API's purpose
2. **Getting Started** → Navigate to quick start guide or playground
3. **Experimentation** → Use playground to test queries
4. **Reference** → Dive into schema documentation for detailed information
5. **Production** → Access guides for authentication, rate limits, SDKs

### Home Page Scroll Experience

As developers scroll down the home page specifically, they should encounter information in order of urgency/importance:

1. **Above the fold**: Hero with clear value prop and CTAs
2. **First scroll**: Quick start code snippets
3. **Continue scrolling**: Interactive playground preview, feature highlights
4. **Bottom**: Resources, changelog updates, community links

## Configuration Philosophy for Polen Framework

Since Polen is a framework used by different organizations with varying needs, the home page implementation should follow these principles:

### Defaults vs Customization

- **Smart Defaults**: Provide a professional, functional home page out-of-the-box
- **Progressive Disclosure**: Start simple, allow complexity through configuration
- **Opt-in Features**: Advanced sections (metrics, playground) can be enabled/disabled
- **Complete Override**: Users can replace the entire home page if needed

### Use Case Examples

1. **Small Internal API**: Might only need hero + quick start
2. **Public API**: Full feature set with playground, metrics, changelog
3. **Enterprise API**: Custom branding, specific auth flows, compliance info
4. **Open Source Project**: Community focus, contribution guides, examples

## Proposed Home Page Sections

### 1. Hero Section

- **API Title & Logo** (already supported via polen.config.ts)
- **Tagline/Description** - Brief value proposition
- **Quick Actions:**
  - "Get Started" → Quick start guide
  - "Explore API" → GraphQL playground
  - "View Schema" → Reference docs
- **Live metrics** (optional): Uptime, version, last updated
- **Hero Image** (optional):
  - AI-generated contextual image based on schema analysis
  - See [AI Hero Generation Proposal](./ai-hero-generation-proposal.md) for details
  - Zero-config with free services, optional token for better quality

### 2. Social Proof Section (Optional)

- **"Used By" / "Trusted By"** - Logo carousel of prominent API consumers
- Configurable via `home.socialProof.logos` array
- Can include customer testimonials or case studies links

### 3. Social Media Highlights Section (Optional)

- **Community Buzz** - Embedded posts from X/Twitter, Bluesky, Mastodon
- **Implementation approach**:
  - X/Twitter: Use Twitter's oEmbed API or static embed codes
  - Bluesky: Use AT Protocol embed widgets (when available) or screenshots
  - Generic: Allow HTML embed codes or use react-social-media-embed library
- **Configuration**: `home.socialMedia.posts: [{ platform: 'x', id: '...' }]`
- **Privacy-conscious**: Option to show as static screenshots with links

### 4. Quick Start Section

**SDK Generation Vision**:

Polen can revolutionize GraphQL onboarding by auto-generating type-safe SDKs from the schema:

**Phase 1 - Manual Instructions** (MVP):

- Users provide their own SDK setup instructions in config
- Simple code blocks with language tabs
- Copy-paste ready snippets

**Phase 2 - Graffle Integration** (Near-term):

- Auto-generate TypeScript/JavaScript clients using Graffle
- Type-safe, zero-config client generation
- Download as npm package or copy code directly

**Phase 3 - Multi-Language Support** (Future):

- GraphQL Code Generator integration for:
  - Python (graphql-python/gql with types)
  - Go (genqlient)
  - Swift, Kotlin, etc.
- Each language gets idiomatic, type-safe client
- Polen becomes one-stop shop: "Pick your language, get your SDK"

- **Copy-paste setup** in 3 steps:
  1. Install SDK/client
  2. Configure authentication
  3. Run first query
- **Language tabs** (JavaScript, Python, Go, etc.)

**Playground & Authentication Strategy**:

Simple cases (MVP):

- `home.playground.endpoint` - basic endpoint configuration
- Public APIs work out of the box

Authentication complexity:

- **Option 1**: Config-based headers: `home.playground.headers: { 'X-API-Key': '...' }`
- **Option 2**: Auth UI in playground for entering tokens
- **Option 3**: Custom auth component injection point
- **Reality**: Each API has unique auth needs - we need flexible hooks

**Mock Data Vision**:

Built-in mocking would let developers try the API without backend:

- **GraphQL Faker**: Auto-generates realistic data from schema types
- **Implementation**: Polen bundles faker, generates mock resolvers
- **Usage**: Toggle in playground: "Use Mock Data"
- **Benefits**: Zero-friction exploration, works offline, no rate limits
- **Config**: `home.playground.mockData: { enabled: true, seed: 123 }`

**Interactive Examples** (Part of Quick Start above):

- Quick Start section includes tabs: Setup | Examples | Playground
- Example queries use existing `GraphQLInteractive` component
- Full GraphQL documents users can copy or run
- Configuration: `home.quickStart.examples: [{ query: '...', description: '...' }]`

### 5. Key Features Grid

- **Schema at a Glance:**
  - Total types, queries, mutations, subscriptions
  - Recently added/updated
- **Documentation:**
  - Guides count
  - Changelog entries
- **Developer Resources:**
  - SDKs available
  - API status (optional - requires config: `home.stats.statusEndpoint` or integration)

### 6. Recent Changes

- **Latest changelog entries** (3-5 items)
- **"View Full Changelog"** link
- **Version picker** if versioned

### 7. Resources Section

- **Quick Links:**
  - API Reference
  - Authentication Guide
  - Rate Limits
  - SDKs & Tools
- **Community:**
  - GitHub/Discord links
  - Support contact

## Implementation Steps

### Phase 1: Core Structure & Data

1. Create home page data structures (Schema types)
2. Extend polen.config.ts for home configuration
3. Create home page component architecture

### Phase 2: Hero & Quick Start

1. Implement Hero component with CTAs
2. Build Quick Start component with code snippets
3. Add language selector and copy functionality

### Phase 3: Interactive Elements

1. Integrate GraphQL playground preview
2. Add example queries system
3. Create metrics/stats components

### Phase 4: Dynamic Content

1. Pull changelog data for recent changes
2. Generate schema statistics
3. Add version awareness

### Phase 5: Polish & Customization

1. **Theme integration**: Ensure home page respects Polen's theme system (dark/light mode, color tokens from Radix UI)
2. Create animation/transitions
3. **Customization hooks examples**:
   - `beforeSection` / `afterSection` - inject custom components
   - `onPlaygroundQuery` - track playground usage
   - `transformExample` - modify example rendering
   - `renderCustomMetric` - add custom stat cards

## Technical Implementation Details

### New Files Structure

```
src/template/routes/index.tsx         # Complete rewrite
src/template/components/home/
  ├── Hero.tsx
  ├── QuickStart.tsx
  ├── ExplorerPreview.tsx
  ├── FeatureGrid.tsx
  ├── RecentChanges.tsx
  └── Resources.tsx
```

### Configuration Extension

Add `home` section to polen.config.ts with flexible, opt-in configuration:

```typescript
export default defineConfig({
  name: 'Pokemon API',
  home: {
    // Minimal config - Polen provides smart defaults
    enabled: true, // Can disable home page entirely

    // Optional: Override specific sections
    hero: {
      title: 'Pokemon GraphQL API', // Defaults to config.name
      description: 'Query Pokemon data with GraphQL', // Optional
      callToActions: [
        { label: 'Get Started', href: '/guides/quick-start' },
        { label: 'Explore API', href: '/playground' },
      ],
      before: CustomComponent, // Optional injection point
      after: AnotherComponent, // Optional injection point
    },

    // Optional: Social proof
    socialProof: {
      title: 'Trusted By',
      logos: [
        'Company A', // Auto-looks for /logos/company-a.svg
        { name: 'Company B', src: '/custom/path.svg' }, // Or specify custom path
        { name: 'Company C', src: '/logos/company-c.svg', href: 'https://...' },
      ],
      before: null, // Optional injection points
      after: null,
    },

    // Optional: Quick start section with playground
    quickStart: {
      // No enabled field needed - presence of object means enabled
      tabs: ['setup', 'examples', 'playground'], // Choose which tabs to show
      setup: {
        steps: [
          {
            title: 'Install Client',
            code: 'npm install @apollo/client graphql',
          },
          {
            title: 'Configure',
            code: `const client = new ApolloClient({
  uri: 'https://api.pokemon.com/graphql'
})`,
          },
          {
            title: 'Query',
            code: `const { data } = await client.query({
  query: GET_POKEMON
})`,
          },
        ],
        languages: ['javascript', 'typescript', 'python', 'go'],
      },
      // Examples can be auto-discovered from examples/ directory
      // File: examples/get-pokemon.graphql → title: "Get Pokemon"
      examples: 'auto', // Or explicit array: [{ title: '...', query: '...' }]
      playground: {
        endpoint: 'https://api.pokemon.com/graphql', // Required if playground enabled
        useMockData: false, // Optional: use auto-generated mock data
        defaultQuery: '{ pokemons { name } }',
      },
      before: null, // Optional injection points for all sections
      after: null,
    },

    // Sections can be boolean (enable/disable) or object (configure)
    // Missing sections use smart defaults
    socialMedia: false, // Disable social media section
    stats: true, // Enable with defaults
    changelog: {
      limit: 5,
      showVersions: true,
      before: CustomChangelogHeader,
    },
    resources: true, // Enable with defaults
  },
  schema: {
    // existing schema config
  },
})

// Minimal config example - Polen handles the rest
export default defineConfig({
  name: 'My API',
  schema: {/* ... */},
  // No home config = sensible defaults
})
```

### Data Integration Points

- **Catalog System**: Leverage existing catalog for schema statistics
- **Changelog Data**: Use existing changelog system for recent changes
- **Version Support**: Handle both versioned and unversioned schemas
- **Virtual Modules**: Use Polen's virtual module system for data injection

### Component Architecture

#### Hero Component

```typescript
interface HeroProps {
  title: string
  description?: string
  ctaButtons: Array<{
    label: string
    href: string
    variant?: 'primary' | 'secondary'
  }>
}
```

#### Quick Start Component

```typescript
interface QuickStartProps {
  steps: Array<{
    title: string
    description?: string
    code: string
    language?: string
  }>
  languages: string[]
  onTryNow?: () => void
}
```

#### Feature Grid Component

```typescript
interface FeatureGridProps {
  stats?: {
    types: number
    queries: number
    mutations: number
    subscriptions: number
  }
  customCards?: Array<{
    title: string
    description: string
    icon?: React.ReactNode
    href?: string
  }>
}
```

## Design Principles

### Configuration Philosophy

1. **Progressive Disclosure**: Start simple, add complexity as needed
2. **Smart Defaults**: Missing config = sensible defaults
3. **Flexible Types**: Sections can be `boolean | object | 'auto'`
4. **Injection Points**: Every section has `before` and `after` hooks
5. **Auto-discovery**: Examples from `examples/` dir, logos from `/logos/`

### Implementation Principles

- **Type-safe** - Full TypeScript with Effect Schema
- **Performance** - SSG/SSR ready with Vite
- **Zero maintenance** - Auto-updates with schema changes
- **Extensible** - Hook system allows custom components

## Open Questions Still to Address

1. **Metrics & Analytics**
   - What metrics are most valuable to show?
   - Real-time vs cached data?

2. **Mobile Experience**
   - Responsive design priorities?
   - Mobile-specific features?

3. **Internationalization**
   - Multi-language support needed?
   - RTL considerations?

## Developer Portal Competitive Analysis

### Research Methodology

Analyzed 9 leading developer portals to identify common patterns and best practices:

- Salesforce, OpenAI, Miro, Stripe, Plaid, Klaviyo, Anthropic, Notion, Highnote

### Feature Matrix

| Feature                   | Salesforce | OpenAI    | Miro     | Stripe    | Plaid     | Klaviyo   | Anthropic | Notion    | Highnote  |
| ------------------------- | ---------- | --------- | -------- | --------- | --------- | --------- | --------- | --------- | --------- |
| Hero section with tagline | ✓          | ✓         | ✗        | ✗         | ✓         | ✓         | ✓         | ✓         | ✓         |
| Quick start guide         | ✗          | ✓         | ✗        | ✓         | ✓         | ✗         | ✓         | ✓         | ✗         |
| Code examples on home     | ✗          | ✓         | ✗        | ✓         | ✓         | ✓         | ✓         | ✓         | ✓         |
| Interactive playground    | ✗          | ✓         | ✗        | ✓         | ✗         | ✗         | ✗         | ✗         | ✗         |
| API reference links       | ✗          | ✓         | ✗        | ✓         | ✓         | ✓         | ✓         | ✓         | ✓         |
| SDK/library downloads     | ✗          | ✓         | ✗        | ✓         | ✓         | ✓         | ✓         | ✓         | ✓         |
| Authentication info       | ✗          | ✓         | ✗        | ✓         | ✓         | ✓         | ✓         | ✓         | ✓         |
| Search functionality      | ✗          | ✓         | ✓        | ✓         | ✓         | ✓         | ✓         | ✓         | ✓         |
| Language selector         | ✗          | ✓         | ✗        | ✓         | ✓         | ✓         | ✗         | ✓         | ✓         |
| Community links           | ✗          | ✓         | ✓        | ✓         | ✓         | ✓         | ✓         | ✓         | ✗         |
| Status page               | ✗          | ✓         | ✗        | ✓         | ✓         | ✗         | ✗         | ✓         | ✗         |
| Changelog                 | ✗          | ✓         | ✗        | ✓         | ✓         | ✓         | ✓         | ✓         | ✗         |
| Use cases gallery         | ✓          | ✓         | ✗        | ✓         | ✓         | ✓         | ✓         | ✓         | ✗         |
| Customer logos            | ✗          | ✗         | ✗        | ✗         | ✗         | ✗         | ✗         | ✓         | ✓         |
| Newsletter signup         | ✓          | ✗         | ✗        | ✗         | ✗         | ✗         | ✗         | ✗         | ✗         |
| Video tutorials           | ✗          | ✗         | ✗        | ✓         | ✗         | ✗         | ✗         | ✗         | ✗         |
| Doc categories            | ✓          | ✓         | ✓        | ✓         | ✓         | ✓         | ✓         | ✓         | ✓         |
| Pricing info              | ✗          | ✓         | ✗        | ✓         | ✓         | ✓         | ✓         | ✓         | ✓         |
| Support/contact           | ✗          | ✓         | ✗        | ✓         | ✓         | ✓         | ✓         | ✓         | ✓         |
| **Total Features**        | **6/19**   | **16/19** | **3/19** | **16/19** | **15/19** | **13/19** | **13/19** | **14/19** | **11/19** |

### Feature Frequency Analysis

#### Universal Features (Present in 8-9 portals)

- **Search functionality** (9/9) - Every portal has search
- **Documentation categories** (9/9) - All organize docs hierarchically
- **API reference links** (8/9) - Standard for developer portals
- **SDK/library downloads** (8/9) - Essential for quick integration
- **Authentication/API key info** (8/9) - Critical for getting started

#### Common Features (Present in 6-7 portals)

- **Hero section with tagline** (6/9) - Sets context and value prop
- **Code examples on home page** (6/9) - Immediate code visibility
- **Language/framework selector** (6/9) - Multi-language support
- **Community links** (7/9) - Discord, GitHub, forums
- **Changelog/what's new** (7/9) - Transparency about updates
- **Use cases/examples gallery** (7/9) - Inspiration and learning
- **Pricing information** (7/9) - Upfront cost transparency
- **Support/contact options** (7/9) - Clear help pathways

#### Differentiating Features (Present in 2-5 portals)

- **Quick start guide** (5/9) - Dedicated onboarding flow
- **Interactive playground** (2/9) - Only Stripe & OpenAI
- **Status page/uptime info** (4/9) - Enterprise reliability signal
- **Customer logos/testimonials** (2/9) - Social proof (Notion, Highnote)
- **Video tutorials** (1/9) - Only Stripe has prominent videos
- **Newsletter signup** (1/9) - Only Salesforce

### Top Performers by Feature Count

1. **Stripe & OpenAI** (16/19 features) - Gold standard
2. **Plaid** (15/19 features) - Strong foundation
3. **Anthropic, Notion, Klaviyo** (13-14/19) - Solid coverage
4. **Highnote** (11/19) - Focused approach
5. **Salesforce & Miro** (6-7/19) - Legacy/minimal approach

### Key Insights for Polen

#### Must-Have Features (Based on Universal Adoption)

1. **Search** - Non-negotiable for any developer portal
2. **Organized documentation** - Clear categories and navigation
3. **API reference** - Direct access to technical details
4. **SDK/libraries** - Polen can auto-generate with Graffle
5. **Authentication guide** - Clear "how to get started"

#### High-Value Differentiators

1. **Interactive playground** - Only 22% have this; Polen can leverage GraphQL's interactive nature
2. **Auto-generated SDKs** - Polen's Graffle integration is unique
3. **Live schema stats** - Polen can auto-generate from GraphQL schema
4. **Version-aware changelog** - Polen already has this capability

#### Features to Consider

1. **Status page integration** - Shows production readiness
2. **Language selector** - Essential for multi-language SDKs
3. **Community links** - Low effort, high value
4. **Customer logos** - Social proof when available

#### Features to Skip (Low Adoption)

1. **Newsletter signup** - Only 11% adoption
2. **Video tutorials** - High maintenance, low adoption
3. **Complex animations** - Not seen in any portal

### Recommended Polen Home Page Features

Based on this analysis, Polen should include:

**Core (Must-have)**:

- Search functionality ✓
- Clear documentation categories ✓
- API reference links ✓
- Authentication/setup guide ✓
- Code examples on home page

**Differentiators (Polen advantages)**:

- Interactive GraphQL playground
- Auto-generated type-safe SDKs (Graffle)
- Live schema statistics
- Version-aware changelog

**Nice-to-have**:

- Language/framework selector
- Community links
- Status page integration
- Customer logos section

This positions Polen competitively with top-tier portals while leveraging unique GraphQL capabilities.

## Next Steps

1. Review and refine this proposal
2. Create detailed component designs/mockups
3. Define Effect Schemas for home page data
4. Implement Phase 1 (Core Structure)
5. Iterate based on feedback
