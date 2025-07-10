# Get Started

## Quick Start

The fastest way to get started with Polen is using the create command:

```sh
npx polen create my-graphql-docs
cd my-graphql-docs
npx polen dev
```

This will:

1. Create a new Polen project with a working example
2. Install all dependencies
3. Start the development server

Your developer portal is now running at `http://localhost:5173`!

## Manual Setup

1. Install Polen

   ```sh
   npm init
   npm add polen
   ```

1. Create a `schema.graphql` file with your GraphQL schema:

   ```graphql
   type Query {
     hello: String
   }
   ```

1. Add scripts to your `package.json`:

   ```json
   {
     "scripts": {
       "dev": "polen dev",
       "build": "polen build"
     }
   }
   ```

## Next Steps

- Edit `schema.graphql` to use your own GraphQL schema ([Schema Reference](/features/schema-reference))
- Add your content as markdown in the `pages` directory ([Pages](/features/pages))
- Build and deploy your portal ([Deployment (SSG)](/deployment-ssg/overview), [Deployment (SSR)](/deployment-ssr/overview))
