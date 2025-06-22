---
description: This is a hidden page that won't appear in navigation
hidden: true
---

# Hidden Page Example

This page demonstrates the `hidden` front matter field. While this page won't appear in the navigation or sidebar, it's still accessible if you know the direct URL.

## Use Cases for Hidden Pages

- Internal documentation
- Work-in-progress pages
- Pages accessible only via direct links
- Archive content

## How It Works

By setting `hidden: true` in the front matter, Polen excludes this page from:

1. The main navigation bar
2. Sidebar navigation
3. Any automatically generated page lists

However, the page is still:

- Built and deployed
- Accessible via its URL (`/internal/hidden-example`)
- Indexed by search engines (unless you add additional meta tags)
