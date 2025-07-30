import { Api } from '#api/index'
import { allowGlobalParameter } from '#cli/_/parameters'
import { Command } from '@molt/command'
import { z } from 'zod'

const args = Command.create()
  .parameter(
    `--depth -d`,
    z.number().min(0).max(5).default(2).describe(`Maximum depth for directory tree display`),
  )
  .parameter(`--allow-global`, allowGlobalParameter)
  .settings({
    parameters: {
      environment: {
        $default: {
          prefix: `POLEN_CACHE_`,
          enabled: false,
        },
      },
    },
  })
  .parse()

// Helper to format bytes
const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

// Helper to render directory tree
const renderTree = (nodes: Api.Cache.TreeNode[], prefix = ``, isLast = true): string[] => {
  const lines: string[] = []

  nodes.forEach((node, index) => {
    const isLastNode = index === nodes.length - 1
    const connector = isLastNode ? `└─` : `├─`
    const extension = isLastNode ? `  ` : `│ `

    let line = `${prefix}${connector} ${node.name}`
    if (node.type === `file` && node.size !== undefined) {
      line += ` (${formatBytes(node.size)})`
    }
    lines.push(line)

    if (node.children && node.children.length > 0) {
      const childLines = renderTree(node.children, prefix + extension, isLastNode)
      lines.push(...childLines)
    }
  })

  return lines
}

// Get cache info
const info = await Api.Cache.info({ depth: args.depth })

console.log(`Root: ${info.rootPath}`)
console.log()

// Development assets
console.log(`Development assets: ${info.developmentAssets.path.replace(info.rootPath + `/`, ``)}`)
if (info.developmentAssets.exists) {
  const size = info.developmentAssets.size ? ` (${formatBytes(info.developmentAssets.size)})` : ``
  console.log(`  Status: exists${size}`)

  if (info.developmentAssets.tree && info.developmentAssets.tree.length > 0) {
    console.log(`  Contents:`)
    const treeLines = renderTree(info.developmentAssets.tree, `    `)
    treeLines.forEach(line => console.log(line))
  }
} else {
  console.log(`  Status: empty`)
}

console.log()

// Vite cache
console.log(`Vite:`)
if (info.vite.exists) {
  const size = info.vite.size ? ` (${formatBytes(info.vite.size)})` : ``
  console.log(`  Status: exists${size}`)

  if (info.vite.optimizedDependencies && info.vite.optimizedDependencies.length > 0) {
    const deps = info.vite.optimizedDependencies
    const showing = Math.min(10, deps.length)
    const more = deps.length - showing

    console.log(`  Optimized dependencies (${deps.length}):`)
    deps.slice(0, showing).forEach(dep => {
      console.log(`    ${dep.name} (${formatBytes(dep.size)})`)
    })

    if (more > 0) {
      console.log(`    ... (${more} more)`)
    }
  }
} else {
  console.log(`  Status: empty`)
}
