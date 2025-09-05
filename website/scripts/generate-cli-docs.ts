#!/usr/bin/env tsx
/**
 * Generate CLI documentation from Effect CLI commands
 *
 * This script extracts documentation from the actual CLI commands
 * and generates markdown documentation for the website.
 */

import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { polenCli } from '../../src/cli/index.js'
import { EffectCliHelpMarkdown } from '../../src/lib/effect-cli-help-markdown/$.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const generateCliDocs = async () => {
  console.log('🔧 Generating CLI documentation...')

  // Generate documentation for each command
  const sections: string[] = []

  // Header
  sections.push(`---
# THIS FILE IS AUTO-GENERATED - DO NOT EDIT
# Run 'pnpm website:cli-docs' to regenerate
---

# CLI Reference

Polen provides several CLI commands to help you develop and deploy your GraphQL developer portal.

## Common Options

Most Polen commands that operate on projects accept these common options:

- \`--project <path>\`, \`-p\` - Path to the project directory (default: current working directory)
- \`--allow-global\` - Allow global installation (when running globally installed Polen)

## Commands`)

  // Generate documentation for all commands using the CLI tree
  const commandsMarkdown = EffectCliHelpMarkdown.cliToMarkdown(polenCli, {
    baseHeadingLevel: 3,
    includeCommandName: true,
    includeGlobalOptions: true,
  })

  sections.push(commandsMarkdown)

  const markdownContent = sections.join('\n')

  // Write the generated markdown to the documentation file
  const outputPath = path.join(__dirname, '..', 'reference', 'cli.md')
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, markdownContent)

  console.log(`✅ CLI documentation generated at: ${outputPath}`)
}

// Run the generator
generateCliDocs().catch(console.error)
