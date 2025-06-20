/* eslint-disable */
// @ts-nocheck
import { Api } from '#api/index'
import { Task } from '#lib/task'
import { Command } from '@molt/command'
import { Err, Path } from '@wollybeard/kit'
import { z } from 'zod'

const args = Command.create()
  .parameter(
    `source`,
    z.string().describe('Path to the Polen build directory to rebase'),
  )
  .parameter(
    `newBasePath`,
    z.string().describe('New base path for the build (e.g., /new-path/)'),
  )
  .parameter(
    `--target -t`,
    z.string().optional().describe('Target directory for copy mode (if not provided, mutate in place)'),
  )
  .parse()

const plan: Api.Static.RebasePlan = args.target
  ? {
    changeMode: 'copy',
    sourcePath: args.source,
    targetPath: args.target,
    newBasePath: args.newBasePath,
  }
  : {
    changeMode: 'mutate',
    sourcePath: args.source,
    newBasePath: args.newBasePath,
  }

await Task.runAndExit(Api.Static.rebase, plan)
