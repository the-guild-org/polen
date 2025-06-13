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
  .parameter('mode', z.enum(['demo', 'pr-index']).default('demo').describe('Page mode: demo landing or PR index'))
  .parameter('prDeployments', z.string().optional().describe('JSON array of PR deployments'))
  .parameter('trunkDeployments', z.string().optional().describe('JSON object with trunk deployment info'))
  .parse()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { basePath, prNumber, currentSha, mode, prDeployments, trunkDeployments } = args

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

const parsedTrunkDeployments = (trunkDeployments ? JSON.parse(trunkDeployments) : null) as TrunkDeploymentsData | null

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

    .previous-deployments {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e0e0e0;
    }

    .previous-deployments h3 {
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
          <a href="latest/pokemon/" class="demo-link">
            View Latest
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
          ${
  // For trunk deployments (no prNumber), use parsedTrunkDeployments if available
  !prNumber && parsedTrunkDeployments && parsedTrunkDeployments.latest
    ? `<div class="current-deployment">
            <span>Current: </span>${
      parsedTrunkDeployments.latest.tag
        ? `${parsedTrunkDeployments.latest.tag} (<a href="${parsedTrunkDeployments.latest.sha}/pokemon/" class="commit-link">${parsedTrunkDeployments.latest.shortSha}</a>)`
        : `<a href="${parsedTrunkDeployments.latest.sha}/pokemon/" class="commit-link">${parsedTrunkDeployments.latest.shortSha}</a>`
    }
          </div>`
    : currentSha
    ? `<div class="current-deployment">
              <span>Current: </span><a href="${currentSha}/pokemon/" class="commit-link">${
      currentSha.substring(0, 7)
    }</a>
            </div>`
    : ''}
          <div class="previous-deployments">
            <h3>Previous Deployments</h3>
            ${
  // For trunk deployments, use parsedTrunkDeployments
  !prNumber && parsedTrunkDeployments
    ? parsedTrunkDeployments.previous.length > 0
      ? `<div class="commit-links">
              ${
        parsedTrunkDeployments.previous.map(deployment => {
          const label = deployment.tag
            ? `${deployment.tag} (${deployment.shortSha})`
            : deployment.shortSha
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
