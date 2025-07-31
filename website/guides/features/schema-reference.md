# Schema Reference

::: info
This page assumes basic knowledge of schema configuration and versioning concepts. See [Schema Overview](/guides/features/schema-overview) for foundational information.
:::

## Introduction

Polen will derive reference documentation for your GraphQL Schema once you've supplied it. This guide documents everything you need to know about the reference feature.

## Navigation

The reference documentation is always available through a "Reference" link in the navigation bar once you've supplied a schema. It's accessible through these URL patterns:

### Routes

- Type overview: `/reference/{type}`
- Field details: `/reference/{type}/{field}`

### Examples

```
# View the User type
/reference/User

# View the email field on the User type
/reference/User/email

# View the Query type
/reference/Query
```

## Schema Augmentations

You can enhance your schema documentation without modifying the schema itself using schema augmentations. This allows you to add implementation details, usage examples, deprecation notices, and other context to your reference documentation.

Learn more: [Schema Augmentations](/guides/features/schema-augmentations)

## Versioning

When you have multiple schema versions configured, Polen enables version-specific reference documentation. This allows you to view your GraphQL schema as it existed at any point in time.

For complete details on schema versioning including configuration and version formats, see [Schema Overview](/guides/features/schema-overview).

### Interactive Version Navigation

Polen provides both UI-based and URL-based methods for navigating between schema versions:

#### Version Picker Dropdown

When multiple schema versions are available, Polen automatically displays an interactive version picker in the reference documentation interface. This dropdown allows you to:

- Switch between any available schema version instantly
- Jump to the latest version using the "Latest" option
- Navigate to the equivalent page in the target version (when possible)

The version picker handles complex navigation scenarios intelligently:

- **Automatic Path Resolution**: If a type or field doesn't exist in the target version, Polen finds the closest equivalent page
- **Smart Notifications**: When schema elements have moved or been removed, Polen shows helpful toast notifications with options to:
  - Go back to the previous version
  - View the changelog to understand what changed
- **Seamless Experience**: Version switching preserves your current context whenever possible

#### Manual URL Navigation

You can also navigate to specific versions directly using URLs. The [basic URL structure](#navigation) shown earlier always displays the latest version. When you have multiple schema versions, you can access specific versions using an extended URL pattern:

- Type overview: `/reference/version/{version}/{type}`
- Field details: `/reference/version/{version}/{type}/{field}`

Where `{version}` can be:

- A specific date: `2024-01-15`
- The `latest` tag: `latest` (convenience tag that always points to the most recent version)

### Examples

```
# These are equivalent - both show the latest version
/reference/User
/reference/version/latest/User

# View the User type as it existed on January 15, 2024
/reference/version/2024-01-15/User

# View a specific field from that version
/reference/version/2024-01-15/User/email
```
