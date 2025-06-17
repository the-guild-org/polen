/**
 * HTML page renderer for demo landing pages
 */

import type { LandingPageData } from './data-collector.ts'
import {
  getDemoPageStyles,
  generateHeader,
  generateDemosGrid,
  generateVersionInfo,
  generatePrSection,
  generateBackLink,
} from './components.ts'
import { demoConfig } from '../config.ts'

/**
 * Renders complete HTML pages for demo landing
 */
export class DemoPageRenderer {
  /**
   * Render main demo landing page
   */
  renderMainLandingPage(data: LandingPageData): string {
    const config = demoConfig.getConfig()
    const { mode, prNumber } = data.config

    let pageTitle = config.ui.branding.title
    if (prNumber) {
      pageTitle = `${pageTitle} - PR #${prNumber} Preview`
    }

    const headerHtml = generateHeader(data)
    const demosGridHtml = generateDemosGrid(data)
    const versionInfoHtml = generateVersionInfo(data)

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${config.ui.branding.description}">
  ${config.ui.branding.logoUrl ? `<link rel="icon" href="${config.ui.branding.logoUrl}">` : ''}
  <style>
    ${getDemoPageStyles()}
  </style>
</head>
<body>
  <div class="container">
    ${headerHtml}
    ${demosGridHtml}
    ${versionInfoHtml}
  </div>
</body>
</html>`
  }

  /**
   * Render PR index page showing all PR previews
   */
  renderPrIndexPage(data: LandingPageData): string {
    const backLinkHtml = generateBackLink('/', 'Back to Main Demos')
    const headerHtml = generateHeader(data)
    const prSectionHtml = generatePrSection(data)

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Polen PR Previews</title>
  <meta name="description" content="Interactive demos for pull request previews">
  <style>
    ${getDemoPageStyles()}
  </style>
</head>
<body>
  <div class="container">
    ${backLinkHtml}
    ${headerHtml}
    ${prSectionHtml}
  </div>
</body>
</html>`
  }

  /**
   * Render development page with mock data
   */
  renderDevPage(data: LandingPageData): string {
    const headerHtml = generateHeader(data)
    const demosGridHtml = generateDemosGrid(data)
    const versionInfoHtml = generateVersionInfo(data)

    const devNoticeHtml = `
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 1rem; margin-bottom: 2rem; border-radius: 4px;">
        <strong>Development Mode:</strong> This page is using mock data for development purposes.
      </div>
    `

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Polen Demos - Development</title>
  <meta name="description" content="Development version of Polen demos">
  <style>
    ${getDemoPageStyles()}
  </style>
</head>
<body>
  <div class="container">
    ${devNoticeHtml}
    ${headerHtml}
    ${demosGridHtml}
    ${versionInfoHtml}
  </div>
</body>
</html>`
  }

  /**
   * Render page based on mode
   */
  renderPage(data: LandingPageData): string {
    const { mode } = data.config

    switch (mode) {
      case 'pr-index':
        return this.renderPrIndexPage(data)
      case 'dev':
        return this.renderDevPage(data)
      case 'demo':
      default:
        return this.renderMainLandingPage(data)
    }
  }
}

/**
 * Utility function for quick page rendering
 */
export async function renderDemoLandingPage(
  data: LandingPageData,
): Promise<string> {
  const renderer = new DemoPageRenderer()
  return renderer.renderPage(data)
}