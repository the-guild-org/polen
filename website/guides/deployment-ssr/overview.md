# Deployment (SSR)

Polen can generate a traditional serverful app (Node.js) with server-side rendering for good SEO and performance.

## Building

```sh
npx polen build --architecture ssr
```

This creates a self-contained Node.js app in the `build/` directory.

## Running

Just use NodeJS. By default listens on port 3000.

```sh
node build/app.js
```

### Environment Variables

#### `PORT`

Optionally set the port the server listens on. Overrides port [build configuration](/guides/features/configuration) if given. Example:

```sh
PORT=8080 node build/app.js
```

## Platform Targets

The generated app is a standard Node.js app. One easy way to deploy is with docker or similar combined with a containerized hosting platform, e.g.:

- [Railway](https://railway.app)
- [Heroku](https://heroku.com)
- [Fly](https://fly.io)

## Future Features

Polen will eventually have serverful features like user context integration. Currently there are no particular advantages over static generation, so we generally recommend using the [SSG build](/guides/deployment-ssg/overview) which gives you more deployment options and better runtime performance.
