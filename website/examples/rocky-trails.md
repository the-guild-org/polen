# Rocky Trails Example

[**View Live Demo** →](https://polen.js.org/examples-live/rocky-trails/)

Explore Polen's revision-based changelog capabilities with the Rocky Mountain Trails API. This example demonstrates how Polen handles schema evolution through date-based revisions without versioning.

## What Makes This Example Unique

Unlike our other examples, Rocky Trails showcases:

- **Single Schema, Multiple Revisions**: Evolution through dated revision files without version directories
- **Automatic Changelog Generation**: Polen tracks changes between each revision automatically
- **Real-World Domain**: Canadian Rocky Mountains trail planning with weather, routing, and difficulty ratings
- **Progressive Enhancement**: See how an API grows from basic trails to comprehensive trip planning

## Key Features

- **5 Schema Revisions**: Track the API evolution from January to November 2024
- **Date-Based Organization**: Clean `YYYY-MM-DD.graphql` file naming
- **Rich Domain Model**: Places, trails, weather, difficulty ratings, and route planning
- **Branching Trails**: Demonstrates complex type relationships and interfaces
- **Interactive Documentation**: Full Polen features including reference docs and changelog

## Schema Evolution Timeline

### January 15, 2024 - Foundation

- Basic `Place` and `Trail` types
- Simple point-to-point trail connections
- GPS coordinates and elevation data

### March 20, 2024 - Weather Integration

- Added current weather conditions
- 7-day forecast capabilities
- Trail-specific weather reporting

### June 10, 2024 - Difficulty & Terrain

- Comprehensive difficulty rating system
- Terrain type classification (boulder fields, river crossings, etc.)
- Scramble classes and exposure levels
- Route finding difficulty

### August 25, 2024 - Trail Networks

- Introduced branching trails concept
- Trail connections and junctions
- Complex trail network support
- Suggested multi-day routes

### November 30, 2024 - Trip Planning

- Intelligent route finding between places
- Multi-day trip planning with itineraries
- Campsite and water source tracking
- Emergency exit points
- User trip reports

## Run Locally

```bash
git clone https://github.com/the-guild-org/polen.git
cd polen
pnpm install

# Run the Rocky Trails example
cd examples/rocky-trails
pnpm dev
```

## Key Files

- `polen.config.ts` - Configuration using directory source for revisions
- `schema/` - Directory containing date-prefixed revision files
- `schema/2024-01-15.graphql` - Initial schema with basic trails
- `schema/2024-11-30.graphql` - Latest revision with full trip planning
- `pages/` - Custom documentation pages about the API

## Configuration Pattern

This example uses the `directory` source with date-prefixed files:

```ts
export default defineConfig({
  name: 'Rocky Mountain Trails API',
  schema: {
    useSources: ['directory'],
    sources: {
      directory: {
        path: './schema',
      },
    },
  },
})
```

Polen automatically:

- Detects revision files by date prefix
- Generates changelogs between revisions
- Creates a timeline of schema evolution
- Tracks breaking and non-breaking changes

## Learning Points

1. **Revision-Based Evolution**: See how APIs can evolve through revisions without formal versioning
2. **Changelog Generation**: Understand how Polen detects and categorizes changes
3. **Domain Modeling**: Learn from a rich, real-world GraphQL schema design
4. **Progressive Enhancement**: Watch an API grow from simple to complex

## Source Code

Check out the [source code on GitHub](https://github.com/the-guild-org/polen/tree/main/examples/rocky-trails) to see the complete implementation.
