#!/usr/bin/env node

import { Command } from '@molt/command'
import { z } from 'zod'
import { buildDemosHome } from './landing-page.ts'

/**
 * CLI entry point
 */
const command = Command.create()
  .parameter('basePath', z.string().optional().describe('Base path for demo links'))
  .parameter('prNumber', z.string().optional().describe('PR number for preview mode'))
  .parameter('currentSha', z.string().optional().describe('Current commit SHA'))
  .parameter('mode', z.enum(['production', 'development']).optional().describe('Page mode'))
  .parameter('prDeployments', z.string().optional().describe('JSON string of PR deployments'))
  .parameter('trunkDeployments', z.string().optional().describe('JSON string of trunk deployments'))
  .parameter('distTags', z.string().optional().describe('JSON string of dist-tags'))
  .parameter('serve', z.boolean().optional().describe('Start development server'))
  .parameter('outputDir', z.string().optional().describe('Output directory'))
  .parameter('outputPath', z.string().optional().describe('Output file path (overrides outputDir)'))

const args = await command.parse()
await buildDemosHome(args)
