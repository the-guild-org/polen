# React Server Components (RSC) Integration in Polen

## Overview

This document captures the learnings from integrating React Server Components (RSC) into Polen using the `@hiogawa/vite-rsc` plugin and React Router's experimental RSC support.

## Key Architectural Changes

### 1. Three-Environment Architecture

RSC requires three separate build environments:

- **rsc**: React Server Components environment
- **ssr**: Server-Side Rendering environment
- **client**: Client-side hydration environment

Each environment has its own entry point and build configuration.

### 2. Entry Points

#### RSC Entry (`entry.rsc.tsx`)

- Exports `fetchServer` function that handles RSC requests
- Uses `matchRSCServerRequest` from React Router to match routes
- Renders RSC payloads using `renderToReadableStream`

#### SSR Entry (`entry.ssr.tsx`)

- Handles HTML rendering from RSC streams
- Uses `routeRSCServerRequest` to coordinate RSC and HTML responses
- Injects RSC stream into HTML for client hydration

#### Client Entry (`entry.client.tsx`)

- Hydrates the RSC payload from the server
- Uses `RSCHydratedRouter` from React Router
- Extracts RSC stream using `getRSCStream()`

### 3. Polen's Unconventional Vite Root

Polen sets the Vite root to the template directory inside the Polen package, not the user's project directory. This required:

- Using absolute paths for build output directories
- Passing `appDirectory: config.paths.framework.template.absolute.rootDir` to the React Router plugin
- Careful handling of path resolution in plugins

## React Router RSC Integration

### 1. Plugin Configuration

The `@hiogawa/vite-rsc-react-router` plugin was copied locally and adapted for Polen's needs. Key aspects:

- Generates virtual routes from `routes.ts` and `root.tsx`
- Handles RSC-specific transformations
- Manages the three-environment build process

### 2. Required File Structure

React Router RSC expects:

- `src/template/routes.ts` - Route configuration using `@react-router/dev/routes`
- `src/template/root.tsx` - Root component with specific exports
- Route files with default exports

### 3. Root Component Pattern

The `root.tsx` file must export:

- **Named export `Layout`**: Receives `{ children }` and renders the HTML structure
- **Default export**: Simply renders `<Outlet />` for route content

This pattern is required because:

- The plugin appends `?vite-rsc-css-export=Layout` to load only the Layout export
- This enables automatic CSS loading for server components
- React Router uses the default export for route hierarchy

### 4. CSS Handling

The `vite-rsc-css-export` query parameter enables:

- Automatic CSS injection for server components
- Wrapping components with CSS loading functionality
- Ensuring styles are loaded before components render

## Implementation Steps

1. **Install Dependencies**:
   - `@hiogawa/vite-plugin-rsc`
   - React Router experimental version: `0.0.0-experimental-*`

2. **Create Entry Points**:
   - Three separate entry files for rsc, ssr, and client environments
   - Each handles its specific responsibilities in the RSC flow

3. **Configure Vite**:
   - Add environments configuration for rsc, ssr, and client
   - Use absolute paths for output directories due to Polen's root setup
   - Add RSC and React Router plugins

4. **Set Up Routes**:
   - Create `routes.ts` with React Router route configuration
   - Create `root.tsx` with Layout and default exports
   - Ensure all route components have default exports

## Common Issues and Solutions

### Issue: "Cannot find 'root' file"

**Solution**: Ensure `root.tsx` exists in the appDirectory

### Issue: "The React Server Writer cannot be used outside a react-server environment"

**Solution**: Use correct imports from `@hiogawa/vite-rsc` instead of `react-server-dom-webpack`

### Issue: Client hydration errors (blank page)

**Solution**: Use `getRSCStream()` from React Router to extract the RSC payload

### Issue: Build output in wrong location

**Solution**: Use absolute paths for environment output directories

### Issue: 404 errors for routes

**Solution**: Ensure route components have default exports and routes.ts is properly configured

## Benefits of RSC in Polen

1. **Server-side data fetching**: Can directly access GraphQL schemas and data on the server
2. **Reduced bundle size**: Server components don't ship JavaScript to the client
3. **Simplified architecture**: No need for virtual modules for server-side data
4. **Better performance**: Initial page loads are faster with pre-rendered content

## Future Considerations

1. **SSG Integration**: The RSC SSG plugin needs updates to work with the new RSC architecture
2. **Schema Routes**: Need to integrate Polen's dynamic schema routes with React Router
3. **Virtual Modules**: Can potentially remove many virtual modules in favor of server components
4. **Build Optimization**: The three-environment build process may need optimization for larger projects
