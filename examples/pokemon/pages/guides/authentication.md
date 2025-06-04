# Authentication

Learn how to authenticate with the Pokemon GraphQL API.

## API Keys

To use the Pokemon API, you'll need an API key. You can obtain one by:

1. Creating an account on our developer portal
2. Navigating to the API Keys section
3. Generating a new key

## Using Your API Key

Include your API key in the `Authorization` header:

```graphql
{
  "headers": {
    "Authorization": "Bearer YOUR_API_KEY"
  }
}
```

## Rate Limits

- **Free tier**: 1000 requests per hour
- **Pro tier**: 10000 requests per hour
- **Enterprise**: Unlimited

## Security Best Practices

- Never expose your API key in client-side code
- Rotate your keys regularly
- Use environment variables to store keys
