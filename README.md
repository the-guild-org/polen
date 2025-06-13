# Polen

A framework for delightful GraphQL developer portals ✨.

## Installation

```
npm add polen
```

## Quickstart

1. Have a `schema.graphql` GraphQL schema file in your project directory.

   ```graphql
   type Query {
     hello: String
   }
   ```

2. Build your developer portal.

   ```sh
   npx polen build
   ```

3. You now have a deployable developer portal. Try it locally
   (http://localhost:3001):

   ```sh
   node build/app.js
   ```

## Examples

You can find working examples in the [examples](./examples) directory.

### Live Demos

View our example Polen documentation sites:

- ⚡ [Pokemon GraphQL API Demo](https://the-guild-org.github.io/polen/pokemon/)
- 📚 [More demos coming soon...](https://the-guild-org.github.io/polen/)

> [!NOTE]
> These examples work against the version of Polen on trunk. Every commit on trunk is available as a pre-release on npm. You may see behaviour in the examples that has not been released in a stable version of Polen yet.

## Guide

### Schema Reference

If you [provide Polen with a schema](#providing-a-schema), Polen will
automatically render reference documentation for it.

If you provide multiple versions of your schema then the reference is based on
the schema with the latest date.

### Schema Changelog

Polen can render a changelog for your schema.

This feature is automatically enabled when you provide multiple versions of your
schema. Refer to [Provide a Schema](#providing-a-schema) for details on how to
do that.

### Schema Augmentations

#### Descriptions

You can append/prepend/replace descriptions of types and fields in your schema.

Any Markdown syntax in your content will be automatically rendered.

```ts
import { Polen } from 'polen'

export default Polen.defineConfig({
  templateVariables: {
    title: `Pokemon Developer Portal`,
  },
  schemaAugmentations: [
    {
      type: `description`,
      on: {
        type: `TargetType`,
        name: `Query`,
      },
      placement: `over`,
      content:
        `**Content from [Polen](https://github.com/the-guild-org/polen)**.`,
    },
  ],
})
```

### Providing a Schema

You can provide a GraphQL schema to Polen in various ways.

#### File

Have a single `schema.graphql` SDL file in your project directory. Example:

```
schema.graphql
```

#### Directory

Have a `schema` directory in your project directory with multiple versions of
your schema as SDL files named using format: `YYYY-MM-DD.graphql`. Example:

```
schema/
  2023-01-13.graphql
  2020-09-26.graphql
```

This approach allows Polen to render a changelog for your schema. Refer to
[Changelog](#changelog).

#### Memory

You can provide a schema to Polen in memory via configuration.

You have control to provide one or multiple schemas, with or without dates.

If no dates are given then the current time is assumed.

If you provide multiple versions then Polen can render a changelog for you.
Refer to [Changelog](#changelog).

Basic example:

```ts
// polen.config.ts
import { Polen } from 'polen'

export default Polen.defineConfig({
  schema: {
    useDataSources: `memory`,
    dataSources: {
      memory: {
        versions: [
          {
            date: new Date('2023-01-13'),
            value: `type Query { hello: String }`,
          },
        ],
      },
    },
  },
})
```

### Pages

You can add pages to your developer portal by adding markdown (`.md`) or MDX (`.mdx`) files to a
`pages` directory.

#### Routing

- A file becomes a page.
- The relative (to `pages` directory) file path becomes the web path.
- _Navigation Bar_
  - Top level pages are listed in the navigation bar.
- _Index Pages_
  - A file named `index` is an index page.
  - The file name is elided in the route. For example `foo/index.md` becomes
    route `/foo` .
  - Details:
    - If both `foo/index.md` and `foo.md` exist, then the former is used, latter
      ignored, and a warning is raised.

Example:

| File                  | Route      | Navigation Bar Title |
| --------------------- | ---------- | -------------------- |
| `pages/foo.md`        | `/foo`     | `Foo`                |
| `pages/foo.mdx`       | `/foo`     | `Foo`                |
| `pages/foo/index.md`  | `/foo`     | `Foo`                |
| `pages/foo/index.mdx` | `/foo`     | `Foo`                |
| `pages/foo/bar.md`    | `/foo/bar` | `Foo`                |
| `pages/foo/bar.mdx`   | `/foo/bar` | `Foo`                |

#### Page Ordering

You can control the order of pages in the sidebar by prefixing file names with numbers followed by `_` or `-`. The numeric prefix affects only the sidebar ordering - it does not appear in the page URL or title.

- _Syntax_
  - Format: `<number>_<name>.md` or `<number>-<name>.md`
  - Examples: `01_intro.md`, `10_getting-started.md`, `20-configuration.md`
- _Ordering_
  - Pages with numeric prefixes appear before pages without prefixes
  - Pages are sorted by their numeric value (not alphabetically)
  - Pages without prefixes are sorted alphabetically after numbered pages
- _Collisions_
  - If multiple files have the same name after removing the prefix (e.g., `10_about.md` and `20_about.md`), the file with the higher number is used
  - A warning is shown for collision conflicts

Example:

| File                          | Route              | Sidebar Title     | Order |
| ----------------------------- | ------------------ | ----------------- | ----- |
| `pages/10_getting-started.md` | `/getting-started` | `Getting Started` | 1st   |
| `pages/20_configuration.md`   | `/configuration`   | `Configuration`   | 2nd   |
| `pages/30_advanced.md`        | `/advanced`        | `Advanced`        | 3rd   |
| `pages/api-reference.md`      | `/api-reference`   | `Api Reference`   | 4th   |
| `pages/troubleshooting.md`    | `/troubleshooting` | `Troubleshooting` | 5th   |

#### Markdown

Markdown files (`.md`) are supported using [remark](https://remark.js.org/). This is the same underlying engine as [MDX](https://mdxjs.com/) thus you can rely on consistent behavior between your `.md` and `.mdx` files.

Polen supports:

- [CommonMark](https://commonmark.org/).
- [GitHub Flavored Markdown](https://github.github.com/gfm/).

In the future you will be able to extend Polen in your project with additional [Remark plugins](https://github.com/remarkjs/remark/blob/main/doc/plugins.md#list-of-plugins). Track this feature in [#64](https://github.com/the-guild-org/polen/issues/64).

If you're new to Markdown, here are some great resources to get started:

- **[CommonMark Tutorial](https://commonmark.org/help/)** - Interactive 10-minute tutorial
- **[Markdown Guide](https://www.markdownguide.org/)** - Comprehensive reference and cheat sheets
- **[GitHub's Markdown Guide](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)** - Practical guide with examples

Syntax features available to you include:

**Via CommonMark:**

- Headers, paragraphs, and line breaks
- Bold, italic, and code formatting
- Lists (ordered and unordered)
- Links and images
- Code blocks with syntax highlighting
- Blockquotes
- Horizontal rules

**Via GitHub Flavored Markdown:**

- Tables
- Task lists
- Strikethrough text
- Autolinks

#### MDX

MDX begins where [Markdown](#markdown) ends. So everything stated there such as regarding supported Markdown flavours applies here too.

MDX files (`.mdx`) allow you to use JSX/React components within your markdown content. This enables
interactive documentation with live examples, custom components, and more.

Example MDX page:

```mdx
# Interactive Documentation

import { Button } from "@radix-ui/themes";

This page demonstrates MDX features.

<Button onClick={() => alert("Hello from MDX!")}>Click me!</Button>

## Code Examples

You can mix markdown with React components for powerful documentation:

export const CodeExample = ({ language, code }) => (
  <pre>
    <code className={`language-${language}`}>{code}</code>
  </pre>
);

<CodeExample
  language="graphql"
  code={`
    query GetUser($id: ID!) {
      user(id: $id) {
        name
        email
      }
    }
  `}
/>
```

### Build

When you build you may choose between SSG and SSR. The default is SSG.

#### SSG

```sh
npx polen build --type ssg
```

Deploy the contents of the `./build` directory on your favourite static site provider.

#### SSR

In the future Polen will have features that motivate using a server, but for now there is no particular benefit. Use `SSG` instead.

#### Base Path Configuration

Polen supports deploying to subdirectories through the `build.base` configuration option. This is useful for:

- GitHub Pages project sites (e.g., `/my-project/`)
- PR preview deployments (e.g., `/pr-123/`)
- Hosting multiple Polen sites on one domain

```ts
// polen.config.ts
import { Polen } from 'polen'

export default Polen.defineConfig({
  build: {
    base: '/my-project/', // Must start and end with /
  },
})
```

When configured, Polen will output differently:

- For SSG architecture:
  - Generate static files that work in the subdirectory
- For SSR architecture:
  - A server that serrves static assets from the correct path

### Package

#### ESM

Polen is an ESM only package. If you are using CJS, then you need
[NodeJS version `>=22.0.0` to `require` it](https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require).

#### Exports

You can import a `Polen` namespace from `polen`. You can import its bare exports
from `polen/polen`.

```ts
import { Polen } from 'polen'
import { defineConfig } from 'polen/polen'

console.log(Polen.defineConfig === defineConfig) // true
```

### Instant Schema Explorer

Polen comes with a light-weight command to instantly view any GraphQL schema.

Example:

```sh
npx polen open --name github
```

See docs for more details

```sh
npx polen open --help
```

## Other

### Changelog

Refer to
[releases on this repo](https://github.com/the-guild-org/polen/releases).

### Development

If you are working on Polen itself, then refer to
[DEVELOPMENT.md](./DEVELOPMENT.md) for details about workflow, testing, etc.
