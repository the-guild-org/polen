# Fix Project Standard Violations

## Goal

- Ensure all code meets the project's standards and conventions.
- Allow focused checking of specific domains of standards.

## Usage

- `/enforce-standards` - Check all standards in all src/ files
- `/enforce-standards <path>` - Check all standards in specified path
- `/enforce-standards <path> <domain>` - Check specific domain standards in specified path

## Domains

- `all` - Conventions from all domains
- `*` - Match against the top level headings (`#`) in CLAUDE.md files

## Examples

- `/enforce-standards src/lib testing` - Check test standards in src/lib
- `/enforce-standards src/lib2/hydra testing` - Check test standards in hydra module
- `/enforce-standards . layout` - Check import standards in entire project
- `/enforce-standards src/template types` - Check TypeScript standards in template

## Non-Goals

- Change code semantics or functionality.
- Fix issues automatically (only report them).

## Required Reading

1. Fully read ./claude/serena-prompt.md
2. Fully read ./CLAUDE.md
3. Fully read ~/.claude/CLAUDE.md

## Instructions

Parse arguments: "$ARGUMENTS"

1. **Parse arguments**:
   - No args: path = "src/", domain = "all"
   - One arg: path = arg1, domain = "all"
   - Two args: path = arg1, domain = arg2

2. **Validate inputs**:
   - Ensure path exists and is within project
   - Ensure domain is valid (tests/testing/imports/libraries/types/all)

3. **Apply domain-specific checks**:
   - Serarch these files:
     - CLAUDE.md
     - ~/.claude/CLAUDE.md
   - Local CLAUDE.md takes precedence
   - If using 'all' domain then enforce all conventions
   - Otherwise use conventions within markdown headings matching the given domain

4. **Immediately fix all issues you have found**
