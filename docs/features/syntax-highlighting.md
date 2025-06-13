# Syntax Highlighting

Polen now includes built-in syntax highlighting powered by [Shiki](https://shiki.style/), providing beautiful and accurate code highlighting for your documentation.

## Features

- **100+ Languages**: Support for TypeScript, GraphQL, JavaScript, JSON, YAML, CSS, and many more
- **Tokyo Night Theme**: Beautiful dark theme by default
- **GitHub Light Theme**: Clean light theme option
- **Zero JavaScript**: Syntax highlighting happens at build time - no client-side JavaScript required
- **Line Highlighting**: Support for highlighting specific lines
- **Diff Support**: Show additions and removals in code blocks

## Usage

### Basic Code Blocks

Simply use standard markdown code blocks with language identifiers:

````markdown
```typescript
interface User {
  id: string
  name: string
}
```
````

### Supported Languages

Common languages for GraphQL development include:

- `typescript` / `ts`
- `javascript` / `js`
- `graphql` / `gql`
- `json`
- `yaml` / `yml`
- `bash` / `shell`
- `css`
- `html`
- `markdown` / `md`

### Theme Support

Polen uses CSS variables to support both light and dark themes:

- **Light Mode**: GitHub Light theme
- **Dark Mode**: Tokyo Night theme

The themes automatically switch based on the CSS class on the document root.

## Configuration

Syntax highlighting is enabled by default for all markdown content in Polen. No additional configuration is required.

### MDX Pages

Code blocks in MDX files automatically receive syntax highlighting through the rehype plugin integration.

### GraphQL Schema Descriptions

Markdown content in GraphQL schema descriptions also benefits from syntax highlighting when rendered.

## Performance

- **Build-time Highlighting**: All syntax highlighting happens during the build process
- **Singleton Highlighter**: Shared highlighter instance for optimal performance
- **Lazy Language Loading**: Only loads grammars for languages actually used

## Future Enhancements

- **Line Numbers**: Display line numbers for code blocks
- **Copy Button**: One-click code copying
- **Shiki Twoslash**: TypeScript type information on hover
- **Custom Themes**: Support for additional color themes
- **Code Block Titles**: File names or descriptions for code blocks