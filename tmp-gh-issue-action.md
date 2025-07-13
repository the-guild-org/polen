# Create GitHub Action for Polen deployment

## Description

Create and publish a GitHub Action to simplify Polen deployment to GitHub Pages. Currently users need to manually configure workflows - we should provide a reusable action.

## Requirements

- [ ] Create a composite GitHub Action that wraps Polen build and deployment
- [ ] Support common configuration options (base path, architecture, etc.)
- [ ] Include GitHub Pages deployment steps
- [ ] Publish to GitHub Marketplace
- [ ] Add documentation and examples

## Example Usage

```yaml
- uses: the-guild-org/polen-action@v1
  with:
    base-path: '/my-docs/'
    architecture: 'ssg'
```

## Benefits

- Simplifies deployment from multi-step process to single action
- Reduces configuration errors
- Provides sensible defaults
- Makes Polen more accessible to non-technical users
