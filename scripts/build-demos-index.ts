#!/usr/bin/env node

import { Command } from '@molt/command'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { z } from 'zod'

const args = Command.create()
  .description('Build demos landing page or PR index')
  .parameter('basePath', z.string().default('/').describe('Base path for the demos'))
  .parameter('prNumber', z.string().optional().describe('Pull request number'))
  .parameter('currentSha', z.string().optional().describe('Current commit SHA'))
  .parameter(
    'mode',
    z.enum(['demo', 'pr-index', 'dev']).default('demo').describe('Page mode: demo landing, PR index, or dev'),
  )
  .parameter('prDeployments', z.string().optional().describe('JSON array of PR deployments'))
  .parameter('trunkDeployments', z.string().optional().describe('JSON object with trunk deployment info'))
  .parameter('distTags', z.string().optional().describe('JSON object with dist-tag mappings'))
  .parameter('serve', z.boolean().default(false).describe('Start a dev server (only in dev mode)'))
  .parse()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { basePath, prNumber, currentSha, mode, prDeployments, trunkDeployments, distTags, serve } = args

// Set up mock data for dev mode
let finalDistTags = distTags
let finalTrunkDeployments = trunkDeployments

if (mode === 'dev') {
  const mockDistTags = {
    latest: '1.2.0',
    next: '1.3.0-beta.2',
  }
  const mockTrunkDeployments = {
    latest: { sha: '1.2.0', shortSha: '1.2.0', tag: '1.2.0' },
    previous: [
      { sha: '1.1.0', shortSha: '1.1.0', tag: '1.1.0' },
      { sha: '1.0.0', shortSha: '1.0.0', tag: '1.0.0' },
      { sha: '0.9.1', shortSha: '0.9.1', tag: '0.9.1' },
      { sha: '0.9.0', shortSha: '0.9.0', tag: '0.9.0' },
    ],
  }
  finalDistTags = JSON.stringify(mockDistTags)
  finalTrunkDeployments = JSON.stringify(mockTrunkDeployments)
}

// Parse PR deployments if provided
const parsedPrDeployments = (prDeployments ? JSON.parse(prDeployments) : []) as { number: number }[]

// Parse trunk deployments if provided
interface TrunkDeployment {
  sha: string
  shortSha: string
  tag: string | null
}

interface TrunkDeploymentsData {
  latest: TrunkDeployment | null
  previous: TrunkDeployment[]
}

const parsedTrunkDeployments = (finalTrunkDeployments ? JSON.parse(finalTrunkDeployments) : null) as
  | TrunkDeploymentsData
  | null

// Parse dist-tags if provided
interface DistTagsData {
  [key: string]: string
}

const parsedDistTags = (finalDistTags ? JSON.parse(finalDistTags) : {}) as DistTagsData

// Function to get previous deployments
const getPreviousDeployments = () => {
  if (!prNumber) return []

  try {
    // Fetch gh-pages branch
    execSync('git fetch origin gh-pages:refs/remotes/origin/gh-pages', { stdio: 'ignore' })

    // Get list of commit directories
    const prDir = `pr-${prNumber}`
    const result = execSync(`git ls-tree -d --name-only "origin/gh-pages:${prDir}" 2>/dev/null || echo ""`, {
      encoding: 'utf-8',
    })

    const commits = result
      .split('\n')
      .filter(line => line && /^[0-9a-f]{7,40}$/.test(line))
      .filter(sha => sha !== currentSha) // Exclude current deployment
      .sort()
      .reverse()

    return commits
  } catch (e) {
    return []
  }
}

const previousDeployments = getPreviousDeployments()

// Generate PR index page if mode is pr-index
if (mode === 'pr-index') {
  const prIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Polen PR Previews</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #000;
      background: #fff;
      padding: 2rem;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      font-size: 2rem;
      font-weight: 400;
      margin-bottom: 0.5rem;
      letter-spacing: -0.02em;
    }

    p {
      color: #666;
      margin-bottom: 2rem;
    }

    .back-link {
      color: #000;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 2rem;
      font-size: 0.875rem;
    }

    .back-link:hover {
      text-decoration: underline;
    }

    .pr-list {
      display: grid;
      gap: 1rem;
    }

    .pr-item {
      background: white;
      padding: 1.5rem;
      border: 1px solid #000;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .pr-number {
      font-weight: 600;
      color: #000;
    }

    .pr-link {
      background: #000;
      color: #fff;
      text-decoration: none;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s ease;
      border: 1px solid #000;
    }

    .pr-link:hover {
      background: #fff;
      color: #000;
    }
  </style>
</head>
<body>
  <div class="container">
    <a href="/" class="back-link">
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to main demos
    </a>
    <h1>Polen PR Previews</h1>
    <p>Preview deployments for open pull requests.</p>
    <div class="pr-list">
      ${
    parsedPrDeployments.length > 0
      ? parsedPrDeployments.map((pr) => `
          <div class="pr-item">
            <span class="pr-number">PR #${pr.number}</span>
            <a href="/pr-${pr.number}/" class="pr-link">View Preview →</a>
          </div>
        `).join('')
      : '<p>No PR previews currently deployed.</p>'
  }
    </div>
  </div>
</body>
</html>`

  // Write PR index
  const distDir = path.join(process.cwd(), 'dist-demos')
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true })
  }
  fs.writeFileSync(path.join(distDir, 'pr-index.html'), prIndexHtml)
  console.log('Built PR index page')
  process.exit(0)
}

// Otherwise generate demo landing page
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Polen Demos</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #000;
      background: #fff;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      margin-bottom: 4rem;
      padding: 3rem 0;
      border-bottom: 1px solid #000;
    }

    .header h1 {
      font-size: 2.5rem;
      font-weight: 400;
      margin-bottom: 0.5rem;
      letter-spacing: -0.02em;
    }

    .header p {
      font-size: 1rem;
      color: #000;
      max-width: 600px;
    }

    .demos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .demo-card {
      background: white;
      padding: 2rem;
      border: 1px solid #000;
      transition: all 0.2s ease;
    }

    .demo-card:hover {
      transform: translateY(-2px);
    }

    .demo-card h2 {
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
      color: #000;
      font-weight: 600;
      letter-spacing: -0.01em;
    }

    .demo-card p {
      color: #000;
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .demo-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #000;
      color: #fff;
      text-decoration: none;
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s ease;
      border: 1px solid #000;
    }

    .demo-link:hover {
      background: #fff;
      color: #000;
    }

    .demo-link svg {
      width: 16px;
      height: 16px;
    }

    .demo-links {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .dist-tags {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .dist-tag-button {
      display: flex;
      align-items: stretch;
      border: 1px solid #000;
      overflow: hidden;
    }

    .dist-tag-label {
      flex: 1;
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #000;
      color: #fff;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .dist-tag-label svg {
      width: 16px;
      height: 16px;
      transition: transform 0.2s ease;
    }

    .dist-tag-label:hover svg {
      transform: translateX(4px);
    }

    .dist-tag-version {
      padding: 0.625rem 1.25rem;
      border-left: 1px solid rgba(255, 255, 255, 0.2);
      font-family: monospace;
      font-size: 0.875rem;
      background: #000;
      color: #fff;
      text-decoration: none;
      display: flex;
      align-items: center;
      transition: all 0.2s ease;
    }

    /* Hover states */
    .dist-tag-button:hover .dist-tag-label,
    .dist-tag-button:hover .dist-tag-version {
      background: #fff;
      color: rgba(0, 0, 0, 0.5);
    }

    .dist-tag-button:hover .dist-tag-version {
      border-left-color: rgba(0, 0, 0, 0.2);
    }

    .dist-tag-label:hover {
      color: #000 !important;
    }

    .dist-tag-version:hover {
      color: #000 !important;
    }

    .permalink-icon {
      display: inline-block;
      transition: transform 0.2s ease;
      margin-left: 0.75rem;
      transform-origin: center center;
    }

    .dist-tag-version:hover .permalink-icon {
      transform: rotate(15deg) translateY(-1px);
    }

    .previous-versions {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e0e0e0;
    }

    .previous-versions h3 {
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .commit-links {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      font-size: 0.75rem;
    }

    .commit-link {
      padding: 0.25rem 0.5rem;
      border: 1px solid #000;
      text-decoration: none;
      color: #000;
      font-family: monospace;
      transition: all 0.2s ease;
    }

    .commit-link:hover {
      background: #000;
      color: #fff;
    }

    .current-deployment {
      margin-top: 1rem;
      font-size: 0.875rem;
      color: #666;
    }

    .current-deployment span {
      color: #000;
    }

    .footer {
      text-align: center;
      padding: 3rem 0;
      color: #000;
      border-top: 1px solid #000;
      font-size: 0.875rem;
    }

    .footer a {
      color: #000;
      text-decoration: underline;
    }

    .footer a:hover {
      text-decoration: none;
    }

    .disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .disabled .demo-link {
      background: #fff;
      color: #000;
      pointer-events: none;
      width: 100%;
      justify-content: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Polen Demos</h1>
      <p>Interactive examples showcasing Polen's powerful GraphQL documentation features</p>
    </div>

    <div class="demos-grid">
      <div class="demo-card">
        <h2>Pokemon API</h2>
        <p>Explore a fun GraphQL API for Pokemon data with rich schema documentation and interactive examples.</p>
        <div class="demo-links">
          ${
  // For trunk deployments, show dist-tag buttons
  !prNumber
    ? Object.entries(parsedDistTags).length > 0
      ? `<div class="dist-tags">
            ${
        Object.entries(parsedDistTags)
          .sort(([a], [b]) => a === 'latest' ? -1 : b === 'latest' ? 1 : 0)
          .filter(([tag, version]) => {
            // If next points to the same version as latest, filter it out
            if (tag === 'next' && parsedDistTags['latest'] === version) {
              return false
            }
            return true
          })
          .map(([tag, version]) => `
                  <div class="dist-tag-button">
                    <a href="${tag}/pokemon/" class="dist-tag-label">
                      ${tag}
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </a>
                    <a href="${version}/pokemon/" class="dist-tag-version">${version}<span class="permalink-icon">¶</span></a>
                  </div>
                `).join('')
      }
          ${
        // Show "no prereleases" message if next === latest
        parsedDistTags['next'] && parsedDistTags['next'] === parsedDistTags['latest']
          ? '<div class="disabled" style="margin-top: 0.75rem;"><span class="demo-link" style="width: 100%; justify-content: center;">No pre-releases since latest</span></div>'
          : ''}
          </div>`
      : parsedTrunkDeployments && parsedTrunkDeployments.latest
      ? `<a href="latest/pokemon/" class="demo-link">
            View Latest (${parsedTrunkDeployments.latest.tag || parsedTrunkDeployments.latest.shortSha})
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>`
      : '<p style="color: #666; font-size: 0.875rem;">No deployments available</p>'
    // For PR deployments, show latest pseudo-dist-tag
    : currentSha
    ? `<div class="dist-tags">
          <div class="dist-tag-button">
            <a href="latest/pokemon/" class="dist-tag-label">
              latest
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
            <a href="${currentSha}/pokemon/" class="dist-tag-version">${
      currentSha.substring(0, 7)
    }<span class="permalink-icon">¶</span></a>
          </div>
        </div>`
    : '<p style="color: #666; font-size: 0.875rem;">No deployments available</p>'}
          <div class="previous-versions">
            <h3>Previous Versions</h3>
            ${
  // For trunk deployments, use parsedTrunkDeployments
  !prNumber && parsedTrunkDeployments
    ? parsedTrunkDeployments.previous.length > 0
      ? `<div class="commit-links">
              ${
        parsedTrunkDeployments.previous.map(deployment => {
          // For semver deployments, tag and sha are the same, so just show once
          const label = deployment.tag || deployment.shortSha
          return `<a href="${deployment.sha}/pokemon/" class="commit-link">${label}</a>`
        }).join('')
      }
            </div>`
      : '<p style="color: #666; font-size: 0.875rem; margin: 0;">(none)</p>'
    // For PR deployments, use the existing logic
    : previousDeployments.length > 0
    ? `<div class="commit-links">
              ${
      previousDeployments.map(sha => `
                <a href="${sha}/pokemon/" class="commit-link">${sha.substring(0, 7)}</a>
              `).join('')
    }
            </div>`
    : '<p style="color: #666; font-size: 0.875rem; margin: 0;">(none)</p>'}
          </div>
        </div>
      </div>

      <div class="demo-card disabled">
        <h2>GitHub API</h2>
        <p>Browse GitHub's extensive GraphQL API with over 1600 types. Currently disabled due to build performance.</p>
        <span class="demo-link">
          Coming Soon
        </span>
      </div>
    </div>

    <div class="footer">
      <p>Built with <a href="https://github.com/the-guild-org/polen" target="_blank">Polen</a> - The delightful GraphQL documentation framework</p>
    </div>
  </div>
</body>
</html>`

// Create dist-demos directory if it doesn't exist
const distDir = path.join(process.cwd(), 'dist-demos')
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true })
}

// Write index.html
fs.writeFileSync(path.join(distDir, 'index.html'), indexHtml)

console.log('✅ Built demos index page')

// Start dev server if requested
if (mode === 'dev' && serve) {
  const { createServer } = await import('http')
  const { readFileSync } = await import('fs')

  const server = createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(readFileSync(path.join(distDir, 'index.html'), 'utf-8'))
    } else {
      res.writeHead(404)
      res.end('Not found')
    }
  })

  const port = 3000
  server.listen(port, () => {
    console.log(`\n🚀 Dev server running at http://localhost:${port}\n`)
  })
}
