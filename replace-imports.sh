#!/bin/bash

# Replace all #lib imports with graphql-kit imports

echo "Replacing #lib imports with graphql-kit..."

# Grafaid
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/grafaid'|from 'graphql-kit/grafaid'|g" {} \;
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/grafaid/grafaid'|from 'graphql-kit/grafaid'|g" {} \;
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/grafaid-old'|from 'graphql-kit/grafaid'|g" {} \;

# Catalog
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/catalog'|from 'graphql-kit/catalog'|g" {} \;
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/catalog/catalog'|from 'graphql-kit/catalog'|g" {} \;

# Schema
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/schema'|from 'graphql-kit/schema'|g" {} \;
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/schema/schema'|from 'graphql-kit/schema'|g" {} \;

# Change
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/change'|from 'graphql-kit/change'|g" {} \;
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/change/change'|from 'graphql-kit/change'|g" {} \;

# Revision
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/revision'|from 'graphql-kit/revision'|g" {} \;
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/revision/revision'|from 'graphql-kit/revision'|g" {} \;

# Version
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/version'|from 'graphql-kit/version'|g" {} \;
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/version/version'|from 'graphql-kit/version'|g" {} \;

# Lifecycles
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/lifecycles'|from 'graphql-kit/lifecycles'|g" {} \;
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/lifecycles/lifecycles'|from 'graphql-kit/lifecycles'|g" {} \;

# GraphQL Error
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/graphql-error'|from 'graphql-kit/graphql-error'|g" {} \;

# GraphQL Schema Loader
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/graphql-schema-loader'|from 'graphql-kit/graphql-schema-loader'|g" {} \;

# GraphQL Schema Path
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/graphql-schema-path'|from 'graphql-kit/graphql-schema-path'|g" {} \;
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/graphql-schema-path/graphql-schema-path'|from 'graphql-kit/graphql-schema-path'|g" {} \;

# Schema Definition
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/schema-definition'|from 'graphql-kit/schema-definition'|g" {} \;
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/schema-definition/schema-definition'|from 'graphql-kit/schema-definition'|g" {} \;

# Date Only
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/date-only'|from 'graphql-kit/date-only'|g" {} \;

# Version Coverage
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/version-coverage'|from 'graphql-kit/version-coverage'|g" {} \;
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/version-coverage/version-coverage'|from 'graphql-kit/version-coverage'|g" {} \;

# Kit Temp
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/kit-temp'|from 'graphql-kit/kit-temp'|g" {} \;

# Semver
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/semver'|from 'graphql-kit/semver'|g" {} \;
find src/api -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '#lib/semver/semver'|from 'graphql-kit/semver'|g" {} \;

echo "Done replacing imports!"