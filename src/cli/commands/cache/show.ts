import { Api } from '#api/$'
import { Op } from '#dep/effect'
import { Ef } from '#dep/effect'
import { Command, Options } from '@effect/cli'
import { NodeFileSystem } from '@effect/platform-node'
import { FsLoc } from '@wollybeard/kit'
import { allowGlobalParameter } from '../../_/parameters.js'

const depth = Options.integer('depth').pipe(
  Options.withAlias('d'),
  Options.withDefault(2),
  Options.withDescription('Maximum depth for directory tree display'),
)

// Helper to format bytes
const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

// Helper to render directory tree
const renderTree = (nodes: Api.Cache.TreeNode[], prefix = '', isLast = true): string[] => {
  const lines: string[] = []

  nodes.forEach((node, index) => {
    const isLastNode = index === nodes.length - 1
    const connector = isLastNode ? '└─' : '├─'
    const extension = isLastNode ? '  ' : '│ '

    let line = `${prefix}${connector} ${node.name}`
    if (node.type === 'file' && Op.isSome(node.size)) {
      line += ` (${formatBytes(node.size.value)})`
    }
    lines.push(line)

    if (Op.isSome(node.children) && node.children.value.length > 0) {
      const childLines = renderTree(node.children.value, prefix + extension, isLastNode)
      lines.push(...childLines)
    }
  })

  return lines
}

export const cacheShow = Command.make(
  'show',
  {
    depth,
    allowGlobal: allowGlobalParameter,
  },
  ({ depth, allowGlobal }) =>
    Ef.gen(function*() {
      // Get cache info
      const info = yield* Api.Cache.info({ depth }).pipe(
        Ef.provide(NodeFileSystem.layer),
      )

      const rootPathStr = FsLoc.encodeSync(info.rootPath)
      console.log(`Root: ${rootPathStr}`)
      console.log()

      // Development assets
      const devAssetsPathStr = FsLoc.encodeSync(info.developmentAssets.path)
      const devAssetsRelative = devAssetsPathStr.replace(rootPathStr, '').replace(/^\//, '')
      console.log(`Development assets: ${devAssetsRelative}`)
      if (info.developmentAssets.exists) {
        const size = Op.isSome(info.developmentAssets.size)
          ? ` (${formatBytes(info.developmentAssets.size.value)})`
          : ''
        console.log(`  Status: exists${size}`)

        if (Op.isSome(info.developmentAssets.tree) && info.developmentAssets.tree.value.length > 0) {
          console.log('  Contents:')
          const treeLines = renderTree(info.developmentAssets.tree.value, '    ')
          treeLines.forEach(line => console.log(line))
        }
      } else {
        console.log('  Status: empty')
      }

      console.log()

      // Vite cache
      console.log('Vite:')
      if (info.vite.exists) {
        const size = Op.isSome(info.vite.size)
          ? ` (${formatBytes(info.vite.size.value)})`
          : ''
        console.log(`  Status: exists${size}`)

        if (Op.isSome(info.vite.optimizedDependencies) && info.vite.optimizedDependencies.value.length > 0) {
          const deps = info.vite.optimizedDependencies.value
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
        console.log('  Status: empty')
      }
    }),
)
