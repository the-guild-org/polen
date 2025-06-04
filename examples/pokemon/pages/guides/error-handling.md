# Error Handling

How to handle errors in the Pokemon GraphQL API.

## Error Types

### GraphQL Errors

Standard GraphQL errors appear in the `errors` array:

```json
{
  "errors": [
    {
      "message": "Pokemon not found",
      "extensions": {
        "code": "POKEMON_NOT_FOUND",
        "pokemonId": "999"
      },
      "path": ["pokemon"]
    }
  ],
  "data": {
    "pokemon": null
  }
}
```

### Common Error Codes

- `POKEMON_NOT_FOUND` - The requested Pokemon doesn't exist
- `UNAUTHORIZED` - Missing or invalid API key
- `RATE_LIMITED` - Too many requests
- `INVALID_EVOLUTION` - Pokemon cannot evolve
- `INSUFFICIENT_LEVEL` - Pokemon level too low
- `TRADE_REJECTED` - Trade was declined

## Error Handling Best Practices

1. **Always check for errors**
   ```javascript
   const { data, errors } = await client.query(...)
   if (errors) {
     handleErrors(errors)
   }
   ```

2. **Use error codes for logic**
   ```javascript
   if (error.extensions.code === 'RATE_LIMITED') {
     await delay(error.extensions.retryAfter)
   }
   ```

3. **Provide user-friendly messages**
   Map technical errors to user-friendly messages

## Retry Strategies

Implement exponential backoff for transient errors:

```javascript
async function queryWithRetry(query, variables, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.query({ query, variables })
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await delay(Math.pow(2, i) * 1000)
    }
  }
}
```