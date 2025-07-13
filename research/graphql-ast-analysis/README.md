# GraphQL AST Analysis Research

## Overview

This research was conducted to determine the best approach for implementing interactive GraphQL token classification in Polen. The core problem was that after transitioning from Shiki to CodeHike, interactive features broke due to incorrect token classification.

## Problem Statement

Interactive GraphQL documents were incorrectly classifying tokens:

- ❌ `GetPokemon` (operation name) - incorrectly interactive (should NOT be)
- ❌ `$id` (variable name) - incorrectly interactive (should NOT be)
- ✅ `Pokemon`/`ID` (type references) - correctly interactive (should be)
- ✅ `name`/`id` (field names) - correctly interactive (should be)

## Research Question

**Should we use tree-sitter alone or combine it with GraphQL package AST for semantic token classification?**

## Key Findings

### Tree-sitter Provides Complete Semantic Context

Tree-sitter's parent context perfectly disambiguates tokens:

```json
{
  "type": "name",
  "text": "GetPokemon", 
  "parent": { "type": "operation_definition" }  // ← NON-interactive
}

{
  "type": "name", 
  "text": "Pokemon",
  "parent": { "type": "named_type" }  // ← Interactive (type reference)
}

{
  "type": "name",
  "text": "name", 
  "parent": { "type": "field" }  // ← Interactive (field reference)
}

{
  "type": "variable",
  "text": "$id",
  "parent": { "type": "variable_definition" }  // ← NON-interactive
}
```

### Field Names Provide Additional Semantic Context

Tree-sitter also provides semantic field names:

```json
{
  "type": "operation_definition",
  "fieldNames": {
    "0": "operation_type", // "query"
    "1": "name", // "GetPokemon"
    "2": "variable_definitions",
    "3": "selection_set"
  }
}
```

## Conclusion

**Tree-sitter alone is sufficient for accurate token classification.**

The GraphQL package AST adds unnecessary complexity without meaningful semantic benefit for basic interactive features. Tree-sitter provides:

- ✅ **Perfect disambiguation** via parent context
- ✅ **Complete hierarchy** with field names
- ✅ **Simpler implementation** (single parser)
- ✅ **Better performance** (no dual parsing)
- ✅ **More robust** (works with malformed GraphQL)

## Recommended Implementation

```typescript
function isTokenInteractive(node: TreeSitterNode): boolean {
  return node.parent?.type === 'named_type' // Type references
    || node.parent?.type === 'field' // Field references
}

function getTokenType(node: TreeSitterNode): string {
  switch (node.parent?.type) {
    case 'operation_definition':
      return 'operation_name' // Non-interactive
    case 'variable_definition':
      return 'variable_name' // Non-interactive
    case 'named_type':
      return 'type_reference' // Interactive
    case 'field':
      return 'field_name' // Interactive
    default:
      return 'text'
  }
}
```

## Files

- `sandbox-graphql-ast.ts` - Research tool for analyzing both AST approaches
- `sample-output.txt` - Captured terminal output showing AST structures
- `findings.md` - Detailed analysis and conclusions
- `README.md` - This overview document

## Next Steps

1. Remove GraphQL AST parsing from production code
2. Implement tree-sitter-only classification using parent context
3. Test against Pokemon examples to verify correctness
4. Remove dual-AST complexity and dependencies
