#!/usr/bin/env tsx

import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { join } from 'path'

// Component mapping from Radix Themes to our new UI components
const IMPORT_REPLACEMENTS = {
  // Radix Themes imports to UI component imports
  '@radix-ui/themes': '../ui/index.js',
  "'@radix-ui/themes'": "'../ui/index.js'",
  '"@radix-ui/themes"': '"../ui/index.js"',
}

const COMPONENT_MAPPINGS = {
  // Direct component replacements (most stay the same)
  'Section': 'section', // Use HTML section
  'Theme': null, // Remove Theme wrapper
}

const SWISS_REPLACEMENTS = {
  'Swiss.Body': 'Container',
  'Swiss.Grid': 'div', // Will need manual grid setup
  'Swiss.Item': 'GridItem',
  'Swiss.Viewport': 'div className="w-full"',
  'Swiss.Extended': 'Container size="xl"',
}

function migrateFile(filePath: string) {
  console.log(`Migrating: ${filePath}`)

  let content = readFileSync(filePath, 'utf-8')
  let modified = false

  // Skip if already migrated
  if (content.includes('../ui/index.js')) {
    console.log('  Already migrated, skipping...')
    return
  }

  // Replace Radix Themes imports
  for (const [oldImport, newImport] of Object.entries(IMPORT_REPLACEMENTS)) {
    if (content.includes(oldImport)) {
      content = content.replace(new RegExp(oldImport, 'g'), newImport)
      modified = true
    }
  }

  // Replace Swiss components
  for (const [oldComp, newComp] of Object.entries(SWISS_REPLACEMENTS)) {
    if (content.includes(oldComp)) {
      if (newComp) {
        content = content.replace(new RegExp(oldComp.replace('.', '\\.'), 'g'), newComp)
      }
      modified = true
    }
  }

  // Remove Swiss import if present
  if (content.includes('import { Swiss }')) {
    content = content.replace(/import \{ Swiss \}.*\n/g, '')
    modified = true
  }

  // Replace Section with semantic HTML
  content = content.replace(/<Section([^>]*)>/g, '<section$1>')
  content = content.replace(/<\/Section>/g, '</section>')

  // Add TODO comments for manual review
  if (modified) {
    if (content.includes('style={{') || content.includes('style={{ ')) {
      content = '// TODO: Review and replace inline styles with Tailwind classes\n' + content
    }

    writeFileSync(filePath, content)
    console.log('  ✓ Migrated')
  } else {
    console.log('  No changes needed')
  }
}

function findTsxFiles(dir: string): string[] {
  const files: string[] = []

  const items = readdirSync(dir)
  for (const item of items) {
    const fullPath = join(dir, item)
    const stat = statSync(fullPath)

    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findTsxFiles(fullPath))
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      files.push(fullPath)
    }
  }

  return files
}

// Run migration
const templateDir = join(process.cwd(), 'src/template')
const files = findTsxFiles(templateDir)

console.log(`Found ${files.length} files to check...`)
console.log('---')

for (const file of files) {
  // Skip UI components and already migrated files
  if (!file.includes('/ui/') && !file.includes('.new.')) {
    migrateFile(file)
  }
}

console.log('---')
console.log('Migration complete! Please review files with TODO comments.')
