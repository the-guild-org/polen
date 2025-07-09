# React Server Components with Vite and React Router

This document explains how Polen uses React Server Components (RSC) with Vite and React Router based on our implementation experience.

## Architecture Overview

### Three Environments

Polen/Vite RSC uses three separate module environments, each with its own module graph:

1. **RSC Environment** - Loads modules with `react-server` condition
2. **SSR Environment** - Loads modules without `react-server` condition
3. **Client Environment** - For browser hydration and client-side rendering

Each environment has a separate entry point configured in [src/api/vite/plugins/main.ts:36-38](../src/lib/react-router-vite/plugin.ts:36-38).

### Request Flow

1. Browser makes request → Vite dev server
2. Request goes to RSC environment ([src/lib/react-router-vite/entry.rsc.tsx:12](../src/lib/react-router-vite/entry.rsc.tsx:12))
3. `matchRSCServerRequest` processes the route
4. RSC renders components to stream
5. SSR environment deserializes stream for HTML
6. Client hydrates the HTML

## Key Concepts

### Terminology Reference

#### React Terminology
- **Server Component** - Component that runs only on server (no directive needed - this is the default)
- **Client Component** - Component marked with `'use client'` directive
- **Server Function** - Async function marked with `'use server'` that can be called from client components (formerly called "Server Action")

#### React Router v7 Terminology
- **loader** - Function that fetches data before rendering (runs on server in SSR)
- **action** - Function that handles data mutations (runs on server in SSR)
- **clientLoader** - Loader that runs in the browser
- **clientAction** - Action that runs in the browser

#### How They Work Together in Our Setup
- All route components are **Server Components by default** (no directive = server)
- Routes export `Component` or `default` (not `ServerComponent` - that naming doesn't work)
- A route becomes a "client route" only when the component has `'use client'` directive
- React Router actions are NOT the same as React Server Functions

### Quick Reference: Component Types

| Type                  | Directive      | Purpose                       | Example                                                          |
| --------------------- | -------------- | ----------------------------- | ---------------------------------------------------------------- |
| **Server Component**  | None (default) | Render UI on server           | `export function Component() { ... }`                            |
| **Client Component**  | `'use client'` | Interactive UI                | `'use client'`<br/> `export function Component() { ... }`        |
| **Server Function**   | `'use server'` | Function callable from client | `'use server'`<br/> `export async function submitForm() { ... }` |

### Server vs Client Components

**IMPORTANT: Server Components are the DEFAULT** - no directive needed!

**Server Components** (default - no directive):

- Run only on server during RSC rendering
- Can be regular functions OR async functions
- Use async when you need to await data fetching
- Can access server-only resources (DB, files, etc)
- Cannot use hooks, event handlers, or browser APIs
- Smaller bundle size as code doesn't go to client
- **NO DIRECTIVE NEEDED** - components are server-side by default

**Client Components** (must be marked with `'use client'`):

- Run on both server (SSR) and client
- Can use React hooks and browser APIs
- Required for interactivity
- Example: [src/template/root.client.tsx:1](../src/template/root.client.tsx:1)
- **Polen convention**: Use `.client.tsx` suffix for clarity (e.g., `root.client.tsx`)

### Route Components and Server Components

**All route components are Server Components by default** - they run on the server unless explicitly marked as client components.

#### Standard Export Names for Routes:

- `export function Component()` - Standard route component (server by default)
- `export default function` - Alternative route component (server by default)

#### Server Component Routes (The Default):

```typescript
// ✅ These are ALL Server Component Routes (no directive = server by default)

// Non-async Server Component Route
export function Component() {
  return <div>I'm a server component route!</div>
}

// Async Server Component Route (when you need to await data)
export async function Component() {
  const data = await readFile(path)
  return <div>{data}</div>
}

// Default export also works
export default function MyRoute() {
  return <div>Also a server component route!</div>
}
```

#### Client Component Routes (Explicit Opt-in):

```typescript
// ✅ Client Component Route (explicit 'use client' directive)
'use client'

export function Component() {
  const [state, setState] = useState() // Can use hooks
  return <div>I'm a client component route!</div>
}
```

**Important Notes**:
- The export name `ServerComponent` mentioned in some React Router examples doesn't work in our setup
- Use `Component` or `default` exports instead
- All are server components by default unless marked with `'use client'`

**Directive Clarification**:

- **No directive = Server Component** (default)
- **'use client' = Client Component** (opt-in for interactivity)
- **'use server' = Server Function** (NOT for components - only for functions called from client)

Do NOT confuse 'use server' with Server Components - they are completely different concepts!

### Component Parameters

**Routes with Dynamic Segments** receive params:

```typescript
// File: reference.$type.tsx
export async function Component(
  { params }: { params: { type: string } },
) {
  const typeParam = params.type
  // ... use the param
}
```

**Routes with Multiple Dynamic Segments**:

```typescript
// File: reference.$type.$field.tsx
export async function Component(
  { params }: { params: { type: string; field: string } },
) {
  const typeParam = params.type
  const fieldParam = params.field
  // ... use the params
}
```

**Static Routes** (no dynamic segments) don't receive parameters:

```typescript
// File: index.tsx
// No directive = Server Component (default)
export async function Component() {
  // No params needed
  return <Box>Home content</Box>
}
```

**Component with Loader Data**:

```typescript
export async function loader({ request, params }) {
  const project = await loadProject(params.projectId)
  return { project }
}

export async function Component({ loaderData }) {
  return <ProjectScreen project={loaderData.project} />
}
```

**Available Props**:

- Server components can receive: `loaderData`, `actionData`, `params`, `matches`
- The availability depends on the route configuration and whether you have loaders/actions defined

### Layout vs Component Exports

React Router treats these exports differently:

**Layout Export (root.tsx ONLY)**:

- **IMPORTANT**: The `Layout` export is ONLY available in `root.tsx`
- Provides the HTML document structure (html, head, body tags)
- Wraps the entire application
- Does NOT receive props (no loaderData, params, etc)
- Used via `?vite-rsc-css-export=Layout` query for CSS injection
- Example: [src/template/root.tsx:28](../src/template/root.tsx:28)

**Component/Default Export**:

- Used in ALL route files (including layout routes)
- Receives props: `loaderData`, `actionData`, `params`, `matches`
- Standard export for route components
- Layout routes created with `layout()` helper also use Component export
- Example: [src/template/routes/page.tsx:12](../src/template/routes/page.tsx:12)

### Creating Layout Routes

For non-root layout routes, use the `Component` export with React Router's `layout()` helper:

**Layout Route File** (`routes/layout.sidebar.tsx`):
```typescript
import { Outlet } from 'react-router'
import { Sidebar } from '../components/Sidebar'

// Use Component export, NOT Layout (Layout is only for root.tsx)
export function Component() {
  return (
    <Grid columns="250px 1fr">
      <Sidebar />
      <Outlet /> {/* Child routes render here */}
    </Grid>
  )
}
```

**Route Configuration** (`routes.ts`):
```typescript
import { layout, route } from '@react-router/dev/routes'

export default [
  route('/', 'routes/index.tsx'),
  layout('routes/layout.sidebar.tsx', [
    // These routes will render inside the sidebar layout
    route('docs', 'routes/docs.tsx'),
    route('guide/*', 'routes/page.tsx'),
  ]),
] satisfies RouteConfig
```

### Middleware and Request Context

React Router's `unstable_middleware` allows access to the request object:

```typescript
export const unstable_middleware: unstable_MiddlewareFunction[] = [
  async ({ request }, next) => {
    // Access request headers, cookies, etc
    const cookieHeader = request.headers.get('Cookie')

    // Store in AsyncLocalStorage for server components
    return requestStorage.run(
      { request, theme },
      async () => await next(),
    )
  },
]
```

Reference: [src/template/root.tsx:19-30](../src/template/root.tsx:19-30)

### AsyncLocalStorage for Request Context

Since server components can't use hooks or receive the request directly, we use Node's AsyncLocalStorage:

1. Create storage: [src/template/request-context.ts:9](../src/template/request-context.ts:9)
2. Run in middleware: [src/template/root.tsx:25-28](../src/template/root.tsx:25-28)
3. Access in server components: [src/template/request-context.ts:11-17](../src/template/request-context.ts:11-17)

React Router uses this pattern internally: [node_modules/.../index-react-server.js:2129](https://github.com/remix-run/react-router/blob/dev/packages/react-router/lib/rsc/server.rsc.tsx#L45)

### CSS Injection with vite-rsc-css-export

The `?vite-rsc-css-export=Layout` query wraps the export with CSS injection:

```tsx
// Original export
export function Layout(props) {
  return <div>...</div>
}

// Transformed by vite-rsc
function __Layout(props) {
  return (
    <>
      {import.meta.viteRsc.loadCss()}
      <Layout {...props} />
    </>
  )
}
export { __Layout as Layout }
```

Reference: [@vitejs/plugin-rsc README](https://github.com/hi-ogawa/vite-plugins/tree/main/packages/react-server#idvite-rsc-css-exportname)

## Practical Patterns

### Accessing Request Data in Server Components

Three approaches:

1. **Middleware + AsyncLocalStorage** (Polen's approach):
   ```typescript
   // In middleware
   const theme = themeManager.getTheme(request.headers.get('Cookie'))
   requestStorage.run({ theme }, next)

   // In server component
   const theme = getTheme() // from AsyncLocalStorage
   ```
   Reference: [src/template/root.tsx:19-30](../src/template/root.tsx:19-30)

2. **Component Export with Loader**:
   ```typescript
   export async function loader({ request }) {
     return { theme: getThemeFromCookie(request) }
   }

   export default function Page({ loaderData }) {
     // Can access loaderData.theme
   }
   ```
   Note: Only works for Component/default exports, not Layout

3. **Client Component with useLoaderData**:
   ```typescript
   'use client'
   import { useLoaderData } from 'react-router'

   export default function Page() {
     const { theme } = useLoaderData()
   }
   ```

### Virtual Modules and Reactive Data

Polen uses virtual modules that update when data changes:

1. Virtual module provides data: `virtual:polen/project/data/navbar.jsonsuper`
2. Reactive plugin watches for changes: [src/lib/vite-plugin-reactive-data/vite-plugin-reactive-data.ts:87-93](../src/lib/vite-plugin-reactive-data/vite-plugin-reactive-data.ts:87-93)
3. Module invalidation triggers HMR: [src/lib/vite-plugin-reactive-data/vite-plugin-reactive-data.ts:139-147](../src/lib/vite-plugin-reactive-data/vite-plugin-reactive-data.ts:139-147)

Important: Each environment has its own module graph, so invalidation must target the correct environment.

### Theme Persistence Example

Complete implementation showing all concepts:

1. **Middleware reads cookie**: [src/template/root.tsx:20-22](../src/template/root.tsx:20-22)
2. **AsyncLocalStorage stores theme**: [src/template/root.tsx:25-28](../src/template/root.tsx:25-28)
3. **Server component reads context**: [src/template/root.tsx:33](../src/template/root.tsx:33)
4. **Passes to client component**: [src/template/root.tsx:46](../src/template/root.tsx:46)
5. **Client component manages state**: [src/template/contexts/ThemeContext.tsx:38-58](../src/template/contexts/ThemeContext.tsx:38-58)

## Common Pitfalls

### 1. Root Layout Doesn't Receive Props

The `Layout` export in `root.tsx` doesn't receive route props:

❌ Wrong:

```typescript
// root.tsx
export function Layout({ loaderData }) {
  // loaderData is undefined in root Layout!
}
```

✅ Correct:

```typescript
// root.tsx - Use middleware + AsyncLocalStorage
export function Layout({ children }) {
  const data = getFromContext()
}
```

Note: Regular route components (using `Component` export) DO receive props.

### 2. Module Invalidation in Wrong Environment

❌ Wrong:

```typescript
// This might invalidate in wrong environment
server.moduleGraph.invalidateModule(module)
```

✅ Correct:

```typescript
// Target specific environment
const env = server.environments[envName]
env.moduleGraph.invalidateModule(module)
```

Reference: [src/lib/vite-plugin-reactive-data/vite-plugin-reactive-data.ts:143-147](../src/lib/vite-plugin-reactive-data/vite-plugin-reactive-data.ts:143-147)

### 3. Using Hooks in Server Components

❌ Wrong:

```typescript
// Server component
export function Page() {
  const [state, setState] = useState() // Error!
}
```

✅ Correct:

```typescript
'use client'
export function Page() {
  const [state, setState] = useState() // OK
}
```

### 4. Using 'use server' for Server Components

❌ Wrong:

```typescript
'use server' // WRONG! This is for Server Actions, not Server Components

export async function Component() {
  return <div>...</div>
}
```

✅ Correct:

```typescript
// No directive = Server Component (default)
export async function Component() {
  return <div>...</div>
}
```

**Remember**:

- **Server Components** (render UI) = No directive (default)
- **Client Components** (interactive UI) = 'use client'
- **Server Functions** (callable functions) = 'use server'

### 5. Using Layout Export in Non-Root Files

❌ Wrong:

```typescript
// File: routes/layout.sidebar.tsx
export function Layout({ children }) {  // WRONG! Layout export only works in root.tsx
  return <div>{children}</div>
}
```

✅ Correct:

```typescript
// File: routes/layout.sidebar.tsx
export function Component() {  // Use Component export for layout routes
  return (
    <div>
      <Outlet />
    </div>
  )
}
```

**Remember**: Only `root.tsx` can use the `Layout` export. All other route files (including layout routes) must use `Component` or `default` exports.

### 6. Not Following Polen's File Naming Convention

While not required, Polen recommends using `.client.tsx` suffix for Client Components:

❌ Less clear:

```typescript
// File: ThemeContext.tsx
'use client'
export function ThemeContext() { ... }
```

✅ Polen convention:

```typescript
// File: ThemeContext.client.tsx
'use client'
export function ThemeContext() { ... }
```

This makes it immediately clear which components run on the client without opening the file.

## Debugging Tips

1. **Check which environment runs your code**:
   ```typescript
   console.log('Environment:', this.environment.name)
   ```

2. **Verify module resolution**:
   - Virtual modules need `\0` prefix: `'\0' + moduleId`
   - Reference: [src/lib/vite-plugin-reactive-data/vite-plugin-reactive-data.ts:105](../src/lib/vite-plugin-reactive-data/vite-plugin-reactive-data.ts:105)

3. **Monitor RSC payload**:
   - Browser DevTools Network tab
   - Look for `.rsc` requests
   - Response contains serialized React tree

4. **Enable debug logging**:
   ```typescript
   const debug = debugPolen.sub('module-name')
   debug('message', data)
   ```
   Reference: [src/template/root.tsx:12](../src/template/root.tsx:12)

## References

- [@vitejs/plugin-rsc](https://github.com/hi-ogawa/vite-plugins/tree/main/packages/react-server)
- [React Router RSC Preview](https://remix.run/blog/rsc-preview)
- [Vite Environment API](https://vitejs.dev/guide/api-environment.html)
- React Router source: Check `matchRSCServerRequest` and `getRSCRouteMatch` functions
