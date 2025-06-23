# GraphQL Document Component Demo

This page demonstrates the interactive GraphQL Document component that transforms static code blocks into rich, interactive documentation.

## Basic Query Example

Hover over the identifiers below to see type information and documentation. Click on types and fields to navigate to their reference pages.

```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    posts(first: 10) {
      id
      title
      content
      author {
        name
      }
    }
  }
}
```

## Mutation Example

This mutation creates a new post. Notice how the component provides information about input types and return values.

```graphql
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    content
    createdAt
    author {
      id
      name
    }
  }
}
```

## Subscription Example

Subscriptions work the same way - all GraphQL operations are fully interactive.

```graphql
subscription OnCommentAdded($postId: ID!) {
  commentAdded(postId: $postId) {
    id
    content
    author {
      name
      avatar
    }
    createdAt
  }
}
```

## Fragment Example

Fragments are also supported with full type information and navigation.

```graphql
fragment UserInfo on User {
  id
  name
  email
  profile {
    bio
    avatar
    website
  }
}

query GetUserWithFragment($id: ID!) {
  user(id: $id) {
    ...UserInfo
    posts {
      id
      title
    }
  }
}
```

## Error Handling

The component validates GraphQL against the schema and highlights errors. Try hovering over the invalid field below:

```graphql
query InvalidQuery {
  user {
    nonExistentField
    name
  }
}
```

## Plain Mode

Sometimes you want to show GraphQL without interactivity. Use the `plain` option:

```graphql plain
query SimpleQuery {
  users {
    name
  }
}
```

## Debug Mode

Enable debug mode to see the overlay boundaries:

```graphql debug
query DebugExample {
  user {
    id
    name
  }
}
```

## Features

The GraphQL Document component provides:

- **Interactive Navigation**: Click on any type or field to navigate to its reference documentation
- **Hover Tooltips**: See type information, descriptions, and deprecation warnings
- **Schema Validation**: Invalid queries are highlighted with error messages
- **Syntax Highlighting**: Beautiful syntax highlighting with Shiki
- **Smart Positioning**: Tooltips automatically position themselves to stay within the viewport
- **Accessibility**: Full keyboard navigation and screen reader support

## Configuration Options

```graphql validate=false
# This query won't be validated at build time
query {
  anything {
    goes
  }
}
```

Available options:

- `plain` - Disable all interactive features
- `debug` - Show overlay boundaries for debugging
- `validate=false` - Skip validation for this block
