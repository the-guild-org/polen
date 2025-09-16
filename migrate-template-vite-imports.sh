#!/bin/bash

# Script to migrate graphql-kit #lib imports to root imports in src/template and src/vite

echo "Migrating graphql-kit imports in src/template and src/vite..."

# Process all TypeScript files in src/template and src/vite
for dir in src/template src/vite; do
  if [ -d "$dir" ]; then
    find "$dir" -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
      # Create a temporary file for the changes
      tmp_file="${file}.tmp"

      # Process the file - replace #lib imports with graphql-kit
      sed -E \
        -e "s|from '#lib/catalog'|from 'graphql-kit'|g" \
        -e "s|from '#lib/change'|from 'graphql-kit'|g" \
        -e "s|from '#lib/date-only'|from 'graphql-kit'|g" \
        -e "s|from '#lib/grafaid'|from 'graphql-kit'|g" \
        -e "s|from '#lib/grafaid-old'|from 'graphql-kit'|g" \
        -e "s|from '#lib/graphql-error'|from 'graphql-kit'|g" \
        -e "s|from '#lib/graphql-schema-loader'|from 'graphql-kit'|g" \
        -e "s|from '#lib/graphql-schema-path'|from 'graphql-kit'|g" \
        -e "s|from '#lib/revision'|from 'graphql-kit'|g" \
        -e "s|from '#lib/schema'|from 'graphql-kit'|g" \
        -e "s|from '#lib/schema-definition'|from 'graphql-kit'|g" \
        -e "s|from '#lib/version'|from 'graphql-kit'|g" \
        -e "s|from '#lib/version-coverage'|from 'graphql-kit'|g" \
        -e "s|from '#lib/lifecycles'|from 'graphql-kit'|g" \
        "$file" > "$tmp_file"

      # Only replace the file if it changed
      if ! cmp -s "$file" "$tmp_file"; then
        mv "$tmp_file" "$file"
        echo "Updated: $file"
      else
        rm "$tmp_file"
      fi
    done
  fi
done

echo "Migration complete!"

# Show summary
echo ""
echo "Summary of remaining #lib imports in src/template:"
grep -r "from '#lib/\(grafaid\|catalog\|schema\|version\|change\|revision\|date-only\|graphql-error\|graphql-schema-loader\|graphql-schema-path\|version-coverage\|lifecycles\|schema-definition\)'" src/template --include="*.ts" --include="*.tsx" | wc -l

echo ""
echo "Summary of remaining #lib imports in src/vite:"
grep -r "from '#lib/\(grafaid\|catalog\|schema\|version\|change\|revision\|date-only\|graphql-error\|graphql-schema-loader\|graphql-schema-path\|version-coverage\|lifecycles\|schema-definition\)'" src/vite --include="*.ts" --include="*.tsx" | wc -l