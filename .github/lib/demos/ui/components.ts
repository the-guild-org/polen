/**
 * UI component generators for demo landing pages
 */

import { getDemoConfig } from '../../../../src/lib/demos/index.ts'
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
    }
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
  basePath: string,
): string => {
  const { title, description, enabled, reason } = metadata

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

  const demoUrl = `${basePath}${name}/`

  return `
    <div class="demo-card">
      <h2>${title}</h2>
      <p>${description}</p>
      <a href="${demoUrl}" class="demo-link">
        Explore API
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M7 17L17 7M17 7H7M17 7V17"/>
        </svg>
      </a>
    </div>
  `
}

/**
 * Generate demos grid HTML
 */
export const generateDemosGrid = (data: LandingPageData): string => {
  const { demoMetadata, demoExamples, config } = data
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
      generateDemoCard(name, demoMetadata[name] || { title: name, description: '', enabled: true }, config.basePath)
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

  const distTagsHtml = distTags
    ? Object.entries(distTags)
      .map(([tag, version]) => {
        const className = tag === 'latest'
          ? 'version-tag latest'
          : tag === 'next'
          ? 'version-tag next'
          : 'version-tag'
        return `<a href="/${version}/" class="${className}">${tag}: ${version}</a>`
      })
      .join('')
    : ''

  const previousVersionsHtml = trunkDeployments.previous
    .slice(0, 10) // Limit to recent versions
    .map(version => `<a href="/${version.tag}/" class="version-tag">${version.tag}</a>`)
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
