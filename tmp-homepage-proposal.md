# Homepage Reorganization Proposal

## Current Structure

- Hero section
- 8 feature boxes all at the same level

## Proposed Structure

### 1. Enhanced Hero Section

Keep the current hero but add a brief paragraph explaining Polen's core value:

```markdown
---
layout: home

hero:
  name: "Polen"
  text: "GraphQL Developer Portals"
  tagline: A framework for building delightful GraphQL developer portals by The Guild
  image:
    src: /logo.svg
    alt: Polen Logo
  actions:
    - theme: brand
      text: Get Started
      link: /overview/get-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/the-guild-org/polen
---

## Turn Your GraphQL Schema into Beautiful Documentation

Polen automatically generates interactive API documentation from your GraphQL schema. No manual work required - just point Polen at your schema and get a fully-featured developer portal with schema reference, changelog tracking, and customizable pages.

Perfect for teams who want to provide excellent API documentation without the maintenance burden.
```

### 2. Two-Section Feature Organization

**Section 1: Core Features** (What Polen does out of the box)

- Schema Reference - Interactive schema explorer
- Schema Changelog - Automatic change tracking
- Zero Configuration - Works with any GraphQL schema

**Section 2: Customization & Advanced** (How you can extend it)

- Custom Pages - Add guides, tutorials, examples
- Multiple Architectures - SSG, SSR, or SPA
- API Integration - Use as CLI or build API

### 3. Remove These Boxes

- "User & Project Context" - Too technical/future-focused
- "DX" - Can be mentioned in text but not a primary selling point

### Implementation in VitePress

Since VitePress home layout doesn't support sections natively, we could:

1. **Option A**: Use custom HTML in the markdown after the frontmatter:

```html
<div class="vp-home-features-section">
  <h2>Core Features</h2>
  <div class="vp-features">
    <!-- Feature boxes -->
  </div>
</div>

<div class="vp-home-features-section">
  <h2>Extend & Customize</h2>
  <div class="vp-features">
    <!-- Feature boxes -->
  </div>
</div>
```

2. **Option B**: Create a custom home component that extends VitePress's default
3. **Option C**: Keep single features section but reorder to put core features first

What do you think of this approach?
