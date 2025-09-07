# Integration Test Issues

## Example Validation Errors in Pokemon Example

The Pokemon example project (`examples/pokemon/`) contains GraphQL documents with validation errors. These are legitimate issues in the example's GraphQL files that need to be fixed.

### Current Validation Errors

When running example tests that use the Pokemon project, Polen correctly validates the GraphQL documents against the schema and reports errors such as:

```
examples-validation found 44 errors:
✗ Example "catch-pokemon" has validation errors: Unknown type "ID".
✗ Example "get-pokemon" has validation errors: Unknown type "ID".
...
```

### Root Cause

The Pokemon example's GraphQL schema files do not define the `ID` scalar type, which is a built-in GraphQL type. The example's GraphQL documents use `ID` type in their queries and mutations, but the schema files don't include this scalar definition.

### Test Isolation Status

**RESOLVED**: The test isolation issues have been fixed:

1. Fixed runtime error in validator's `parseDocumentSafe` function
2. Updated `getConfigInputDefaults` to use the correct base directory instead of `process.cwd()`

Tests are now properly isolated and run in their temporary directories. The validation errors seen are from the actual example projects being tested, not from Polen's own `/examples/` directory.

### To Fix the Validation Errors

1. Add built-in scalar definitions to the Pokemon schema files:
   - `scalar ID`
   - Any other missing built-in scalars used in the documents
2. Ensure all types referenced in the example GraphQL documents are defined in the schema
3. Fix any executable/non-executable schema issues (e.g., Query types marked as non-executable)

### Integration Tests Status

- **Page tests**: ✅ Passing
- **Schema tests**: ✅ Passing
- **Example tests**: ⚠️ Show validation warnings but don't fail (expected behavior for invalid GraphQL documents)
