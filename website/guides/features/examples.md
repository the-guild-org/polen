# Examples

## Introduction

Polen automatically discovers GraphQL examples from your `examples` directory and displays them as interactive code blocks on your home page.

## Navigation

### Navbar

When examples are present the [navbar](/guides/features/navbar) will display an examples link.

### Routes

- `/examples/{example-name}` – Individual example pages
- `/examples` – Examples overview if [index](#index) present or just redirection to your first example

## Supplying Your Examples

### File Convention

#### Unversioned Examples

Place `.graphql` files in the `examples` directory:

```
examples/
├── get-user.graphql
├── create-post.graphql
└── search-products.graphql
```

#### Versioned Examples

When using [multiple schema versions](/guides/features/schema-overview#versioning), you can author version-specific examples.

- Use version identifier in extensions
- Use keyword suffix `.default.graphql` if not all schema versions need their own variant of an example
- Versioned examples display a client-side version picker in the UI, allowing users to switch between versions

Example:

```
examples/
├── get-user.1.graphql
├── get-user.2.graphql
├── get-user.3.graphql
├── create-post.1.graphql
├── create-post.default.graphql
└── search-products.graphql
```

#### Index

You can display [arbirary content](./arbitrary-pages#markdown) on the [index page](#routes) by adding an `index.md` file in your examples directory.

Example:

```
examples/
├── index.md              # Optional: Custom overview content
├── ...
└── search-products.graphql
```
