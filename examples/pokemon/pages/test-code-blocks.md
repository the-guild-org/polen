# Code Block Test Page

This page tests various code block features with syntax highlighting.

## TypeScript Example

```typescript
interface User {
  id: string
  name: string
  email: string
}

async function getUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`)
  if (!response.ok) {
    throw new Error('User not found')
  }
  return response.json()
}

// Usage
const user = await getUser('123')
console.log(user.name)
```

## GraphQL Example

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
}

type Query {
  user(id: ID!): User
  users: [User!]!
  post(id: ID!): Post
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
}
```

## JavaScript with Line Highlighting

```javascript
// This is a comment
const numbers = [1, 2, 3, 4, 5]

// Map over numbers
const doubled = numbers.map(n => n * 2)

// Filter even numbers
const evens = numbers.filter(n => n % 2 === 0)

// Reduce to sum
const sum = numbers.reduce((acc, n) => acc + n, 0)

console.log({ doubled, evens, sum })
```

## JSON Example

```json
{
  "name": "pokemon-example",
  "version": "1.0.0",
  "dependencies": {
    "graphql": "^16.0.0",
    "polen": "workspace:*"
  },
  "scripts": {
    "dev": "polen dev",
    "build": "polen build"
  }
}
```

## Bash Example

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

## CSS Example

```css
.code-block {
  position: relative;
  margin: 1rem 0;
  border-radius: 8px;
  overflow: hidden;
}

.code-block pre {
  margin: 0;
  padding: 1rem;
  overflow-x: auto;
}

/* Theme switching */
:root {
  --shiki-light: initial;
  --shiki-dark: none;
}

.dark {
  --shiki-light: none;
  --shiki-dark: initial;
}
```
