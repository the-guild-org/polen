# Start

## Goal

- Initialize a Claude Code session with full awareness of project standards and conventions
- Confirm awareness of personal configuration already in context
- Optionally focus on a specific area of the codebase

## Usage

- `/start` - Start with general project awareness
- `/start <focus-area>` - Start with specific focus (e.g., `/start hydra implementation`)

## Required Reading

1. Fully read ./claude/serena-prompt.md
2. Fully read ./CLAUDE.md
3. Fully read ~/.claude/CLAUDE.md

## Instructions

After reading the required files:

1. **Confirm personal configuration awareness**:
   - Explicitly state: "✓ Personal configuration from ~/.claude/CLAUDE.md is active"
   - List 2-3 key principles from the user's personal CLAUDE.md to prove awareness, such as:
     - Core work style preferences (e.g., ADHD considerations, no flattery)
     - Key technical preferences (e.g., ESM modules, TypeScript patterns)
     - Important rules (e.g., never guess APIs, verify everything)
   - Confirm: "✓ Personal commands from ~/.claude/commands/ are available"

2. **Acknowledge project configuration**:
   - Confirm project-specific standards are loaded
   - Note any project-specific MCP configurations (ref, exa, serena)

3. **Focus area handling**:
   If focus area is provided: "$ARGUMENTS"
   - Pay special attention to code and patterns related to the specified focus area
   - Proactively mention relevant standards and patterns for that area
   - Be ready to work on tasks related to the focus area

   If no focus area is provided:
   - Provide a brief acknowledgment that all configurations are active
   - Be ready to assist with any aspect of the codebase

## Example Output

```
✓ Loaded project standards from ./CLAUDE.md
✓ Loaded Serena instructions from .claude/serena-prompt.md
✓ Personal configuration from ~/.claude/CLAUDE.md is active, including:
  - ADHD-aware work style: breaking down tasks into smaller iterations
  - Technical preferences: ESM modules only, no CJS, prefer unknown over any
  - Critical rule: Never guess APIs - always verify in source code
✓ Personal commands from ~/.claude/commands/ are available
✓ MCP servers configured: ref (docs), exa (search), serena (code analysis)

Ready to assist with Polen development.
```
