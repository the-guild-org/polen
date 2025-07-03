#!/usr/bin/env node

import { Command } from '@molt/command'
import { z } from 'zod'
import { buildHome } from './home.ts'
import type { BuildConfig } from './types.ts'

/**
 * CLI entry point
 */
const command = Command.create()
  .parameter(`basePath`, z.string().optional().describe(`Base path for demo links`))
  .parameter(`prNumber`, z.string().optional().describe(`PR number for preview mode`))
  .parameter(`currentSha`, z.string().optional().describe(`Current commit SHA`))
  .parameter(`prDeployments`, z.string().optional().describe(`JSON string of PR deployments`))
  .parameter(`trunkDeployments`, z.string().optional().describe(`JSON string of trunk deployments`))
  .parameter(`distTags`, z.string().optional().describe(`JSON string of dist-tags`))
  .parameter(`outputDir`, z.string().optional().describe(`Output directory`))
  .parameter(`outputPath`, z.string().optional().describe(`Output file path (overrides outputDir)`))

const args = await command.parse()

// Create build config based on args
const config: BuildConfig = args.prNumber
  ? {
    mode: 'preview',
    prNumber: args.prNumber,
    currentSha: args.currentSha,
    prDeployments: args.prDeployments ? JSON.parse(args.prDeployments) : [],
    basePath: args.basePath,
    outputDir: args.outputDir,
    outputPath: args.outputPath,
  }
  : {
    mode: 'trunk',
    catalog: {
      distTags: args.distTags ? JSON.parse(args.distTags) : { latest: null, next: null },
      stable: [],
      prerelease: [],
      versions: args.trunkDeployments ? JSON.parse(args.trunkDeployments).previous || [] : [],
    },
    basePath: args.basePath,
    outputDir: args.outputDir,
    outputPath: args.outputPath,
  }

await buildHome(config)
