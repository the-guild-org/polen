# Schema Reference

Polen can derive schema reference documentation from your GraphQL Schema.

## Input

You can provide your GraphQL schema to Polen in various ways.

### File

Have a single `schema.graphql` SDL file in your project directory. Example:

```
schema.graphql
```

### Directory

Have a `schema` directory in your project directory with multiple versions of your schema as SDL files named using format: `YYYY-MM-DD.graphql`. Example:

```
schema/
  2023-01-13.graphql
  2020-09-26.graphql
```

This approach allows Polen to render a changelog for your schema.

### Memory

You can provide a schema to Polen in memory via configuration.

You have control to provide one or multiple schemas, with or without dates.

If no dates are given then the current time is assumed.

If you provide multiple versions then Polen can render a changelog for you.

Basic example:

```ts
// polen.config.ts
import { Polen } from 'polen'

export default Polen.defineConfig({
  schema: {
    useDataSources: `memory`,
    dataSources: {
      memory: {
        versions: [
          {
            date: new Date('2023-01-13'),
            value: `type Query { hello: String }`,
          },
        ],
      },
    },
  },
})
```

## Schema Augmentations

### Descriptions

You can append/prepend/replace descriptions of types and fields in your schema.

Any Markdown syntax in your content will be automatically rendered.

```ts
import { Polen } from 'polen'

export default Polen.defineConfig({
  templateVariables: {
    title: `GraphQL Developer Portal`,
  },
  schemaAugmentations: [
    {
      type: `description`,
      on: {
        type: `TargetType`,
        name: `Query`,
      },
      placement: `over`,
      content:
        `**Content from [Polen](https://github.com/the-guild-org/polen)**.`,
    },
  ],
})
```
