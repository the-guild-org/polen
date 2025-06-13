#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

// Get base path from command line argument or default to /
const basePath = process.argv[2] || '/'
const basePathWithoutTrailingSlash = basePath.endsWith('/') && basePath !== '/'
  ? basePath.slice(0, -1)
  : basePath

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
        <a href="${basePathWithoutTrailingSlash}/pokemon/" class="demo-link">
          View Demo
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
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
