/**
 * UI component generators for demo landing pages
 */

import { getDemoConfig } from '../index.ts'
import type { DemoMetadata, LandingPageData, PrDeployment, TrunkDeployment } from './data-collector.ts'

/**
 * CSS styles for the demo landing page
 */
export const getDemoPageStyles = () => {
  const config = getDemoConfig().fullConfig
  const theme = config.ui.theme

  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: ${theme.textColor};
      background: ${theme.backgroundColor};
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      margin-bottom: 4rem;
      padding: 3rem 0;
      border-bottom: 1px solid ${theme.primaryColor};
    }

    .header h1 {
      font-size: 2.5rem;
      font-weight: 400;
      margin-bottom: 0.5rem;
      letter-spacing: -0.02em;
    }

    .header p {
      font-size: 1rem;
      color: ${theme.textColor};
      max-width: 600px;
    }

    .demos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .demo-card {
      background: ${theme.backgroundColor};
      padding: 2rem;
      border: 1px solid ${theme.primaryColor};
      transition: all 0.2s ease;
    }

    .demo-card:hover {
      transform: translateY(-2px);
    }

    .demo-card.disabled {
      opacity: 0.6;
      background: #f5f5f5;
    }

    .demo-card h2 {
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
      color: ${theme.textColor};
      font-weight: 600;
      letter-spacing: -0.01em;
    }

    .demo-card p {
      color: ${theme.textColor};
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .demo-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: ${theme.primaryColor};
      color: ${theme.backgroundColor};
      text-decoration: none;
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s ease;
      border: 1px solid ${theme.primaryColor};
    }

    .demo-link:hover {
      background: transparent;
      color: ${theme.primaryColor};
    }

    .demo-link.disabled {
      background: #ccc;
      color: #666;
      border-color: #ccc;
      cursor: not-allowed;
    }

    .dist-tags {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .dist-tag-button {
      display: flex;
      align-items: stretch;
      border: 1px solid ${theme.primaryColor};
    }

    .dist-tag-label {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      background: ${theme.primaryColor};
      color: ${theme.backgroundColor};
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: opacity 0.2s ease;
    }

    .dist-tag-label:hover {
      opacity: 0.9;
    }

    .dist-tag-label svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .dist-tag-version {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      background: ${theme.backgroundColor};
      color: ${theme.primaryColor};
      text-decoration: none;
      font-size: 0.875rem;
      font-family: monospace;
      border-left: 1px solid ${theme.primaryColor};
      transition: background 0.2s ease;
    }

    .dist-tag-version:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    .permalink-icon {
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .dist-tag-version:hover .permalink-icon {
      opacity: 0.6;
    }

    .version-info {
      margin-top: 3rem;
      padding: 2rem;
      background: #f8f8f8;
      border: 1px solid #e0e0e0;
    }

    .version-info h3 {
      font-size: 1.125rem;
      margin-bottom: 1rem;
      color: ${theme.textColor};
    }

    .version-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .version-tag {
      padding: 0.25rem 0.75rem;
      background: ${theme.primaryColor};
      color: ${theme.backgroundColor};
      text-decoration: none;
      font-size: 0.75rem;
      font-weight: 500;
      border-radius: 3px;
    }

    .version-tag.latest {
      background: #0066cc;
    }

    .version-tag.next {
      background: #ff6600;
    }

    .pr-section {
      margin-top: 3rem;
      padding: 2rem;
      background: #f0f8ff;
      border: 1px solid #b3d9ff;
    }

    .pr-section h3 {
      color: #0066cc;
      margin-bottom: 1rem;
    }

    .pr-list {
      display: grid;
      gap: 1rem;
    }

    .pr-item {
      padding: 1rem;
      background: white;
      border: 1px solid #ddd;
    }

    .pr-item h4 {
      color: #0066cc;
      margin-bottom: 0.5rem;
    }

    .back-link {
      color: ${theme.textColor};
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

    .pr-banner {
      background: ${theme.primaryColor};
      color: ${theme.backgroundColor};
      padding: 1rem 0;
      margin-bottom: 0;
      border-bottom: 2px solid ${theme.primaryColor};
    }

    .pr-banner .container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
      flex-wrap: wrap;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }

    .pr-banner-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .pr-banner-badge {
      background: ${theme.backgroundColor};
      color: ${theme.primaryColor};
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .pr-banner-text {
      font-size: 0.875rem;
    }

    .pr-banner-links {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .pr-banner-link {
      color: ${theme.backgroundColor};
      text-decoration: none;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: 1px solid ${theme.backgroundColor};
      transition: all 0.2s ease;
    }

    .pr-banner-link:hover {
      background: ${theme.backgroundColor};
      color: ${theme.primaryColor};
    }

    .pr-banner-link svg {
      width: 16px;
      height: 16px;
    }

    @media (max-width: 768px) {
      .container {
        padding: 1rem;
      }

      .header h1 {
        font-size: 2rem;
      }

      .demos-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .demo-card {
        padding: 1.5rem;
      }

      .pr-banner .container {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
        padding: 0 1rem;
      }

      .pr-banner-links {
        width: 100%;
        flex-direction: column;
        align-items: stretch;
      }

      .pr-banner-link {
        justify-content: center;
      }
    }
  `
}

/**
 * Generate PR banner HTML
 */
export const generatePrBanner = (prNumber: string): string => {
  return `
    <div class="pr-banner">
      <div class="container">
        <div class="pr-banner-content">
          <span class="pr-banner-badge">PR Preview</span>
          <span class="pr-banner-text">You're viewing a preview deployment for Pull Request #${prNumber}</span>
        </div>
        <div class="pr-banner-links">
          <a href="https://github.com/the-guild-org/polen/pull/${prNumber}" class="pr-banner-link" target="_blank">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View PR on GitHub
          </a>
          <a href="https://the-guild-org.github.io/polen/" class="pr-banner-link">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go to Production Demos
          </a>
        </div>
      </div>
    </div>
  `
}

/**
 * Generate header HTML
 */
export const generateHeader = (data: LandingPageData): string => {
  const config = getDemoConfig().fullConfig
  const { mode, prNumber } = data.config

  let title = config.ui.branding.title
  let description = config.ui.branding.description

  if (mode === 'pr-index') {
    title = 'Polen PR Previews'
    description = 'Interactive demos for pull request previews'
  } else if (prNumber) {
    title = `${title} - PR #${prNumber} Preview`
    description = `Preview of changes in pull request #${prNumber}`
  }

  return `
    <div class="header">
      <h1>${title}</h1>
      <p>${description}</p>
    </div>
  `
}

/**
 * Generate demo card HTML
 */
export const generateDemoCard = (
  name: string,
  metadata: DemoMetadata,
  data: LandingPageData,
): string => {
  const { title, description, enabled, reason } = metadata
  const { basePath, prNumber, currentSha } = data.config
  const { distTags, trunkDeployments } = data

  if (!enabled) {
    return `
      <div class="demo-card disabled">
        <h2>${title}</h2>
        <p>${description}</p>
        ${reason ? `<p><em>Note: ${reason}</em></p>` : ''}
        <div class="demo-link disabled">Coming Soon</div>
      </div>
    `
  }

  // For PR deployments, show latest/sha buttons
  if (prNumber && currentSha) {
    return `
      <div class="demo-card">
        <h2>${title}</h2>
        <p>${description}</p>
        <div class="dist-tags">
          <div class="dist-tag-button">
            <a href="${basePath}latest/${name}/" class="dist-tag-label">
              latest
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
            <a href="${basePath}${currentSha}/${name}/" class="dist-tag-version">${currentSha.substring(0, 7)}<span class="permalink-icon">¶</span></a>
          </div>
        </div>
      </div>
    `
  }

  // For trunk deployments, show dist-tag buttons
  if (!prNumber && distTags && Object.keys(distTags).length > 0) {
    const distTagButtons = Object.entries(distTags)
      .sort(([a], [b]) => a === 'latest' ? -1 : b === 'latest' ? 1 : 0)
      .filter(([tag, version]) => {
        // If next points to the same version as latest, filter it out
        if (tag === 'next' && distTags['latest'] === version) {
          return false
        }
        return true
      })
      .map(([tag, version]) => `
        <div class="dist-tag-button">
          <a href="${basePath}${tag}/${name}/" class="dist-tag-label">
            ${tag}
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
          <a href="${basePath}${version}/${name}/" class="dist-tag-version">${version}<span class="permalink-icon">¶</span></a>
        </div>
      `).join('')

    const noPrereleasesMessage = distTags['next'] && distTags['next'] === distTags['latest']
      ? '<div class="disabled" style="margin-top: 0.75rem;"><span class="demo-link" style="width: 100%; justify-content: center;">No pre-releases since latest</span></div>'
      : ''

    return `
      <div class="demo-card">
        <h2>${title}</h2>
        <p>${description}</p>
        <div class="dist-tags">
          ${distTagButtons}
          ${noPrereleasesMessage}
        </div>
      </div>
    `
  }

  // Fallback to simple link
  const latestTag = trunkDeployments?.latest?.tag || trunkDeployments?.latest?.shortSha || 'latest'
  
  return `
    <div class="demo-card">
      <h2>${title}</h2>
      <p>${description}</p>
      <a href="${basePath}latest/${name}/" class="demo-link">
        View Latest ${latestTag ? `(${latestTag})` : ''}
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </a>
    </div>
  `
}

/**
 * Generate demos grid HTML
 */
export const generateDemosGrid = (data: LandingPageData): string => {
  const { demoMetadata, demoExamples } = data
  const orderedExamples = getDemoConfig().getOrderedDemos(demoExamples)

  // Add disabled demos to the list
  const allDemos = [...orderedExamples]
  for (const [name, metadata] of Object.entries(demoMetadata)) {
    if (!metadata.enabled && !allDemos.includes(name)) {
      allDemos.push(name)
    }
  }

  const demoCards = allDemos
    .map(name =>
      generateDemoCard(name, demoMetadata[name] || { title: name, description: '', enabled: true }, data)
    )
    .join('')

  return `
    <div class="demos-grid">
      ${demoCards}
    </div>
  `
}

/**
 * Generate version information section
 */
export const generateVersionInfo = (data: LandingPageData): string => {
  const { trunkDeployments, distTags } = data

  if (!trunkDeployments) return ''

  const basePath = data.config.basePath || '/'
  
  const distTagsHtml = distTags
    ? Object.entries(distTags)
      .map(([tag, version]) => {
        const className = tag === 'latest'
          ? 'version-tag latest'
          : tag === 'next'
          ? 'version-tag next'
          : 'version-tag'
        return `<a href="${basePath}${version}/" class="${className}">${tag}: ${version}</a>`
      })
      .join('')
    : ''

  const previousVersionsHtml = trunkDeployments.previous
    .slice(0, 10) // Limit to recent versions
    .map(version => `<a href="${basePath}${version.tag}/" class="version-tag">${version.tag}</a>`)
    .join('')

  return `
    <div class="version-info">
      <h3>Available Versions</h3>
      ${distTagsHtml ? `<div class="version-list">${distTagsHtml}</div>` : ''}
      ${
    previousVersionsHtml
      ? `
        <h4 style="margin: 1rem 0 0.5rem 0; font-size: 0.875rem; color: #666;">Previous Versions:</h4>
        <div class="version-list">${previousVersionsHtml}</div>
      `
      : ''
  }
    </div>
  `
}

/**
 * Generate PR deployments section
 */
export const generatePrSection = (data: LandingPageData): string => {
  const { prDeployments } = data

  if (!prDeployments || prDeployments.length === 0) {
    return `
      <div class="pr-section">
        <h3>Pull Request Previews</h3>
        <p>No active PR previews at the moment.</p>
        <p><em>PR previews are automatically generated when pull requests are opened with demo changes.</em></p>
      </div>
    `
  }

  const prItems = prDeployments
    .slice(0, 20) // Limit to recent PRs
    .map(pr => `
      <div class="pr-item">
        <h4><a href="/pr-${pr.number}/">PR #${pr.number}</a></h4>
        ${pr.sha ? `<p>Latest commit: <code>${pr.sha.substring(0, 7)}</code></p>` : ''}
        ${pr.ref ? `<p>Branch: <code>${pr.ref}</code></p>` : ''}
      </div>
    `)
    .join('')

  return `
    <div class="pr-section">
      <h3>Pull Request Previews</h3>
      <div class="pr-list">
        ${prItems}
      </div>
    </div>
  `
}

/**
 * Generate back navigation link
 */
export const generateBackLink = (targetUrl: string, label: string = 'Back to Main'): string => {
  return `
    <a href="${targetUrl}" class="back-link">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19L5 12L12 5"/>
      </svg>
      ${label}
    </a>
  `
}
