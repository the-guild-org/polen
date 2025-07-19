# Pages

## Introduction

You can add pages to your developer portal by adding markdown (`.md`) or MDX (`.mdx`) files to a `pages` directory.

## Frontmatter

Pages support frontmatter for metadata configuration:

```yaml
---
hidden: true
---
```

Available fields:

- `hidden` (optional, default: `false`) - Hide the page from navigation menus while keeping it accessible via direct URL

## Routing

- A file becomes a page.
- The relative (to `pages` directory) file path becomes the web path.
- _Navigation Bar_
  - Top level pages are listed in the navigation bar.
  - Titles are auto-generated from the URL segment using title case (e.g., `get-started` → `Get Started`)
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
| `pages/foo/bar.md`    | `/foo/bar` | -                    |
| `pages/foo/bar.mdx`   | `/foo/bar` | -                    |

Note: Only top-level pages appear in the navigation bar. Nested pages (like `foo/bar.md`) are accessible via the sidebar when viewing pages in the same section.

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

### Syntax Highlighting

Code blocks support syntax highlighting via [Code Hike](https://codehike.org/) using the `github-light` theme. All languages supported by Code Hike are available, including popular ones like JavaScript, TypeScript, Python, Go, Rust, and many more.

## Document Blocks

Polen automatically enhances GraphQL document code blocks with rich interactive features when you add `interactive` to the code block's metadata (and have a [GraphQL schema configured](/guides/features/schema-reference#configuration)).

### Usage

Add `interactive` to your GraphQL code block's metadata:

````markdown
```graphql interactive
query GetPokemon($id: ID!) {
  pokemon(id: $id) {
    name
    types
    abilities {
      name
      description
    }
  }
}
```
````

### Features

When enabled, GraphQL code blocks provide:

- **Syntax Highlighting** - Full GraphQL syntax highlighting with semantic colors for:
  - Keywords (`query`, `mutation`, `fragment`, `on`)
  - Type names and field names
  - Arguments and variables
  - Comments and strings

- **Hover Information** - Hover over any element to see:
  - Type information and descriptions
  - Field types and arguments
  - Return types and nullability
  - Links to full reference documentation

- **Click to Pin** - Click on valid types/fields to:
  - Pin tooltips open for detailed exploration
  - Keep multiple tooltips open simultaneously
  - Navigate via links in pinned tooltips

- **Navigation** - Click links in tooltips to navigate to:
  - Type reference documentation
  - Field documentation with anchors
  - Related types and interfaces

- **Error Detection** - Invalid fields are:
  - Underlined with wavy red lines
  - Show "← No such field" inline hints
  - Display helpful popovers listing available fields in SDL format
  - Cannot be clicked/pinned (hover-only)

### Requirements

- The code block must use `graphql` with `interactive` in the metadata
- A GraphQL schema must be configured in your Polen project
- Works in both `.md` and `.mdx` files

### Configuration

Control how Polen handles interactive blocks when no [GraphQL schema is configured](/guides/features/schema-reference#configuration). By default, Polen shows a warning indicator to help developers understand why interactive features aren't working.

```ts
export default defineConfig({
  warnings: {
    interactiveWithoutSchema: {
      enabled: false, // Disable the "No schema configured" warning
    },
  },
})
```

When `enabled` is `true` (default), blocks without schema show: "⚠️ No schema configured"

Learn more about [configuring Polen](/guides/reference/api#warnings).

### Live Examples

Explore working examples in the [Pokemon example](https://polen.js.org/examples-live/pokemon/examples):

- [Pokemon Basics](https://polen.js.org/examples-live/pokemon/examples/pokemon-basics) - Simple queries
- [Advanced Queries](https://polen.js.org/examples-live/pokemon/examples/advanced-queries) - Complex patterns
- [Error Handling](https://polen.js.org/examples-live/pokemon/examples) - Invalid field detection

## MDX

MDX begins where Markdown ends. So everything stated there such as regarding supported Markdown flavours applies here too.

MDX files (`.mdx`) allow you to use JSX/React components within your markdown content. This enables
interactive documentation with live examples, custom components, and more.

**Key points:**

- Components are available globally - no imports required
- All Radix Themes component props and variants are supported
- GraphQL code blocks can use the `interactive` metadata for rich features
- Standard markdown elements are automatically enhanced with Radix styling

Polen integrates [Radix Themes](https://www.radix-ui.com/themes/docs/overview/getting-started) components, providing a rich set of accessible UI components out of the box.

### Markdown Element Mapping

Polen automatically maps standard markdown elements to styled Radix Themes components. This automatic mapping ensures consistent styling across all your documentation without manual component usage. The mapping is as follows:

- `#` Headings 1-6 → `<Heading size="8-3">` ([Radix docs ↗](https://www.radix-ui.com/themes/docs/components/heading))
- Paragraphs → `<Text as="p">` ([Radix docs ↗](https://www.radix-ui.com/themes/docs/components/text))
- `**bold**` → `<Strong>` ([Radix docs ↗](https://www.radix-ui.com/themes/docs/components/strong))
- `*italic*` → `<Em>` ([Radix docs ↗](https://www.radix-ui.com/themes/docs/components/em))
- `` `code` `` → `<Code>` ([Radix docs ↗](https://www.radix-ui.com/themes/docs/components/code))
- `> blockquote` → `<Quote>` ([Radix docs ↗](https://www.radix-ui.com/themes/docs/components/quote))
- `[link](url)` → `<Link>` ([Radix docs ↗](https://www.radix-ui.com/themes/docs/components/link))
- `---` → `<Separator>` ([Radix docs ↗](https://www.radix-ui.com/themes/docs/components/separator))
- Tables → `<Table>` components ([Radix docs ↗](https://www.radix-ui.com/themes/docs/components/table))
- Lists → `<Box as="ul/ol">` with proper spacing ([Radix docs ↗](https://www.radix-ui.com/themes/docs/components/box))

### Available Components

Polen automatically makes the following Radix Themes components available in MDX files without needing imports:

**UI Components:**

- `Badge` - Highlight important labels and tags ([Radix docs ↗](https://www.radix-ui.com/themes/docs/components/badge))
- `Button` - Interactive buttons ([Radix docs ↗](https://www.radix-ui.com/themes/docs/components/button))
- `Callout` - Highlight important information with colored boxes ([Radix docs ↗](https://www.radix-ui.com/themes/docs/components/callout))
- `Card` - Container for grouped content ([Radix docs ↗](https://www.radix-ui.com/themes/docs/components/card))
- `DataList` - Display key-value pairs ([Radix docs ↗](https://www.radix-ui.com/themes/docs/components/data-list))
- `Tabs` - Create tabbed content sections ([Radix docs ↗](https://www.radix-ui.com/themes/docs/components/tabs))
- `Tooltip` - Show additional information on hover ([Radix docs ↗](https://www.radix-ui.com/themes/docs/components/tooltip))

**Typography Components:**

- `Heading` - Section headings with sizes 1-9 ([Radix docs ↗](https://www.radix-ui.com/themes/docs/components/heading))
- `Text` - Body text with various sizes and weights ([Radix docs ↗](https://www.radix-ui.com/themes/docs/components/text))
- `Code` - Inline code snippets ([Radix docs ↗](https://www.radix-ui.com/themes/docs/components/code))
- `Quote` - Blockquotes ([Radix docs ↗](https://www.radix-ui.com/themes/docs/components/quote))

All standard markdown elements are automatically styled using these Radix components with proper spacing.

### Examples

#### Callouts for Important Information

```mdx
<Callout>
  Default callout for general information.
</Callout>

<Callout type="info">
  **Note:** This is an informational callout.
</Callout>

<Callout type="warning">
  **Warning:** Pay attention to this!
</Callout>
```

#### Interactive Tabs

````mdx
<Tabs.Root defaultValue="query">
  <Tabs.List>
    <Tabs.Trigger value="query">Query</Tabs.Trigger>
    <Tabs.Trigger value="mutation">Mutation</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="query">
    ```graphql interactive
    query GetPokemon($id: ID!) {
      pokemon(id: $id) {
        name
        types
      }
    }
    ```
  </Tabs.Content>
  <Tabs.Content value="mutation">
    ```graphql
    mutation UpdatePokemon($id: ID!, $name: String!) {
      updatePokemon(id: $id, name: $name) {
        id
        name
      }
    }
    ```
  </Tabs.Content>
</Tabs.Root>
````

#### Data Lists and Badges

```mdx
<DataList.Root>
  <DataList.Item>
    <DataList.Label>Status</DataList.Label>
    <DataList.Value>
      <Badge color="green">Active</Badge>
    </DataList.Value>
  </DataList.Item>
  <DataList.Item>
    <DataList.Label>Version</DataList.Label>
    <DataList.Value>2.0.0</DataList.Value>
  </DataList.Item>
</DataList.Root>
```

#### Cards for Grouped Content

```mdx
<Card>
  <Heading size="3">Feature Highlight</Heading>
  <Text>Cards provide visual grouping for related content.</Text>
  <Button size="1">Learn more</Button>
</Card>
```

#### Buttons and Tooltips

```mdx
<Button>Default</Button>
<Button variant="soft">Soft</Button>
<Button variant="solid">Solid</Button>

<Tooltip content="This is helpful information!">
  <Button>Hover for tooltip</Button>
</Tooltip>
```
