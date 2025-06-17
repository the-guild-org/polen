/**
 * Deployment path management for demos
 */

import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { WorkflowError } from '../../shared/error-handling.ts'

export interface RedirectConfig {
  from: string
  to: string
  type?: 'html' | 'meta'
}

/**
 * Manages deployment paths and base path updates for demo files
 */
export class DeploymentPathManager {
  constructor(private rootPath: string = process.cwd()) {}

  /**
   * Update base paths in built demo files
   * Replaces HTML/JS references from one base path to another
   */
  async updateBasePaths(
    directory: string,
    fromPath: string,
    toPath: string,
  ): Promise<void> {
    try {
      const files = await this.getAllFiles(directory)
      const targetFiles = files.filter(file => 
        file.endsWith('.html') || 
        file.endsWith('.js') || 
        file.endsWith('.css') ||
        file.endsWith('.json')
      )

      for (const file of targetFiles) {
        await this.updateFileBasePath(file, fromPath, toPath)
      }
    } catch (error) {
      throw new WorkflowError('path-manager', `Failed to update base paths in ${directory}`, error)
    }
  }

  /**
   * Generate HTML redirect pages
   */
  async generateRedirects(redirects: RedirectConfig[], outputDir: string): Promise<void> {
    try {
      for (const redirect of redirects) {
        const redirectPath = join(outputDir, redirect.from, 'index.html')
        const redirectDir = join(outputDir, redirect.from)
        
        await fs.mkdir(redirectDir, { recursive: true })
        
        const html = this.createRedirectHtml(redirect.to)
        await fs.writeFile(redirectPath, html)
      }
    } catch (error) {
      throw new WorkflowError('path-manager', 'Failed to generate redirects', error)
    }
  }

  /**
   * Create convenience redirects for demo examples
   */
  async createDemoRedirects(
    examples: string[], 
    outputDir: string, 
    targetBasePath: string = '/latest/',
  ): Promise<void> {
    const redirects: RedirectConfig[] = examples.map(example => ({
      from: example,
      to: `${targetBasePath}${example}/`,
    }))

    await this.generateRedirects(redirects, outputDir)
  }

  /**
   * Validate deployment structure
   */
  async validateDeploymentStructure(deploymentDir: string): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Check if deployment directory exists
      await fs.access(deploymentDir)
    } catch {
      errors.push(`Deployment directory does not exist: ${deploymentDir}`)
      return { valid: false, errors, warnings }
    }

    try {
      // Check for index.html
      const indexPath = join(deploymentDir, 'index.html')
      await fs.access(indexPath)
    } catch {
      warnings.push('No index.html found in deployment root')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Clean up old deployment directories
   */
  async cleanupOldDeployments(
    parentDir: string,
    keepVersions: string[],
    dryRun: boolean = false,
  ): Promise<{ removed: string[]; kept: string[]; errors: string[] }> {
    const removed: string[] = []
    const kept: string[] = []
    const errors: string[] = []

    try {
      const entries = await fs.readdir(parentDir, { withFileTypes: true })
      const directories = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)

      for (const dir of directories) {
        if (keepVersions.includes(dir)) {
          kept.push(dir)
        } else if (this.isSemverDirectory(dir)) {
          if (!dryRun) {
            try {
              await fs.rm(join(parentDir, dir), { recursive: true, force: true })
              removed.push(dir)
            } catch (error) {
              errors.push(`Failed to remove ${dir}: ${error}`)
            }
          } else {
            removed.push(dir) // Dry run - just track what would be removed
          }
        } else {
          kept.push(dir) // Keep non-semver directories
        }
      }
    } catch (error) {
      throw new WorkflowError('path-manager', `Failed to cleanup deployments in ${parentDir}`, error)
    }

    return { removed, kept, errors }
  }

  // Private helper methods

  private async getAllFiles(directory: string): Promise<string[]> {
    const files: string[] = []
    
    const processDirectory = async (dir: string): Promise<void> => {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        
        if (entry.isDirectory()) {
          await processDirectory(fullPath)
        } else {
          files.push(fullPath)
        }
      }
    }

    await processDirectory(directory)
    return files
  }

  private async updateFileBasePath(
    filePath: string,
    fromPath: string,
    toPath: string,
  ): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const updatedContent = content.replaceAll(fromPath, toPath)
      
      if (content !== updatedContent) {
        await fs.writeFile(filePath, updatedContent)
      }
    } catch (error) {
      throw new WorkflowError('path-manager', `Failed to update file ${filePath}`, error)
    }
  }

  private createRedirectHtml(targetUrl: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=${targetUrl}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirecting...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .redirect-message {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .redirect-message a {
      color: #0066cc;
      text-decoration: none;
    }
    .redirect-message a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="redirect-message">
    <h1>Redirecting...</h1>
    <p>If you are not redirected automatically, <a href="${targetUrl}">click here</a>.</p>
  </div>
  <script>
    window.location.href = '${targetUrl}';
  </script>
</body>
</html>`
  }

  private isSemverDirectory(name: string): boolean {
    // Check if directory name looks like a semver version
    return /^\d+\.\d+\.\d+/.test(name)
  }
}