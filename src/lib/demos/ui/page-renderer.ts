/**
 * HTML page renderer for demo landing pages
 */

import { getDemoConfig } from '../index.ts'
import {
  generateDemosGrid,
  generateFooter,
  generateHeader,
  generatePrBanner,
  generateVersionInfo,
  getDemoPageStyles,
} from './components.ts'
import type { LandingPageData } from './data-collector.ts'

/**
 * Renders complete HTML pages for demo landing
 */
export class DemoPageRenderer {
  /**
   * Render main demo landing page
   */
  renderMainLandingPage(data: LandingPageData): string {
    const config = getDemoConfig().fullConfig
    const { mode, prNumber } = data.config

    let pageTitle = config.ui.branding.title
    if (prNumber) {
      pageTitle = `${pageTitle} - PR #${prNumber} Preview`
    }

    const prBannerHtml = prNumber ? generatePrBanner(prNumber) : ''
    const headerHtml = generateHeader(data)
    const demosGridHtml = generateDemosGrid(data)
    const versionInfoHtml = generateVersionInfo(data)
    const footerHtml = generateFooter()

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
  ${prBannerHtml}
  <div class="container">
    ${headerHtml}
    ${demosGridHtml}
    ${versionInfoHtml}
    ${footerHtml}
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
    const footerHtml = generateFooter()

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
    ${footerHtml}
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
      case 'development':
        return this.renderDevPage(data)
      case 'production':
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
