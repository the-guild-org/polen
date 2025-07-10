# Deployment (SSG)

Polen supports static site generation (SSG).

Static sites can be deployed easily through a variety of static hosting service:

- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront

## CLI

Typically you would run your SSG build via the Polen CLI.

```bash
npx polen build --architecture ssg
```

SSG is the default so this works:

```bash
npx polen build
```

### Base

By default the built website expects to be hosted at the root of a domain e.g. https://foo.dev. If this is not the case for you (e.g. GitHub pages will expose your website within a path matching your repository name) then you must configure the build with `--base` to ensure website links work correctly.

```bash
# Deploy to example.com/docs/
npx polen build --base /docs/

# Deploy to example.com/v2/api/
npx polen build --base /v2/api/
```

### Rebasing

It is possible to change the base of an existing built website. One use-case for this can be if you're versioning your SSG site and want to include a path that points to the latest version. You can copy the already built site rather than having to build it twice. Learn more in [Rebasing](./rebasing.md).
