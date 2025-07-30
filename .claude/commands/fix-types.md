# Fix TypeScript Errors

## Goal

- Fix all TypeScript errors in the specified path until `tsc` shows no errors

## Usage

- `/fix-types` - Fix TypeScript errors in all src/ files
- `/fix-types <path>` - Fix TypeScript errors in specified path (e.g., `/fix-types src/lib`)

## Requirements

- Must use `tsc` with the project's `tsconfig.json`
- Continue until zero errors remain
- No cheating, skipping, or hack solutions
- Ask before making significant design changes

## Instructions

Parse arguments: "$ARGUMENTS"

- If path provided: validate it exists and is within project
- If no path provided: default to "src/"

1. **Setup temporary tsconfig** (if path provided):
   - Create `tsconfig.fix-types.json` that extends the main tsconfig but only includes the specified path:
   ```json
   {
     "extends": "./tsconfig.json",
     "include": ["${path}/**/*"]
   }
   ```
   - Use `--project tsconfig.fix-types.json` for all type checks
   - If no path provided, use the main `tsconfig.json`

2. **Initial type check**:
   - Run `tsc --project ${configFile} --noEmit` where configFile is either tsconfig.fix-types.json or tsconfig.json
   - Count total errors - these are now ONLY for the specified path
   - No need for grep filtering since tsconfig handles the scoping

3. **Fix errors systematically**:
   - Work through errors file by file
   - For each error:
     - Understand the root cause
     - Apply proper TypeScript solution
     - No `any` types unless absolutely necessary
     - No `@ts-ignore` or `@ts-expect-error` comments
     - Follow project's type conventions from CLAUDE.md

   **CRITICAL PRINCIPLE**:
   - Function contracts (public APIs) MUST be properly typed
   - Internal implementations should NEVER be complicated for type safety
   - If internal type safety requires complex gymnastics, use simple types internally
   - Example: Cast to `any` inside implementation if needed, but keep external API types strict

4. **Design decision protocol**:
   - If a fix requires significant refactoring or design changes:
     - STOP and present detailed analysis:
       - What is the type error?
       - Why is it occurring?
       - What are the possible solutions?
       - What are the trade-offs of each solution?
       - What is confusing or unclear?
     - Wait for user guidance before proceeding

5. **Verification loop**:
   - After each batch of fixes, run `tsc --project ${configFile} --noEmit`
   - Count remaining errors
   - Continue until output shows zero errors
   - Do not stop until completely error-free

6. **Final check**:
   - Run final `tsc --project ${configFile} --noEmit`
   - MUST show zero errors
   - ONLY claim success if error count is 0
   - Summarize what was fixed

7. **Cleanup**:
   - If temporary tsconfig.fix-types.json was created, delete it

## CRITICAL: Success Criteria

**YOU MUST NOT CLAIM SUCCESS UNLESS:**

1. Running `tsc --project ${configFile} --noEmit` returns zero errors
2. You have explicitly shown the final tsc command and its output showing no errors
3. The temporary tsconfig (if created) has been cleaned up

**COMMON FAILURE MODES TO AVOID:**

- Don't look at errors from other paths (the temporary tsconfig prevents this)
- Don't stop after fixing only some errors
- Don't claim success without verifying zero errors with the scoped tsconfig
- Don't forget to clean up the temporary tsconfig.fix-types.json file

## Examples of when to ask for guidance

- Need to change a public API interface
- Type error suggests fundamental design issue
- Multiple valid solutions with different implications
- Error spans multiple modules requiring coordinated changes
- Generic type constraints causing widespread changes
