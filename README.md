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
import { Polen } from "polen";

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
      content: `**Content from [Polen](https://github.com/the-guild-org/polen)**.`,
    },
  ],
});
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
import { Polen } from "polen";

export default Polen.defineConfig({
  schema: {
    useDataSources: `memory`,
    dataSources: {
      memory: {
        versions: [
          {
            date: new Date("2023-01-13"),
            value: `type Query { hello: String }`,
          },
        ],
      },
    },
  },
});
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

#### Markdown Pages

Standard markdown files (`.md`) are supported and will be rendered as HTML using [Marked](https://marked.js.org/).

Marked supports the following "flavours". For more details refer to [their docs](https://marked.js.org/).

- [Markdown 1.0](https://daringfireball.net/projects/markdown/) (100% compliant)
- [CommonMark 0.31](https://spec.commonmark.org/0.31/) (98% compliant)
- [GitHub Flavored Markdown 0.29](https://github.github.com/gfm/) (97% compliant)

If you're new to Markdown, here are some great resources to get started:

- **[CommonMark Tutorial](https://commonmark.org/help/)** - Interactive 10-minute tutorial
- **[Markdown Guide](https://www.markdownguide.org/)** - Comprehensive reference and cheat sheets
- **[Marked Documentation](https://marked.js.org/)** - Documentation for the markdown parser used by Polen

Common features include:

- Headers, paragraphs, and line breaks
- Bold, italic, and code formatting
- Lists (ordered and unordered)
- Links and images
- Code blocks with syntax highlighting
- Tables
- Blockquotes
- Horizontal rules
- Strikethrough text

#### MDX Pages

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

### Package

#### ESM

Polen is an ESM only package. If you are using CJS, then you need
[NodeJS version `>=22.0.0` to `require` it](https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require).

#### Exports

You can import a `Polen` namespace from `polen`. You can import its bare exports
from `polen/polen`.

```ts
import { Polen } from "polen";
import { defineConfig } from "polen/polen";

console.log(Polen.defineConfig === defineConfig); // true
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
