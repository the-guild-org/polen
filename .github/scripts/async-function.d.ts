// This file is vendored from: https://github.com/actions/github-script/blob/main/types/async-function.d.ts
// To refresh this file, run:
// curl -s https://raw.githubusercontent.com/actions/github-script/main/types/async-function.d.ts -o .github/scripts/async-function.d.ts

/// <reference types="node" />
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { Context } from '@actions/github/lib/context'
import { GitHub } from '@actions/github/lib/utils'
import * as glob from '@actions/glob'
import * as io from '@actions/io'
export declare type AsyncFunctionArguments = {
  context: Context
  core: typeof core
  github: InstanceType<typeof GitHub>
  octokit: InstanceType<typeof GitHub>
  exec: typeof exec
  glob: typeof glob
  io: typeof io
  require: NodeRequire
  __original_require__: NodeRequire
}
export declare function callAsyncFunction<T>(args: AsyncFunctionArguments, source: string): Promise<T>
