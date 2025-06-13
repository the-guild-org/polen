#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

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
      color: #1a1a1a;
      background: #fafafa;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .header {
      text-align: center;
      margin-bottom: 4rem;
      padding: 3rem 0;
    }
    
    .header h1 {
      font-size: 3rem;
      font-weight: 800;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .header p {
      font-size: 1.25rem;
      color: #666;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .demos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }
    
    .demo-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      border: 1px solid #e5e5e5;
    }
    
    .demo-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }
    
    .demo-card h2 {
      font-size: 1.5rem;
      margin-bottom: 0.75rem;
      color: #1a1a1a;
    }
    
    .demo-card p {
      color: #666;
      margin-bottom: 1.5rem;
      font-size: 1rem;
    }
    
    .demo-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #667eea;
      color: white;
      text-decoration: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 500;
      transition: background 0.2s ease;
    }
    
    .demo-link:hover {
      background: #5a67d8;
    }
    
    .demo-link svg {
      width: 20px;
      height: 20px;
    }
    
    .footer {
      text-align: center;
      padding: 3rem 0;
      color: #666;
      border-top: 1px solid #e5e5e5;
    }
    
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    
    .footer a:hover {
      text-decoration: underline;
    }
    
    .disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .disabled .demo-link {
      background: #ccc;
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
        <h2>🎮 Pokemon API</h2>
        <p>Explore a fun GraphQL API for Pokemon data with rich schema documentation and interactive examples.</p>
        <a href="/pokemon/" class="demo-link">
          View Demo
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
      
      <div class="demo-card disabled">
        <h2>🐙 GitHub API</h2>
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
