# Pages

You can add pages to your developer portal by adding markdown (`.md`) or MDX (`.mdx`) files to a `pages` directory.

## Routing

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

## Page Ordering

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

| File                        | Route              | Sidebar Title     | Order |
| --------------------------- | ------------------ | ----------------- | ----- |
| `pages/10_get-started.md`   | `/get-started`     | `Get Started`     | 1st   |
| `pages/20_configuration.md` | `/configuration`   | `Configuration`   | 2nd   |
| `pages/30_advanced.md`      | `/advanced`        | `Advanced`        | 3rd   |
| `pages/api-reference.md`    | `/api-reference`   | `Api Reference`   | 4th   |
| `pages/troubleshooting.md`  | `/troubleshooting` | `Troubleshooting` | 5th   |

## Markdown

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

## MDX

MDX begins where Markdown ends. So everything stated there such as regarding supported Markdown flavours applies here too.

MDX files (`.mdx`) allow you to use JSX/React components within your markdown content. This enables
interactive documentation with live examples, custom components, and more.

Example MDX page:

````mdx
# Interactive Documentation

import { Tabs, Callout, GraphQLDocumentWithSchema } from "polen/components";

This page demonstrates MDX features with Polen's available components.

<Callout type="info">
  Polen provides a curated set of components for use in MDX pages.
</Callout>

## Available Components

Polen exports the following components for use in MDX pages:

- **Tabs** - Create tabbed content sections
- **Callout** - Highlight important information
- **GraphQLDocumentWithSchema** - Display GraphQL documents with schema context

## Code Examples

Here's how to use the Tabs component:

<Tabs.Root defaultValue="query">
  <Tabs.List>
    <Tabs.Trigger value="query">Query</Tabs.Trigger>
    <Tabs.Trigger value="mutation">Mutation</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="query">
    ```graphql
    query GetUser($id: ID!) {
      user(id: $id) {
        name
        email
      }
    }
    ```
  </Tabs.Content>
  <Tabs.Content value="mutation">
    ```graphql
    mutation UpdateUser($id: ID!, $name: String!) {
      updateUser(id: $id, name: $name) {
        id
        name
      }
    }
    ```
  </Tabs.Content>
</Tabs.Root>
````
