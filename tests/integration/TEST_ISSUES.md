# Integration Test Issues

## Example Validation Failures

As of PR #139 (https://github.com/the-guild-org/polen/pull/139), integration tests are experiencing validation errors during the Polen build process. These errors appear as:

```
examples-validation found 44 errors:
✗ 1. Example "schema" has validation errors: The "Query" definition is not executable.
✗ 2. Example "catch-pokemon" has validation errors: Unknown type "ID".
...
```

### Root Cause

These validation errors occur when Polen processes example GraphQL documents during the build. The errors are not directly related to the circular dependency fix implemented in PR #139, but are pre-existing issues with the example validation system.

### Affected Tests

The validation errors affect integration tests that rely on Polen's example processing, particularly:

- Tests that use GraphQL documents with schemas
- Tests that process multiple example files
- Tests that validate GraphQL queries against schemas

### Temporary Workaround

Until the underlying example validation issue is resolved, these errors may cause integration test failures in CI. The core functionality (circular dependency resolution) has been verified to work correctly through unit tests and build verification.

### Related Issues

- PR #139: Removed mask library and resolved circular dependency between document and version-coverage modules
- The validation system may need updates to properly handle the new module structure

## Future Resolution

To properly fix these issues:

1. Review the example validation logic in `src/api/examples/diagnostic/validator.ts`
2. Ensure proper schema resolution for versioned and unversioned documents
3. Update integration test fixtures to provide valid GraphQL schemas and examples
