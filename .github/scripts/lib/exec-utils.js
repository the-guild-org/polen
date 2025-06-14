// @ts-check
/**
 * Utility functions for executing commands in GitHub Actions scripts
 */

/**
 * Execute a command and return its stdout as a string
 * @param {import('./async-function').AsyncFunctionArguments['exec']} exec
 * @param {string} command
 * @param {string[]} args
 * @returns {Promise<string>}
 */
export async function execGetOutput(exec, command, args = []) {
  let output = ''
  await exec.exec(command, args, {
    listeners: {
      stdout: (data) => {
        output += data.toString()
      },
    },
  })
  return output.trim()
}

/**
 * Execute a git command and return its stdout as a string
 * @param {import('./async-function').AsyncFunctionArguments['exec']} exec
 * @param {string[]} args
 * @returns {Promise<string>}
 */
export async function execGit(exec, args) {
  return execGetOutput(exec, 'git', args)
}

/**
 * Get all git tags as an array
 * @param {import('./async-function').AsyncFunctionArguments['exec']} exec
 * @returns {Promise<string[]>}
 */
export async function getGitTags(exec) {
  const output = await execGit(exec, ['tag'])
  return output.split('\n').filter(Boolean)
}

/**
 * Execute a node script and return its stdout
 * @param {import('./async-function').AsyncFunctionArguments['exec']} exec
 * @param {string} scriptPath
 * @param {string[]} args
 * @returns {Promise<string>}
 */
export async function execNodeScript(exec, scriptPath, args = []) {
  return execGetOutput(exec, 'node', [scriptPath, ...args])
}
