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

Your developer portal is now running at `http://localhost:3000`!

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

## Adding Examples

Create an `examples` directory and add `.graphql` files:

```graphql
# examples/hello.graphql
query HelloWorld {
  hello
}
```

Examples appear automatically on your home page. Learn more: [Examples](/guides/features/examples)

## Next Steps

- Edit `schema.graphql` to use your own GraphQL schema ([Schema Reference](/guides/features/schema-reference))
- Add your content as markdown in the `arbitrary-pages` directory ([Arbitrary Pages](/guides/features/arbitrary-pages))
- Build and deploy your portal ([Deployment (SSG)](/guides/deployment-ssg/overview), [Deployment (SSR)](/guides/deployment-ssr/overview))
