# Schema Changelog

::: info
This page assumes basic knowledge of schema configuration and versioning concepts. See [Schema Overview](/guides/features/schema-overview) for foundational information.
:::

## Introduction

Polen can render a changelog for your GraphQL schema [when it is versioned](/guides/features/schema-overview#versioning), showing how it has evolved over time.

When active, a "Changelog" link appears in the navigation bar.

The overall process performed by Polen goes something like this:

1. Polen reads a set of schemas (see [Schema Overview](/guides/features/schema-overview) for configuration details)
2. Orders them by date
3. Detects differences (changes) between each sequential pair (powered by GraphQL Inspector)
4. Displays in chronological order (newest at page top) one section per schema, each section displaying how it changed

## Change Types

Polen displays all GraphQL schema changes detected by GraphQL Inspector, organized into logical groups:

#### Type Changes

- **Operations** - Types added, removed, or changed in kind
- **Descriptions** - Type description modifications

#### Field Changes

- **Operations** - Fields added, removed, or type changed
- **Descriptions** - Field description modifications
- **Deprecation** - Field deprecation status changes
- **Deprecation Reasons** - Field deprecation reason modifications

#### Argument Changes

- **Operations** - Arguments added or removed
- **Modifications** - Default value or type changes
- **Descriptions** - Argument description changes

#### Enum Changes

- **Value Operations** - Enum values added or removed
- **Value Descriptions** - Enum value description changes
- **Value Deprecation** - Enum value deprecation reason changes

#### Input Type Changes

- **Field Operations** - Input fields added, removed, or type changed
- **Field Descriptions** - Input field description changes
- **Default Values** - Input field default value changes

#### Schema Composition Changes

- **Union Members** - Types added/removed from unions
- **Interface Implementations** - Objects implementing/removing interfaces
- **Directive Operations** - Directives added or removed
- **Directive Locations** - Valid directive locations modified
- **Directive Arguments** - Directive argument changes
- **Directive Usage** - Where directives are applied in the schema
- **Schema Root Types** - Query/Mutation/Subscription type changes

## Notes

### Effect on Reference Documentation

When multiple schema versions exist, the reference documentation supports viewing any version through URL-based navigation:

- **Default behavior**: The reference docs at `/reference` show the **latest version**
- **Version-specific access**: You can view any historical version using the URL pattern `/reference/version/{version}/{type}`
- **Version format**: Must use the exact `YYYY-MM-DD` format with zero-padding (e.g., `2024-03-10`, not `2024-3-10`)

#### Examples

If your changelog shows a version from "March 10, 2024", you can view that version's User type at:

```
/reference/version/2024-03-10/User
```

**Important**: The version string must match the exact format shown in the changelog. Pay attention to zero-padding for single-digit months and days.

#### Current Limitations

- Version navigation must be done manually via URL (no UI version selector yet)
- Types mentioned in the changelog are not clickable links to their versioned reference pages (yet)
- You need to manually construct URLs using the exact `YYYY-MM-DD` format from the changelog

### Navigation

- The changelog page is accessible at `/changelog`
- A "Changelog" link appears in the navigation bar when you have 2 or more schema versions
